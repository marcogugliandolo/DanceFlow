import Database from 'better-sqlite3';
const database = new Database('./data/salsanova.db');
const a = {
  id: "act1",
  user_id: "test-user",
  name: "Bachata",
  location: "Room 1",
  pricePerClass: 10,
  paymentType: "per_class",
  isRecurring: true,
  defaultDuration: 1
};
try {
  database.prepare("INSERT OR REPLACE INTO activities (id, user_id, name, location, pricePerClass, paymentType, isRecurring, defaultDuration) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run(a.id, a.user_id, a.name, a.location, a.pricePerClass, a.paymentType || null, a.isRecurring ? 1 : 0, a.defaultDuration ?? 1);
  console.log("Success Act1");
} catch (e) {
  console.error("Error Act1:", e);
}
