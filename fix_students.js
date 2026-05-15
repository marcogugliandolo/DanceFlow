import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

// Add column to students if not exists
code = code.replace(
  `tryAlterTable("ALTER TABLE students ADD COLUMN location TEXT;");`,
  `tryAlterTable("ALTER TABLE students ADD COLUMN location TEXT;");
tryAlterTable("ALTER TABLE students ADD COLUMN enrolledActivityIds TEXT;");`
);

// Update insert logic for single student
code = code.replace(
  `db.prepare("INSERT OR REPLACE INTO students (id, user_id, name, phone, email, notes, location) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(s.id, (req as any).effectiveUserId, s.name || 'Estudiante', s.phone || null, s.email || null, s.notes || null, s.location || null);`,
  `db.prepare("INSERT OR REPLACE INTO students (id, user_id, name, phone, email, notes, location, enrolledActivityIds) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(s.id, (req as any).effectiveUserId, s.name || 'Estudiante', s.phone || null, s.email || null, s.notes || null, s.location || null, JSON.stringify(s.enrolledActivityIds || []));`
);

// Update insert logic for bulk students
code = code.replace(
  `const insert = db.prepare("INSERT OR REPLACE INTO students (id, user_id, name, phone, email, notes, location) VALUES (?, ?, ?, ?, ?, ?, ?)");
  
  try {
    db.transaction(() => {
      for (const s of students) {
        insert.run(s.id, (req as any).effectiveUserId, s.name || 'Estudiante', s.phone || null, s.email || null, s.notes || null, s.location || null);`,
  `const insert = db.prepare("INSERT OR REPLACE INTO students (id, user_id, name, phone, email, notes, location, enrolledActivityIds) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  
  try {
    db.transaction(() => {
      for (const s of students) {
        insert.run(s.id, (req as any).effectiveUserId, s.name || 'Estudiante', s.phone || null, s.email || null, s.notes || null, s.location || null, JSON.stringify(s.enrolledActivityIds || []));`
);

// Update getSyncData parsing
code = code.replace(
  `    students`,
  `    students: students.map((s: any) => {
      let parsed = [];
      if (s.enrolledActivityIds) {
        try { parsed = JSON.parse(s.enrolledActivityIds); } catch(e) {}
      }
      return { ...s, enrolledActivityIds: parsed };
    })`
);

// Update GET /api/students parsing
code = code.replace(
  `  const students = db.prepare("SELECT * FROM students WHERE user_id = ?").all((req as any).effectiveUserId);
  res.json(students);`,
  `  const students = db.prepare("SELECT * FROM students WHERE user_id = ?").all((req as any).effectiveUserId);
  res.json(students.map((s: any) => {
    let parsed = [];
    if (s.enrolledActivityIds) {
      try { parsed = JSON.parse(s.enrolledActivityIds); } catch(e) {}
    }
    return { ...s, enrolledActivityIds: parsed };
  }));`
);

// Update /api/export
code = code.replace(
  `      students,
      exportDate: new Date().toISOString()`,
  `      students: students.map((s: any) => {
        let parsed = [];
        if (s.enrolledActivityIds) {
          try { parsed = JSON.parse(s.enrolledActivityIds); } catch(e) {}
        }
        return { ...s, enrolledActivityIds: parsed };
      }),
      exportDate: new Date().toISOString()`
);

// Update /api/import 
code = code.replace(
  `      // Import students
      if (studentsToImport && Array.isArray(studentsToImport)) {
        const insStu = db.prepare("INSERT INTO students (id, user_id, name, phone, email, notes) VALUES (?, ?, ?, ?, ?, ?)");
        for (const s of studentsToImport) {
          const newId = crypto.randomUUID();
          studentIdMap.set(s.id, newId);
          insStu.run(newId, user.id, s.name || 'Estudiante sin nombre', s.phone || null, s.email || null, s.notes || null);
        }
      }`,
  `      // Import students
      if (studentsToImport && Array.isArray(studentsToImport)) {
        const insStu = db.prepare("INSERT INTO students (id, user_id, name, phone, email, notes, location, enrolledActivityIds) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        for (const s of studentsToImport) {
          const newId = crypto.randomUUID();
          studentIdMap.set(s.id, newId);
          // remap enrolledActivityIds
          let newEnrolled: string[] = [];
          if (Array.isArray(s.enrolledActivityIds)) {
             newEnrolled = s.enrolledActivityIds.map((oldActId: string) => activityIdMap.get(oldActId) || oldActId);
          }
          insStu.run(newId, user.id, s.name || 'Estudiante sin nombre', s.phone || null, s.email || null, s.notes || null, s.location || null, JSON.stringify(newEnrolled));
        }
      }`
);

fs.writeFileSync('server.ts', code);
console.log('Fixed server.ts');
