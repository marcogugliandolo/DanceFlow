import Database from 'better-sqlite3';
const database = new Database('./data/salsanova.db');
const s = {
  id: "test3",
  user_id: "test-user",
  activityId: "act1",
  date: "2026-05-06",
  status: "held",
  justification: "none",
  notes: "test note",
  attendeeIds: [],
  duration: 1
};
try {
  database.prepare("INSERT OR REPLACE INTO class_sessions (id, user_id, activityId, date, status, justification, notes, attendeeIds, duration) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run(s.id, s.user_id, s.activityId, s.date, s.status, s.justification || null, s.notes || null, JSON.stringify(s.attendeeIds || []), s.duration ?? 1);
  console.log("Success");
} catch (e) {
  console.error("Error:", e);
}
