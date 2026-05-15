import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

const migration = `
try {
  const allSessions = db.prepare("SELECT * FROM class_sessions").all() as any[];
  for (const s of allSessions) {
    if (s.attendeeIds && s.attendeeIds !== '[]') {
      try {
        const attendeeIds = JSON.parse(s.attendeeIds);
        enrollStudentsInActivity(attendeeIds, s.activityId, s.user_id);
      } catch(e) {}
    }
  }
} catch (e) {
  console.log("Migration error (might be first run):", e);
}
`;

code = code.replace('// Create tables', migration + '\n\// Create tables');

fs.writeFileSync('server.ts', code);
console.log('Added migration to server.ts');
