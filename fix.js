import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  `function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = ((req as any).session as any).user;
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  db.prepare("UPDATE users SET last_active = ? WHERE id = ?").run(new Date().toISOString(), user.id);
  next();
}`,
  `function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
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
}`
);

const endpointsRegex = /\/api\/(activities|sessions|students)["'], requireAuth, \(req, res\) => {[\s\S]*?(?=\n\/\/|\napp\.)/g;
code = code.replace(endpointsRegex, (match) => {
  return match.replace(/user\.id/g, '(req as any).effectiveUserId');
});

code = code.replace(
  `app.get("/api/sync", requireAuth, (req, res) => {
  const user = ((req as any).session as any).user;
  
  try {
    const syncData = getSyncData(user.id);`,
  `app.get("/api/sync", requireAuth, (req, res) => {  
  try {
    const syncData = getSyncData((req as any).effectiveUserId);`
);

fs.writeFileSync('server.ts', code);
console.log('Done');
