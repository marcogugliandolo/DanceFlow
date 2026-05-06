import Database from 'better-sqlite3';
const db = new Database('./data/salsanova.db');
const activities = db.prepare("SELECT * FROM activities").all();
console.log("Activities count:", activities.length);
if (activities.length > 0) console.log("First activity user_id:", activities[0].user_id);
const sessions = db.prepare("SELECT * FROM class_sessions").all();
console.log("Sessions count:", sessions.length);
if (sessions.length > 0) console.log("First session user_id:", sessions[0].user_id);
