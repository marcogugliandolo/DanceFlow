import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import path from "path";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fs from "fs";
import crypto from "crypto";
import session from "express-session";
import cookieParser from "cookie-parser";
import { OAuth2Client } from "google-auth-library";

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
    notes TEXT,
    attendeeIds TEXT,
    FOREIGN KEY (activityId) REFERENCES activities (id)
  );

  CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    google_id TEXT UNIQUE,
    name TEXT,
    email TEXT UNIQUE,
    avatar_url TEXT,
    password TEXT,
    theme TEXT DEFAULT 'dark'
  );
`);

const tryAlterTable = (sql: string) => {
  try { db.exec(sql); } catch (e) { /* ignore duplicate column errors */ }
};

tryAlterTable("ALTER TABLE students ADD COLUMN phone TEXT;");
tryAlterTable("ALTER TABLE students ADD COLUMN email TEXT;");
tryAlterTable("ALTER TABLE students ADD COLUMN notes TEXT;");
tryAlterTable("ALTER TABLE class_sessions ADD COLUMN duration REAL DEFAULT 1;");
tryAlterTable("ALTER TABLE activities ADD COLUMN defaultDuration REAL DEFAULT 1;");

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

app.set('trust proxy', 1);

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || "salsanova-secret-key-12345",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
}));

// Auth Routes
const getGoogleClient = (req: express.Request) => {
  if (!process.env.GOOGLE_CLIENT_ID) return null;
  // Use APP_URL if provided, otherwise fallback to request host
  const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const redirectUri = `${baseUrl}/api/auth/google/callback`;
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
};

app.get("/api/auth/google/url", (req, res) => {
  const client = getGoogleClient(req);
  if (!client) {
    return res.status(500).json({ error: "Google OAuth not configured" });
  }
  const url = client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  });
  res.json({ url });
});

app.get("/api/auth/google/callback", async (req, res) => {
  const code = req.query.code as string;
  const client = getGoogleClient(req);
  
  if (!code || !client) {
    return res.redirect("/?error=no_code");
  }

  try {
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (payload) {
      const { sub: googleId, name, email, picture: avatarUrl } = payload;

      // Check if user exists
      let user = db.prepare("SELECT * FROM users WHERE google_id = ?").get(googleId) as any;

      if (!user) {
        // Create user
        const id = crypto.randomUUID();
        db.prepare("INSERT INTO users (id, google_id, name, email, avatar_url) VALUES (?, ?, ?, ?, ?)")
          .run(id, googleId, name, email, avatarUrl);
        user = { id, google_id: googleId, name, email, avatar_url: avatarUrl };
      }

      // Set user in session
      ((req as any).session as any).user = user;
      
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Autenticación exitosa. Esta ventana se cerrará automáticamente.</p>
          </body>
        </html>
      `);
    } else {
      res.redirect("/?error=no_payload");
    }
  } catch (err) {
    console.error("Google Auth Error:", err);
    res.redirect("/?error=auth_failed");
  }
});

app.get("/api/auth/me", (req, res) => {
  res.json({ user: ((req as any).session as any).user || null });
});

app.post("/api/auth/logout", (req, res) => {
  (req as any).session.destroy(() => {
    res.json({ success: true });
  });
});

app.post("/api/profile", (req, res) => {
  const user = ((req as any).session as any).user;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { name, email, avatarUrl, theme } = req.body;
  try {
    db.prepare("UPDATE users SET name = ?, email = ?, avatar_url = ?, theme = ? WHERE id = ?")
      .run(name, email, avatarUrl, theme || user.theme, user.id);
    
    // Update session user
    ((req as any).session as any).user = { ...user, name, email, avatar_url: avatarUrl, theme: theme || user.theme };
    res.json({ success: true, user: ((req as any).session as any).user });
  } catch (err: any) {
    res.status(500).json({ error: "DB Error", details: err.message });
  }
});

// Legacy login for backwards compatibility (can be removed later)
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  // Ana Salsanova default account
  if (username.toLowerCase() === "ana" && password === "salsanova") {
    let user = db.prepare("SELECT * FROM users WHERE email = ?").get("profesor@ejemplo.com") as any;
    if (!user) {
      const id = crypto.randomUUID();
      db.prepare("INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)")
        .run(id, "Profesor", "profesor@ejemplo.com", "salsanova");
      user = { id, name: "Profesor", email: "profesor@ejemplo.com" };
    }
    ((req as any).session as any).user = user;
    return res.json({ success: true, user });
  }
  res.status(401).json({ error: "Invalid credentials" });
});

app.post("/api/profile/password", (req, res) => {
  const user = ((req as any).session as any).user;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { currentPassword, newPassword } = req.body;
  try {
    const dbUser = db.prepare("SELECT password FROM users WHERE id = ?").get(user.id) as any;
    // For now, we compare plain text if they haven't set up hashing, 
    // but the session user might not have the real password if it came from Google.
    // If googleId exists, they might not have a password.
    if (dbUser.password && dbUser.password !== currentPassword) {
      return res.status(400).json({ error: "La contraseña actual es incorrecta" });
    }

    db.prepare("UPDATE users SET password = ? WHERE id = ?").run(newPassword, user.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "DB Error", details: err.message });
  }
});

app.get("/api/export", (req, res) => {
  const user = ((req as any).session as any).user;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  try {
    const activities = db.prepare("SELECT * FROM activities").all();
    const sessions = db.prepare("SELECT * FROM class_sessions").all();
    const students = db.prepare("SELECT * FROM students").all();
    
    res.json({
      activities,
      sessions: sessions.map((s: any) => ({
        ...s,
        attendeeIds: s.attendeeIds ? JSON.parse(s.attendeeIds) : []
      })),
      students,
      exportDate: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ error: "Export Error", details: err.message });
  }
});

app.post("/api/import", (req, res) => {
  const user = ((req as any).session as any).user;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { activities, sessions, students } = req.body;
  try {
    db.transaction(() => {
      // Clear existing data
      db.prepare("DELETE FROM activities").run();
      db.prepare("DELETE FROM class_sessions").run();
      db.prepare("DELETE FROM students").run();

      // Import activities
      if (activities && Array.isArray(activities)) {
        const insAct = db.prepare("INSERT INTO activities (id, name, location, pricePerClass, paymentType, isRecurring, defaultDuration) VALUES (?, ?, ?, ?, ?, ?, ?)");
        for (const a of activities) {
          insAct.run(a.id, a.name, a.location, a.pricePerClass, a.paymentType || null, a.isRecurring ? 1 : 0, a.defaultDuration ?? 1);
        }
      }

      // Import sessions
      if (sessions && Array.isArray(sessions)) {
        const insSes = db.prepare("INSERT INTO class_sessions (id, activityId, date, status, justification, notes, attendeeIds, duration) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        for (const s of sessions) {
          insSes.run(s.id, s.activityId, s.date, s.status, s.justification || null, s.notes || null, JSON.stringify(s.attendeeIds || []), s.duration ?? 1);
        }
      }

      // Import students
      if (students && Array.isArray(students)) {
        const insStu = db.prepare("INSERT INTO students (id, name, phone, email, notes) VALUES (?, ?, ?, ?, ?)");
        for (const s of students) {
          insStu.run(s.id, s.name, s.phone || null, s.email || null, s.notes || null);
        }
      }
    })();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Import Error", details: err.message });
  }
});

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
  const insert = db.prepare("INSERT OR REPLACE INTO activities (id, name, location, pricePerClass, paymentType, isRecurring, defaultDuration) VALUES (?, ?, ?, ?, ?, ?, ?)");
  
  db.transaction(() => {
    // Basic sync: delete all and insert or just insert/replace
    // For simplicity, handle just insert/replace
    for (const a of activities) {
      insert.run(a.id, a.name, a.location, a.pricePerClass, a.paymentType || null, a.isRecurring ? 1 : 0, a.defaultDuration ?? 1);
    }
  })();
  res.json({ success: true });
});

// Update or add single activity
app.post("/api/activities/:id", (req, res) => {
  const a = req.body;
  db.prepare("INSERT OR REPLACE INTO activities (id, name, location, pricePerClass, paymentType, isRecurring, defaultDuration) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(a.id, a.name, a.location, a.pricePerClass, a.paymentType || null, a.isRecurring ? 1 : 0, a.defaultDuration ?? 1);
  res.json({ success: true });
});

app.delete("/api/activities/:id", (req, res) => {
  console.log("DELETE /api/activities/:id ->", req.params.id);
  try {
    const r1 = db.prepare("DELETE FROM class_sessions WHERE activityId = ?").run(req.params.id);
    const r2 = db.prepare("DELETE FROM activities WHERE id = ?").run(req.params.id);
    console.log("Delete result sessions:", r1, "activities:", r2);
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE activities error:", err);
    res.status(500).json({ error: "DB Error" });
  }
});

// Get all sessions
app.get("/api/sessions", (req, res) => {
  const sessions = db.prepare("SELECT * FROM class_sessions").all();
  // Ensure attendeeIds is returned as an array or empty array if null
  res.json(sessions.map((s: any) => ({
    ...s,
    attendeeIds: s.attendeeIds ? JSON.parse(s.attendeeIds) : []
  })));
});

// Save all sessions
app.post("/api/sessions", (req, res) => {
  const sessions = req.body;
  const insert = db.prepare("INSERT OR REPLACE INTO class_sessions (id, activityId, date, status, justification, notes, attendeeIds, duration) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  
  db.transaction(() => {
    for (const s of sessions) {
      insert.run(s.id, s.activityId, s.date, s.status, s.justification || null, s.notes || null, JSON.stringify(s.attendeeIds || []), s.duration ?? 1);
    }
  })();
  res.json({ success: true });
});

app.post("/api/sessions/:id", (req, res) => {
  const s = req.body;
  console.log("POST /api/sessions/:id ->", req.params.id, s);
  try {
    db.prepare("INSERT OR REPLACE INTO class_sessions (id, activityId, date, status, justification, notes, attendeeIds, duration) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(s.id, s.activityId, s.date, s.status, s.justification || null, s.notes || null, JSON.stringify(s.attendeeIds || []), s.duration ?? 1);
    res.json({ success: true });
  } catch (err: any) {
    console.error("POST session error:", err);
    res.status(500).json({ error: "DB Error", details: err.message });
  }
});

app.delete("/api/sessions/:id", (req, res) => {
  console.log("DELETE /api/sessions/:id ->", req.params.id);
  try {
    const result = db.prepare("DELETE FROM class_sessions WHERE id = ?").run(req.params.id);
    console.log("Delete result:", result);
    res.json({ success: true });
  } catch (err: any) {
    console.error("DELETE session error:", err);
    res.status(500).json({ error: "DB Error", details: err.message });
  }
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

    const { className, attendeesCount, date, status, justification, notes, attendeeIds } = req.body;

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
    const duration = req.body.duration || 1;

    db.prepare("INSERT INTO class_sessions (id, activityId, date, status, notes, justification, attendeeIds, duration) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(sessionId, activity.id, sessionDate, sessionStatus, notes || attendeesCount?.toString() || null, justification || null, JSON.stringify(attendeeIds || []), duration);

    res.json({
      success: true,
      message: `Clase externa registrada: ${activity.name}`,
      data: {
        id: sessionId,
        activityId: activity.id,
        activityName: activity.name,
        date: sessionDate,
        status: sessionStatus,
        notes: notes || attendeesCount?.toString() || 'No especificado',
        attendeeIds: attendeeIds || [],
        justification: justification || null
      }
    });

  } catch (error) {
    console.error("Error en API Externa:", error);
    res.status(500).json({ error: "Error interno del servidor al registrar la clase externa" });
  }
});

// Get all students
app.get("/api/students", (req, res) => {
  const students = db.prepare("SELECT * FROM students").all();
  res.json(students);
});

// Update or add single student
app.post("/api/students/:id", (req, res) => {
  const s = req.body;
  try {
    db.prepare("INSERT OR REPLACE INTO students (id, name, phone, email, notes) VALUES (?, ?, ?, ?, ?)")
      .run(s.id, s.name, s.phone || null, s.email || null, s.notes || null);
    res.json({ success: true, student: s });
  } catch (err: any) {
    console.error("POST student error:", err);
    res.status(500).json({ error: "DB Error", details: err.message });
  }
});

app.delete("/api/students/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM students WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    console.error("DELETE student error:", err);
    res.status(500).json({ error: "DB Error", details: err.message });
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
