import React, { useState } from "react";
import { motion, LayoutGroup, AnimatePresence } from "motion/react";
import {
  ChevronDown, ChevronLeft, Share2, Check, Search, FileDown, Users, Plus, History, Pencil, Trash2,
  Moon, KeyRound, Download, Upload, LogOut, ChevronRight,
} from "lucide-react";
import {
  classes, classHue, className, classPlace, students, history, sheet, relation, month, type Hue, type HistStatus,
} from "./data";
import { CountUp, DancersMark, EASE } from "./shared";
import { HUE, pop } from "./themeB";

// Secciones del estilo B ("Ritmo"): Asistencia, Historial, Alumnos y Perfil.
// Mismo lenguaje que el inicio: fondo lila muy claro, tarjetas blancas grandes,
// un color propio por clase y movimiento con un punto de rebote.

const INK = "#17131f";
const MUTED = "text-[#6b6478]";
const CARD = "rounded-[28px] bg-white border border-[#ebe8f2]";
const SOLID_HEX: Record<Hue, string> = { rose: "#f43f5e", violet: "#8b5cf6", amber: "#f59e0b", teal: "#14b8a6" };

// ---------- Piezas comunes ----------
const PageTitle: React.FC<{ title: string; sub?: string; right?: React.ReactNode; mobile?: boolean }> = ({ title, sub, right, mobile }) => (
  <div className={`flex ${mobile ? "flex-col gap-4" : "items-end justify-between gap-6"}`}>
    <motion.div {...pop(0)}>
      <h1 className={`font-bricolage font-bold tracking-[-0.035em] leading-[0.95] ${mobile ? "text-[40px]" : "text-[56px]"}`}>{title}</h1>
      {sub && <p className={`mt-3 ${MUTED} ${mobile ? "text-base" : "text-lg"}`}>{sub}</p>}
    </motion.div>
    {right && <motion.div {...pop(1)} className={`flex flex-wrap items-center gap-2 ${mobile ? "" : "justify-end"}`}>{right}</motion.div>}
  </div>
);

const Segmented: React.FC<{ id: string; options: { id: string; label: string }[]; value: string; onChange: (v: string) => void; full?: boolean }> = ({ id, options, value, onChange, full }) => (
  <LayoutGroup id={id}>
    <div className={`${full ? "flex w-full" : "inline-flex"} p-1.5 rounded-full bg-white border border-[#ebe8f2]`}>
      {options.map(o => {
        const on = value === o.id;
        return (
          <button key={o.id} onClick={() => onChange(o.id)}
            className={`relative ${full ? "flex-1" : ""} h-10 px-5 rounded-full text-sm font-semibold transition-colors ${on ? "text-white" : "text-[#6b6478] hover:text-[#17131f]"}`}>
            {on && <motion.span layoutId={`${id}-bubble`} className="absolute inset-0 rounded-full bg-[#17131f]" transition={{ type: "spring", stiffness: 380, damping: 28 }} />}
            <span className="relative whitespace-nowrap">{o.label}</span>
          </button>
        );
      })}
    </div>
  </LayoutGroup>
);

const MonthChip: React.FC = () => (
  <button className="h-12 px-5 rounded-full bg-white border border-[#ebe8f2] text-sm font-semibold flex items-center gap-1.5 hover:border-[#d9d4e6] transition-colors">
    {month} <ChevronDown className="w-4 h-4 text-[#6b6478]" />
  </button>
);

const ClassTile: React.FC<{ hue: Hue; size?: "sm" | "md" }> = ({ hue, size = "md" }) => (
  <span className={`inline-flex shrink-0 items-center justify-center ${HUE[hue].solid} ${size === "sm" ? "w-9 h-9 rounded-xl" : "w-11 h-11 rounded-2xl"}`}>
    <DancersMark className={`${size === "sm" ? "w-6" : "w-7"} h-auto text-white`} />
  </span>
);

const MiniRing: React.FC<{ pct: number; hue: Hue; size?: number; delay?: number }> = ({ pct, hue, size = 64, delay = 0.4 }) => {
  const sw = 8, r = (size - sw) / 2, c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={sw} stroke="#efedf5" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={sw} strokeLinecap="round" stroke={SOLID_HEX[hue]}
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct / 100) }}
          transition={{ delay, duration: 1.1, ease: EASE }} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-bricolage text-[15px] font-bold">{pct}%</span>
    </div>
  );
};

const GradientButton: React.FC<{ children: React.ReactNode; onClick?: () => void }> = ({ children, onClick }) => (
  <motion.button onClick={onClick} whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}
    className="h-12 px-6 rounded-full bg-gradient-to-r from-rose-500 to-violet-500 text-white font-semibold flex items-center gap-2 shadow-[0_12px_30px_-12px_rgba(244,63,94,0.8)]">
    {children}
  </motion.button>
);

// ================= ASISTENCIA =================
const PENDING: Record<string, string[]> = { sal: ["jue 22", "mar 20"], bac: ["mié 21"], dan: [], pil: [] };
const SESSIONS_OCT: Record<string, number> = { sal: 7, bac: 3, dan: 3, pil: 3 };

export const AsistenciaB: React.FC<{ mobile?: boolean; initialSub?: string }> = ({ mobile, initialSub }) => {
  const [sub, setSub] = useState(initialSub === "relacion" ? "relacion" : initialSub === "hoja" ? "hoja" : "lista");
  const tab = sub === "relacion" ? "relacion" : "lista";

  return (
    <>
      <PageTitle mobile={mobile} title="Asistencia" sub="Pasa lista y mira cómo va cada clase."
        right={<>
          <Segmented id="asis" value={tab} onChange={setSub} full={mobile}
            options={[{ id: "lista", label: "Pasar lista" }, { id: "relacion", label: "Relación de clases" }]} />
        </>} />

      <AnimatePresence mode="wait">
        <motion.div key={sub} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: EASE }} className="mt-8">
          {sub === "lista" && <PassListCards mobile={mobile} onOpen={() => setSub("hoja")} />}
          {sub === "hoja" && <MonthSheet mobile={mobile} onBack={() => setSub("lista")} />}
          {sub === "relacion" && <RelationCards mobile={mobile} />}
        </motion.div>
      </AnimatePresence>
    </>
  );
};

const PassListCards: React.FC<{ mobile?: boolean; onOpen: () => void }> = ({ mobile, onOpen }) => (
  <div className={`grid gap-4 ${mobile ? "grid-cols-1" : "grid-cols-2"}`}>
    {classes.map((c, i) => {
      const hue = c.hue as Hue, h = HUE[hue], pend = PENDING[c.id];
      return (
        <motion.div key={c.id} {...pop(i, 0.15)} whileHover={{ y: -4 }} onClick={onOpen}
          className={`${CARD} p-6 cursor-pointer relative overflow-hidden`}>
          <div className={`absolute -right-10 -top-10 w-36 h-36 rounded-full ${h.bg}`} aria-hidden />
          <div className="relative flex items-start gap-4">
            <ClassTile hue={hue} />
            <div className="flex-1 min-w-0">
              <p className="font-bricolage text-xl font-bold tracking-[-0.02em] leading-tight">{c.name}</p>
              <p className={`text-sm ${MUTED} mt-0.5`}>{c.place}</p>
            </div>
            <MiniRing pct={c.attendance} hue={hue} delay={0.35 + i * 0.07} />
          </div>
          <div className="relative mt-5 flex items-center gap-2 text-sm font-semibold">
            <span className="px-3 py-1.5 rounded-full bg-[#f4f3f8]">{SESSIONS_OCT[c.id]} clases</span>
            <span className="px-3 py-1.5 rounded-full bg-[#f4f3f8]">{c.students} alumnos</span>
          </div>
          <div className="relative mt-5 pt-4 border-t border-[#f0eef5] flex flex-wrap items-center gap-2">
            {pend.length ? (
              <>
                <span className={`text-sm font-semibold ${h.ink} mr-1`}>Por pasar lista</span>
                {pend.map(d => (
                  <motion.span key={d} whileHover={{ y: -2 }} className={`h-9 px-3.5 rounded-full ${h.solid} text-white text-sm font-semibold flex items-center capitalize`}>{d}</motion.span>
                ))}
              </>
            ) : (
              <span className={`text-sm font-semibold ${MUTED} flex items-center gap-1.5`}><Check className="w-4 h-4 text-emerald-500" /> Lista al día</span>
            )}
            <span className="ml-auto text-sm font-semibold flex items-center gap-1">Hoja del mes <ChevronRight className="w-4 h-4" /></span>
          </div>
        </motion.div>
      );
    })}
  </div>
);

const MonthSheet: React.FC<{ mobile?: boolean; onBack: () => void }> = ({ mobile, onBack }) => {
  const hue = classHue[sheet.cls], h = HUE[hue];
  const [rows, setRows] = useState(sheet.rows.map(r => r.marks.slice()));
  const held = sheet.days.length - 1;
  const toggle = (ri: number, di: number) => setRows(rs => rs.map((r, i) => i !== ri ? r : r.map((m, j) => j === di ? (m ? 0 : 1) : m)));
  const totalPresent = rows.reduce((a, r) => a + r.reduce((s, m, j) => s + (j === sheet.cancelledIdx ? 0 : m), 0), 0);
  const pct = Math.round((totalPresent / (rows.length * held)) * 100);
  const cell = mobile ? "w-7 h-7 rounded-lg" : "w-9 h-9 rounded-xl";

  return (
    <>
      <motion.button {...pop(0)} onClick={onBack} className={`mb-4 text-sm font-semibold ${MUTED} hover:text-[#17131f] flex items-center gap-1`}>
        <ChevronLeft className="w-4 h-4" /> Todas las clases
      </motion.button>
      <motion.div {...pop(1, 0.05)} className={`${CARD} overflow-hidden`}>
        <div className={`${h.bg} ${mobile ? "p-5" : "p-7"} flex ${mobile ? "flex-col gap-4" : "items-center justify-between gap-6"}`}>
          <div className="flex items-center gap-4">
            <ClassTile hue={hue} />
            <div>
              <p className={`text-sm font-semibold ${h.ink}`}>Asistencia de octubre</p>
              <p className={`font-bricolage font-bold tracking-[-0.03em] leading-tight ${mobile ? "text-2xl" : "text-[34px]"}`}>{className[sheet.cls]}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="h-10 px-4 rounded-full bg-white text-sm font-semibold flex items-center">{held} clases</span>
            <span className="h-10 px-4 rounded-full bg-white text-sm font-semibold flex items-center">{rows.length} alumnos</span>
            <span className={`h-10 px-4 rounded-full bg-white text-sm font-bold ${h.ink} flex items-center`}>{pct}%</span>
            <GradientButton><Share2 className="w-4 h-4" /> Compartir</GradientButton>
          </div>
        </div>

        <div className={`${mobile ? "p-4" : "p-7"} overflow-x-auto`}>
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr>
                <th className={`text-left text-xs font-semibold ${MUTED} pb-3 pr-3 ${mobile ? "hidden" : ""}`}>Alumno</th>
                {sheet.days.map((d, j) => (
                  <th key={d.d} className="pb-3 px-0.5">
                    <div className="flex flex-col items-center leading-none">
                      <span className={`text-[10px] font-semibold ${MUTED} capitalize`}>{d.w}</span>
                      <span className={`font-bricolage font-bold mt-1 ${mobile ? "text-sm" : "text-lg"} ${j === sheet.cancelledIdx ? "text-[#c4bfd0] line-through" : ""}`}>{d.d}</span>
                    </div>
                  </th>
                ))}
                <th className={`text-right text-xs font-semibold ${MUTED} pb-3 pl-3`}>Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => {
                const count = r.reduce((s, m, j) => s + (j === sheet.cancelledIdx ? 0 : m), 0);
                return (
                  <React.Fragment key={sheet.rows[ri].name}>
                    {mobile && <tr><td colSpan={sheet.days.length + 1} className="pt-3 pb-1 text-[13px] font-semibold">{sheet.rows[ri].name}</td></tr>}
                    <tr>
                      {!mobile && <td className="py-1.5 pr-3 text-[15px] font-semibold whitespace-nowrap">{sheet.rows[ri].name}</td>}
                      {r.map((m, j) => (
                        <td key={j} className="py-1 px-0.5 text-center">
                          {j === sheet.cancelledIdx ? (
                            <span className={`${cell} mx-auto block bg-[repeating-linear-gradient(135deg,#efedf5_0_4px,#f8f7fb_4px_8px)]`} title="Festivo" />
                          ) : (
                            <button onClick={() => toggle(ri, j)} aria-label={`${sheet.rows[ri].name}, día ${sheet.days[j].d}`}
                              className={`${cell} mx-auto relative block bg-[#f4f3f8] hover:bg-[#ebe8f2] transition-colors`}>
                              <AnimatePresence>
                                {m === 1 && (
                                  <motion.span initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.3, opacity: 0 }}
                                    transition={{ delay: 0.3 + j * 0.06 + ri * 0.02, type: "spring", stiffness: 520, damping: 22 }}
                                    className={`absolute inset-0 ${mobile ? "rounded-lg" : "rounded-xl"} ${h.solid} flex items-center justify-center`}>
                                    <Check className={`${mobile ? "w-3.5 h-3.5" : "w-4 h-4"} text-white`} strokeWidth={3.5} />
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </button>
                          )}
                        </td>
                      ))}
                      <td className="py-1 pl-3 text-right">
                        <span className={`font-bricolage font-bold ${mobile ? "text-sm" : "text-lg"}`}>{count}</span><span className={`text-sm ${MUTED}`}>/{held}</span>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          <p className={`mt-5 text-xs ${MUTED}`}>Toca una casilla para cambiarla. El 13 fue festivo y no cuenta.</p>
        </div>
      </motion.div>
    </>
  );
};

const RelationCards: React.FC<{ mobile?: boolean }> = ({ mobile }) => (
  <div className={`grid gap-4 ${mobile ? "grid-cols-1" : "grid-cols-2"}`}>
    {relation.map((r, i) => {
      const hue = classHue[r.cls], h = HUE[hue];
      const cur = r.months[r.months.length - 1];
      return (
        <motion.div key={r.cls} {...pop(i, 0.15)} whileHover={{ y: -4 }} className={`${CARD} p-6 cursor-pointer`}>
          <div className="flex items-center gap-4">
            <MiniRing pct={cur.v} hue={hue} size={72} delay={0.35 + i * 0.07} />
            <div className="flex-1 min-w-0">
              <p className="font-bricolage text-xl font-bold tracking-[-0.02em] leading-tight">{className[r.cls]}</p>
              <p className={`text-sm ${MUTED} mt-0.5`}>{classPlace[r.cls]}</p>
            </div>
          </div>
          <div className="mt-5 flex items-end gap-3 h-28">
            {r.months.map((m, k) => {
              const last = k === r.months.length - 1;
              return (
                <div key={m.m} className="flex-1 max-w-[72px] flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className={`text-xs font-bold ${last ? h.ink : MUTED}`}>{m.v}%</span>
                  <motion.div className={`w-full rounded-2xl ${last ? h.solid : "bg-[#efedf5]"}`}
                    initial={{ height: 0 }} animate={{ height: `${m.v}%` }}
                    transition={{ delay: 0.45 + i * 0.07 + k * 0.06, type: "spring", stiffness: 140, damping: 17 }} />
                  <span className={`text-xs font-semibold ${last ? "text-[#17131f]" : MUTED}`}>{m.m}</span>
                </div>
              );
            })}
            <div className="flex-1" />
            <span className="self-end text-sm font-semibold flex items-center gap-1">Ver alumnos <ChevronRight className="w-4 h-4" /></span>
          </div>
        </motion.div>
      );
    })}
  </div>
);

// ================= HISTORIAL =================
const STATUS: Record<HistStatus, { label: string; cls: string }> = {
  held: { label: "Realizada", cls: "bg-emerald-50 text-emerald-700" },
  billed: { label: "Cancelada · se cobra", cls: "bg-amber-50 text-amber-700" },
  unbilled: { label: "Cancelada · no se cobra", cls: "bg-rose-50 text-rose-600" },
};

export const HistorialB: React.FC<{ mobile?: boolean }> = ({ mobile }) => {
  const [filter, setFilter] = useState("todas");
  const items = history.filter(x => filter === "todas" ? true : filter === "realizadas" ? x.status === "held" : x.status !== "held");
  return (
    <>
      <PageTitle mobile={mobile} title="Historial" sub="Todas tus clases, una a una."
        right={<motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }} className="h-12 px-5 rounded-full bg-white border border-[#ebe8f2] font-semibold flex items-center gap-2"><FileDown className="w-4 h-4" /> Exportar PDF</motion.button>} />

      <motion.div {...pop(2, 0.05)} className={`mt-8 ${CARD} p-3 flex ${mobile ? "flex-col" : "items-center"} gap-3`}>
        <label className="flex-1 h-12 rounded-full bg-[#f4f3f8] flex items-center gap-2 px-4">
          <Search className="w-4 h-4 shrink-0 text-[#6b6478]" />
          <input placeholder="Buscar por clase o nota" className="bg-transparent outline-none flex-1 text-[15px] placeholder:text-[#a49fb1]" />
        </label>
        <Segmented id="hist" value={filter} onChange={setFilter} full={mobile}
          options={[{ id: "todas", label: "Todas" }, { id: "realizadas", label: "Realizadas" }, { id: "canceladas", label: "Canceladas" }]} />
      </motion.div>

      <motion.div {...pop(3, 0.1)} className="mt-8 flex items-end justify-between">
        <h2 className="font-bricolage text-[28px] font-bold tracking-[-0.03em]">Octubre</h2>
        <span className={`text-sm ${MUTED}`}>{items.length} clases</span>
      </motion.div>

      <LayoutGroup id="hist-list">
        <div className="mt-4 flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {items.map((x, i) => {
              const hue = classHue[x.cls], h = HUE[hue], st = STATUS[x.status];
              return (
                <motion.div key={x.id} layout
                  initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                  transition={{ delay: 0.15 + i * 0.04, type: "spring", stiffness: 300, damping: 26 }}
                  whileHover={{ x: 4 }}
                  className={`${CARD} rounded-[24px] p-3 pr-5 flex items-center gap-4 cursor-pointer`}>
                  <div className={`w-16 h-16 rounded-[20px] ${h.bg} flex flex-col items-center justify-center shrink-0`}>
                    <span className="font-bricolage text-2xl font-bold leading-none">{x.day}</span>
                    <span className={`text-[11px] font-semibold ${h.ink} capitalize mt-0.5`}>{x.wd}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${h.solid} shrink-0`} />
                      <p className="font-semibold text-[15px] truncate">{className[x.cls]}</p>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                      <span className={`px-2.5 py-1 rounded-full font-semibold ${st.cls}`}>{st.label}</span>
                      {x.status === "held" && <span className={`${MUTED} flex items-center gap-1`}><Users className="w-3.5 h-3.5" />{x.people}</span>}
                      {x.note && !mobile && <span className={MUTED}>{x.note}</span>}
                    </div>
                  </div>
                  <span className={`font-bricolage font-bold ${mobile ? "text-lg" : "text-xl"} ${x.amount === "—" ? "text-[#c4bfd0]" : ""}`}>{x.amount}</span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </LayoutGroup>
    </>
  );
};

// ================= ALUMNOS =================
const initials = (n: string) => n.split(" ").filter(w => /^[A-ZÁÉÍÓÚÑ]/.test(w)).slice(0, 2).map(w => w[0]).join("");

export const AlumnosB: React.FC<{ mobile?: boolean }> = ({ mobile }) => {
  const [cls, setCls] = useState<string>("todas");
  const list = students.filter(s => cls === "todas" || s.classes.includes(cls));
  return (
    <>
      <PageTitle mobile={mobile} title="Alumnos" sub={`${students.length} alumnos en ${classes.length} clases.`}
        right={<>
          {!mobile && (
            <label className="h-12 w-64 rounded-full bg-white border border-[#ebe8f2] flex items-center gap-2 px-4">
              <Search className="w-4 h-4 shrink-0 text-[#6b6478]" />
              <input placeholder="Buscar alumno" className="bg-transparent outline-none flex-1 text-[15px] placeholder:text-[#a49fb1]" />
            </label>
          )}
          <GradientButton><Plus className="w-5 h-5" /> Nuevo alumno</GradientButton>
        </>} />

      {/* Filtro por clase con su color */}
      <motion.div {...pop(2, 0.05)} className={`mt-8 flex gap-2 ${mobile ? "overflow-x-auto -mx-4 px-4 pb-1" : "flex-wrap"}`}>
        {[{ id: "todas", label: "Todas" }, ...classes.map(c => ({ id: c.id, label: c.name }))].map(o => {
          const on = cls === o.id;
          const hue = o.id !== "todas" ? classHue[o.id] : null;
          return (
            <motion.button key={o.id} whileTap={{ scale: 0.95 }} onClick={() => setCls(o.id)}
              className={`h-10 px-4 rounded-full text-sm font-semibold whitespace-nowrap flex items-center gap-2 border transition-colors ${on ? (hue ? `${HUE[hue].solid} text-white border-transparent` : "bg-[#17131f] text-white border-transparent") : "bg-white border-[#ebe8f2] hover:border-[#d9d4e6]"}`}>
              {hue && !on && <span className={`w-2.5 h-2.5 rounded-full ${HUE[hue].solid}`} />}
              {o.label}
            </motion.button>
          );
        })}
      </motion.div>

      <LayoutGroup id="alumnos">
        <motion.div layout className={`mt-6 grid gap-4 ${mobile ? "grid-cols-1" : "grid-cols-3"}`}>
          <AnimatePresence initial={false}>
            {list.map((s, i) => {
              const hue = classHue[s.classes[0]];
              return (
                <motion.div key={s.id} layout
                  initial={{ opacity: 0, scale: 0.94, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                  transition={{ delay: 0.12 + i * 0.035, type: "spring", stiffness: 300, damping: 24 }}
                  whileHover={{ y: -4 }}
                  className={`group ${CARD} p-5 relative`}>
                  {/* Acciones que aparecen al pasar el ratón */}
                  <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200">
                    {[History, Pencil, Trash2].map((Icon, k) => (
                      <button key={k} className={`w-8 h-8 rounded-full flex items-center justify-center ${k === 2 ? "hover:bg-rose-50 text-rose-500" : "hover:bg-[#f4f3f8] text-[#6b6478]"}`} aria-label={["Historial", "Editar", "Borrar"][k]}><Icon className="w-4 h-4" /></button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`w-12 h-12 rounded-full ${HUE[hue].solid} text-white font-bold flex items-center justify-center shrink-0`}>{initials(s.name)}</span>
                    <div className="min-w-0">
                      <p className="font-bricolage text-lg font-bold tracking-[-0.02em] leading-tight truncate">{s.name}</p>
                      <p className={`text-sm ${MUTED}`}>{s.phone}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {s.classes.map(c => <span key={c} className={`px-2.5 py-1 rounded-full text-xs font-semibold ${HUE[classHue[c]].bg} ${HUE[classHue[c]].ink}`}>{className[c]}</span>)}
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs font-semibold"><span className={MUTED}>Asistencia</span><span>{s.pct}%</span></div>
                    <div className="mt-1.5 h-2 rounded-full bg-[#f4f3f8] overflow-hidden">
                      <motion.div className={`h-full rounded-full ${s.pct >= 75 ? "bg-emerald-400" : s.pct >= 50 ? "bg-amber-400" : "bg-rose-400"}`}
                        initial={{ width: 0 }} animate={{ width: `${s.pct}%` }} transition={{ delay: 0.4 + i * 0.035, duration: 0.8, ease: EASE }} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </LayoutGroup>
    </>
  );
};

// ================= PERFIL =================
const Toggle: React.FC<{ on: boolean; onChange: () => void }> = ({ on, onChange }) => (
  <button onClick={onChange} aria-pressed={on}
    className={`w-14 h-8 rounded-full p-1 flex transition-colors ${on ? "bg-[#17131f] justify-end" : "bg-[#e6e3ee] justify-start"}`}>
    <motion.span layout transition={{ type: "spring", stiffness: 600, damping: 32 }} className="w-6 h-6 rounded-full bg-white shadow" />
  </button>
);

export const PerfilB: React.FC<{ mobile?: boolean }> = ({ mobile }) => {
  const [dark, setDark] = useState(false);
  const rows = [
    { icon: Moon, title: "Modo oscuro", desc: "Cambia entre tema claro y oscuro", action: <Toggle on={dark} onChange={() => setDark(d => !d)} /> },
    { icon: KeyRound, title: "Contraseña", desc: "Cambia la contraseña para entrar", action: "Cambiar" },
    { icon: Download, title: "Exportar datos", desc: "Descarga una copia con toda tu información", action: "Exportar" },
    { icon: Upload, title: "Importar datos", desc: "Recupera tus datos desde una copia", action: "Importar" },
  ];
  return (
    <>
      <motion.div {...pop(0)} className={`${CARD} relative overflow-hidden ${mobile ? "p-6" : "p-8"}`}>
        <div className="absolute -right-16 -top-20 w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.18),transparent_65%)]" aria-hidden />
        <div className={`relative flex ${mobile ? "flex-col items-start gap-5" : "items-center gap-7"}`}>
          <motion.span initial={{ scale: 0.6, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 14 }}
            className={`${mobile ? "w-20 h-20 text-3xl" : "w-28 h-28 text-5xl"} rounded-full bg-gradient-to-br from-rose-400 to-violet-500 text-white font-bricolage font-bold flex items-center justify-center shrink-0`}>A</motion.span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className={`font-bricolage font-bold tracking-[-0.035em] leading-none ${mobile ? "text-[34px]" : "text-[48px]"}`}>Ana Salsanova</h1>
              <span className="px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-bold">Profesora</span>
            </div>
            <p className={`mt-2 ${MUTED}`}>ana@salsanova.com</p>
          </div>
          <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }} className="h-12 px-6 rounded-full bg-[#17131f] text-white font-semibold">Editar perfil</motion.button>
        </div>
      </motion.div>

      <div className={`mt-4 grid gap-4 ${mobile ? "grid-cols-2" : "grid-cols-3"}`}>
        {[
          { label: "Clases este mes", value: 15 },
          { label: "Alumnos", value: 11 },
          { label: "Clases que das", value: 4, dots: true },
        ].map((s, i) => (
          <motion.div key={s.label} {...pop(i, 0.15)} className={`${CARD} p-6 ${mobile && i === 2 ? "col-span-2" : ""}`}>
            <p className={`text-sm font-semibold ${MUTED}`}>{s.label}</p>
            <div className="flex items-end justify-between">
              <p className="font-bricolage text-[52px] font-bold tracking-[-0.04em] leading-none mt-2"><CountUp value={s.value} delay={0.2 + i * 0.05} /></p>
              {s.dots && <div className="flex gap-1.5 mb-2">{(["rose", "violet", "amber", "teal"] as Hue[]).map(hh => <span key={hh} className={`w-4 h-4 rounded-full ${HUE[hh].solid}`} />)}</div>}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div {...pop(3, 0.2)} className={`mt-4 ${CARD} p-2`}>
        {rows.map((r, i) => (
          <div key={r.title} className={`flex items-center gap-4 px-4 py-4 rounded-[22px] hover:bg-[#f8f7fb] transition-colors ${i ? "border-t border-[#f0eef5]" : ""}`}>
            <span className="w-11 h-11 rounded-2xl bg-[#f4f3f8] flex items-center justify-center shrink-0"><r.icon className="w-5 h-5" /></span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{r.title}</p>
              <p className={`text-sm ${MUTED}`}>{r.desc}</p>
            </div>
            {typeof r.action === "string"
              ? <motion.button whileTap={{ scale: 0.95 }} className="h-10 px-4 rounded-full border border-[#ebe8f2] text-sm font-semibold hover:bg-[#f4f3f8] transition-colors">{r.action}</motion.button>
              : r.action}
          </div>
        ))}
        <div className="flex items-center gap-4 px-4 py-4 border-t border-[#f0eef5]">
          <span className="w-11 h-11 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0"><LogOut className="w-5 h-5 text-rose-500" /></span>
          <p className="flex-1 font-semibold text-rose-600">Cerrar sesión</p>
        </div>
      </motion.div>
    </>
  );
};
