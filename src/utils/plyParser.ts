export interface ParsedPlyData {
  vertexCount: number;
  positions: Float32Array;
  colors: Float32Array;
  normals?: Float32Array;
}

interface PropertyInfo {
  name: string;
  type: string;
  size: number;
}

interface ChunkInfo {
  min_x: number;
  min_y: number;
  min_z: number;
  max_x: number;
  max_y: number;
  max_z: number;
}

/**
 * Universal 3D Gaussian Splat PLY Parser supporting:
 * 1. SuperSplat 2.x compressed PLY files (PlayCanvas / Steam Studio "サボテンGS" standard format)
 * 2. INRIA 3D Gaussian Splatting binary PLY files (Spherical Harmonics f_dc_0..2 colors)
 * 3. Standard ASCII / Binary PLY files (x,y,z, r,g,b)
 */
export function parsePlyBuffer(buffer: ArrayBuffer): ParsedPlyData {
  const bytes = new Uint8Array(buffer);
  const textDecoder = new TextDecoder('ascii');
  
  // 1. Locate end_header\n
  let headerText = '';
  let headerLength = 0;
  for (let i = 0; i < Math.min(bytes.length, 8192); i++) {
    headerText += String.fromCharCode(bytes[i]);
    if (headerText.includes('end_header\n') || headerText.includes('end_header\r\n')) {
      const match = headerText.match(/end_header(\r\n|\n)/);
      if (match) {
        headerLength = headerText.indexOf(match[0]) + match[0].length;
        break;
      }
    }
  }

  // Check if this is a SuperSplat compressed PLY format
  const isSuperSplat = headerText.includes('element chunk') && headerText.includes('packed_position');

  if (isSuperSplat) {
    return parseSuperSplatPly(buffer, headerText, headerLength);
  }

  // Standard or INRIA PLY parsing
  const vertexMatch = headerText.match(/element\s+vertex\s+(\d+)/i);
  const vertexCount = vertexMatch ? parseInt(vertexMatch[1], 10) : 0;

  if (vertexCount === 0) {
    throw new Error('Invalid PLY header: could not find element vertex count.');
  }

  const propertyRegex = /property\s+(float|double|uchar|uint8|char|int|short)\s+([\w_]+)/gi;
  const properties: PropertyInfo[] = [];
  let match: RegExpExecArray | null;

  while ((match = propertyRegex.exec(headerText)) !== null) {
    const type = match[1].toLowerCase();
    const name = match[2].toLowerCase();
    const size = (type === 'float' || type === 'int') ? 4 : (type === 'double') ? 8 : 1;
    properties.push({ name, type, size });
  }

  const stride = properties.reduce((acc, p) => acc + p.size, 0) || 28;

  const findOffset = (names: string[]): number => {
    let offset = 0;
    for (const p of properties) {
      if (names.includes(p.name)) return offset;
      offset += p.size;
    }
    return -1;
  };

  const xOffset = findOffset(['x']);
  const yOffset = findOffset(['y']);
  const zOffset = findOffset(['z']);
  const rOffset = findOffset(['red', 'r']);
  const gOffset = findOffset(['green', 'g']);
  const bOffset = findOffset(['blue', 'b']);
  const fdc0Offset = findOffset(['f_dc_0']);
  const fdc1Offset = findOffset(['f_dc_1']);
  const fdc2Offset = findOffset(['f_dc_2']);

  const positions = new Float32Array(vertexCount * 3);
  const colors = new Float32Array(vertexCount * 3);

  const isBinary = headerText.includes('format binary_little_endian');
  const dataView = new DataView(buffer, headerLength);

  if (isBinary) {
    const SH_C0 = 0.28209479177387814;

    for (let i = 0; i < vertexCount; i++) {
      const baseOffset = i * stride;
      if (baseOffset + stride > dataView.byteLength) break;

      const px = xOffset !== -1 ? dataView.getFloat32(baseOffset + xOffset, true) : 0;
      const py = yOffset !== -1 ? dataView.getFloat32(baseOffset + yOffset, true) : 0;
      const pz = zOffset !== -1 ? dataView.getFloat32(baseOffset + zOffset, true) : 0;

      positions[i * 3] = px;
      positions[i * 3 + 1] = py;
      positions[i * 3 + 2] = pz;

      let r = 0.2, g = 0.7, b = 0.3;

      if (rOffset !== -1 && gOffset !== -1 && bOffset !== -1) {
        r = dataView.getUint8(baseOffset + rOffset) / 255.0;
        g = dataView.getUint8(baseOffset + gOffset) / 255.0;
        b = dataView.getUint8(baseOffset + bOffset) / 255.0;
      } else if (fdc0Offset !== -1 && fdc1Offset !== -1 && fdc2Offset !== -1) {
        const fdc0 = dataView.getFloat32(baseOffset + fdc0Offset, true);
        const fdc1 = dataView.getFloat32(baseOffset + fdc1Offset, true);
        const fdc2 = dataView.getFloat32(baseOffset + fdc2Offset, true);

        r = Math.min(1.0, Math.max(0.0, 0.5 + SH_C0 * fdc0));
        g = Math.min(1.0, Math.max(0.0, 0.5 + SH_C0 * fdc1));
        b = Math.min(1.0, Math.max(0.0, 0.5 + SH_C0 * fdc2));
      }

      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }
  } else {
    const bodyStr = textDecoder.decode(bytes.subarray(headerLength));
    const lines = bodyStr.split(/\r?\n/);
    let validCount = 0;

    for (let i = 0; i < lines.length && validCount < vertexCount; i++) {
      const parts = lines[i].trim().split(/\s+/);
      if (parts.length >= 3) {
        const px = parseFloat(parts[0]);
        const py = parseFloat(parts[1]);
        const pz = parseFloat(parts[2]);

        if (!isNaN(px) && !isNaN(py) && !isNaN(pz)) {
          positions[validCount * 3] = px;
          positions[validCount * 3 + 1] = py;
          positions[validCount * 3 + 2] = pz;

          const r = parts.length > 6 ? parseFloat(parts[6]) / 255.0 : 0.2;
          const g = parts.length > 7 ? parseFloat(parts[7]) / 255.0 : 0.8;
          const b = parts.length > 8 ? parseFloat(parts[8]) / 255.0 : 0.3;

          colors[validCount * 3] = r;
          colors[validCount * 3 + 1] = g;
          colors[validCount * 3 + 2] = b;
          validCount++;
        }
      }
    }
  }

  return { vertexCount, positions, colors };
}

/**
 * Parses SuperSplat 2.x compressed PLY format (Steam Studio "サボテンGS" scan set)
 */
function parseSuperSplatPly(buffer: ArrayBuffer, headerText: string, headerLength: number): ParsedPlyData {
  const chunkMatch = headerText.match(/element\s+chunk\s+(\d+)/i);
  const vertexMatch = headerText.match(/element\s+vertex\s+(\d+)/i);

  const chunkCount = chunkMatch ? parseInt(chunkMatch[1], 10) : 0;
  const vertexCount = vertexMatch ? parseInt(vertexMatch[1], 10) : 0;

  if (vertexCount === 0) {
    throw new Error('Invalid SuperSplat PLY header: missing vertex count.');
  }

  const dataView = new DataView(buffer, headerLength);
  const chunkStride = 18 * 4; // 18 float32 properties per chunk = 72 bytes
  const chunks: ChunkInfo[] = [];
  let offset = 0;

  for (let i = 0; i < chunkCount; i++) {
    const min_x = dataView.getFloat32(offset, true);
    const min_y = dataView.getFloat32(offset + 4, true);
    const min_z = dataView.getFloat32(offset + 8, true);
    const max_x = dataView.getFloat32(offset + 12, true);
    const max_y = dataView.getFloat32(offset + 16, true);
    const max_z = dataView.getFloat32(offset + 20, true);

    chunks.push({ min_x, min_y, min_z, max_x, max_y, max_z });
    offset += chunkStride;
  }

  const positions = new Float32Array(vertexCount * 3);
  const colors = new Float32Array(vertexCount * 3);
  const vertexStride = 16; // 4 uint32s = 16 bytes per vertex

  for (let i = 0; i < vertexCount; i++) {
    if (offset + 15 >= dataView.byteLength) break;

    const chunkIdx = Math.floor(i / 256);
    const chunk = chunks[chunkIdx] || chunks[0] || { min_x: -1, min_y: -1, min_z: -1, max_x: 1, max_y: 1, max_z: 1 };

    const packedPos = dataView.getUint32(offset, true);
    const packedColor = dataView.getUint32(offset + 12, true);

    // 10 bits X, 11 bits Y, 11 bits Z
    const posXBits = packedPos & 0x3FF;
    const posYBits = (packedPos >> 10) & 0x7FF;
    const posZBits = (packedPos >> 21) & 0x7FF;

    const x = chunk.min_x + (posXBits / 1023.0) * (chunk.max_x - chunk.min_x);
    const y = chunk.min_y + (posYBits / 2047.0) * (chunk.max_y - chunk.min_y);
    const z = chunk.min_z + (posZBits / 2047.0) * (chunk.max_z - chunk.min_z);

    const r = (packedColor & 0xFF) / 255.0;
    const g = ((packedColor >> 8) & 0xFF) / 255.0;
    const b = ((packedColor >> 16) & 0xFF) / 255.0;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;

    offset += vertexStride;
  }

  return { vertexCount, positions, colors };
}
