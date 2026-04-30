import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "salsanova.db");
const db = new Database(dbPath);

console.log("Activities:", db.prepare("SELECT * FROM activities").all());
