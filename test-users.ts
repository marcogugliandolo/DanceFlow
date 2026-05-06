import Database from 'better-sqlite3';
const database = new Database('./data/salsanova.db');
const users = database.prepare("SELECT * FROM users").all();
console.log(users);
