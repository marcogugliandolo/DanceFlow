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
