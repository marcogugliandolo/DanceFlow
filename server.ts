import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import path from "path";
import Database from "better-sqlite3";
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

// Prevent caching on API requests
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// Get all activities
app.get("/api/activities", (req, res) => {
  const activities = db.prepare("SELECT * FROM activities").all();
  res.json(activities.map((a: any) => ({...a, isRecurring: Boolean(a.isRecurring)})));
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


// External API para integrar con n8n u otros servicios (similar a Alza.finance)
app.post("/api/external/clase", express.json(), (req, res) => {
  try {
    // Autenticación tipo Bearer Token (Authorization: Bearer <token>)
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    
    if (process.env.API_KEY && token !== process.env.API_KEY) {
      return res.status(401).json({ error: "No autorizado. Verifique su API Key en el encabezado Authorization: Bearer <API_KEY>" });
    }

    const { className, attendeesCount, date, status, justification } = req.body;

    if (!className) {
      return res.status(400).json({ error: "El campo 'className' es obligatorio para asociar la clase." });
    }

    // Buscar actividad por nombre (coincidencia parcial)
    const activity = db.prepare("SELECT * FROM activities WHERE name LIKE ? LIMIT 1").get(`%${className}%`) as any;

    if (!activity) {
      return res.status(404).json({ error: `No pude encontrar una clase (actividad) que coincida con "${className}".` });
    }

    // Create session (use provided date or today)
    const sessionDate = date || new Date().toISOString().split('T')[0];
    const sessionId = crypto.randomUUID();
    const sessionStatus = status || 'held';

    db.prepare("INSERT INTO class_sessions (id, activityId, date, status, attendeesCount, justification) VALUES (?, ?, ?, ?, ?, ?)")
      .run(sessionId, activity.id, sessionDate, sessionStatus, attendeesCount || null, justification || null);

    res.json({
      success: true,
      message: `Clase externa registrada: ${activity.name}`,
      data: {
        id: sessionId,
        activityId: activity.id,
        activityName: activity.name,
        date: sessionDate,
        status: sessionStatus,
        attendeesCount: attendeesCount || 'No especificado',
        justification: justification || null
      }
    });

  } catch (error) {
    console.error("Error en API Externa:", error);
    res.status(500).json({ error: "Error interno del servidor al registrar la clase externa" });
  }
});

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
