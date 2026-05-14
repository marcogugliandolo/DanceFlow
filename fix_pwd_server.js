import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  `app.post("/api/profile/password", (req, res) => {
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

    db.prepare("UPDATE users SET password = ? WHERE id = ?").run(newPassword, user.id);`,
  `app.post("/api/profile/password", requireAuth, (req, res) => {
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

    db.prepare("UPDATE users SET password = ? WHERE id = ?").run(newPassword, effectiveUserId);`
);

fs.writeFileSync('server.ts', code);
console.log('Fixed auth/password in server.ts');
