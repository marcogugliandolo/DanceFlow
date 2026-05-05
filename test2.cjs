const http = require('http');
http.get('http://127.0.0.1:3000/api/sessions', (getRes) => {
  let getBody = '';
  getRes.on('data', (c) => getBody += c);
  getRes.on('end', () => {
    console.log("Response:", getBody);
  });
});
