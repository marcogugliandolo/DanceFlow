import fs from 'fs';

let code = fs.readFileSync('src/hooks/useDanceStore.ts', 'utf8');

code = code.replace(
  `// Safety check so we don't bleed admin local state to other user views
    if (adminUserId) {
      setActivities([]);
      setSessions([]);
      setStudents([]);
    }`,
  `// Safety check so we don't bleed admin local state to other user views
    setActivities([]);
    setSessions([]);
    setStudents([]);`
);

fs.writeFileSync('src/hooks/useDanceStore.ts', code);
console.log('Fixed safety check');
