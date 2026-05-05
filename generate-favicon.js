import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// read the logo.ts file
const logoPath = path.join(process.cwd(), 'src/logo.ts');
let logoContent = fs.readFileSync(logoPath, 'utf8');

// The file typically looks like: const logoBase64 = "data:image/png;base64,iVBORw0K....";
const match = logoContent.match(/base64,([a-zA-Z0-9+/=]+)/);
if (match && match[1]) {
  const base64Data = match[1];
  const buffer = Buffer.from(base64Data, 'base64');
  
  // Save as favicon files in public
  const publicDir = path.join(process.cwd(), 'public');
  
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), buffer);
  fs.writeFileSync(path.join(publicDir, 'favicon.png'), buffer);
  fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), buffer);
  fs.writeFileSync(path.join(publicDir, 'favicon-16x16.png'), buffer);
  fs.writeFileSync(path.join(publicDir, 'favicon-square.png'), buffer);
  
  console.log("Successfully generated favicons from logo.ts");
} else {
  console.log("Failed to extract base64 from logo.ts");
}
