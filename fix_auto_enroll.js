import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

const helper = `
function enrollStudentsInActivity(studentIds: string[], activityId: string, effectiveUserId: string) {
  if (!studentIds || studentIds.length === 0) return;
  
  const getStudent = db.prepare("SELECT * FROM students WHERE id = ? AND user_id = ?");
  const updateStudent = db.prepare("UPDATE students SET enrolledActivityIds = ? WHERE id = ?");

  for (const stuId of studentIds) {
    const student = getStudent.get(stuId, effectiveUserId) as any;
    if (student) {
      let enrolled = [];
      try {
        if (student.enrolledActivityIds) {
          enrolled = JSON.parse(student.enrolledActivityIds);
        }
      } catch (e) {}
      
      if (!enrolled.includes(activityId)) {
        enrolled.push(activityId);
        updateStudent.run(JSON.stringify(enrolled), stuId);
      }
    }
  }
}
`;

code = code.replace('// Create tables', helper + '\n// Create tables');

code = code.replace(
  `  db.transaction(() => {
    for (const s of sessions) {
      insert.run(s.id, (req as any).effectiveUserId, s.activityId, s.date || new Date().toISOString().split('T')[0], s.status || 'scheduled', s.justification || null, s.notes || null, JSON.stringify(s.attendeeIds || []), s.duration ?? 1, s.substituteTeacherId || null);
    }
  })();`,
  `  db.transaction(() => {
    for (const s of sessions) {
      insert.run(s.id, (req as any).effectiveUserId, s.activityId, s.date || new Date().toISOString().split('T')[0], s.status || 'scheduled', s.justification || null, s.notes || null, JSON.stringify(s.attendeeIds || []), s.duration ?? 1, s.substituteTeacherId || null);
      if (s.attendeeIds && s.attendeeIds.length > 0) {
        enrollStudentsInActivity(s.attendeeIds, s.activityId, (req as any).effectiveUserId);
      }
    }
  })();`
);

code = code.replace(
  `      db.prepare("INSERT OR REPLACE INTO class_sessions (id, user_id, activityId, date, status, justification, notes, attendeeIds, duration, substitute_teacher_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .run(s.id, (req as any).effectiveUserId, s.activityId, s.date || new Date().toISOString().split('T')[0], s.status || 'scheduled', s.justification || null, s.notes || null, JSON.stringify(s.attendeeIds || []), s.duration ?? 1, s.substituteTeacherId || null);`,
  `      db.prepare("INSERT OR REPLACE INTO class_sessions (id, user_id, activityId, date, status, justification, notes, attendeeIds, duration, substitute_teacher_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .run(s.id, (req as any).effectiveUserId, s.activityId, s.date || new Date().toISOString().split('T')[0], s.status || 'scheduled', s.justification || null, s.notes || null, JSON.stringify(s.attendeeIds || []), s.duration ?? 1, s.substituteTeacherId || null);
      
      if (s.attendeeIds && s.attendeeIds.length > 0) {
        enrollStudentsInActivity(s.attendeeIds, s.activityId, (req as any).effectiveUserId);
      }`
);

fs.writeFileSync('server.ts', code);
console.log('Fixed server.ts');
