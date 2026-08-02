import fs from 'fs';
import path from 'path';

const plyPath = path.join(process.cwd(), 'uploads', 'models', 'sample_cactus.ply');
const buffer = fs.readFileSync(plyPath);

console.log('Testing SuperSplat PLY parser on:', plyPath);
const headerText = buffer.toString('ascii', 0, 2048);
const headerEndIdx = headerText.indexOf('end_header\n') + 11;

console.log('Header length:', headerEndIdx);

// Parse chunk count & vertex count
const chunkMatch = headerText.match(/element\s+chunk\s+(\d+)/i);
const vertexMatch = headerText.match(/element\s+vertex\s+(\d+)/i);

const chunkCount = chunkMatch ? parseInt(chunkMatch[1], 10) : 0;
const vertexCount = vertexMatch ? parseInt(vertexMatch[1], 10) : 0;

console.log('Chunks:', chunkCount, 'Vertices (Gaussians):', vertexCount);

// Each chunk has 18 float32s = 72 bytes
// Chunk properties: min_x, min_y, min_z, max_x, max_y, max_z, min_scale_x... max_b
const chunkStride = 18 * 4;
let dataView = new DataView(buffer.buffer, buffer.byteOffset + headerEndIdx);

const chunks = [];
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

console.log('First chunk bounding box:', chunks[0]);

// Vertices start after chunks
// Each vertex has 4 uint32s = 16 bytes (packed_position, packed_rotation, packed_scale, packed_color)
const vertexStride = 16;
const samplePositions = [];
const sampleColors = [];

for (let i = 0; i < Math.min(10, vertexCount); i++) {
  const chunkIdx = Math.floor(i / 256);
  const chunk = chunks[chunkIdx] || chunks[0];

  const packedPos = dataView.getUint32(offset, true);
  const packedRot = dataView.getUint32(offset + 4, true);
  const packedScale = dataView.getUint32(offset + 8, true);
  const packedColor = dataView.getUint32(offset + 12, true);

  // Unpack position: 10 bits X, 11 bits Y, 11 bits Z
  const posXBits = packedPos & 0x3FF; // 10 bits
  const posYBits = (packedPos >> 10) & 0x7FF; // 11 bits
  const posZBits = (packedPos >> 21) & 0x7FF; // 11 bits

  const x = chunk.min_x + (posXBits / 1023.0) * (chunk.max_x - chunk.min_x);
  const y = chunk.min_y + (posYBits / 2047.0) * (chunk.max_y - chunk.min_y);
  const z = chunk.min_z + (posZBits / 2047.0) * (chunk.max_z - chunk.min_z);

  // Unpack color: 8 bits R, 8 bits G, 8 bits B, 8 bits A
  const r = (packedColor & 0xFF) / 255.0;
  const g = ((packedColor >> 8) & 0xFF) / 255.0;
  const b = ((packedColor >> 16) & 0xFF) / 255.0;

  samplePositions.push({ x, y, z });
  sampleColors.push({ r, g, b });

  offset += vertexStride;
}

console.log('Sample unpacked positions:', samplePositions.slice(0, 3));
console.log('Sample unpacked colors:', sampleColors.slice(0, 3));
