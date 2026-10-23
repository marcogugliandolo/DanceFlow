// Datos de ejemplo (inventados) para las propuestas de diseño: octubre de 2026
export const month = "Octubre 2026";
export const teacher = "Ana";
export const kpis = { income: 405, held: 15, cancelled: 1, students: 11, attendance: 71, avg: 36.8 };
export const incomeTrend = [
  { m: "Jul", v: 80 }, { m: "Ago", v: 175 }, { m: "Sep", v: 330 }, { m: "Oct", v: 405 },
];
export type ClassCard = {
  id: string; name: string; place: string; price: string; total: number; sessions: number; cancelled: number;
  students: number; attendance: number; hue: "rose" | "violet" | "amber" | "teal"; last: boolean[];
};
export const classes: ClassCard[] = [
  { id: "sal", name: "Salón O Burgo G1", place: "Centro Cívico O Burgo", price: "25 € / sesión", total: 150, sessions: 6, cancelled: 1, students: 5, attendance: 81, hue: "rose", last: [true, true, false, true, true, true] },
  { id: "bac", name: "Bachata Betanzos", place: "Escuela SalsaNova", price: "120 € / mes", total: 120, sessions: 3, cancelled: 0, students: 3, attendance: 67, hue: "violet", last: [true, false, true] },
  { id: "dan", name: "Danzas pola Igualdade", place: "Présaras", price: "25 € / sesión", total: 75, sessions: 3, cancelled: 0, students: 3, attendance: 56, hue: "amber", last: [true, false, true] },
  { id: "pil", name: "Pilates Abegondo GM2", place: "Pavillón de Abegondo", price: "20 € / sesión", total: 60, sessions: 3, cancelled: 0, students: 4, attendance: 72, hue: "teal", last: [true, true, true] },
];
export const pending = [
  { id: "p1", cls: "Salón O Burgo G1", day: "jue 22" },
  { id: "p2", cls: "Bachata Betanzos", day: "mié 21" },
  { id: "p3", cls: "Salón O Burgo G1", day: "mar 20" },
];

// ---------- Datos para el resto de secciones (inventados) ----------
export type Hue = "rose" | "violet" | "amber" | "teal";
export const classHue: Record<string, Hue> = { sal: "rose", bac: "violet", dan: "amber", pil: "teal" };
export const className: Record<string, string> = { sal: "Salón O Burgo G1", bac: "Bachata Betanzos", dan: "Danzas pola Igualdade", pil: "Pilates Abegondo GM2" };
export const classPlace: Record<string, string> = { sal: "Centro Cívico O Burgo", bac: "Escuela SalsaNova", dan: "Présaras", pil: "Pavillón de Abegondo" };

export const students = [
  { id: "s2", name: "Ana Pérez", phone: "600 000 002", classes: ["sal", "bac"], pct: 83 },
  { id: "s10", name: "Brais Otero", phone: "600 000 010", classes: ["dan", "bac"], pct: 41 },
  { id: "s1", name: "Conce Isla", phone: "600 000 001", classes: ["pil"], pct: 96 },
  { id: "s3", name: "Luis Gómez", phone: "600 000 003", classes: ["sal", "bac"], pct: 71 },
  { id: "s7", name: "María del Carmen Fernández", phone: "600 000 007", classes: ["sal"], pct: 77 },
  { id: "s4", name: "Marta Rey", phone: "600 000 004", classes: ["pil", "sal"], pct: 58 },
  { id: "s11", name: "Noa Castro", phone: "600 000 011", classes: ["dan"], pct: 62 },
  { id: "s6", name: "Pilar Souto", phone: "600 000 006", classes: ["pil"], pct: 88 },
  { id: "s9", name: "Rosa Barreiro", phone: "600 000 009", classes: ["pil"], pct: 40 },
  { id: "s8", name: "Uxía Lema", phone: "600 000 008", classes: ["dan"], pct: 52 },
  { id: "s5", name: "Xoán Vidal", phone: "600 000 005", classes: ["sal"], pct: 90 },
];

export type HistStatus = "held" | "billed" | "unbilled";
export const history: { id: string; day: string; wd: string; cls: string; status: HistStatus; people: number; amount: string; note?: string }[] = [
  { id: "h1", day: "22", wd: "jue", cls: "sal", status: "held", people: 4, amount: "25 €" },
  { id: "h2", day: "21", wd: "mié", cls: "bac", status: "held", people: 2, amount: "Mensual" },
  { id: "h3", day: "20", wd: "mar", cls: "sal", status: "held", people: 3, amount: "25 €" },
  { id: "h4", day: "19", wd: "lun", cls: "pil", status: "held", people: 3, amount: "20 €" },
  { id: "h5", day: "16", wd: "vie", cls: "dan", status: "held", people: 3, amount: "25 €" },
  { id: "h6", day: "15", wd: "jue", cls: "sal", status: "held", people: 4, amount: "25 €" },
  { id: "h7", day: "14", wd: "mié", cls: "bac", status: "billed", people: 0, amount: "Mensual", note: "Cancelada por la escuela, se cobra" },
  { id: "h8", day: "13", wd: "mar", cls: "sal", status: "unbilled", people: 0, amount: "—", note: "Festivo local" },
  { id: "h9", day: "12", wd: "lun", cls: "pil", status: "held", people: 4, amount: "20 €" },
  { id: "h10", day: "9", wd: "vie", cls: "dan", status: "held", people: 2, amount: "25 €" },
];

// Hoja de octubre de Salón O Burgo G1
export const sheet = {
  cls: "sal",
  days: [{ w: "jue", d: "01" }, { w: "mar", d: "06" }, { w: "jue", d: "08" }, { w: "mar", d: "13" }, { w: "jue", d: "15" }, { w: "mar", d: "20" }, { w: "jue", d: "22" }],
  rows: [
    { name: "Ana Pérez", marks: [1, 1, 0, 0, 1, 1, 1] },
    { name: "Luis Gómez", marks: [1, 0, 1, 0, 1, 0, 1] },
    { name: "María del Carmen Fernández", marks: [1, 1, 0, 0, 1, 1, 1] },
    { name: "Marta Rey", marks: [0, 1, 1, 0, 0, 1, 0] },
    { name: "Xoán Vidal", marks: [1, 1, 1, 0, 1, 1, 1] },
  ],
  cancelledIdx: 3,
};

// Relación de clases: % de asistencia por mes
export const relation = [
  { cls: "sal", months: [{ m: "Sep", v: 74 }, { m: "Oct", v: 81 }] },
  { cls: "bac", months: [{ m: "Sep", v: 70 }, { m: "Oct", v: 67 }] },
  { cls: "dan", months: [{ m: "Ago", v: 48 }, { m: "Sep", v: 61 }, { m: "Oct", v: 56 }] },
  { cls: "pil", months: [{ m: "Jul", v: 79 }, { m: "Ago", v: 70 }, { m: "Sep", v: 66 }, { m: "Oct", v: 72 }] },
];
