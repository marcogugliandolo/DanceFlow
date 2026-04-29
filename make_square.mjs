import sharp from 'sharp';
import fs from 'fs';

async function makeSquare() {
  const buf = fs.readFileSync('public/favicon.png');
  await sharp(buf)
    .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile('public/favicon-square.png');
  
  console.log('done');
}
makeSquare();
