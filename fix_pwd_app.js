import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `const res = await fetch('/api/profile/password', {`,
  `const res = await fetch(\`/api/profile/password\${adminUserId ? '?admin_user_id=' + adminUserId : ''}\`, {`
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed password api in App.tsx');
