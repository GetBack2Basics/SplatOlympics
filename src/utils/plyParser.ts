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

/**
 * High-performance PLY parser supporting both standard PLY and INRIA 3D Gaussian Splatting PLY files
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

  // 2. Parse element vertex count from header
  const vertexMatch = headerText.match(/element\s+vertex\s+(\d+)/i);
  const vertexCount = vertexMatch ? parseInt(vertexMatch[1], 10) : 0;

  if (vertexCount === 0) {
    throw new Error('Invalid PLY header: could not find element vertex count.');
  }

  // 3. Parse property list to determine stride & attribute offsets
  const propertyRegex = /property\s+(float|double|uchar|uint8|char|int|short)\s+([\w_]+)/gi;
  const properties: PropertyInfo[] = [];
  let match: RegExpExecArray | null;

  while ((match = propertyRegex.exec(headerText)) !== null) {
    const type = match[1].toLowerCase();
    const name = match[2].toLowerCase();
    const size = (type === 'float' || type === 'int') ? 4 : (type === 'double') ? 8 : 1;
    properties.push({ name, type, size });
  }

  // Calculate total vertex stride
  const stride = properties.reduce((acc, p) => acc + p.size, 0) || 28;

  // Find property offsets
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

  // INRIA 3D Gaussian Spherical Harmonics direct color offsets (f_dc_0, f_dc_1, f_dc_2)
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

      // Extract Positions
      const px = xOffset !== -1 ? dataView.getFloat32(baseOffset + xOffset, true) : 0;
      const py = yOffset !== -1 ? dataView.getFloat32(baseOffset + yOffset, true) : 0;
      const pz = zOffset !== -1 ? dataView.getFloat32(baseOffset + zOffset, true) : 0;

      positions[i * 3] = px;
      positions[i * 3 + 1] = py;
      positions[i * 3 + 2] = pz;

      // Extract Colors
      let r = 0.2, g = 0.7, b = 0.3;

      if (rOffset !== -1 && gOffset !== -1 && bOffset !== -1) {
        r = dataView.getUint8(baseOffset + rOffset) / 255.0;
        g = dataView.getUint8(baseOffset + gOffset) / 255.0;
        b = dataView.getUint8(baseOffset + bOffset) / 255.0;
      } else if (fdc0Offset !== -1 && fdc1Offset !== -1 && fdc2Offset !== -1) {
        // INRIA Spherical Harmonics conversion to RGB: RGB = 0.5 + SH_C0 * f_dc
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
    // ASCII parsing fallback
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

          const r = parts.length > 6 ? parseFloat(parts[6]) / 255.0 : 0.15 + Math.random() * 0.4;
          const g = parts.length > 7 ? parseFloat(parts[7]) / 255.0 : 0.75;
          const b = parts.length > 8 ? parseFloat(parts[8]) / 255.0 : 0.35;

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
