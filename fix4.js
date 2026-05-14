import fs from 'fs';

let code = fs.readFileSync('src/hooks/useDanceStore.ts', 'utf8');

code = code.replace(
  `  // Sync with Backend Server (Data + Telegram integration)
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchData = async () => {`,
  `  // Sync with Backend Server (Data + Telegram integration)
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Safety check so we don't bleed admin local state to other user views
    if (adminUserId) {
      setActivities([]);
      setSessions([]);
      setStudents([]);
    }
    
    const fetchData = async () => {`
);

code = code.replace(
  `          // Data Migration from LocalStorage if server is empty
          const localActs = JSON.parse(localStorage.getItem('dance_activities') || '[]');
          const localSess = JSON.parse(localStorage.getItem('dance_sessions') || '[]');
          const localStus = JSON.parse(localStorage.getItem('dance_students') || '[]');

          let didMigrate = false;
          
          if (acts.length === 0 && localActs.length > 0) {
            await fetch(getUrl('/api/activities'), { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(localActs) });
            acts.push(...localActs);
            didMigrate = true;
          }
          if (sessRaw.length === 0 && localSess.length > 0) {
            await fetch(getUrl('/api/sessions'), { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(localSess) });
            sessRaw.push(...localSess);
            didMigrate = true;
          }
          if (stus.length === 0 && localStus.length > 0) {
            await fetch(getUrl('/api/students'), { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(localStus) });
            stus.push(...localStus);
            didMigrate = true;
          }`,
  `          // Data Migration from LocalStorage if server is empty
          let didMigrate = false;
          if (!adminUserId) { // Only do migration for your own acc
            const localActs = JSON.parse(localStorage.getItem('dance_activities') || '[]');
            const localSess = JSON.parse(localStorage.getItem('dance_sessions') || '[]');
            const localStus = JSON.parse(localStorage.getItem('dance_students') || '[]');
            
            if (acts.length === 0 && localActs.length > 0) {
              await fetch(getUrl('/api/activities'), { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(localActs) });
              acts.push(...localActs);
              didMigrate = true;
            }
            if (sessRaw.length === 0 && localSess.length > 0) {
              await fetch(getUrl('/api/sessions'), { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(localSess) });
              sessRaw.push(...localSess);
              didMigrate = true;
            }
            if (stus.length === 0 && localStus.length > 0) {
              await fetch(getUrl('/api/students'), { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(localStus) });
              stus.push(...localStus);
              didMigrate = true;
            }
          }`
);

code = code.replace(
  `// Poll the server every 5 seconds to get updates from Telegram bot
    const intervalId = setInterval(fetchData, 5000);
    return () => clearInterval(intervalId);
  }, [isAuthenticated]);`,
`    // Poll the server every 5 seconds to get updates from Telegram bot
    const intervalId = setInterval(fetchData, 5000);
    return () => clearInterval(intervalId);
  }, [isAuthenticated, adminUserId]);`
);

fs.writeFileSync('src/hooks/useDanceStore.ts', code);
