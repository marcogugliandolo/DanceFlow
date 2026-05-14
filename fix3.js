import fs from 'fs';

let code = fs.readFileSync('src/hooks/useDanceStore.ts', 'utf8');

code = code.replace(
  `export function useDanceStore(selectedMonth?: string, isAuthenticated?: boolean) {`,
  `export function useDanceStore(selectedMonth?: string, isAuthenticated?: boolean, adminUserId?: string | null) {\n  const getUrl = (path: string) => adminUserId ? path + (path.includes('?') ? '&' : '?') + 'admin_user_id=' + adminUserId : path;`
);

code = code.replace(/fetch\(\`([^`]+)\`/g, 'fetch(getUrl(`$1`)');
code = code.replace(/fetch\('([^']+)'/g, 'fetch(getUrl(\'$1\')');

// Actually wait, for '/api/sync' -> getUrl('/api/sync')
fs.writeFileSync('src/hooks/useDanceStore.ts', code);
