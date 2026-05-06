import Database from 'better-sqlite3';
const db = new Database('./data/salsanova.db');
const columns = db.pragma('table_info(class_sessions)');
console.log(columns);
