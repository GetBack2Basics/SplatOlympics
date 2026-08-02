export interface ParsedPlyData {
  vertexCount: number;
  positions: Float32Array;
  colors: Float32Array;
  normals?: Float32Array;
}

/**
 * Parses binary or ASCII PLY point cloud data into Float32 position and color arrays for Three.js
 */
export function parsePlyBuffer(buffer: ArrayBuffer): ParsedPlyData {
  const bytes = new Uint8Array(buffer);
  const textDecoder = new TextDecoder('ascii');
  
  // 1. Locate end_header\n
  let headerText = '';
  let headerLength = 0;
  for (let i = 0; i < Math.min(bytes.length, 4096); i++) {
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

  const positions = new Float32Array(vertexCount * 3);
  const colors = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);

  const isBinary = headerText.includes('format binary_little_endian');
  const dataView = new DataView(buffer, headerLength);

  if (isBinary) {
    // Check property stride from header
    const hasNormals = headerText.includes('property float nx');
    const hasAlpha = headerText.includes('property uchar alpha');
    
    // Default stride: 6 floats (24B) + 4 uchars (4B) = 28 bytes per vertex
    const stride = hasNormals ? 28 : 16;

    for (let i = 0; i < vertexCount; i++) {
      const offset = i * stride;
      if (offset + 27 > dataView.byteLength) break;

      const px = dataView.getFloat32(offset, true);
      const py = dataView.getFloat32(offset + 4, true);
      const pz = dataView.getFloat32(offset + 8, true);

      positions[i * 3] = px;
      positions[i * 3 + 1] = py;
      positions[i * 3 + 2] = pz;

      if (hasNormals) {
        normals[i * 3] = dataView.getFloat32(offset + 12, true);
        normals[i * 3 + 1] = dataView.getFloat32(offset + 16, true);
        normals[i * 3 + 2] = dataView.getFloat32(offset + 20, true);

        const r = dataView.getUint8(offset + 24) / 255.0;
        const g = dataView.getUint8(offset + 25) / 255.0;
        const b = dataView.getUint8(offset + 26) / 255.0;

        colors[i * 3] = r;
        colors[i * 3 + 1] = g;
        colors[i * 3 + 2] = b;
      } else {
        const r = dataView.getUint8(offset + 12) / 255.0;
        const g = dataView.getUint8(offset + 13) / 255.0;
        const b = dataView.getUint8(offset + 14) / 255.0;

        colors[i * 3] = r;
        colors[i * 3 + 1] = g;
        colors[i * 3 + 2] = b;
      }
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

          const r = parts.length > 6 ? parseFloat(parts[6]) / 255.0 : 0.2 + Math.random() * 0.6;
          const g = parts.length > 7 ? parseFloat(parts[7]) / 255.0 : 0.8;
          const b = parts.length > 8 ? parseFloat(parts[8]) / 255.0 : 0.4;

          colors[validCount * 3] = r;
          colors[validCount * 3 + 1] = g;
          colors[validCount * 3 + 2] = b;
          validCount++;
        }
      }
    }
  }

  return { vertexCount, positions, colors, normals };
}
