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
import { google } from "googleapis";

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

function getSyncData(userId: string) {
  const activities = db.prepare("SELECT * FROM activities WHERE user_id = ?").all(userId);
  const sessions = db.prepare("SELECT * FROM class_sessions WHERE user_id = ?").all(userId);
  const students = db.prepare("SELECT * FROM students WHERE user_id = ?").all(userId);

  return {
    activities: activities.map((a: any) => ({ ...a, isRecurring: Boolean(a.isRecurring) })),
    sessions: sessions.map((s: any) => {
      let parsed = [];
      if (s.attendeeIds) {
        try {
          parsed = JSON.parse(s.attendeeIds);
        } catch (e) {}
      }
      return { ...s, attendeeIds: parsed, substituteTeacherId: s.substitute_teacher_id, substitute_teacher_id: undefined, attendanceCompleted: Boolean(s.attendanceCompleted) };
    }),
    students: students.map((s: any) => {
      let parsed = [];
      if (s.enrolledActivityIds) {
        try { parsed = JSON.parse(s.enrolledActivityIds); } catch(e) {}
      }
      return { ...s, enrolledActivityIds: parsed };
    })
  };
}


function enrollStudentsInActivity(studentIds: string[], activityId: string, effectiveUserId: string) {
  if (!studentIds || studentIds.length === 0) return;
  
  const getStudent = db.prepare("SELECT * FROM students WHERE id = ? AND user_id = ?");
  const updateStudent = db.prepare("UPDATE students SET enrolledActivityIds = ? WHERE id = ?");

  for (const stuId of studentIds) {
    const student = getStudent.get(stuId, effectiveUserId) as any;
    if (student) {
      let enrolled = [];
      try {
        if (student.enrolledActivityIds) {
          enrolled = JSON.parse(student.enrolledActivityIds);
        }
      } catch (e) {}
      
      if (!enrolled.includes(activityId)) {
        enrolled.push(activityId);
        updateStudent.run(JSON.stringify(enrolled), stuId);
      }
    }
  }
}


try {
  const allSessions = db.prepare("SELECT * FROM class_sessions").all() as any[];
  for (const s of allSessions) {
    if (s.attendeeIds && s.attendeeIds !== '[]') {
      try {
        const attendeeIds = JSON.parse(s.attendeeIds);
        enrollStudentsInActivity(attendeeIds, s.activityId, s.user_id);
      } catch(e) {}
    }
  }
} catch (e) {
  console.log("Migration error (might be first run):", e);
}

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
    notes TEXT,
    location TEXT
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

tryAlterTable("ALTER TABLE users ADD COLUMN google_refresh_token TEXT;");
tryAlterTable("ALTER TABLE users ADD COLUMN drive_file_id TEXT;");
tryAlterTable("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';");
tryAlterTable("ALTER TABLE users ADD COLUMN last_active DATETIME;");
tryAlterTable("ALTER TABLE students ADD COLUMN phone TEXT;");

tryAlterTable("ALTER TABLE students ADD COLUMN email TEXT;");
tryAlterTable("ALTER TABLE students ADD COLUMN notes TEXT;");
tryAlterTable("ALTER TABLE students ADD COLUMN location TEXT;");
tryAlterTable("ALTER TABLE students ADD COLUMN enrolledActivityIds TEXT;");
tryAlterTable("ALTER TABLE class_sessions ADD COLUMN duration REAL DEFAULT 1;");
tryAlterTable("ALTER TABLE activities ADD COLUMN defaultDuration REAL DEFAULT 1;");
tryAlterTable("ALTER TABLE activities ADD COLUMN user_id TEXT;");
tryAlterTable("ALTER TABLE class_sessions ADD COLUMN user_id TEXT;");
tryAlterTable("ALTER TABLE class_sessions ADD COLUMN substitute_teacher_id TEXT;");
tryAlterTable("ALTER TABLE class_sessions ADD COLUMN attendanceCompleted INTEGER DEFAULT 0;");
tryAlterTable("ALTER TABLE students ADD COLUMN user_id TEXT;");

try {
  db.prepare("UPDATE users SET role = 'admin' WHERE email = 'marcogugliandolo94@gmail.com'").run();
} catch (e) {}

// Seed default users if they don't exist
const defaultUsersToSeed = [
  { name: "Super Admin", email: "admin@salsanova.com", password: "salsanova", role: "admin" },
  { name: "Ana Salsanova", email: "ana@salsanova.com", password: "salsanova", role: "user" },
  { name: "David Ybón", email: "david@salsanova.com", password: "salsanova", role: "user" },
  { name: "Laura Rancaño", email: "laura@salsanova.com", password: "salsanova", role: "user" },
  { name: "Débora Muñoz", email: "debora@salsanova.com", password: "salsanova", role: "user" },
  { name: "Ana Reborido", email: "ana.reborido@salsanova.com", password: "salsanova", role: "user" },
  { name: "Barbara Dieppa", email: "barbara@salsanova.com", password: "salsanova", role: "user" },
];

for (const u of defaultUsersToSeed) {
  try {
    const existing = db.prepare("SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(name) = ?").get(u.email.toLowerCase(), u.name.toLowerCase());
    if (!existing) {
      const id = crypto.randomUUID();
      db.prepare("INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)").run(id, u.name, u.email, u.password, u.role);
    }
  } catch (err) {}
}

// Migrate old data assuming it belongs to the first created user
const firstUser = db.prepare("SELECT id FROM users ORDER BY ROWID ASC LIMIT 1").get() as any;
if (firstUser) {
    db.prepare("UPDATE activities SET user_id = ? WHERE user_id IS NULL").run(firstUser.id);
    db.prepare("UPDATE class_sessions SET user_id = ? WHERE user_id IS NULL").run(firstUser.id);
    db.prepare("UPDATE students SET user_id = ? WHERE user_id IS NULL").run(firstUser.id);
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
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/drive.file"
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
        const isFirstUser = db.prepare("SELECT COUNT(*) as count FROM users").get() as any;
        const role = isFirstUser.count === 0 ? 'admin' : 'user';

        const id = crypto.randomUUID();
        db.prepare("INSERT INTO users (id, google_id, name, email, avatar_url, google_refresh_token, role) VALUES (?, ?, ?, ?, ?, ?, ?)")
          .run(id, googleId, name, email, avatarUrl, tokens.refresh_token || null, role);
        user = { id, google_id: googleId, name, email, avatar_url: avatarUrl, google_refresh_token: tokens.refresh_token || null, role };
      } else if (tokens.refresh_token) {
        db.prepare("UPDATE users SET google_refresh_token = ? WHERE id = ?").run(tokens.refresh_token, user.id);
        user.google_refresh_token = tokens.refresh_token;
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
  const sessionUser = ((req as any).session as any).user || null;
  if (!sessionUser) {
    return res.json({ user: null });
  }
  
  const dbUser = db.prepare("SELECT * FROM users WHERE id = ?").get(sessionUser.id) as any;
  if (!dbUser) {
    return res.json({ user: null });
  }
  
  const finalUser = {
    ...sessionUser,
    role: dbUser.role || 'user'
  };

  try {
    const syncData = getSyncData(sessionUser.id);
    res.json({ user: finalUser, syncData });
  } catch (error) {
    res.json({ user: finalUser });
  }
});

// Admin Routes
app.get("/api/admin/users", requireAdmin, (req, res) => {
  const users = db.prepare(`
    SELECT users.id, users.name, users.email, users.avatar_url, users.role, users.last_active, 
           COUNT(DISTINCT activities.id) as activitiesCount, 
           COUNT(DISTINCT class_sessions.id) as sessionsCount,
           COUNT(DISTINCT students.id) as studentsCount
    FROM users 
    LEFT JOIN activities ON users.id = activities.user_id
    LEFT JOIN class_sessions ON users.id = class_sessions.user_id
    LEFT JOIN students ON users.id = students.user_id
    GROUP BY users.id
  `).all();
  res.json(users);
});

app.put("/api/admin/users/:id/role", requireAdmin, (req, res) => {
  const { role } = req.body; 
  db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, req.params.id);
  res.json({ success: true });
});

app.get("/api/admin/users/:id/data", requireAdmin, (req, res) => {
  try {
    const syncData = getSyncData(req.params.id);
    const user = db.prepare("SELECT id, name, email FROM users WHERE id = ?").get(req.params.id);
    res.json({ user, syncData });
  } catch(e: any) {
    res.status(500).json({ error: "DB Error" });
  }
});

app.post("/api/admin/users", requireAdmin, (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "El nombre es obligatorio" });
  }
  if (!email || !email.trim()) {
    return res.status(400).json({ error: "El correo electrónico es obligatorio" });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();
  const cleanRole = role === 'admin' ? 'admin' : 'user';
  const cleanPassword = (password && password.trim()) ? password.trim() : 'salsanova';

  const existing = db.prepare("SELECT * FROM users WHERE LOWER(email) = ?").get(cleanEmail);
  if (existing) {
    return res.status(400).json({ error: "Ya existe un usuario con este correo electrónico" });
  }

  try {
    const id = crypto.randomUUID();
    db.prepare("INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)")
      .run(id, cleanName, cleanEmail, cleanPassword, cleanRole);

    const newUser = db.prepare(`
      SELECT users.id, users.name, users.email, users.avatar_url, users.role, users.last_active, 
             0 as activitiesCount, 0 as sessionsCount, 0 as studentsCount
      FROM users WHERE id = ?
    `).get(id);

    res.json({ success: true, user: newUser });
  } catch (err: any) {
    res.status(500).json({ error: "Error al crear el usuario: " + err.message });
  }
});

app.delete("/api/admin/users/:id", requireAdmin, (req, res) => {
  const sessionUser = ((req as any).session as any).user;
  if (sessionUser && sessionUser.id === req.params.id) {
    return res.status(400).json({ error: "No puedes eliminar tu propia cuenta de administrador" });
  }
  try {
    db.transaction(() => {
      db.prepare("DELETE FROM activities WHERE user_id = ?").run(req.params.id);
      db.prepare("DELETE FROM class_sessions WHERE user_id = ?").run(req.params.id);
      db.prepare("DELETE FROM students WHERE user_id = ?").run(req.params.id);
      db.prepare("DELETE FROM class_sessions WHERE substitute_teacher_id = ?").run(req.params.id);
      db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
    })();
    res.json({ success: true });
  } catch(e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/auth/logout", (req, res) => {
  (req as any).session.destroy(() => {
    res.json({ success: true });
  });
});

app.post("/api/profile", requireAuth, (req, res) => {
  const effectiveUserId = (req as any).effectiveUserId;
  const sessionUser = ((req as any).session as any).user;

  const { name, email, avatarUrl, theme } = req.body;
  try {
    const defaultTheme = theme || "dark";
    db.prepare("UPDATE users SET name = ?, email = ?, avatar_url = ?, theme = ? WHERE id = ?")
      .run(name, email, avatarUrl, defaultTheme, effectiveUserId);
    
    const updatedUser = db.prepare("SELECT * FROM users WHERE id = ?").get(effectiveUserId) as any;
    
    // Update session user only if editing self
    if (sessionUser.id === effectiveUserId) {
      ((req as any).session as any).user = updatedUser;
    }
    
    res.json({ success: true, user: updatedUser });
  } catch (err: any) {
    res.status(500).json({ error: "DB Error", details: err.message });
  }
});

// Legacy login for backwards compatibility (can be removed later)
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  // Ana Salsanova default account
  if (username.toLowerCase() === "ana" && password === "salsanova") {
    let user = db.prepare("SELECT * FROM users WHERE email = ?").get("ana@salsanova.com") as any;
    if (!user) {
      let legacyUser = db.prepare("SELECT * FROM users WHERE email = ?").get("profesor@ejemplo.com") as any;
      if (legacyUser) {
        db.prepare("UPDATE users SET name = ?, email = ? WHERE id = ?").run("Ana Salsanova", "ana@salsanova.com", legacyUser.id);
        user = db.prepare("SELECT * FROM users WHERE id = ?").get(legacyUser.id) as any;
      } else {
        const id = crypto.randomUUID();
        db.prepare("INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)")
          .run(id, "Ana Salsanova", "ana@salsanova.com", "salsanova", "user");
        user = { id, name: "Ana Salsanova", email: "ana@salsanova.com", role: "user" };
      }
    }
    ((req as any).session as any).user = user;
    try {
      const syncData = getSyncData(user.id);
      return res.json({ success: true, user, syncData });
    } catch {
      return res.json({ success: true, user });
    }
  }

  // Admin testing account
  if (username.toLowerCase() === "admin" && password === "salsanova") {
    let user = db.prepare("SELECT * FROM users WHERE email = ?").get("admin@salsanova.com") as any;
    if (!user) {
      const id = crypto.randomUUID();
      db.prepare("INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)")
        .run(id, "Super Admin", "admin@salsanova.com", "salsanova", "admin");
      user = { id, name: "Super Admin", email: "admin@salsanova.com", role: "admin" };
    }
    ((req as any).session as any).user = user;
    try {
      const syncData = getSyncData(user.id);
      return res.json({ success: true, user, syncData });
    } catch {
      return res.json({ success: true, user });
    }
  }

  // Database lookup for any created user (by email or exact name or first name)
  if (username) {
    const trimmed = username.trim().toLowerCase();
    const dbUser = db.prepare(`
      SELECT * FROM users 
      WHERE LOWER(email) = ? OR LOWER(name) = ? OR LOWER(name) LIKE ?
    `).get(trimmed, trimmed, `${trimmed}%`) as any;

    if (dbUser && (dbUser.password === password || !dbUser.password)) {
      ((req as any).session as any).user = dbUser;
      db.prepare("UPDATE users SET last_active = ? WHERE id = ?").run(new Date().toISOString(), dbUser.id);
      try {
        const syncData = getSyncData(dbUser.id);
        return res.json({ success: true, user: dbUser, syncData });
      } catch {
        return res.json({ success: true, user: dbUser });
      }
    }
  }

  res.status(401).json({ error: "Credenciales incorrectas" });
});

app.post("/api/profile/password", requireAuth, (req, res) => {
  const effectiveUserId = (req as any).effectiveUserId;
  const { currentPassword, newPassword } = req.body;
  const bypassCurrent = !!req.query.admin_user_id;

  try {
    const dbUser = db.prepare("SELECT password FROM users WHERE id = ?").get(effectiveUserId) as any;
    // For now, we compare plain text if they haven't set up hashing, 
    // but the session user might not have the real password if it came from Google.
    // If googleId exists, they might not have a password.
    if (!bypassCurrent && dbUser.password && dbUser.password !== currentPassword) {
      return res.status(400).json({ error: "La contraseña actual es incorrecta" });
    }

    db.prepare("UPDATE users SET password = ? WHERE id = ?").run(newPassword, effectiveUserId);
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
  db.prepare("UPDATE users SET last_active = ? WHERE id = ?").run(new Date().toISOString(), user.id);
  
  // Set effectiveUserId for admin proxy
  (req as any).effectiveUserId = user.id;
  if (user.role === 'admin' && req.query.admin_user_id) {
    (req as any).effectiveUserId = req.query.admin_user_id;
  }
  
  next();
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = ((req as any).session as any).user;
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const dbUser = db.prepare("SELECT role FROM users WHERE id = ?").get(user.id) as any;
  if (!dbUser || dbUser.role !== 'admin') {
    return res.status(403).json({ error: "Forbidden: Admins only" });
  }
  db.prepare("UPDATE users SET last_active = ? WHERE id = ?").run(new Date().toISOString(), user.id);
  next();
}

app.get("/api/export", requireAuth, (req, res) => {
  const user = ((req as any).session as any).user;
  try {
    const activities = db.prepare("SELECT * FROM activities WHERE user_id = ?").all(user.id);
    const sessions = db.prepare("SELECT * FROM class_sessions WHERE user_id = ?").all(user.id);
    const students = db.prepare("SELECT * FROM students WHERE user_id = ?").all(user.id);
    
    res.json({
      activities,
      sessions: sessions.map((s: any) => {
        let parsed = [];
        if (s.attendeeIds) {
          try {
            parsed = JSON.parse(s.attendeeIds);
            if (!Array.isArray(parsed)) parsed = [];
          } catch(e) {}
        }
        return {
          ...s,
          attendeeIds: parsed,
          substituteTeacherId: s.substitute_teacher_id,
          substitute_teacher_id: undefined,
          attendanceCompleted: Boolean(s.attendanceCompleted)
        };
      }),
      students: students.map((s: any) => {
        let parsed = [];
        if (s.enrolledActivityIds) {
          try { parsed = JSON.parse(s.enrolledActivityIds); } catch(e) {}
        }
        return { ...s, enrolledActivityIds: parsed };
      }),
      exportDate: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ error: "Export Error", details: err.message });
  }
});

app.post("/api/import", requireAuth, (req, res) => {
  const user = ((req as any).session as any).user;
  const { activities, sessions, students, dance_activities, dance_sessions, dance_students } = req.body;
  
  const activitiesToImport = activities || dance_activities;
  const sessionsToImport = sessions || dance_sessions;
  const studentsToImport = students || dance_students;

  try {
    const activityIdMap = new Map<string, string>();
    const studentIdMap = new Map<string, string>();

    db.transaction(() => {
      // Clear existing data for this user
      db.prepare("DELETE FROM activities WHERE user_id = ?").run(user.id);
      db.prepare("DELETE FROM class_sessions WHERE user_id = ?").run(user.id);
      db.prepare("DELETE FROM students WHERE user_id = ?").run(user.id);

      // Import activities
      if (activitiesToImport && Array.isArray(activitiesToImport)) {
        const insAct = db.prepare("INSERT INTO activities (id, user_id, name, location, pricePerClass, paymentType, isRecurring, defaultDuration) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        for (const a of activitiesToImport) {
          const newId = crypto.randomUUID();
          activityIdMap.set(a.id, newId);
          insAct.run(newId, user.id, a.name || 'Actividad sin nombre', a.location || 'Sin ubicación', a.pricePerClass || 0, a.paymentType || null, a.isRecurring ? 1 : 0, a.defaultDuration ?? 1);
        }
      }

      // Import students
      if (studentsToImport && Array.isArray(studentsToImport)) {
        const insStu = db.prepare("INSERT INTO students (id, user_id, name, phone, email, notes, location, enrolledActivityIds) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        for (const s of studentsToImport) {
          const newId = crypto.randomUUID();
          studentIdMap.set(s.id, newId);
          // remap enrolledActivityIds
          let newEnrolled: string[] = [];
          if (Array.isArray(s.enrolledActivityIds)) {
             newEnrolled = s.enrolledActivityIds.map((oldActId: string) => activityIdMap.get(oldActId) || oldActId);
          }
          insStu.run(newId, user.id, s.name || 'Estudiante sin nombre', s.phone || null, s.email || null, s.notes || null, s.location || null, JSON.stringify(newEnrolled));
        }
      }

      // Import sessions (dependent on activities and students)
      if (sessionsToImport && Array.isArray(sessionsToImport)) {
        const insSes = db.prepare("INSERT INTO class_sessions (id, user_id, activityId, date, status, justification, notes, attendeeIds, duration, attendanceCompleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        for (const s of sessionsToImport) {
          const newId = crypto.randomUUID();
          const newActivityId = activityIdMap.get(s.activityId) || s.activityId; // fallback should not happen normally
          
          let newAttendeeIds: string[] = [];
          if (Array.isArray(s.attendeeIds)) {
            newAttendeeIds = s.attendeeIds.map(oldId => studentIdMap.get(oldId as string) || (oldId as string));
          } else if (typeof s.attendeeIds === 'string') {
            try {
              const parsed = JSON.parse(s.attendeeIds);
              if (Array.isArray(parsed)) {
                newAttendeeIds = parsed.map(oldId => studentIdMap.get(oldId as string) || (oldId as string));
              }
            } catch (e) {}
          }

          insSes.run(newId, user.id, newActivityId, s.date || new Date().toISOString().split('T')[0], s.status || 'scheduled', s.justification || null, s.notes || null, JSON.stringify(newAttendeeIds), s.duration ?? 1, s.attendanceCompleted ? 1 : 0);
        }
      }
    })();
    res.json({ success: true });
  } catch (err: any) {
    console.error("Import error:", err);
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
  const user = ((req as any).session as any).user;
  const activities = db.prepare("SELECT * FROM activities WHERE user_id = ?").all((req as any).effectiveUserId);
  res.json(activities.map((a: any) => ({...a, isRecurring: Boolean(a.isRecurring)})));
});

// Save all activities
app.post("/api/activities", requireAuth, (req, res) => {
  const user = ((req as any).session as any).user;
  const activities = req.body;
  const insert = db.prepare("INSERT OR REPLACE INTO activities (id, user_id, name, location, pricePerClass, paymentType, isRecurring, defaultDuration) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  
  db.transaction(() => {
    for (const a of activities) {
      insert.run(a.id, (req as any).effectiveUserId, a.name || 'Actividad sin nombre', a.location || 'Sin ubicación', a.pricePerClass || 0, a.paymentType || null, a.isRecurring ? 1 : 0, a.defaultDuration ?? 1);
    }
  })();
  res.json({ success: true });
});

// Update or add single activity
app.post("/api/activities/:id", requireAuth, (req, res) => {
  const user = ((req as any).session as any).user;
  const a = req.body;
  db.prepare("INSERT OR REPLACE INTO activities (id, user_id, name, location, pricePerClass, paymentType, isRecurring, defaultDuration) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run(a.id, (req as any).effectiveUserId, a.name || 'Actividad', a.location || 'Sin ubicación', a.pricePerClass || 0, a.paymentType || null, a.isRecurring ? 1 : 0, a.defaultDuration ?? 1);
  res.json({ success: true });
});

app.delete("/api/activities/:id", requireAuth, (req, res) => {
  const user = ((req as any).session as any).user;
  try {
    const r1 = db.prepare("DELETE FROM class_sessions WHERE activityId = ? AND user_id = ?").run(req.params.id, (req as any).effectiveUserId);
    const r2 = db.prepare("DELETE FROM activities WHERE id = ? AND user_id = ?").run(req.params.id, (req as any).effectiveUserId);
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE activities error:", err);
    res.status(500).json({ error: "DB Error" });
  }
});

// Get all sessions
app.get("/api/sessions", requireAuth, (req, res) => {
  const user = ((req as any).session as any).user;
  const sessions = db.prepare("SELECT * FROM class_sessions WHERE user_id = ?").all((req as any).effectiveUserId);
  // Ensure attendeeIds is returned as an array or empty array if null
  res.json(sessions.map((s: any) => {
    let parsed = [];
    if (s.attendeeIds) {
      try {
        parsed = JSON.parse(s.attendeeIds);
        if (!Array.isArray(parsed)) parsed = [];
      } catch(e) {
        // Fallback for invalid JSON strings
        parsed = [];
      }
    }
    return {
      ...s,
      attendeeIds: parsed,
      substituteTeacherId: s.substitute_teacher_id,
      substitute_teacher_id: undefined
    };
  }));
});

// Save all sessions
app.post("/api/sessions", requireAuth, (req, res) => {
  const user = ((req as any).session as any).user;
  const sessions = req.body;
  const insert = db.prepare("INSERT OR REPLACE INTO class_sessions (id, user_id, activityId, date, status, justification, notes, attendeeIds, duration, substitute_teacher_id, attendanceCompleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  
  db.transaction(() => {
    for (const s of sessions) {
      insert.run(s.id, (req as any).effectiveUserId, s.activityId, s.date || new Date().toISOString().split('T')[0], s.status || 'scheduled', s.justification || null, s.notes || null, JSON.stringify(s.attendeeIds || []), s.duration ?? 1, s.substituteTeacherId || null, s.attendanceCompleted ? 1 : 0);
      if (s.attendeeIds && s.attendeeIds.length > 0) {
        enrollStudentsInActivity(s.attendeeIds, s.activityId, (req as any).effectiveUserId);
      }
    }
  })();
  res.json({ success: true });
});

app.post("/api/sessions/:id", requireAuth, (req, res) => {
  const user = ((req as any).session as any).user;
  const s = req.body;
  try {
    db.transaction(() => {
      db.prepare("INSERT OR REPLACE INTO class_sessions (id, user_id, activityId, date, status, justification, notes, attendeeIds, duration, substitute_teacher_id, attendanceCompleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .run(s.id, (req as any).effectiveUserId, s.activityId, s.date || new Date().toISOString().split('T')[0], s.status || 'scheduled', s.justification || null, s.notes || null, JSON.stringify(s.attendeeIds || []), s.duration ?? 1, s.substituteTeacherId || null, s.attendanceCompleted ? 1 : 0);
      
      if (s.attendeeIds && s.attendeeIds.length > 0) {
        enrollStudentsInActivity(s.attendeeIds, s.activityId, (req as any).effectiveUserId);
      }

      if (s.status === 'substitution' && s.substituteTeacherId) {
        const subSessionId = `sub_${s.id}`;
        
        // Ensure an activity exists for the substitute teacher
        const originActivity = db.prepare("SELECT * FROM activities WHERE id = ?").get(s.activityId) as any;
        if (originActivity) {
          const subActId = `sub_${s.activityId}_${s.substituteTeacherId}`;
          const existingAct = db.prepare("SELECT id FROM activities WHERE id = ?").get(subActId);
          if (!existingAct) {
            db.prepare("INSERT INTO activities (id, user_id, name, location, pricePerClass, paymentType, isRecurring, defaultDuration) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
              .run(subActId, s.substituteTeacherId, originActivity.name + ' (Sustitución)', originActivity.location || '', originActivity.pricePerClass || 0, 'fixed', 0, originActivity.defaultDuration || 1);
          }
          
          const originTeacher = db.prepare("SELECT name FROM users WHERE id = ?").get((req as any).effectiveUserId) as any;
          const teacherName = originTeacher ? originTeacher.name : user.name;
          
          db.prepare("INSERT OR REPLACE INTO class_sessions (id, user_id, activityId, date, status, justification, notes, attendeeIds, duration, substitute_teacher_id, attendanceCompleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
            .run(subSessionId, s.substituteTeacherId, subActId, s.date || new Date().toISOString().split('T')[0], 'held', null, `Sustituyendo a ${teacherName}`, JSON.stringify(s.attendeeIds || []), s.duration ?? 1, null, 0);
        }
      } else {
        // If it was reverted from substitution
        const subSessionId = `sub_${s.id}`;
        db.prepare("DELETE FROM class_sessions WHERE id = ?").run(subSessionId);
      }
    })();
    res.json({ success: true });
  } catch (err: any) {
    console.error("POST session error:", err);
    res.status(500).json({ error: "DB Error", details: err.message });
  }
});

app.delete("/api/sessions/:id", requireAuth, (req, res) => {
  const user = ((req as any).session as any).user;
  try {
    const result = db.prepare("DELETE FROM class_sessions WHERE id = ? AND user_id = ?").run(req.params.id, (req as any).effectiveUserId);
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
    const activity = db.prepare("SELECT * FROM activities WHERE name LIKE ? AND user_id = ? LIMIT 1").get(`%${className}%`, user.id) as any;

    if (!activity) {
      return res.status(404).json({ error: `No pude encontrar una clase (actividad) que coincida con "${className}".` });
    }

    // Create session (use provided date or today)
    const sessionDate = date || new Date().toISOString().split('T')[0];
    const sessionId = crypto.randomUUID();
    
    // Normalize status ("Realizada", "Completada" -> "held", others to lowercase or fallback)
    let sessionStatus = 'held';
    if (status) {
      const sLower = status.toLowerCase().trim();
      if (sLower === 'held' || sLower === 'realizada' || sLower === 'completada' || sLower === 'realizada') {
        sessionStatus = 'held';
      } else if (sLower === 'cancelled_billed' || sLower.includes('cobra')) {
        sessionStatus = 'cancelled_billed';
      } else if (sLower === 'cancelled_unbilled' || sLower.includes('no cobra') || sLower.includes('cancel')) {
        sessionStatus = 'cancelled_unbilled';
      } else {
        sessionStatus = 'held';
      }
    }

    const duration = req.body.duration || 1;
    
    // Safe parse attendee ids
    let parsedAttendeeIds: string[] = [];
    if (Array.isArray(attendeeIds)) {
        parsedAttendeeIds = attendeeIds;
    } else if (typeof attendeeIds === 'string') {
        try {
            const parsed = JSON.parse(attendeeIds);
            if (Array.isArray(parsed)) parsedAttendeeIds = parsed;
        } catch(e) {}
    }

    db.prepare("INSERT INTO class_sessions (id, user_id, activityId, date, status, notes, justification, attendeeIds, duration) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(sessionId, user.id, activity.id, sessionDate, sessionStatus, notes || attendeesCount?.toString() || null, justification || null, JSON.stringify(parsedAttendeeIds), duration);

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

// Get all teachers
app.get("/api/teachers", requireAuth, (req, res) => {
  const teachers = db.prepare("SELECT id, name, avatar_url FROM users").all();
  res.json(teachers);
});

// Get all students
app.get("/api/students", requireAuth, (req, res) => {
  const user = ((req as any).session as any).user;
  const students = db.prepare("SELECT * FROM students WHERE user_id = ?").all((req as any).effectiveUserId);
  res.json(students.map((s: any) => {
    let parsed = [];
    if (s.enrolledActivityIds) {
      try { parsed = JSON.parse(s.enrolledActivityIds); } catch(e) {}
    }
    return { ...s, enrolledActivityIds: parsed };
  }));
});

// Save all students (bulk)
app.post("/api/students", requireAuth, (req, res) => {
  const user = ((req as any).session as any).user;
  const students = req.body;
  const insert = db.prepare("INSERT OR REPLACE INTO students (id, user_id, name, phone, email, notes, location, enrolledActivityIds) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  
  try {
    db.transaction(() => {
      for (const s of students) {
        insert.run(s.id, (req as any).effectiveUserId, s.name || 'Estudiante', s.phone || null, s.email || null, s.notes || null, s.location || null, JSON.stringify(s.enrolledActivityIds || []));
      }
    })();
    res.json({ success: true });
  } catch (err: any) {
    console.error("POST students bulk error:", err);
    res.status(500).json({ error: "DB Error", details: err.message });
  }
});

// Update or add single student
app.post("/api/students/:id", requireAuth, (req, res) => {
  const user = ((req as any).session as any).user;
  const s = req.body;
  try {
    db.prepare("INSERT OR REPLACE INTO students (id, user_id, name, phone, email, notes, location, enrolledActivityIds) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(s.id, (req as any).effectiveUserId, s.name || 'Estudiante', s.phone || null, s.email || null, s.notes || null, s.location || null, JSON.stringify(s.enrolledActivityIds || []));
    res.json({ success: true, student: s });
  } catch (err: any) {
    console.error("POST student error:", err);
    res.status(500).json({ error: "DB Error", details: err.message });
  }
});

app.delete("/api/students/:id", requireAuth, (req, res) => {
  const user = ((req as any).session as any).user;
  const studentId = req.params.id;
  console.log("==> DELETING STUDENT:", studentId, "USER:", (req as any).effectiveUserId);
  try {
    db.transaction(() => {
      console.log("==> Inside transaction!");
      db.prepare("DELETE FROM students WHERE id = ? AND user_id = ?").run(studentId, (req as any).effectiveUserId);
      
      const sessions = db.prepare("SELECT * FROM class_sessions WHERE user_id = ?").all((req as any).effectiveUserId);
      const updateSession = db.prepare("UPDATE class_sessions SET attendeeIds = ? WHERE id = ? AND user_id = ?");
      
      let updatedCount = 0;
      for (const s of sessions as any[]) {
        if (s.attendeeIds) {
          try {
            const parsed = JSON.parse(s.attendeeIds);
            if (Array.isArray(parsed) && parsed.includes(studentId)) {
              const nextIds = parsed.filter(id => id !== studentId);
              updateSession.run(JSON.stringify(nextIds), s.id, (req as any).effectiveUserId);
              updatedCount++;
            }
          } catch (e) {
            console.error("JSON parse error for session", s.id);
          }
        }
      }
      console.log("==> Students deleted and", updatedCount, "sessions updated");
    })();
    res.json({ success: true });
  } catch (err: any) {
    console.error("DELETE student error:", err);
    res.status(500).json({ error: "DB Error", details: err.message });
  }
});

// Fast Sync Data Route
app.get("/api/sync", requireAuth, (req, res) => {  
  try {
    const syncData = getSyncData((req as any).effectiveUserId);
    res.json(syncData);
  } catch (error) {
    res.status(500).json({ error: "Sync failed" });
  }
});

app.all("/api/*", (req, res) => {
  res.status(404).json({ error: "API route not found: " + req.path });
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

  // Periodic Google Drive Backup
  setInterval(async () => {
    console.log("Running scheduled Google Drive backups...");
    const usersWithRefresh = db.prepare("SELECT * FROM users WHERE google_refresh_token IS NOT NULL").all() as any[];
    
    for (const user of usersWithRefresh) {
      try {
        const syncData = getSyncData(user.id);
        const jsonContent = JSON.stringify(syncData, null, 2);
        
        const client = new OAuth2Client(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET
        );
        client.setCredentials({ refresh_token: user.google_refresh_token });
        
        const drive = google.drive({ version: 'v3', auth: client as any });
        
        const fileMetadata = {
          name: 'SalsaNova_Backup.json',
          mimeType: 'application/json'
        };
        const media = {
          mimeType: 'application/json',
          body: jsonContent
        };
        
        if (user.drive_file_id) {
          try {
            await drive.files.update({
              fileId: user.drive_file_id,
              media: media
            });
            console.log(`Backup updated for user ${user.email}`);
            continue;
          } catch (updateErr: any) {
            if (updateErr.status === 404 || updateErr.code === 404) {
               // File deleted or lost, recreate it below
            } else {
               throw updateErr;
            }
          }
        }
        
        const response = await drive.files.create({
          requestBody: fileMetadata,
          media: media,
          fields: 'id'
        });
        
        if (response.data.id) {
          db.prepare("UPDATE users SET drive_file_id = ? WHERE id = ?").run(response.data.id, user.id);
          console.log(`Backup created for user ${user.email} with File ID ${response.data.id}`);
        }
      } catch (e: any) {
        console.error(`Failed to backup for user ${user.email}:`, e.message);
      }
    }
  }, 2 * 60 * 60 * 1000);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
