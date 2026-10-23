import React, { useState } from "react";
import { motion, LayoutGroup, AnimatePresence } from "motion/react";
import { Home, CheckCircle2, History, Users, ChevronDown, Plus } from "lucide-react";
import { kpis, incomeTrend, classes, pending, month } from "../data";
import { CountUp, DancersMark } from "../shared";
import { HUE_OF, hueBg, hueInk, enter, EASE, type Hue } from "./tokens";
import { AsistenciaB2, HistorialB2, AlumnosB2, PerfilB2 } from "./PagesB2";

// Estilo B v2 · "Ritmo", depurado: paleta propia (carmín, ciruela, mostaza, petróleo),
// sin degradados ni manchas decorativas, esquinas según jerarquía y movimiento contenido.

const NAV = [
  { id: "inicio", label: "Inicio", icon: Home },
  { id: "asistencia", label: "Asistencia", icon: CheckCircle2 },
  { id: "historial", label: "Historial", icon: History },
  { id: "alumnos", label: "Alumnos", icon: Users },
];

// Firma de la escuela: una franja con los cuatro colores de las clases
export const Stripe: React.FC = () => (
  <div className="flex h-[3px] w-full" aria-hidden>
    {(["salon", "bachata", "danzas", "pilates"] as Hue[]).map(h => <span key={h} className="flex-1" style={hueBg(h)} />)}
  </div>
);

export const AppB2: React.FC<{ mobile?: boolean; initialPage?: string; initialSub?: string; initialDark?: boolean }> = ({ mobile, initialPage, initialSub, initialDark }) => {
  const [active, setActive] = useState(initialPage ?? "inicio");
  const [dark, setDark] = useState(!!initialDark);

  return (
    <div className={`b2 ${dark ? "dark" : ""} min-h-screen font-geist antialiased`}>
      <Stripe />
      <header className={`flex items-center justify-between ${mobile ? "px-4 pt-4" : "px-10 pt-5"}`}>
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-[10px] bg-[var(--ink)] flex items-center justify-center"><DancersMark className="w-6 h-auto text-[var(--on-ink)]" /></span>
          <span className="font-bricolage text-[20px] font-bold tracking-[-0.02em]">SalsaNova</span>
        </div>

        {!mobile && (
          <LayoutGroup id="b2-nav">
            <nav className="flex items-center gap-0.5 p-1 rounded-[14px] bg-[var(--surface)] border border-[var(--line)]">
              {NAV.map(n => {
                const on = active === n.id;
                return (
                  <button key={n.id} onClick={() => setActive(n.id)}
                    className={`relative h-9 px-4 rounded-[10px] text-sm font-semibold ${on ? "text-[var(--on-ink)]" : "text-[var(--muted)] hover:text-[var(--ink)]"}`}>
                    {on && <motion.span layoutId="b2-bubble" className="absolute inset-0 rounded-[10px] bg-[var(--ink)]" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                    <span className="relative">{n.label}</span>
                  </button>
                );
              })}
            </nav>
          </LayoutGroup>
        )}

        <div className="flex items-center gap-2">
          {!mobile && (
            <button className="h-10 px-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-sm font-semibold flex items-center gap-1.5 hover:border-[var(--line-strong)]">
              {month} <ChevronDown className="w-4 h-4 text-[var(--muted)]" />
            </button>
          )}
          <button onClick={() => setActive("perfil")} aria-label="Perfil"
            className={`w-10 h-10 rounded-full bg-[var(--fill)] text-[var(--ink)] font-bricolage font-bold flex items-center justify-center ${active === "perfil" ? "outline outline-2 outline-offset-2 outline-[var(--ink)]" : ""}`}>A</button>
        </div>
      </header>

      <main className={mobile ? "px-4 pt-7 pb-28" : "px-10 pt-10 pb-14 max-w-[1280px] mx-auto"}>
        <AnimatePresence mode="wait">
          <motion.div key={active} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.24, ease: EASE }}>
            {active === "inicio" ? <HomeB2 mobile={mobile} />
              : active === "asistencia" ? <AsistenciaB2 mobile={mobile} initialSub={initialSub} />
              : active === "historial" ? <HistorialB2 mobile={mobile} />
              : active === "alumnos" ? <AlumnosB2 mobile={mobile} />
              : <PerfilB2 mobile={mobile} dark={dark} onToggleDark={() => setDark(d => !d)} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {mobile && (
        <LayoutGroup id="b2-tab">
          <nav className="fixed bottom-0 inset-x-0 bg-[var(--surface)] border-t border-[var(--line)] px-2 pt-1.5 pb-6 grid grid-cols-4">
            {NAV.map(n => {
              const on = active === n.id;
              return (
                <button key={n.id} aria-label={n.label} onClick={() => setActive(n.id)} className={`relative flex flex-col items-center gap-1 py-1.5 text-[11px] font-semibold ${on ? "text-[var(--ink)]" : "text-[var(--faint)]"}`}>
                  {on && <motion.span layoutId="b2-tab-ind" className="absolute -top-1.5 w-8 h-[3px] rounded-b bg-[var(--brand)]" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
                  <n.icon className="w-5 h-5" />{n.label}
                </button>
              );
            })}
          </nav>
        </LayoutGroup>
      )}
    </div>
  );
};

// ---------- Inicio ----------
const HomeB2: React.FC<{ mobile?: boolean }> = ({ mobile }) => {
  const max = Math.max(...incomeTrend.map(p => p.v));
  const prev = incomeTrend[incomeTrend.length - 2].v;
  const card = "rounded-[18px] bg-[var(--surface)] border border-[var(--line)]";

  return (
    <>
      <div className={`flex ${mobile ? "flex-col gap-5" : "items-end justify-between gap-8"}`}>
        <motion.div {...enter(0)}>
          <p className="text-[15px] text-[var(--muted)]">Jueves, 22 de octubre</p>
          <h1 className={`mt-1 font-bricolage font-bold tracking-[-0.035em] leading-[1] ${mobile ? "text-[34px]" : "text-[48px]"}`}>
            Te quedan {pending.length} listas por pasar
          </h1>
          <div className="mt-4 flex flex-wrap gap-2">
            {pending.map(p => {
              const id = classes.find(c => c.name === p.cls)!.id, h = HUE_OF[id];
              return (
                <motion.button key={p.id} whileTap={{ scale: 0.97 }}
                  className="h-10 pl-3 pr-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-strong)] text-sm font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={hueBg(h)} />
                  {p.cls}
                  <span className="font-medium text-[var(--muted)] capitalize">{p.day}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
        <motion.button {...enter(1)} whileTap={{ scale: 0.97 }}
          className="self-start md:self-auto h-11 px-5 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-[var(--on-brand)] font-semibold flex items-center gap-2">
          <Plus className="w-[18px] h-[18px]" /> Registrar clase
        </motion.button>
      </div>

      <div className={`mt-9 grid gap-4 ${mobile ? "grid-cols-1" : "grid-cols-12"}`}>
        {/* Ingresos */}
        <motion.section {...enter(2)} className={`rounded-[22px] bg-[var(--feature)] text-[var(--on-feature)] ${mobile ? "p-6" : "col-span-7 p-8"}`}>
          <p className="text-sm font-medium text-[var(--feature-muted)]">Ingresos de octubre</p>
          <p className={`mt-1 font-bricolage font-bold tracking-[-0.045em] leading-none tabular-nums ${mobile ? "text-[56px]" : "text-[80px]"}`}>
            <CountUp value={kpis.income} /> <span className="text-[0.45em] font-semibold text-[var(--feature-muted)]">€</span>
          </p>
          <p className="mt-2 text-sm text-[var(--feature-muted)]"><span className="text-[var(--on-feature)] font-semibold">+{kpis.income - prev} €</span> más que en septiembre</p>
          <div className={`mt-8 grid grid-cols-4 gap-4 items-end ${mobile ? "h-28" : "h-36"}`}>
            {incomeTrend.map((p, i) => {
              const last = i === incomeTrend.length - 1;
              return (
                <div key={p.m} className="h-full flex flex-col justify-end">
                  <span className={`text-xs tabular-nums mb-1.5 ${last ? "font-semibold" : "text-[var(--feature-muted)]"}`}>{p.v} €</span>
                  <motion.div className="rounded-[4px] w-full max-w-[64px]" style={{ backgroundColor: last ? "var(--brand)" : "var(--feature-track)" }}
                    initial={{ height: 0 }} animate={{ height: `${(p.v / max) * 72}%` }}
                    transition={{ delay: 0.25 + i * 0.07, duration: 0.6, ease: EASE }} />
                  <span className={`mt-2 text-xs ${last ? "font-semibold" : "text-[var(--feature-muted)]"}`}>{p.m}</span>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* Asistencia por clase + resumen */}
        <div className={`flex flex-col gap-4 ${mobile ? "" : "col-span-5"}`}>
          <motion.section {...enter(3)} className={`${card} p-6`}>
            <div className="flex items-baseline justify-between">
              <h2 className="text-[15px] font-semibold">Asistencia por clase</h2>
              <span className="text-sm text-[var(--muted)]">media {kpis.attendance} %</span>
            </div>
            <ul className="mt-5 flex flex-col gap-4">
              {classes.map((c, i) => {
                const h = HUE_OF[c.id];
                return (
                  <li key={c.id} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 items-center">
                    <span className="text-sm font-medium truncate">{c.name}</span>
                    <span className="text-sm font-semibold tabular-nums" style={hueInk(h)}>{c.attendance} %</span>
                    <span className="col-span-2 h-1.5 rounded-full bg-[var(--fill)] overflow-hidden">
                      <motion.span className="block h-full rounded-full" style={hueBg(h)}
                        initial={{ width: 0 }} animate={{ width: `${c.attendance}%` }} transition={{ delay: 0.3 + i * 0.06, duration: 0.7, ease: EASE }} />
                    </span>
                  </li>
                );
              })}
            </ul>
          </motion.section>
          <motion.section {...enter(4)} className={`${card} grid grid-cols-2 divide-x divide-[var(--line)]`}>
            <div className="p-6">
              <p className="text-sm text-[var(--muted)]">Clases dadas</p>
              <p className="mt-1 font-bricolage text-[40px] font-bold tracking-[-0.04em] leading-none tabular-nums">{kpis.held}</p>
              <p className="mt-2 text-xs text-[var(--muted)]">y {kpis.cancelled} cancelada</p>
            </div>
            <div className="p-6">
              <p className="text-sm text-[var(--muted)]">Alumnos</p>
              <p className="mt-1 font-bricolage text-[40px] font-bold tracking-[-0.04em] leading-none tabular-nums">{kpis.students}</p>
              <p className="mt-2 text-xs text-[var(--muted)]">en {classes.length} clases</p>
            </div>
          </motion.section>
        </div>
      </div>

      {/* Clases */}
      <motion.div {...enter(5)} className="mt-10 flex items-baseline justify-between">
        <h2 className="font-bricolage text-[26px] font-bold tracking-[-0.03em]">Tus clases</h2>
        <span className="text-sm text-[var(--muted)]">octubre</span>
      </motion.div>
      <motion.div {...enter(6)} className={`mt-4 ${card} overflow-hidden`}>
        {!mobile && (
          <div className="grid grid-cols-[1fr_140px_120px_100px] gap-4 px-6 py-3 text-xs font-medium text-[var(--muted)] border-b border-[var(--line)]">
            <span>Clase</span><span>Sesiones</span><span className="text-right">Asistencia</span><span className="text-right">Total</span>
          </div>
        )}
        {classes.map(c => {
          const h: Hue = HUE_OF[c.id];
          return (
            <div key={c.id} className={`group relative grid ${mobile ? "grid-cols-[1fr_auto]" : "grid-cols-[1fr_140px_120px_100px]"} gap-4 items-center px-6 py-4 border-b border-[var(--line)] last:border-b-0 hover:bg-[var(--hover)] cursor-pointer`}>
              <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r" style={hueBg(h)} />
              <div className="min-w-0">
                <p className="font-semibold text-[15px] truncate">{c.name}</p>
                <p className="text-[13px] text-[var(--muted)] truncate">{c.place}, {c.price}</p>
              </div>
              {!mobile && (
                <div className="flex gap-1">
                  {c.last.map((ok, k) => <span key={k} className="w-2.5 h-2.5 rounded-full" style={ok ? hueBg(h) : { backgroundColor: "var(--fill)" }} />)}
                </div>
              )}
              {!mobile && <span className="text-sm text-right tabular-nums" style={hueInk(h)}>{c.attendance} %</span>}
              <span className="font-bricolage text-lg font-bold text-right tabular-nums">{c.total} €</span>
            </div>
          );
        })}
      </motion.div>
    </>
  );
};
