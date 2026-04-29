import sharp from 'sharp';
import fs from 'fs';

async function processImage() {
  const { data, info } = await sharp('test.jpg')
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const tolerance = 60; // pixel value tolerance
  const bgR = data[0];
  const bgG = data[1];
  const bgB = data[2];

  console.log(`Background color detected: rgb(${bgR}, ${bgG}, ${bgB})`);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i+1];
    const b = data[i+2];

    const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
    if (diff < tolerance * 3) {
      data[i+3] = 0; // Set alpha to 0
    }
  }

  // Find tight bounding box for the visible pixels to crop empty space
  let minX = info.width, minY = info.height, maxX = 0, maxY = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const alpha = data[(y * info.width + x) * 4 + 3];
      if (alpha > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const croppedData = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 }
  })
  .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
  .png()
  .toBuffer();

  const b64 = croppedData.toString('base64');
  fs.writeFileSync('src/logo.ts', `const logoBase64 = "data:image/png;base64,${b64}";\nexport default logoBase64;`);
  console.log('done!');
}

processImage();
