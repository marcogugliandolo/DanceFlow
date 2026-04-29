import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import path from "path";
import Database from "better-sqlite3";
import TelegramBot from "node-telegram-bot-api";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fs from "fs";
import crypto from "crypto";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Database setup
const db = new Database(path.join(dataDir, "salsanova.db"));

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    pricePerClass REAL NOT NULL,
    paymentType TEXT,
    isRecurring BOOLEAN
  );

  CREATE TABLE IF NOT EXISTS class_sessions (
    id TEXT PRIMARY KEY,
    activityId TEXT NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL,
    justification TEXT,
    attendeesCount INTEGER,
    FOREIGN KEY (activityId) REFERENCES activities (id)
  );
`);

// API endpoints to communicate with Frontend
const app = express();
app.use(cors());
app.use(express.json());

// Get all activities
app.get("/api/activities", (req, res) => {
  const activities = db.prepare("SELECT * FROM activities").all();
  res.json(activities.map(a => ({...a, isRecurring: Boolean(a.isRecurring)})));
});

// Save all activities
app.post("/api/activities", (req, res) => {
  const activities = req.body;
  const insert = db.prepare("INSERT OR REPLACE INTO activities (id, name, location, pricePerClass, paymentType, isRecurring) VALUES (?, ?, ?, ?, ?, ?)");
  
  db.transaction(() => {
    // Basic sync: delete all and insert or just insert/replace
    // For simplicity, handle just insert/replace
    for (const a of activities) {
      insert.run(a.id, a.name, a.location, a.pricePerClass, a.paymentType || null, a.isRecurring ? 1 : 0);
    }
  })();
  res.json({ success: true });
});

// Update or add single activity
app.post("/api/activities/:id", (req, res) => {
  const a = req.body;
  db.prepare("INSERT OR REPLACE INTO activities (id, name, location, pricePerClass, paymentType, isRecurring) VALUES (?, ?, ?, ?, ?, ?)")
    .run(a.id, a.name, a.location, a.pricePerClass, a.paymentType || null, a.isRecurring ? 1 : 0);
  res.json({ success: true });
});

app.delete("/api/activities/:id", (req, res) => {
  db.prepare("DELETE FROM activities WHERE id = ?").run(req.params.id);
  db.prepare("DELETE FROM class_sessions WHERE activityId = ?").run(req.params.id);
  res.json({ success: true });
});

// Get all sessions
app.get("/api/sessions", (req, res) => {
  const sessions = db.prepare("SELECT * FROM class_sessions").all();
  res.json(sessions);
});

// Save all sessions
app.post("/api/sessions", (req, res) => {
  const sessions = req.body;
  const insert = db.prepare("INSERT OR REPLACE INTO class_sessions (id, activityId, date, status, justification, attendeesCount) VALUES (?, ?, ?, ?, ?, ?)");
  
  db.transaction(() => {
    for (const s of sessions) {
      insert.run(s.id, s.activityId, s.date, s.status, s.justification || null, s.attendeesCount || null);
    }
  })();
  res.json({ success: true });
});

app.post("/api/sessions/:id", (req, res) => {
  const s = req.body;
  db.prepare("INSERT OR REPLACE INTO class_sessions (id, activityId, date, status, justification, attendeesCount) VALUES (?, ?, ?, ?, ?, ?)")
    .run(s.id, s.activityId, s.date, s.status, s.justification || null, s.attendeesCount || null);
  res.json({ success: true });
});

app.delete("/api/sessions/:id", (req, res) => {
  db.prepare("DELETE FROM class_sessions WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});


// Telegram Bot Setup
const token = process.env.TELEGRAM_BOT_TOKEN;
if (token) {
  const bot = new TelegramBot(token, { polling: true });
  console.log("Telegram Bot is running...");

  // Match /clase [NombreClase] [asistentes]
  bot.onText(/\/clase (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    if (!match) return;

    try {
      const input = match[1].trim();
      const parts = input.split(' ');
      
      // Assume the last part is a number if possible, else it's all class name
      let className = input;
      let attendeesCount = 1;
      let hasAttendees = false;

      if (parts.length > 1) {
        const lastPart = parts[parts.length - 1];
        if (!isNaN(parseInt(lastPart))) {
          attendeesCount = parseInt(lastPart);
          className = parts.slice(0, -1).join(' ').trim();
          hasAttendees = true;
        }
      }

      // Find activity by name (case insensitive partial match)
      const activity = db.prepare("SELECT * FROM activities WHERE name LIKE ? LIMIT 1").get(`%${className}%`) as any;

      if (!activity) {
        bot.sendMessage(chatId, `No pude encontrar una clase que coincida con "${className}". Asegúrate de que exista en el sistema.`);
        return;
      }

      // Create a session for today
      const today = new Date().toISOString().split('T')[0];
      const sessionId = crypto.randomUUID();

      db.prepare("INSERT INTO class_sessions (id, activityId, date, status, attendeesCount) VALUES (?, ?, ?, ?, ?)")
        .run(sessionId, activity.id, today, 'held', hasAttendees ? attendeesCount : null);

      bot.sendMessage(chatId, `✅ Clase registrada: *${activity.name}*\n📅 Fecha: ${today}\n👥 Asistentes: ${hasAttendees ? attendeesCount : 'No especificado'}\nEstado: Realizada`, { parse_mode: 'Markdown' });
      
    } catch (error) {
      console.error(error);
      bot.sendMessage(chatId, "Hubo un error al registrar la clase.");
    }
  });
  
  bot.on("message", (msg) => {
    if (msg.text && !msg.text.startsWith('/')) {
      bot.sendMessage(msg.chat.id, "Para registrar una clase, usa el comando:\n`/clase [Nombre] [Asistentes]`\nEjemplo: `/clase Latinos 15`", { parse_mode: 'Markdown' });
    }
  });
} else {
  console.log("No TELEGRAM_BOT_TOKEN provided. Telegram integration disabled.");
}

// Start Server
async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
