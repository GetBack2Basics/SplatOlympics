import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const zipPath = path.join(process.cwd(), 'uploads', 'models', '3DGS_PLY_sample_data.zip');
const destPlyPath = path.join(process.cwd(), 'uploads', 'models', 'sample_cactus.ply');

console.log('Reading zip file for Steam Studio real PLY extraction...');
const buffer = fs.readFileSync(zipPath);

// Target file: cactus_splat3_30kSteps_142k_splats.compressed.ply at offset 100305993
const localHeaderOffset = 100305993;

if (buffer.readUInt32LE(localHeaderOffset) !== 0x04034b50) {
  console.error('Invalid local header magic at offset', localHeaderOffset);
  process.exit(1);
}

const compressionMethod = buffer.readUInt16LE(localHeaderOffset + 8); // 8 = deflate, 0 = store
const compressedSize = buffer.readUInt32LE(localHeaderOffset + 18);
const uncompressedSize = buffer.readUInt32LE(localHeaderOffset + 22);
const fileNameLen = buffer.readUInt16LE(localHeaderOffset + 26);
const extraFieldLen = buffer.readUInt16LE(localHeaderOffset + 28);

const filename = buffer.toString('utf8', localHeaderOffset + 30, localHeaderOffset + 30 + fileNameLen);
console.log('Target file:', filename);
console.log('Compression method:', compressionMethod, '(8=deflate, 0=store)');
console.log('Compressed size:', (compressedSize / 1024).toFixed(2), 'KB');
console.log('Uncompressed size:', (uncompressedSize / 1024).toFixed(2), 'KB');

const dataStart = localHeaderOffset + 30 + fileNameLen + extraFieldLen;
const compressedData = buffer.subarray(dataStart, dataStart + compressedSize);

if (compressionMethod === 8) {
  zlib.inflateRaw(compressedData, (err, decompressed) => {
    if (err) {
      console.error('Inflation error:', err);
      process.exit(1);
    }
    fs.writeFileSync(destPlyPath, decompressed);
    console.log('SUCCESSFULLY EXTRACTED REAL STEAM STUDIO 3DGS PLY MODEL TO:', destPlyPath);
    console.log('Extracted file size:', (decompressed.length / (1024 * 1024)).toFixed(2), 'MB');
  });
} else if (compressionMethod === 0) {
  fs.writeFileSync(destPlyPath, compressedData);
  console.log('SUCCESSFULLY STORED REAL STEAM STUDIO 3DGS PLY MODEL TO:', destPlyPath);
}
