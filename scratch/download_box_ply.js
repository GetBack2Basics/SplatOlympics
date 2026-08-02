import fs from 'fs';
import path from 'path';
import https from 'https';

const boxUrl = 'https://app.box.com/index.php?rm=box_download_shared_file&shared_name=itozvq23jh4av2a5hg08d7qevdbi93ii&file_id=f_1827558942828';
const destDir = path.join(process.cwd(), 'uploads', 'models');
if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

const targetZipPath = path.join(destDir, '3DGS_PLY_sample_data.zip');

console.log('Fetching direct Box download URL for Steam Studio 3DGS PLY dataset...');

function getRedirectUrl(url, cb) {
  https.get(url, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      console.log('Followed redirect to BoxCloud:', res.headers.location.substring(0, 80) + '...');
      cb(res.headers.location);
    } else {
      console.error('Unexpected status:', res.statusCode, res.headers);
    }
  }).on('error', (err) => {
    console.error('Error fetching Box URL:', err);
  });
}

getRedirectUrl(boxUrl, (directUrl) => {
  console.log('Downloading first 50 MB to inspect PLY file content...');
  const req = https.get(directUrl, (res) => {
    console.log('Response headers:', res.statusCode, res.headers['content-length']);
    const fileStream = fs.createWriteStream(targetZipPath);
    res.pipe(fileStream);

    fileStream.on('finish', () => {
      fileStream.close();
      console.log('Finished downloading Box sample zip dataset!');
    });
  });
});
