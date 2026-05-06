import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import fs from 'fs';
import path from 'path';

async function generateIcons() {
  const logoPath = './public/logo.png';
  if (!fs.existsSync(logoPath)) {
    console.error('logo.png not found in public/');
    return;
  }

  // Create square version for favicon (fit and pad to avoid distortion)
  await sharp(logoPath)
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    })
    .toFile('./public/favicon-square.png');

  // Generate different sizes
  const sizes = [16, 32, 192, 512];
  for (const size of sizes) {
    await sharp('./public/favicon-square.png')
      .resize(size, size)
      .toFile(`./public/favicon-${size}x${size}.png`);
  }

  // Copy 512 to favicon.png
  fs.copyFileSync(`./public/favicon-512x512.png`, './public/favicon.png');
  fs.copyFileSync(`./public/favicon-32x32.png`, './public/favicon-32x32.png');
  fs.copyFileSync(`./public/favicon-16x16.png`, './public/favicon-16x16.png');

  // Generate ICO
  try {
    const buf = await pngToIco('./public/favicon-32x32.png');
    fs.writeFileSync('./public/favicon.ico', buf);
    console.log('Icons generated successfully');
  } catch (err) {
    console.error('Error generating ICO:', err);
  }
}

generateIcons();
