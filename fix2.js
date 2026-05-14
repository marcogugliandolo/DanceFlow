import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

const endpointsRegex = /\/api\/(activities|sessions|students)(\/:id|\/:id\/status)?["'], requireAuth, \(req, res\) => {[\s\S]*?(?=\n\/\/|\napp\.)/g;
code = code.replace(endpointsRegex, (match) => {
  return match.replace(/user\.id/g, '(req as any).effectiveUserId');
});

fs.writeFileSync('server.ts', code);
console.log('Done replacement');
