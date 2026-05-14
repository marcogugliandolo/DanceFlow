import fs from 'fs';

let code = fs.readFileSync('src/hooks/useDanceStore.ts', 'utf8');

code = code.replace(
  `  useEffect(() => {
    localStorage.setItem('dance_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('dance_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('dance_students', JSON.stringify(students));
  }, [students]);`,
  `  useEffect(() => {
    if (!adminUserId) localStorage.setItem('dance_activities', JSON.stringify(activities));
  }, [activities, adminUserId]);

  useEffect(() => {
    if (!adminUserId) localStorage.setItem('dance_sessions', JSON.stringify(sessions));
  }, [sessions, adminUserId]);

  useEffect(() => {
    if (!adminUserId) localStorage.setItem('dance_students', JSON.stringify(students));
  }, [students, adminUserId]);`
);

fs.writeFileSync('src/hooks/useDanceStore.ts', code);
console.log('Fixed leaky localstorage');
