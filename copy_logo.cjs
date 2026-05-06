const fs = require('fs');

try {
  let sourcePath = 'public/logo.png';
  
  if (!fs.existsSync(sourcePath)) {
    console.log('public/logo.png not found, falling back to writing from src/logo.ts');
  } else {
    console.log('Copying public/logo.png');
    const file = fs.readFileSync(sourcePath);
    fs.writeFileSync('public/favicon.ico', file);
    fs.writeFileSync('public/favicon.png', file);
    fs.writeFileSync('public/favicon-32x32.png', file);
    fs.writeFileSync('public/favicon-16x16.png', file);
    fs.writeFileSync('public/favicon-square.png', file);
  }
} catch (e) {
  console.log(e);
}
