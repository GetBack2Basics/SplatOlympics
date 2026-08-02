import fs from 'fs';
import path from 'path';

const publicDir = path.join(process.cwd(), 'public', 'sample_photos');
const srcPhoto = path.join(publicDir, 'nikon_box_scan.jpg');

if (!fs.existsSync(srcPhoto)) {
  console.error('Source Box photo not found at:', srcPhoto);
  process.exit(1);
}

for (let i = 1; i <= 12; i++) {
  const dest = path.join(publicDir, `cactus_${i}.jpg`);
  fs.copyFileSync(srcPhoto, dest);
  console.log(`Copied official Box photo (${(fs.statSync(dest).size / (1024 * 1024)).toFixed(2)} MB) to:`, dest);
}
