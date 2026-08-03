const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const zipPath = path.join(__dirname, '..', 'uploads', 'models', '3DGS_PLY_sample_data.zip');
const destDir = path.join(__dirname, '..', 'public', 'models');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

console.log('Extracting Box PLY datasets from:', zipPath);

const pyScript = `
import zipfile
import os

zip_path = r"${zipPath}"
dest_dir = r"${destDir}"

with zipfile.ZipFile(zip_path, 'r') as z:
    for member in z.namelist():
        if 'Compressed_PLY' in member and member.endswith('.ply'):
            filename = os.path.basename(member)
            target = os.path.join(dest_dir, filename)
            print(f"Extracting {filename} ({z.getinfo(member).file_size} bytes)...")
            with z.open(member) as source, open(target, 'wb') as target_file:
                target_file.write(source.read())
print("Extraction complete!")
`;

const tempPyPath = path.join(__dirname, 'temp_unzip.py');
fs.writeFileSync(tempPyPath, pyScript);

try {
  execSync(`python "${tempPyPath}"`, { stdio: 'inherit' });
} finally {
  if (fs.existsSync(tempPyPath)) fs.unlinkSync(tempPyPath);
}
