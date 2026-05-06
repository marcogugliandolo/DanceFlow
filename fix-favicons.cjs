const fs = require('fs');
const pngToIco = require('png-to-ico').default;

const logoContent = fs.readFileSync('src/logo.ts', 'utf8');
const match = logoContent.match(/base64,([a-zA-Z0-9+/=]+)/);
if (match && match[1]) {
  const base64Data = match[1];
  const buffer = Buffer.from(base64Data, 'base64');
  
  // Write the actual PNG
  fs.writeFileSync('public/logo.png', buffer);
  fs.writeFileSync('public/favicon.png', buffer);
  fs.writeFileSync('public/favicon-32x32.png', buffer);
  fs.writeFileSync('public/favicon-16x16.png', buffer);
  fs.writeFileSync('public/favicon-square.png', buffer);
  
  // Convert standard PNG to ICO format
  pngToIco('public/logo.png')
    .then(buf => {
      fs.writeFileSync('public/favicon.ico', buf);
      console.log('Successfully generated true favicon.ico');
    })
    .catch(err => {
      console.error('ICO conversion failed:', err);
    });
} else {
  console.log('Could not extract base64 from src/logo.ts');
}
