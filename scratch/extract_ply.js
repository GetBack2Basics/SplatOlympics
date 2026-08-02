import fs from 'fs';
import path from 'path';

const zipPath = path.join(process.cwd(), 'uploads', 'models', '3DGS_PLY_sample_data.zip');
const destPlyPath = path.join(process.cwd(), 'uploads', 'models', 'sample_cactus.ply');

console.log('Inspecting zip file:', zipPath);
if (!fs.existsSync(zipPath)) {
  console.error('Zip file not found!');
  process.exit(1);
}

const buffer = fs.readFileSync(zipPath);
console.log('Read zip buffer, total size:', (buffer.length / (1024 * 1024)).toFixed(2), 'MB');

// Look for PK\x03\x04 headers or PLY headers inside buffer
let plyHeaderIndex = buffer.indexOf(Buffer.from('ply\nformat binary_little_endian'));
if (plyHeaderIndex === -1) {
  plyHeaderIndex = buffer.indexOf(Buffer.from('ply\nformat ascii'));
}

if (plyHeaderIndex !== -1) {
  console.log('FOUND REAL 3DGS PLY HEADER AT OFFSET:', plyHeaderIndex);
  // Find end of PLY content or extract vertex slice
  const plyData = buffer.subarray(plyHeaderIndex);
  fs.writeFileSync(destPlyPath, plyData);
  console.log('Successfully saved REAL PLY model to:', destPlyPath, 'Size:', (plyData.length / (1024 * 1024)).toFixed(2), 'MB');
} else {
  console.log('Searching for filenames in ZIP central directory...');
  let offset = 0;
  while ((offset = buffer.indexOf(Buffer.from('PK\x03\x04'), offset + 1)) !== -1) {
    if (offset + 30 < buffer.length) {
      const fileNameLen = buffer.readUInt16LE(offset + 26);
      const fileName = buffer.toString('utf8', offset + 30, offset + 30 + fileNameLen);
      console.log('Zip local file header at offset:', offset, 'Filename:', fileName);
    }
  }
}
