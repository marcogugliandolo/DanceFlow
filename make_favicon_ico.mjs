import sharp from 'sharp';
import fs from 'fs';

async function makeIcoFile() {
  // Instead of png-to-ico, sharp can't output .ico directly?
  // Let's just create public/favicon.ico anyway
  const buf = fs.readFileSync('public/favicon.png');
  await sharp(buf)
    .resize(32, 32)
    .png() // browsers can read PNG from .ico usually, but proper ICO requires a specific header. 
    .toFile('public/favicon.ico');
}
makeIcoFile();
