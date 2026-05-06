const fs = require('fs');
const pngToIco = require('png-to-ico').default;

pngToIco('public/logo.png')
  .then(buf => {
    fs.writeFileSync('public/favicon.ico', buf);
    console.log('Successfully generated favicon.ico');
  })
  .catch(console.error);
