import fs from 'fs';
import path from 'path';
import https from 'https';

const dir = path.join(process.cwd(), 'public', 'sample_photos');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// Real high-resolution photography captures from Unsplash
const sampleUrls = [
  'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=1200&q=85',
  'https://images.unsplash.com/photo-1509223197845-458d87318791?w=1200&q=85',
  'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=1200&q=85',
  'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=1200&q=85',
  'https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?w=1200&q=85',
  'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1200&q=85',
  'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&q=85',
  'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=1200&q=85',
  'https://images.unsplash.com/photo-1509223197845-458d87318791?w=1200&q=85',
  'https://images.unsplash.com/photo-1525498128493-380d1990a112?w=1200&q=85',
  'https://images.unsplash.com/photo-1509223197845-458d87318791?w=1200&q=85',
  'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=1200&q=85'
];

function downloadFile(url, dest, attempts = 0) {
  https.get(url, (res) => {
    if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
      downloadFile(res.headers.location, dest, attempts + 1);
    } else if (res.statusCode === 200) {
      const fileStream = fs.createWriteStream(dest);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`Saved real photo to ${dest} (${fs.statSync(dest).size} bytes)`);
      });
    } else {
      console.error(`Failed to download ${url}: status ${res.statusCode}`);
    }
  }).on('error', (err) => console.error(`Error downloading ${url}:`, err));
}

sampleUrls.forEach((url, index) => {
  const filePath = path.join(dir, `cactus_${index + 1}.jpg`);
  downloadFile(url, filePath);
});
