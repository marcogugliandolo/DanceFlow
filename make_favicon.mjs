import sharp from 'sharp';
import fs from 'fs';

async function makeIco() {
  const buf = fs.readFileSync('public/favicon.png');
  // Just resize to 32x32 for ico alternative
  await sharp(buf)
    .resize(32, 32)
    .png()
    .toFile('public/favicon-32x32.png');
    
  await sharp(buf)
    .resize(16, 16)
    .png()
    .toFile('public/favicon-16x16.png');
    
  console.log('done');
}
makeIco();
