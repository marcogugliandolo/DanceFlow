import sharp from 'sharp';
import fs from 'fs';

const buf = fs.readFileSync('src/logo.ts', 'utf8').split('base64,')[1].replace('";', '');
const metadata = await sharp(Buffer.from(buf, 'base64')).metadata();
console.log(metadata);
