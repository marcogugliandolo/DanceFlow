import sharp from 'sharp';
import fs from 'fs';

const buf = fs.readFileSync('src/logo.ts', 'utf8').split('base64,')[1].replace('";', '');
const { data, info } = await sharp(Buffer.from(buf, 'base64')).raw().toBuffer({ resolveWithObject: true });

let rSum = 0, gSum = 0, bSum = 0, count = 0;
for (let i = 0; i < data.length; i += 4) {
  if (data[i+3] > 0) {
    rSum += data[i];
    gSum += data[i+1];
    bSum += data[i+2];
    count++;
  }
}
console.log('Avg color:', Math.round(rSum/count), Math.round(gSum/count), Math.round(bSum/count));
