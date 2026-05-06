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
    user_id TEXT,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    pricePerClass REAL NOT NULL,
    paymentType TEXT,
    isRecurring BOOLEAN
  );

  CREATE TABLE IF NOT EXISTS class_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
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
    user_id TEXT,
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
tryAlterTable("ALTER TABLE activities ADD COLUMN user_id TEXT;");
tryAlterTable("ALTER TABLE class_sessions ADD COLUMN user_id TEXT;");
tryAlterTable("ALTER TABLE students ADD COLUMN user_id TEXT;");
tryAlterTable("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'teacher';");

// Ensure default users exist
let anaUser = db.prepare("SELECT * FROM users WHERE email = ?").get("profesor@ejemplo.com") as any;
if (!anaUser) {
  const anaId = crypto.randomUUID();
  db.prepare("INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)")
    .run(anaId, "Profesor", "profesor@ejemplo.com", "salsanova", "teacher");
  anaUser = { id: anaId };
}

let adminUser = db.prepare("SELECT * FROM users WHERE email = ?").get("admin@salsanova.com") as any;
if (!adminUser) {
  const adminId = crypto.randomUUID();
  db.prepare("INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)")
    .run(adminId, "Director", "admin@salsanova.com", "salsanova", "admin");
}

// Migrate old data assuming it belongs to Ana
if (anaUser) {
    db.prepare("UPDATE activities SET user_id = ? WHERE user_id IS NULL").run(anaUser.id);
    db.prepare("UPDATE class_sessions SET user_id = ? WHERE user_id IS NULL").run(anaUser.id);
    db.prepare("UPDATE students SET user_id = ? WHERE user_id IS NULL").run(anaUser.id);
}

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
    secure: true, // Always true for HTTPS (AI Studio)
    sameSite: 'none',
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
  if (username.toLowerCase() === "admin" && password === "salsanova") {
    let user = db.prepare("SELECT * FROM users WHERE email = ?").get("admin@salsanova.com") as any;
    if (!user) {
      const id = crypto.randomUUID();
      db.prepare("INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)")
        .run(id, "Director", "admin@salsanova.com", "salsanova", "admin");
      user = { id, name: "Director", email: "admin@salsanova.com", role: "admin" };
    }
    ((req as any).session as any).user = user;
    return res.json({ success: true, user });
  }

  // Ana Salsanova default account
  if (username.toLowerCase() === "ana" && password === "salsanova") {
    let user = db.prepare("SELECT * FROM users WHERE email = ?").get("profesor@ejemplo.com") as any;
    if (!user) {
      const id = crypto.randomUUID();
      db.prepare("INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)")
        .run(id, "Profesor", "profesor@ejemplo.com", "salsanova", "teacher");
      user = { id, name: "Profesor", email: "profesor@ejemplo.com", role: "teacher" };
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

// Auth Middleware
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = ((req as any).session as any).user;
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

app.get("/api/admin/stats", requireAuth, (req, res) => {
  const user = ((req as any).session as any).user;
  if (user.role !== 'admin') {
    return res.status(403).json({ error: "No tienes permiso para ver esto." });
  }

  // Resumen global: Usuarios, Actividades Totales, Sesiones Totales.
  const usersCount = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'teacher'").get() as any).count;
  const activitiesCount = (db.prepare("SELECT COUNT(*) as count FROM activities").get() as any).count;
  const sessionsCount = (db.prepare("SELECT COUNT(*) as count FROM class_sessions").get() as any).count;
  
  const allSessions = db.prepare("SELECT * FROM class_sessions").all() as any[];
  const allActivities = db.prepare("SELECT * FROM activities").all() as any[];

  let totalRevenue = 0;
  let totalHours = 0;

  allSessions.forEach(s => {
      const activity = allActivities.find(a => a.id === s.activityId);
      if (activity) {
          totalHours += (s.duration || 1);
          if (activity.paymentType !== "monthly") {
              if (s.status === "held" || s.status === "cancelled_billed") {
                  totalRevenue += activity.pricePerClass * (s.duration || 1);
              }
          }
      }
  });

  // Calculate monthly roughly (just sum all recurring without filtering by months logic for simplicity on global stats)
  const monthlyActs = allActivities.filter(a => a.paymentType === "monthly");
  monthlyActs.forEach(a => {
      // Very rough estimate for admin: just add the price for each recurring per user?
      // For a real app, you'd calculate months exactly. We'll simplify to just showing session revenue if needed.
  });

  res.json({
      usersCount, activitiesCount, sessionsCount, totalRevenue, totalHours
  });
});

app.get("/api/admin/users", requireAuth, (req, res) => {
  const user = ((req as any).session as any).user;
  if (user.role !== 'admin') {
    return res.status(403).json({ error: "No tienes permiso para ver esto." });
  }

  const users = db.prepare("SELECT id, name, email, avatar_url, role FROM users WHERE role = 'teacher'").all();
  
  // Agrupar algunas estadísticas por usuario
  const usersWithStats = users.map((u: any) => {
      const uActivities = (db.prepare("SELECT COUNT(*) as count FROM activities WHERE user_id = ?").get(u.id) as any).count;
      const uSessions = (db.prepare("SELECT COUNT(*) as count FROM class_sessions WHERE user_id = ?").get(u.id) as any).count;
      return { ...u, activitiesCount: uActivities, sessionsCount: uSessions };
  });

  res.json(usersWithStats);
});

// (const requireAuth removed to fix hoisting)

app.get("/api/export", requireAuth, (req, res) => {
  const user = ((req as any).session as any).user;
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

app.post("/api/import", requireAuth, (req, res) => {
  const user = ((req as any).session as any).user;
  const { activities, sessions, students } = req.body;
  try {
    db.transaction(() => {
      // Clear existing data for this user
      db.prepare("DELETE FROM activities WHERE user_id = ?").run(user.id);
      db.prepare("DELETE FROM class_sessions WHERE user_id = ?").run(user.id);
      db.prepare("DELETE FROM students WHERE user_id = ?").run(user.id);

      // Import activities
      if (activities && Array.isArray(activities)) {
        const insAct = db.prepare("INSERT INTO activities (id, user_id, name, location, pricePerClass, paymentType, isRecurring, defaultDuration) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        for (const a of activities) {
          insAct.run(a.id, user.id, a.name, a.location, a.pricePerClass, a.paymentType || null, a.isRecurring ? 1 : 0, a.defaultDuration ?? 1);
        }
      }

      // Import sessions
      if (sessions && Array.isArray(sessions)) {
        const insSes = db.prepare("INSERT INTO class_sessions (id, user_id, activityId, date, status, justification, notes, attendeeIds, duration) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        for (const s of sessions) {
          insSes.run(s.id, user.id, s.activityId, s.date, s.status, s.justification || null, s.notes || null, JSON.stringify(s.attendeeIds || []), s.duration ?? 1);
        }
      }

      // Import students
      if (students && Array.isArray(students)) {
        const insStu = db.prepare("INSERT INTO students (id, user_id, name, phone, email, notes) VALUES (?, ?, ?, ?, ?, ?)");
        for (const s of students) {
          insStu.run(s.id, user.id, s.name, s.phone || null, s.email || null, s.notes || null);
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
app.get("/api/activities", requireAuth, (req, res) => {
  const activities = db.prepare("SELECT * FROM activities").all();
  res.json(activities.map((a: any) => ({...a, isRecurring: Boolean(a.isRecurring)})));
});

// Save all activities
app.post("/api/activities", requireAuth, (req, res) => {
  const user = ((req as any).session as any).user;
  const activities = req.body;
  const insert = db.prepare("INSERT OR REPLACE INTO activities (id, user_id, name, location, pricePerClass, paymentType, isRecurring, defaultDuration) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  
  try {
    db.transaction(() => {
      for (const a of activities) {
        insert.run(a.id, user.id, a.name, a.location, a.pricePerClass, a.paymentType || null, a.isRecurring ? 1 : 0, a.defaultDuration ?? 1);
      }
    })();
    res.json({ success: true });
  } catch (err: any) {
    console.error("POST activities bulk error:", err);
    res.status(500).json({ error: "DB Error", details: err.message });
  }
});

// Update or add single activity
app.post("/api/activities/:id", requireAuth, (req, res) => {
  const user = ((req as any).session as any).user;
  const a = req.body;
  try {
    db.prepare("INSERT OR REPLACE INTO activities (id, user_id, name, location, pricePerClass, paymentType, isRecurring, defaultDuration) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(a.id, user.id, a.name, a.location, a.pricePerClass, a.paymentType || null, a.isRecurring ? 1 : 0, a.defaultDuration ?? 1);
    res.json({ success: true });
  } catch (err: any) {
    console.error("POST activity error:", err);
    res.status(500).json({ error: "DB Error", details: err.message });
  }
});

app.delete("/api/activities/:id", requireAuth, (req, res) => {
  try {
    const r1 = db.prepare("DELETE FROM class_sessions WHERE activityId = ?").run(req.params.id);
    const r2 = db.prepare("DELETE FROM activities WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE activities error:", err);
    res.status(500).json({ error: "DB Error" });
  }
});

// Get all sessions
app.get("/api/sessions", requireAuth, (req, res) => {
  const sessions = db.prepare("SELECT * FROM class_sessions").all();
  // Ensure attendeeIds is returned as an array or empty array if null
  res.json(sessions.map((s: any) => ({
    ...s,
    attendeeIds: s.attendeeIds ? JSON.parse(s.attendeeIds) : []
  })));
});

// Save all sessions
app.post("/api/sessions", requireAuth, (req, res) => {
  const user = ((req as any).session as any).user;
  const sessions = req.body;
  const insert = db.prepare("INSERT OR REPLACE INTO class_sessions (id, user_id, activityId, date, status, justification, notes, attendeeIds, duration) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  
  db.transaction(() => {
    for (const s of sessions) {
      insert.run(s.id, user.id, s.activityId, s.date, s.status, s.justification || null, s.notes || null, JSON.stringify(s.attendeeIds || []), s.duration ?? 1);
    }
  })();
  res.json({ success: true });
});

app.post("/api/sessions/:id", requireAuth, (req, res) => {
  const user = ((req as any).session as any).user;
  const s = req.body;
  try {
    db.prepare("INSERT OR REPLACE INTO class_sessions (id, user_id, activityId, date, status, justification, notes, attendeeIds, duration) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(s.id, user.id, s.activityId, s.date, s.status, s.justification || null, s.notes || null, JSON.stringify(s.attendeeIds || []), s.duration ?? 1);
    res.json({ success: true });
  } catch (err: any) {
    console.error("POST session error:", err);
    res.status(500).json({ error: "DB Error", details: err.message });
  }
});

app.delete("/api/sessions/:id", requireAuth, (req, res) => {
  try {
    const result = db.prepare("DELETE FROM class_sessions WHERE id = ?").run(req.params.id);
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
    
    // For external requests without a session, assign to the default user if possible, or fail if no user_id could be determined
    // In this basic version, we will fetch the first user as the default owner, or use a specified an email.
    let user = db.prepare("SELECT * FROM users ORDER BY ROWID ASC LIMIT 1").get() as any;
    if (!user) {
         return res.status(500).json({ error: "No users exist in the system to assign this class to." });
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

    db.prepare("INSERT INTO class_sessions (id, user_id, activityId, date, status, notes, justification, attendeeIds, duration) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(sessionId, user.id, activity.id, sessionDate, sessionStatus, notes || attendeesCount?.toString() || null, justification || null, JSON.stringify(attendeeIds || []), duration);

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
app.get("/api/students", requireAuth, (req, res) => {
  const students = db.prepare("SELECT * FROM students").all();
  res.json(students);
});

// Update or add single student
app.post("/api/students/:id", requireAuth, (req, res) => {
  const user = ((req as any).session as any).user;
  const s = req.body;
  try {
    db.prepare("INSERT OR REPLACE INTO students (id, user_id, name, phone, email, notes) VALUES (?, ?, ?, ?, ?, ?)")
      .run(s.id, user.id, s.name, s.phone || null, s.email || null, s.notes || null);
    res.json({ success: true, student: s });
  } catch (err: any) {
    console.error("POST student error:", err);
    res.status(500).json({ error: "DB Error", details: err.message });
  }
});

app.delete("/api/students/:id", requireAuth, (req, res) => {
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
