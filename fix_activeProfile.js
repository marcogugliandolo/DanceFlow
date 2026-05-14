import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `} = useDanceStore(dashboardMonth, isAuthenticated || false);`,
  `} = useDanceStore(dashboardMonth, isAuthenticated || false, adminUserId);\n\n  const activeProfile = adminUserId && adminUserProfile ? adminUserProfile : profile;`
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed activeProfile');
