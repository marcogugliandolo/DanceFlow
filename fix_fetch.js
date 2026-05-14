import fs from 'fs';

let code = fs.readFileSync('src/hooks/useDanceStore.ts', 'utf8');

code = code.replace(
  `// Safety check so we don't bleed admin local state to other user views
    if (adminUserId) {
      setActivities([]);
      setSessions([]);
      setStudents([]);
    }
    
    const fetchData = async () => {
      // Don't poll if we just updated locally in the last 3 seconds
      if (Date.now() - lastLocalUpdate.current < 3000) {
        return;
      }`,
  `// Safety check so we don't bleed admin local state to other user views
    if (adminUserId) {
      setActivities([]);
      setSessions([]);
      setStudents([]);
    }
    
    const fetchData = async (force = false) => {
      // Don't poll if we just updated locally in the last 3 seconds
      if (!force && Date.now() - lastLocalUpdate.current < 3000) {
        return;
      }`
);

code = code.replace(
  `    // Initial fetch
    fetchData();`,
  `    // Initial fetch
    fetchData(true);`
);

fs.writeFileSync('src/hooks/useDanceStore.ts', code);
console.log('Fixed fast fetch');
