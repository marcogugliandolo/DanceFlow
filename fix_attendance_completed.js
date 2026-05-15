import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

// 1. Alter Table
code = code.replace(
  `tryAlterTable("ALTER TABLE class_sessions ADD COLUMN substitute_teacher_id TEXT;");`,
  `tryAlterTable("ALTER TABLE class_sessions ADD COLUMN substitute_teacher_id TEXT;");
tryAlterTable("ALTER TABLE class_sessions ADD COLUMN attendanceCompleted INTEGER DEFAULT 0;");`
);

// 2. getSyncData
code = code.replace(
  `return { ...s, attendeeIds: parsed, substituteTeacherId: s.substitute_teacher_id, substitute_teacher_id: undefined };`,
  `return { ...s, attendeeIds: parsed, substituteTeacherId: s.substitute_teacher_id, substitute_teacher_id: undefined, attendanceCompleted: Boolean(s.attendanceCompleted) };`
);

// 3. /api/export
code = code.replace(
  `          substituteTeacherId: s.substitute_teacher_id,
          substitute_teacher_id: undefined
        };`,
  `          substituteTeacherId: s.substitute_teacher_id,
          substitute_teacher_id: undefined,
          attendanceCompleted: Boolean(s.attendanceCompleted)
        };`
);

// 4. /api/import
code = code.replace(
  `const insSes = db.prepare("INSERT INTO class_sessions (id, user_id, activityId, date, status, justification, notes, attendeeIds, duration) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");`,
  `const insSes = db.prepare("INSERT INTO class_sessions (id, user_id, activityId, date, status, justification, notes, attendeeIds, duration, attendanceCompleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");`
);
code = code.replace(
  `          insSes.run(newId, user.id, newActivityId, s.date || new Date().toISOString().split('T')[0], s.status || 'scheduled', s.justification || null, s.notes || null, JSON.stringify(newAttendeeIds), s.duration ?? 1);`,
  `          insSes.run(newId, user.id, newActivityId, s.date || new Date().toISOString().split('T')[0], s.status || 'scheduled', s.justification || null, s.notes || null, JSON.stringify(newAttendeeIds), s.duration ?? 1, s.attendanceCompleted ? 1 : 0);`
);

// 5. POST /api/sessions
code = code.replace(
  `const insert = db.prepare("INSERT OR REPLACE INTO class_sessions (id, user_id, activityId, date, status, justification, notes, attendeeIds, duration, substitute_teacher_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  
  db.transaction(() => {
    for (const s of sessions) {
      insert.run(s.id, (req as any).effectiveUserId, s.activityId, s.date || new Date().toISOString().split('T')[0], s.status || 'scheduled', s.justification || null, s.notes || null, JSON.stringify(s.attendeeIds || []), s.duration ?? 1, s.substituteTeacherId || null);`,
  `const insert = db.prepare("INSERT OR REPLACE INTO class_sessions (id, user_id, activityId, date, status, justification, notes, attendeeIds, duration, substitute_teacher_id, attendanceCompleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  
  db.transaction(() => {
    for (const s of sessions) {
      insert.run(s.id, (req as any).effectiveUserId, s.activityId, s.date || new Date().toISOString().split('T')[0], s.status || 'scheduled', s.justification || null, s.notes || null, JSON.stringify(s.attendeeIds || []), s.duration ?? 1, s.substituteTeacherId || null, s.attendanceCompleted ? 1 : 0);`
);


// 6. POST /api/sessions/:id (single)
code = code.replace(
  `db.prepare("INSERT OR REPLACE INTO class_sessions (id, user_id, activityId, date, status, justification, notes, attendeeIds, duration, substitute_teacher_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .run(s.id, (req as any).effectiveUserId, s.activityId, s.date || new Date().toISOString().split('T')[0], s.status || 'scheduled', s.justification || null, s.notes || null, JSON.stringify(s.attendeeIds || []), s.duration ?? 1, s.substituteTeacherId || null);`,
  `db.prepare("INSERT OR REPLACE INTO class_sessions (id, user_id, activityId, date, status, justification, notes, attendeeIds, duration, substitute_teacher_id, attendanceCompleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .run(s.id, (req as any).effectiveUserId, s.activityId, s.date || new Date().toISOString().split('T')[0], s.status || 'scheduled', s.justification || null, s.notes || null, JSON.stringify(s.attendeeIds || []), s.duration ?? 1, s.substituteTeacherId || null, s.attendanceCompleted ? 1 : 0);`
);
code = code.replace(
  `db.prepare("INSERT OR REPLACE INTO class_sessions (id, user_id, activityId, date, status, justification, notes, attendeeIds, duration, substitute_teacher_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
            .run(subSessionId, s.substituteTeacherId, subActId, s.date || new Date().toISOString().split('T')[0], 'held', null, \`Sustituyendo a \${user.name}\`, '[]', s.duration ?? 1, null);`,
  `db.prepare("INSERT OR REPLACE INTO class_sessions (id, user_id, activityId, date, status, justification, notes, attendeeIds, duration, substitute_teacher_id, attendanceCompleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
            .run(subSessionId, s.substituteTeacherId, subActId, s.date || new Date().toISOString().split('T')[0], 'held', null, \`Sustituyendo a \${user.name}\`, '[]', s.duration ?? 1, null, 0);`
);


fs.writeFileSync('server.ts', code);
console.log('Fixed DB logic for attendanceCompleted');
