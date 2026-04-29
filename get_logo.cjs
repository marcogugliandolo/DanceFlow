const https = require('https');
https.get('https://nube.marcogugliandolo.com/s/2pxFTzgMRb2nATb/download', (res) => {
  let data = [];
  res.on('data', (chunk) => data.push(chunk));
  res.on('end', () => {
    let buffer = Buffer.concat(data);
    let base64 = buffer.toString('base64');
    let mime = res.headers['content-type'];
    require('fs').writeFileSync('logo_b64.txt', 'data:' + mime + ';base64,' + base64);
    console.log('Done');
  });
});
