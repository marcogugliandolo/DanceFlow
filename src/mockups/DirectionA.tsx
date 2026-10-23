import React, { useState } from "react";
import { motion, LayoutGroup } from "motion/react";
import {
  LayoutDashboard, CheckCircle2, History, Users, UserCircle2, Plus, ChevronLeft, ChevronRight,
  ArrowUpRight, Search, Moon,
} from "lucide-react";
import { kpis, incomeTrend, classes, pending, month, teacher } from "./data";
import { CountUp, DancersMark, EASE } from "./shared";

// Propuesta A · "Escenario": oscuro, sobrio y preciso. Barra lateral, datos claros y
// una sola nota de color (rosa) para lo importante. El movimiento es corto y funcional.

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "asistencia", label: "Asistencia", icon: CheckCircle2 },
  { id: "historial", label: "Historial", icon: History },
  { id: "alumnos", label: "Alumnos", icon: Users },
  { id: "perfil", label: "Perfil", icon: UserCircle2 },
];

const DOT = { rose: "bg-rose-500", violet: "bg-violet-500", amber: "bg-amber-400", teal: "bg-teal-400" } as const;

const fadeUp = (i: number, base = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay: base + i * 0.05, ease: EASE },
});

const Sparkline: React.FC = () => {
  const w = 220, h = 56, max = Math.max(...incomeTrend.map(p => p.v));
  const pts = incomeTrend.map((p, i) => [(i / (incomeTrend.length - 1)) * w, h - (p.v / max) * (h - 8) - 4]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-14 overflow-visible" aria-hidden>
      <defs>
        <linearGradient id="a-spark" x1="0" x2="1">
          <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#f43f5e" />
        </linearGradient>
        <linearGradient id="a-spark-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path d={`${d} L${w},${h} L0,${h} Z`} fill="url(#a-spark-fill)"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0, duration: 0.6 }} />
      <motion.path d={d} fill="none" stroke="url(#a-spark)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.35, duration: 1.0, ease: [0.65, 0, 0.35, 1] }} />
    </svg>
  );
};

const Ring: React.FC<{ pct: number; size?: number }> = ({ pct, size = 44 }) => {
  const r = (size - 6) / 2, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={5} className="stroke-white/10" />
      <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={5} strokeLinecap="round" className="stroke-rose-500"
        strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct / 100) }}
        transition={{ delay: 0.4, duration: 1.1, ease: EASE }} />
    </svg>
  );
};

export const DirectionA: React.FC<{ mobile?: boolean }> = ({ mobile }) => {
  const [active, setActive] = useState("dashboard");
  const maxIncome = Math.max(...incomeTrend.map(p => p.v));

  const kpiCard = "relative rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 overflow-hidden";

  return (
    <div className="dark min-h-screen bg-[#0b0a0d] text-zinc-100 font-geist antialiased">
      <div className="flex min-h-screen">
        {/* Barra lateral */}
        {!mobile && (
          <aside className="w-[248px] shrink-0 border-r border-white/[0.06] px-4 py-6 flex flex-col">
            <motion.div {...fadeUp(0)} className="flex items-center gap-2.5 px-2">
              <DancersMark className="w-9 h-auto text-rose-500" />
              <span className="text-[17px] font-semibold tracking-tight">SalsaNova</span>
            </motion.div>

            <LayoutGroup id="a-nav">
              <nav className="mt-9 flex flex-col gap-1">
                {NAV.map((n, i) => {
                  const on = active === n.id;
                  return (
                    <motion.button key={n.id} {...fadeUp(i, 0.05)} onClick={() => setActive(n.id)}
                      className={`relative flex items-center gap-3 h-10 px-3 rounded-[10px] text-sm font-medium transition-colors ${on ? "text-white" : "text-zinc-400 hover:text-zinc-100"}`}>
                      {on && <motion.span layoutId="a-nav-bg" className="absolute inset-0 rounded-[10px] bg-white/[0.07]" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
                      {on && <motion.span layoutId="a-nav-bar" className="absolute -left-4 top-2 bottom-2 w-[3px] rounded-r bg-rose-500" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
                      <n.icon className="relative w-[18px] h-[18px]" />
                      <span className="relative">{n.label}</span>
                    </motion.button>
                  );
                })}
              </nav>
            </LayoutGroup>

            <div className="mt-auto flex items-center gap-3 px-2 pt-4 border-t border-white/[0.06]">
              <span className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-500 to-fuchsia-600 flex items-center justify-center text-sm font-semibold">A</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Ana Salsanova</p>
                <p className="text-xs text-zinc-500">Profesora</p>
              </div>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-white/[0.06] hover:text-white transition-colors" aria-label="Tema"><Moon className="w-4 h-4" /></button>
            </div>
          </aside>
        )}

        {/* Contenido */}
        <main className={`flex-1 min-w-0 ${mobile ? "px-4 pt-4 pb-28" : "px-10 py-8"}`}>
          {mobile && (
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2"><DancersMark className="w-8 h-auto text-rose-500" /><span className="font-semibold">SalsaNova</span></div>
              <span className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-fuchsia-600 flex items-center justify-center text-xs font-semibold">A</span>
            </div>
          )}

          <div className="flex flex-wrap items-end justify-between gap-4">
            <motion.div {...fadeUp(0, 0.1)}>
              <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Hola, {teacher}</h1>
              <p className="text-sm text-zinc-500 mt-1">Así va tu mes.</p>
            </motion.div>
            <motion.div {...fadeUp(1, 0.1)} className={`flex items-center gap-2 ${mobile ? "w-full" : ""}`}>
              {!mobile && (
                <button className="h-9 px-3 rounded-[10px] border border-white/[0.08] text-zinc-400 text-sm flex items-center gap-2 hover:text-zinc-100 hover:border-white/15 transition-colors">
                  <Search className="w-4 h-4" /> Buscar
                </button>
              )}
              <div className={`h-9 flex items-center rounded-[10px] border border-white/[0.08] ${mobile ? "flex-1 justify-between" : ""}`}>
                <button className="w-8 h-full flex items-center justify-center text-zinc-400 hover:text-white" aria-label="Mes anterior"><ChevronLeft className="w-4 h-4" /></button>
                <span className="px-1 text-sm font-medium">{month}</span>
                <button className="w-8 h-full flex items-center justify-center text-zinc-400 hover:text-white" aria-label="Mes siguiente"><ChevronRight className="w-4 h-4" /></button>
              </div>
              <motion.button whileTap={{ scale: 0.97 }} className="h-9 px-3.5 rounded-[10px] bg-rose-500 hover:bg-rose-400 text-white text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset]">
                <Plus className="w-4 h-4" /> {mobile ? "Registrar" : "Registrar clase"}
              </motion.button>
            </motion.div>
          </div>

          {/* Cifras */}
          <div className={`mt-7 grid gap-3 ${mobile ? "grid-cols-2" : "grid-cols-[1.6fr_1fr_1fr_1fr]"}`}>
            <motion.div {...fadeUp(0, 0.2)} className={`${kpiCard} ${mobile ? "col-span-2" : ""}`}>
              <p className="text-sm text-zinc-400">Ingresos</p>
              <div className="flex items-end justify-between gap-4 mt-2">
                <p className="text-[40px] leading-none font-semibold tracking-[-0.03em]"><CountUp value={kpis.income} suffix=" €" /></p>
                <span className="mb-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 rounded-md px-1.5 py-0.5 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" />23 % vs sep.</span>
              </div>
              <div className="mt-3"><Sparkline /></div>
            </motion.div>
            <motion.div {...fadeUp(1, 0.2)} className={kpiCard}>
              <p className="text-sm text-zinc-400">Clases dadas</p>
              <p className="mt-2 text-[40px] leading-none font-semibold tracking-[-0.03em]"><CountUp value={kpis.held} delay={0.05} /></p>
              <p className="mt-3 text-xs text-zinc-500">{kpis.cancelled} cancelada</p>
            </motion.div>
            <motion.div {...fadeUp(2, 0.2)} className={`${kpiCard} ${mobile ? "col-span-2 order-last" : ""}`}>
              <p className="text-sm text-zinc-400">Asistencia</p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-[40px] leading-none font-semibold tracking-[-0.03em] whitespace-nowrap"><CountUp value={kpis.attendance} suffix=" %" delay={0.1} /></p>
                <Ring pct={kpis.attendance} />
              </div>
              <p className="mt-3 text-xs text-zinc-500">media de todas las clases</p>
            </motion.div>
            <motion.div {...fadeUp(3, 0.2)} className={kpiCard}>
              <p className="text-sm text-zinc-400">Alumnos</p>
              <p className="mt-2 text-[40px] leading-none font-semibold tracking-[-0.03em]"><CountUp value={kpis.students} delay={0.15} /></p>
              <div className="mt-3 flex -space-x-1.5">
                {["C", "M", "A", "L", "X"].map((l, i) => (
                  <motion.span key={l} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.9 + i * 0.06, type: "spring", stiffness: 500, damping: 22 }}
                    className="w-6 h-6 rounded-full border-2 border-[#0b0a0d] bg-zinc-700 text-[10px] font-semibold flex items-center justify-center">{l}</motion.span>
                ))}
                <span className="w-6 h-6 rounded-full border-2 border-[#0b0a0d] bg-zinc-800 text-[10px] text-zinc-400 flex items-center justify-center">+6</span>
              </div>
            </motion.div>
          </div>

          <div className={`mt-6 grid gap-6 ${mobile ? "grid-cols-1" : "grid-cols-[1fr_340px]"}`}>
            {/* Clases */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold">Tus clases</h2>
                <span className="text-xs text-zinc-500">{classes.length} activas</span>
              </div>
              <div className="rounded-2xl border border-white/[0.07] overflow-hidden">
                {!mobile && (
                  <div className="grid grid-cols-[1fr_120px_90px_90px] gap-4 px-5 py-2.5 text-xs text-zinc-500 border-b border-white/[0.06] bg-white/[0.015]">
                    <span>Clase</span><span>Últimas sesiones</span><span className="text-right">Asistencia</span><span className="text-right">Total</span>
                  </div>
                )}
                {classes.map((c, i) => (
                  <motion.div key={c.id} {...fadeUp(i, 0.45)}
                    className={`group relative grid ${mobile ? "grid-cols-[1fr_auto]" : "grid-cols-[1fr_120px_90px_90px]"} items-center gap-4 px-5 py-4 border-b border-white/[0.05] last:border-b-0 hover:bg-white/[0.035] transition-colors cursor-pointer`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${DOT[c.hue]}`} />
                      <div className="min-w-0">
                        <p className="text-[15px] font-medium truncate">{c.name}</p>
                        <p className="text-xs text-zinc-500 truncate mt-0.5">{c.place} · {c.price}</p>
                      </div>
                    </div>
                    {!mobile && (
                      <div className="flex gap-1">
                        {c.last.map((ok, k) => <span key={k} className={`w-2.5 h-5 rounded-sm ${ok ? "bg-zinc-300" : "bg-white/10"}`} />)}
                      </div>
                    )}
                    {!mobile && <span className="text-sm text-right tabular-nums text-zinc-300">{c.attendance} %</span>}
                    <span className="text-[15px] font-semibold text-right tabular-nums flex items-center justify-end gap-1">
                      {c.total} €
                      <ChevronRight className="w-4 h-4 text-zinc-600 -mr-1 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                    </span>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Lateral derecho */}
            <aside className="flex flex-col gap-6">
              <section>
                <h2 className="text-base font-semibold mb-3">Por pasar lista</h2>
                <div className="flex flex-col gap-2">
                  {pending.map((p, i) => (
                    <motion.div key={p.id} {...fadeUp(i, 0.6)} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] px-4 py-3 hover:border-white/15 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{p.cls}</p>
                        <p className="text-xs text-zinc-500 capitalize">{p.day}</p>
                      </div>
                      <motion.button whileTap={{ scale: 0.96 }} className="h-8 px-3 rounded-lg bg-white text-zinc-900 text-xs font-semibold hover:bg-zinc-200 transition-colors">Pasar lista</motion.button>
                    </motion.div>
                  ))}
                </div>
              </section>
              <section className="rounded-2xl border border-white/[0.07] p-5">
                <div className="flex items-baseline justify-between">
                  <h2 className="text-base font-semibold">Ingresos por mes</h2>
                  <span className="text-xs text-zinc-500">últimos 4</span>
                </div>
                <div className="mt-5 flex items-end gap-3 h-32">
                  {incomeTrend.map((p, i) => {
                    const last = i === incomeTrend.length - 1;
                    return (
                      <div key={p.m} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                        <span className={`text-[11px] tabular-nums ${last ? "text-zinc-100" : "text-zinc-500"}`}>{p.v} €</span>
                        <motion.div className={`w-full rounded-md ${last ? "bg-rose-500" : "bg-white/10"}`}
                          initial={{ height: 0 }} animate={{ height: `${(p.v / maxIncome) * 100}%` }}
                          transition={{ delay: 0.7 + i * 0.08, duration: 0.7, ease: EASE }} />
                        <span className="text-xs text-zinc-500">{p.m}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            </aside>
          </div>
        </main>
      </div>

      {/* Navegación inferior en móvil */}
      {mobile && (
        <LayoutGroup id="a-tab">
          <nav className="fixed bottom-0 inset-x-0 border-t border-white/[0.07] bg-[#0b0a0d]/90 backdrop-blur-xl px-2 pt-2 pb-6 grid grid-cols-5">
            {NAV.map(n => {
              const on = active === n.id;
              return (
                <button key={n.id} onClick={() => setActive(n.id)} className={`relative flex flex-col items-center gap-1 py-1.5 text-[10px] font-medium ${on ? "text-white" : "text-zinc-500"}`}>
                  {on && <motion.span layoutId="a-tab-ind" className="absolute -top-2 w-8 h-[3px] rounded-b bg-rose-500" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
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
