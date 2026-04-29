const https = require('https');
const fs = require('fs');

function fetchUrl(url) {
  https.get(url, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      console.log('Redirecting to', res.headers.location);
      fetchUrl(res.headers.location);
    } else {
      let data = [];
      res.on('data', (chunk) => data.push(chunk));
      res.on('end', () => {
        let buffer = Buffer.concat(data);
        let base64 = buffer.toString('base64');
        let mime = res.headers['content-type'] || 'image/png';
        fs.writeFileSync('logo_b64.txt', 'const logoBase64 = "data:' + mime + ';base64,' + base64 + '";\nexport default logoBase64;');
        console.log('Final size:', base64.length);
      });
    }
  });
}

fetchUrl('https://nube.marcogugliandolo.com/s/2pxFTzgMRb2nATb/download');
