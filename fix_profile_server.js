import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  `app.post("/api/profile", (req, res) => {
  const user = ((req as any).session as any).user;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { name, email, avatarUrl, theme } = req.body;
  try {
    db.prepare("UPDATE users SET name = ?, email = ?, avatar_url = ?, theme = ? WHERE id = ?").run(name, email, avatarUrl, theme, user.id);
    const updated = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id);`,
  `app.post("/api/profile", requireAuth, (req, res) => {
  const effectiveUserId = (req as any).effectiveUserId;
  const { name, email, avatarUrl, theme } = req.body;
  try {
    db.prepare("UPDATE users SET name = ?, email = ?, avatar_url = ?, theme = ? WHERE id = ?").run(name, email, avatarUrl, theme, effectiveUserId);
    const updated = db.prepare("SELECT * FROM users WHERE id = ?").get(effectiveUserId);`
);

code = code.replace(
  `app.post("/api/change-password", (req, res) => {
  const user = ((req as any).session as any).user;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { currentPassword, newPassword } = req.body;
  try {
    const dbUser = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id) as any;`,
  `app.post("/api/change-password", requireAuth, (req, res) => {
  const effectiveUserId = (req as any).effectiveUserId;
  const { currentPassword, newPassword } = req.body;
  
  // If proxying as admin, allow bypass of current password check.
  const bypassCurrent = !!req.query.admin_user_id;

  try {
    const dbUser = db.prepare("SELECT * FROM users WHERE id = ?").get(effectiveUserId) as any;`
);

code = code.replace(
  `    if (dbUser.password !== currentPassword) {
      return res.status(401).json({ error: "Contraseña actual incorrecta" });
    }

    db.prepare("UPDATE users SET password = ? WHERE id = ?").run(newPassword, user.id);`,
  `    if (!bypassCurrent && dbUser.password !== currentPassword) {
      return res.status(401).json({ error: "Contraseña actual incorrecta" });
    }

    db.prepare("UPDATE users SET password = ? WHERE id = ?").run(newPassword, effectiveUserId);`
);

fs.writeFileSync('server.ts', code);
console.log('Fixed auth profile endpoints');
