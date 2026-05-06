import Database from 'better-sqlite3';
const db = new Database('./data/salsanova.db');
const act = db.prepare("SELECT * FROM activities").all();
console.log(act);
