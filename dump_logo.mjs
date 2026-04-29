import fs from 'fs';
import { Buffer } from 'buffer';

const b64 = fs.readFileSync('src/logo.ts', 'utf8').split(',')[1].slice(0, -2);
fs.writeFileSync('test.jpg', Buffer.from(b64, 'base64'));
console.log('done');
