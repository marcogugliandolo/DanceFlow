import React, { useState } from "react";
import { motion, LayoutGroup, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Share2, Check, Search, FileDown, Plus, History, Pencil, Trash2 } from "lucide-react";
import { classes, className, classPlace, students, history, sheet, relation, type HistStatus } from "../data";
import { HUE_OF, hueBg, hueSoft, hueInk, enter, EASE, type Hue } from "./tokens";

// Secciones del estilo B v2: Asistencia, Historial, Alumnos y Perfil.

const card = "rounded-[18px] bg-[var(--surface)] border border-[var(--line)]";
const btnGhost = "h-10 px-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-strong)] text-sm font-semibold flex items-center gap-2";
const btnBrand = "h-11 px-5 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-[var(--on-brand)] font-semibold flex items-center gap-2";

const Title: React.FC<{ title: string; sub?: string; right?: React.ReactNode; mobile?: boolean }> = ({ title, sub, right, mobile }) => (
  <div className={`flex ${mobile ? "flex-col gap-4" : "items-end justify-between gap-6"}`}>
    <motion.div {...enter(0)}>
      <h1 className={`font-bricolage font-bold tracking-[-0.035em] leading-[1] ${mobile ? "text-[34px]" : "text-[48px]"}`}>{title}</h1>
      {sub && <p className="mt-2 text-[15px] text-[var(--muted)]">{sub}</p>}
    </motion.div>
    {right && <motion.div {...enter(1)} className={`flex flex-wrap items-center gap-2 ${mobile ? "" : "justify-end"}`}>{right}</motion.div>}
  </div>
);

const Segmented: React.FC<{ id: string; options: { id: string; label: string }[]; value: string; onChange: (v: string) => void; full?: boolean }> = ({ id, options, value, onChange, full }) => (
  <LayoutGroup id={id}>
    <div className={`${full ? "flex w-full" : "inline-flex"} p-1 rounded-[14px] bg-[var(--surface)] border border-[var(--line)]`}>
      {options.map(o => {
        const on = value === o.id;
        return (
          <button key={o.id} onClick={() => onChange(o.id)}
            className={`relative ${full ? "flex-1" : ""} h-9 px-4 rounded-[10px] text-sm font-semibold ${on ? "text-[var(--on-ink)]" : "text-[var(--muted)] hover:text-[var(--ink)]"}`}>
            {on && <motion.span layoutId={`${id}-b`} className="absolute inset-0 rounded-[10px] bg-[var(--ink)]" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
            <span className="relative whitespace-nowrap">{o.label}</span>
          </button>
        );
      })}
    </div>
  </LayoutGroup>
);

// ================= ASISTENCIA =================
const PENDING: Record<string, string[]> = { sal: ["jue 22", "mar 20"], bac: ["mié 21"], dan: [], pil: [] };
const SESSIONS_OCT: Record<string, number> = { sal: 6, bac: 3, dan: 3, pil: 3 };

export const AsistenciaB2: React.FC<{ mobile?: boolean; initialSub?: string }> = ({ mobile, initialSub }) => {
  const [sub, setSub] = useState(initialSub === "relacion" ? "relacion" : initialSub === "hoja" ? "hoja" : "lista");
  return (
    <>
      <Title mobile={mobile} title="Asistencia" sub="Pasa lista y mira cómo va cada clase este mes."
        right={<Segmented id="b2-asis" full={mobile} value={sub === "relacion" ? "relacion" : "lista"} onChange={setSub}
          options={[{ id: "lista", label: "Pasar lista" }, { id: "relacion", label: "Relación de clases" }]} />} />
      <AnimatePresence mode="wait">
        <motion.div key={sub} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22, ease: EASE }} className="mt-8">
          {sub === "lista" && <PassList mobile={mobile} onOpen={() => setSub("hoja")} />}
          {sub === "hoja" && <Sheet mobile={mobile} onBack={() => setSub("lista")} />}
          {sub === "relacion" && <Relation mobile={mobile} />}
        </motion.div>
      </AnimatePresence>
    </>
  );
};

const PassList: React.FC<{ mobile?: boolean; onOpen: () => void }> = ({ mobile, onOpen }) => (
  <div className={`grid gap-4 ${mobile ? "grid-cols-1" : "grid-cols-2"}`}>
    {classes.map((c, i) => {
      const h: Hue = HUE_OF[c.id], pend = PENDING[c.id];
      return (
        <motion.article key={c.id} {...enter(i, 0.05)} onClick={onOpen} className={`${card} relative overflow-hidden p-6 cursor-pointer hover:border-[var(--line-strong)]`}>
          <span className="absolute left-0 top-0 bottom-0 w-1" style={hueBg(h)} />
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="font-bricolage text-[21px] font-bold tracking-[-0.02em] leading-tight">{c.name}</h3>
              <p className="text-sm text-[var(--muted)] mt-0.5">{c.place}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bricolage text-[30px] font-bold leading-none tabular-nums" style={hueInk(h)}>{c.attendance}<span className="text-base"> %</span></p>
              <p className="text-xs text-[var(--muted)] mt-1">asistencia</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-[var(--muted)]">{SESSIONS_OCT[c.id]} clases y {c.students} alumnos en octubre</p>
          <div className="mt-5 pt-4 border-t border-[var(--line)] flex flex-wrap items-center gap-2">
            {pend.length ? (
              <>
                <span className="text-sm font-semibold mr-1">Pendiente</span>
                {pend.map(d => (
                  <span key={d} className="h-8 px-3 rounded-lg text-sm font-semibold flex items-center capitalize" style={{ ...hueSoft(h), ...hueInk(h) }}>{d}</span>
                ))}
              </>
            ) : (
              <span className="text-sm font-semibold text-[var(--ok)] flex items-center gap-1.5"><Check className="w-4 h-4" /> Lista al día</span>
            )}
            <span className="ml-auto text-sm font-semibold text-[var(--muted)] group-hover:text-[var(--ink)] flex items-center gap-0.5">Hoja del mes <ChevronRight className="w-4 h-4" /></span>
          </div>
        </motion.article>
      );
    })}
  </div>
);

const Sheet: React.FC<{ mobile?: boolean; onBack: () => void }> = ({ mobile, onBack }) => {
  const h: Hue = HUE_OF[sheet.cls];
  const [rows, setRows] = useState(sheet.rows.map(r => r.marks.slice()));
  const held = sheet.days.length - 1;
  const toggle = (ri: number, di: number) => setRows(rs => rs.map((r, i) => i !== ri ? r : r.map((m, j) => j === di ? (m ? 0 : 1) : m)));
  const countRow = (r: number[]) => r.reduce((s, m, j) => s + (j === sheet.cancelledIdx ? 0 : m), 0);
  const total = rows.reduce((a, r) => a + countRow(r), 0);
  const pct = Math.round((total / (rows.length * held)) * 100);
  const cell = mobile ? "w-7 h-7 rounded-[7px]" : "w-9 h-9 rounded-[9px]";

  return (
    <>
      <motion.button {...enter(0)} onClick={onBack} className="mb-4 text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)] flex items-center gap-1">
        <ChevronLeft className="w-4 h-4" /> Todas las clases
      </motion.button>
      <motion.section {...enter(1)} className={`${card} relative overflow-hidden`}>
        <span className="absolute left-0 right-0 top-0 h-1" style={hueBg(h)} />
        <div className={`${mobile ? "p-5" : "px-8 pt-8 pb-6"} flex ${mobile ? "flex-col gap-4" : "items-end justify-between gap-6"} border-b border-[var(--line)]`}>
          <div>
            <p className="text-sm font-semibold" style={hueInk(h)}>Asistencia de octubre</p>
            <h2 className={`font-bricolage font-bold tracking-[-0.03em] leading-tight ${mobile ? "text-2xl" : "text-[34px]"}`}>{className[sheet.cls]}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">{held} clases, {rows.length} alumnos y un {pct} % de asistencia</p>
          </div>
          <motion.button whileTap={{ scale: 0.97 }} className={btnBrand}><Share2 className="w-4 h-4" /> Compartir</motion.button>
        </div>

        <div className={`${mobile ? "p-4" : "px-8 py-6"} overflow-x-auto`}>
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr>
                <th className={`text-left text-xs font-medium text-[var(--muted)] pb-3 ${mobile ? "hidden" : ""}`}>Alumno</th>
                {sheet.days.map((d, j) => (
                  <th key={d.d} className="pb-3 px-0.5 font-normal">
                    <span className="block text-[11px] text-[var(--muted)] capitalize">{d.w}</span>
                    <span className={`block font-bricolage font-bold ${mobile ? "text-sm" : "text-[17px]"} tabular-nums ${j === sheet.cancelledIdx ? "text-[var(--faint)] line-through" : ""}`}>{d.d}</span>
                  </th>
                ))}
                <th className="text-right text-xs font-medium text-[var(--muted)] pb-3 pl-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <React.Fragment key={sheet.rows[ri].name}>
                  {mobile && <tr><td colSpan={sheet.days.length + 1} className="pt-3 pb-1 text-[13px] font-semibold">{sheet.rows[ri].name}</td></tr>}
                  <tr>
                    {!mobile && <td className="py-1.5 pr-4 text-[15px] font-medium whitespace-nowrap">{sheet.rows[ri].name}</td>}
                    {r.map((m, j) => (
                      <td key={j} className="py-1 px-0.5 text-center">
                        {j === sheet.cancelledIdx ? (
                          <span className={`${cell} mx-auto block`} title="Festivo" style={{ backgroundImage: "repeating-linear-gradient(135deg, var(--hatch-a) 0 4px, var(--hatch-b) 4px 8px)" }} />
                        ) : (
                          <button onClick={() => toggle(ri, j)} aria-label={`${sheet.rows[ri].name}, día ${sheet.days[j].d}`} className={`${cell} mx-auto relative block bg-[var(--fill)]`}>
                            <AnimatePresence>
                              {m === 1 && (
                                <motion.span initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }}
                                  transition={{ type: "spring", stiffness: 600, damping: 28, delay: 0.15 + j * 0.035 }}
                                  className={`absolute inset-0 ${mobile ? "rounded-[7px]" : "rounded-[9px]"} flex items-center justify-center`} style={hueBg(h)}>
                                  <Check className={`${mobile ? "w-3.5 h-3.5" : "w-4 h-4"} text-white`} strokeWidth={3.2} />
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </button>
                        )}
                      </td>
                    ))}
                    <td className="py-1 pl-3 text-right tabular-nums"><span className="font-semibold">{countRow(r)}</span><span className="text-sm text-[var(--muted)]">/{held}</span></td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
          <p className="mt-5 text-xs text-[var(--muted)]">Toca una casilla para cambiarla. El martes 13 fue festivo y no cuenta.</p>
        </div>
      </motion.section>
    </>
  );
};

const Relation: React.FC<{ mobile?: boolean }> = ({ mobile }) => (
  <div className={`grid gap-4 ${mobile ? "grid-cols-1" : "grid-cols-2"}`}>
    {relation.map((r, i) => {
      const h: Hue = HUE_OF[r.cls], cur = r.months[r.months.length - 1], prev = r.months[r.months.length - 2];
      const diff = prev ? cur.v - prev.v : 0;
      return (
        <motion.article key={r.cls} {...enter(i, 0.05)} className={`${card} p-6 cursor-pointer hover:border-[var(--line-strong)]`}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="font-bricolage text-[21px] font-bold tracking-[-0.02em] leading-tight">{className[r.cls]}</h3>
              <p className="text-sm text-[var(--muted)] mt-0.5">{classPlace[r.cls]}</p>
            </div>
            <div className="text-right">
              <p className="font-bricolage text-[30px] font-bold leading-none tabular-nums" style={hueInk(h)}>{cur.v}<span className="text-base"> %</span></p>
              {prev && <p className="text-xs text-[var(--muted)] mt-1">{diff >= 0 ? "+" : "−"}{Math.abs(diff)} puntos vs {prev.m.toLowerCase()}.</p>}
            </div>
          </div>
          <div className="mt-6 grid gap-3 items-end h-28" style={{ gridTemplateColumns: `repeat(${Math.max(4, r.months.length)}, minmax(0, 1fr))` }}>
            {r.months.map((m, k) => {
              const last = k === r.months.length - 1;
              return (
                <div key={m.m} className="h-full flex flex-col justify-end">
                  <span className={`mb-1 text-xs tabular-nums ${last ? "font-semibold" : "text-[var(--muted)]"}`}>{m.v} %</span>
                  <motion.div className="rounded-[4px] w-full" style={last ? hueBg(h) : { backgroundColor: "var(--fill)" }}
                    initial={{ height: 0 }} animate={{ height: `${m.v * 0.62}%` }} transition={{ delay: 0.2 + i * 0.05 + k * 0.05, duration: 0.55, ease: EASE }} />
                  <span className={`mt-2 text-xs ${last ? "font-semibold" : "text-[var(--muted)]"}`}>{m.m}</span>
                </div>
              );
            })}
          </div>
        </motion.article>
      );
    })}
  </div>
);

// ================= HISTORIAL =================
const STATUS: Record<HistStatus, { label: string; color: string; bg: string }> = {
  held: { label: "Realizada", color: "var(--ok)", bg: "var(--ok-soft)" },
  billed: { label: "Cancelada (se cobra)", color: "var(--warn)", bg: "var(--warn-soft)" },
  unbilled: { label: "Cancelada (no se cobra)", color: "var(--bad)", bg: "var(--bad-soft)" },
};

export const HistorialB2: React.FC<{ mobile?: boolean }> = ({ mobile }) => {
  const [filter, setFilter] = useState("todas");
  const items = history.filter(x => filter === "todas" ? true : filter === "realizadas" ? x.status === "held" : x.status !== "held");
  const weeks = [
    { label: "Semana del 19 al 22 de octubre", ids: ["h1", "h2", "h3", "h4"] },
    { label: "Semana del 12 al 16 de octubre", ids: ["h5", "h6", "h7", "h8", "h9"] },
    { label: "Semana del 5 al 9 de octubre", ids: ["h10"] },
  ];
  return (
    <>
      <Title mobile={mobile} title="Historial" sub="Todas las clases del mes, una a una."
        right={<motion.button whileTap={{ scale: 0.97 }} className={btnGhost}><FileDown className="w-4 h-4" /> Exportar PDF</motion.button>} />

      <motion.div {...enter(2)} className={`mt-8 flex ${mobile ? "flex-col" : "items-center"} gap-3`}>
        <label className="flex-1 h-11 rounded-xl bg-[var(--surface)] border border-[var(--line)] flex items-center gap-2 px-3.5 focus-within:border-[var(--line-strong)]">
          <Search className="w-4 h-4 shrink-0 text-[var(--muted)]" />
          <input placeholder="Buscar por clase o nota" className="bg-transparent outline-none flex-1 text-[15px] placeholder:text-[var(--faint)]" />
        </label>
        <Segmented id="b2-hist" full={mobile} value={filter} onChange={setFilter}
          options={[{ id: "todas", label: "Todas" }, { id: "realizadas", label: "Realizadas" }, { id: "canceladas", label: "Canceladas" }]} />
      </motion.div>

      <LayoutGroup id="b2-hist-list">
        <div className="mt-8 flex flex-col gap-7">
          {weeks.map((w, wi) => {
            const list = items.filter(x => w.ids.includes(x.id));
            if (!list.length) return null;
            return (
              <motion.section layout key={w.label} {...enter(3 + wi)}>
                <h2 className="text-sm font-semibold text-[var(--muted)] mb-2">{w.label}</h2>
                <div className={`${card} overflow-hidden`}>
                  <AnimatePresence initial={false}>
                    {list.map(x => {
                      const h: Hue = HUE_OF[x.cls], st = STATUS[x.status];
                      return (
                        <motion.div key={x.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                          className={`grid ${mobile ? "grid-cols-[48px_1fr_auto]" : "grid-cols-[56px_1fr_220px_90px]"} gap-4 items-center px-5 py-3.5 border-b border-[var(--line)] last:border-b-0 hover:bg-[var(--hover)] cursor-pointer`}>
                          <div className="leading-none">
                            <p className="font-bricolage text-[22px] font-bold tabular-nums">{x.day}</p>
                            <p className="text-xs text-[var(--muted)] capitalize mt-1">{x.wd}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[15px] font-semibold truncate flex items-center gap-2"><span className="w-2 h-2 rounded-full shrink-0" style={hueBg(h)} />{className[x.cls]}</p>
                            <p className="text-[13px] text-[var(--muted)] truncate mt-0.5">
                              {x.status === "held" ? `${x.people} ${x.people === 1 ? "alumno" : "alumnos"}` : x.note}
                            </p>
                          </div>
                          {!mobile && <span className="justify-self-start text-xs font-semibold px-2 py-1 rounded-md" style={{ color: st.color, backgroundColor: st.bg }}>{st.label}</span>}
                          <span className={`text-right font-semibold tabular-nums ${x.amount === "—" ? "text-[var(--faint)]" : ""}`}>{x.amount}</span>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </motion.section>
            );
          })}
        </div>
      </LayoutGroup>
    </>
  );
};

// ================= ALUMNOS =================
const initials = (n: string) => n.split(" ").filter(w => /^[A-ZÁÉÍÓÚÑ]/.test(w)).slice(0, 2).map(w => w[0]).join("");

export const AlumnosB2: React.FC<{ mobile?: boolean }> = ({ mobile }) => {
  const [cls, setCls] = useState("todas");
  const list = students.filter(s => cls === "todas" || s.classes.includes(cls));
  return (
    <>
      <Title mobile={mobile} title="Alumnos" sub={`${students.length} alumnos en ${classes.length} clases.`}
        right={<>
          {!mobile && (
            <label className="h-11 w-64 rounded-xl bg-[var(--surface)] border border-[var(--line)] flex items-center gap-2 px-3.5">
              <Search className="w-4 h-4 shrink-0 text-[var(--muted)]" />
              <input placeholder="Buscar alumno" className="bg-transparent outline-none flex-1 text-[15px] placeholder:text-[var(--faint)]" />
            </label>
          )}
          <motion.button whileTap={{ scale: 0.97 }} className={btnBrand}><Plus className="w-[18px] h-[18px]" /> Nuevo alumno</motion.button>
        </>} />

      <motion.div {...enter(2)} className={`mt-8 flex gap-2 ${mobile ? "overflow-x-auto -mx-4 px-4 pb-1" : "flex-wrap"}`}>
        {[{ id: "todas", label: "Todas las clases" }, ...classes.map(c => ({ id: c.id, label: c.name }))].map(o => {
          const on = cls === o.id, h = o.id !== "todas" ? HUE_OF[o.id] : null;
          return (
            <motion.button key={o.id} whileTap={{ scale: 0.97 }} onClick={() => setCls(o.id)}
              className={`h-9 px-3.5 rounded-[10px] text-sm font-semibold whitespace-nowrap flex items-center gap-2 border ${on ? "border-transparent" : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-strong)]"}`}
              style={on ? (h ? { ...hueSoft(h), ...hueInk(h) } : { backgroundColor: "var(--ink)", color: "var(--on-ink)" }) : undefined}>
              {h && <span className="w-2 h-2 rounded-full" style={hueBg(h)} />}
              {o.label}
            </motion.button>
          );
        })}
      </motion.div>

      <LayoutGroup id="b2-alumnos">
        <motion.div layout className={`mt-5 grid gap-3 ${mobile ? "grid-cols-1" : "grid-cols-3"}`}>
          <AnimatePresence initial={false}>
            {list.map((s, i) => {
              const h: Hue = HUE_OF[s.classes[0]];
              const level = s.pct >= 75 ? "var(--ok)" : s.pct >= 50 ? "var(--warn)" : "var(--bad)";
              return (
                <motion.article key={s.id} layout
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
                  transition={{ delay: 0.08 + i * 0.03, duration: 0.3, ease: EASE }}
                  className={`group ${card} p-5 relative hover:border-[var(--line-strong)]`}>
                  <div className="absolute top-3.5 right-3.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    {[History, Pencil, Trash2].map((Icon, k) => (
                      <button key={k} aria-label={["Historial", "Editar", "Borrar"][k]} className={`w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--fill)] ${k === 2 ? "text-[var(--bad)]" : "text-[var(--muted)]"}`}><Icon className="w-4 h-4" /></button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-11 h-11 rounded-full font-bricolage font-bold flex items-center justify-center shrink-0" style={{ ...hueSoft(h), ...hueInk(h) }}>{initials(s.name)}</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-[15px] truncate">{s.name}</p>
                      <p className="text-[13px] text-[var(--muted)] tabular-nums">{s.phone}</p>
                    </div>
                  </div>
                  <ul className="mt-4 flex flex-col gap-1">
                    {s.classes.map(c => (
                      <li key={c} className="text-[13px] flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={hueBg(HUE_OF[c])} />{className[c]}</li>
                    ))}
                  </ul>
                  <div className="mt-4 flex items-center gap-3">
                    <span className="flex-1 h-1.5 rounded-full bg-[var(--fill)] overflow-hidden">
                      <motion.span className="block h-full rounded-full bg-[var(--ink)]" initial={{ width: 0 }} animate={{ width: `${s.pct}%` }} transition={{ delay: 0.2 + i * 0.03, duration: 0.6, ease: EASE }} />
                    </span>
                    <span className="text-[13px] font-semibold tabular-nums" style={{ color: level }}>{s.pct} %</span>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </LayoutGroup>
    </>
  );
};

// ================= PERFIL =================
const Toggle: React.FC<{ on: boolean; onChange: () => void; label: string }> = ({ on, onChange, label }) => (
  <button onClick={onChange} role="switch" aria-checked={on} aria-label={label}
    className={`w-12 h-7 rounded-full p-1 flex ${on ? "justify-end bg-[var(--ink)]" : "justify-start bg-[var(--line-strong)]"}`}>
    <motion.span layout transition={{ type: "spring", stiffness: 700, damping: 35 }} className="w-5 h-5 rounded-full bg-[var(--surface)]" />
  </button>
);

export const PerfilB2: React.FC<{ mobile?: boolean; dark: boolean; onToggleDark: () => void }> = ({ mobile, dark, onToggleDark }) => {
  const Row: React.FC<{ title: string; desc: string; children: React.ReactNode; danger?: boolean }> = ({ title, desc, children, danger }) => (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-[var(--line)] last:border-b-0">
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-[15px] ${danger ? "text-[var(--bad)]" : ""}`}>{title}</p>
        <p className="text-[13px] text-[var(--muted)]">{desc}</p>
      </div>
      {children}
    </div>
  );
  return (
    <>
      <motion.section {...enter(0)} className={`${card} ${mobile ? "p-6" : "p-8"} flex ${mobile ? "flex-col items-start gap-5" : "items-center gap-6"}`}>
        <span className={`${mobile ? "w-16 h-16 text-2xl" : "w-20 h-20 text-3xl"} rounded-full bg-[var(--fill)] font-bricolage font-bold flex items-center justify-center shrink-0`}>A</span>
        <div className="flex-1">
          <h1 className={`font-bricolage font-bold tracking-[-0.03em] leading-none ${mobile ? "text-[30px]" : "text-[40px]"}`}>Ana Salsanova</h1>
          <p className="mt-2 text-[15px] text-[var(--muted)]">Profesora</p>
          <p className="text-[15px] text-[var(--muted)]">ana@salsanova.com</p>
          <p className="mt-3 text-sm flex flex-wrap items-center gap-x-3 gap-y-1">
            {classes.map(c => <span key={c.id} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={hueBg(HUE_OF[c.id])} />{c.name}</span>)}
          </p>
        </div>
        <motion.button whileTap={{ scale: 0.97 }} className={btnGhost}>Editar perfil</motion.button>
      </motion.section>

      <motion.h2 {...enter(1)} className="mt-8 mb-2 text-sm font-semibold text-[var(--muted)]">Preferencias</motion.h2>
      <motion.section {...enter(2)} className={card}>
        <Row title="Modo oscuro" desc="Cambia entre tema claro y oscuro."><Toggle on={dark} onChange={onToggleDark} label="Modo oscuro" /></Row>
      </motion.section>

      <motion.h2 {...enter(3)} className="mt-8 mb-2 text-sm font-semibold text-[var(--muted)]">Cuenta y datos</motion.h2>
      <motion.section {...enter(4)} className={card}>
        <Row title="Contraseña" desc="Cambia la contraseña con la que entras."><button className={btnGhost}>Cambiar</button></Row>
        <Row title="Exportar datos" desc="Descarga una copia con tus clases, sesiones y alumnos."><button className={btnGhost}>Exportar</button></Row>
        <Row title="Importar datos" desc="Recupera tus datos desde una copia."><button className={btnGhost}>Importar</button></Row>
        <Row title="Cerrar sesión" desc="Sal de SalsaNova en este dispositivo." danger><button className={`${btnGhost} text-[var(--bad)]`}>Salir</button></Row>
      </motion.section>
    </>
  );
};
