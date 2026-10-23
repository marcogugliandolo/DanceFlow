import React, { useState } from "react";
import { motion, LayoutGroup, AnimatePresence } from "motion/react";
import { Home, CheckCircle2, History, Users, ArrowUpRight, ChevronDown, Plus } from "lucide-react";
import { kpis, incomeTrend, classes, pending, month, teacher } from "./data";
import { CountUp, DancersMark, EASE } from "./shared";
import { AsistenciaB, HistorialB, AlumnosB, PerfilB } from "./PagesB";
import { HUE, pop } from "./themeB";

// Propuesta B · "Ritmo": claro, expresivo y con color. Cada clase tiene su propio color
// para reconocerla de un vistazo en toda la app. Tarjetas tipo "bento", tipografía con
// carácter (Bricolage Grotesque) y movimiento con un punto de rebote, como un paso de baile.

const NAV = [
  { id: "inicio", label: "Inicio", icon: Home },
  { id: "asistencia", label: "Asistencia", icon: CheckCircle2 },
  { id: "historial", label: "Historial", icon: History },
  { id: "alumnos", label: "Alumnos", icon: Users },
];

const BigRing: React.FC<{ pct: number }> = ({ pct }) => {
  const size = 132, sw = 14, r = (size - sw) / 2, c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id="b-ring" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#f43f5e" /><stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={sw} stroke="#efedf5" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={sw} strokeLinecap="round" stroke="url(#b-ring)"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct / 100) }}
          transition={{ delay: 0.5, duration: 1.3, ease: EASE }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-bricolage text-[34px] font-bold leading-none tracking-tight"><CountUp value={pct} suffix="%" delay={0.5} /></span>
      </div>
    </div>
  );
};

// Inicio (dashboard)
const HomeB: React.FC<{ mobile?: boolean }> = ({ mobile }) => {
  const maxIncome = Math.max(...incomeTrend.map(p => p.v));
  const card = "rounded-[28px] bg-white border border-[#ebe8f2]";
  return (
    <>
        {/* Saludo */}
        <div className={`flex ${mobile ? "flex-col gap-4" : "items-end justify-between gap-6"}`}>
          <motion.div {...pop(0, 0.1)}>
            <h1 className={`font-bricolage font-bold tracking-[-0.035em] leading-[0.95] ${mobile ? "text-[40px]" : "text-[64px]"}`}>
              Buenas tardes, {teacher}
            </h1>
            <p className={`mt-3 text-[#6b6478] ${mobile ? "text-base" : "text-lg"}`}>
              Llevas {kpis.held} clases y {kpis.income} € este mes. Quedan {pending.length} listas por pasar.
            </p>
          </motion.div>
          <motion.button {...pop(1, 0.1)} whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}
            className="self-start md:self-auto h-12 px-6 rounded-full bg-gradient-to-r from-rose-500 to-violet-500 text-white font-semibold flex items-center gap-2 shadow-[0_12px_30px_-12px_rgba(244,63,94,0.8)]">
            <Plus className="w-5 h-5" /> Registrar clase
          </motion.button>
        </div>

        {/* Bento */}
        <div className={`mt-8 grid gap-4 ${mobile ? "grid-cols-2" : "grid-cols-12"}`}>
          {/* Ingresos */}
          <motion.div {...pop(0, 0.25)} className={`relative overflow-hidden rounded-[28px] bg-[#17131f] text-white p-7 ${mobile ? "col-span-2" : "col-span-6 row-span-2"}`}>
            <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(244,63,94,0.45),transparent_65%)]" aria-hidden />
            <div className="relative flex items-start justify-between">
              <p className="text-sm font-semibold text-white/60">Ingresos de octubre</p>
              <span className="text-xs font-bold text-emerald-300 bg-emerald-400/15 rounded-full px-2.5 py-1 flex items-center gap-1"><ArrowUpRight className="w-3.5 h-3.5" />23 %</span>
            </div>
            <p className={`relative font-bricolage font-bold tracking-[-0.04em] leading-none mt-3 ${mobile ? "text-[64px]" : "text-[96px]"}`}>
              <CountUp value={kpis.income} /><span className="text-white/40 text-[0.5em] ml-1">€</span>
            </p>
            <div className={`relative flex items-end gap-3 ${mobile ? "h-28 mt-6" : "h-40 mt-8"}`}>
              {incomeTrend.map((p, i) => {
                const last = i === incomeTrend.length - 1;
                return (
                  <div key={p.m} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <motion.div className={`w-full rounded-2xl ${last ? "bg-gradient-to-t from-rose-500 to-violet-400" : "bg-white/12"}`}
                      initial={{ height: 0 }} animate={{ height: `${(p.v / maxIncome) * 100}%` }}
                      transition={{ delay: 0.55 + i * 0.09, type: "spring", stiffness: 120, damping: 16 }} />
                    <span className={`text-xs font-semibold ${last ? "text-white" : "text-white/45"}`}>{p.m}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Asistencia */}
          <motion.div {...pop(1, 0.25)} className={`${card} p-6 ${mobile ? "col-span-2 flex items-center gap-5" : "col-span-3 row-span-2 flex flex-col justify-between"}`}>
            {mobile ? (
              <>
                <BigRing pct={kpis.attendance} />
                <div>
                  <p className="text-sm font-semibold text-[#6b6478]">Asistencia media</p>
                  <p className="mt-2 text-sm text-[#6b6478] leading-snug">De cada 10 alumnos inscritos, vienen 7.</p>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-[#6b6478]">Asistencia media</p>
                <div className="self-center my-4"><BigRing pct={kpis.attendance} /></div>
                <p className="text-sm text-[#6b6478] leading-snug">De cada 10 alumnos inscritos, vienen 7.</p>
              </>
            )}
          </motion.div>

          {/* Clases */}
          <motion.div {...pop(2, 0.25)} className={`${card} p-6 ${mobile ? "" : "col-span-3"}`}>
            <p className="text-sm font-semibold text-[#6b6478]">Clases dadas</p>
            <p className="font-bricolage text-[52px] font-bold tracking-[-0.04em] leading-none mt-2"><CountUp value={kpis.held} delay={0.1} /></p>
            <div className="mt-4 flex gap-1">
              {Array.from({ length: kpis.held + kpis.cancelled }).map((_, i) => (
                <motion.span key={i} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.7 + i * 0.03, type: "spring", stiffness: 500, damping: 20 }}
                  className={`flex-1 h-5 rounded-full origin-bottom ${i < kpis.held ? "bg-[#17131f]" : "bg-rose-300"}`} />
              ))}
            </div>
            <p className="mt-2 text-xs text-[#6b6478]">{kpis.cancelled} cancelada</p>
          </motion.div>

          {/* Alumnos */}
          <motion.div {...pop(3, 0.25)} className={`${card} p-6 ${mobile ? "" : "col-span-3"}`}>
            <p className="text-sm font-semibold text-[#6b6478]">Alumnos</p>
            <p className="font-bricolage text-[52px] font-bold tracking-[-0.04em] leading-none mt-2"><CountUp value={kpis.students} delay={0.15} /></p>
            <div className="mt-4 flex -space-x-2">
              {[["C", "bg-teal-400"], ["M", "bg-rose-400"], ["A", "bg-violet-400"], ["L", "bg-amber-400"]].map(([l, c], i) => (
                <motion.span key={l} initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.8 + i * 0.07, type: "spring", stiffness: 420, damping: 14 }}
                  className={`w-9 h-9 rounded-full border-[3px] border-white ${c} text-white text-xs font-bold flex items-center justify-center`}>{l}</motion.span>
              ))}
              <span className="w-9 h-9 rounded-full border-[3px] border-white bg-[#efedf5] text-xs font-bold text-[#6b6478] flex items-center justify-center">+7</span>
            </div>
          </motion.div>

          {/* Pendientes */}
          {!mobile && (
            <motion.div {...pop(4, 0.25)} className={`${card} p-6 col-span-12 flex items-center justify-between gap-6`}>
              <div className="flex items-center gap-3 shrink-0">
                <p className="text-sm font-semibold text-[#6b6478]">Por pasar lista</p>
                <span className="text-xs font-bold text-rose-600 bg-rose-50 rounded-full px-2.5 py-1">{pending.length}</span>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                {pending.map(p => (
                  <motion.button key={p.id} whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}
                    className="h-11 pl-4 pr-2 rounded-full bg-[#f4f3f8] hover:bg-[#ece9f3] text-sm font-semibold flex items-center gap-3 transition-colors">
                    {p.cls} <span className="text-[#6b6478] font-medium capitalize">{p.day}</span>
                    <span className="h-7 px-3 rounded-full bg-[#17131f] text-white text-xs flex items-center">Pasar</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Clases con color propio */}
        <div className="mt-10 flex items-end justify-between">
          <h2 className="font-bricolage text-[28px] font-bold tracking-[-0.03em]">Tus clases</h2>
          <span className="text-sm text-[#6b6478]">{classes.length} activas</span>
        </div>
        <div className={`mt-4 ${mobile ? "flex gap-3 overflow-x-auto -mx-4 px-4 pb-2 snap-x" : "grid grid-cols-4 gap-4"}`}>
          {classes.map((c, i) => {
            const h = HUE[c.hue];
            return (
              <motion.div key={c.id} {...pop(i, 0.7)} whileHover={{ y: -6, rotate: i % 2 ? 0.6 : -0.6 }}
                className={`relative overflow-hidden rounded-[28px] ${h.bg} p-6 cursor-pointer ${mobile ? "min-w-[260px] snap-start" : ""}`}>
                <div className={`absolute -right-6 -top-6 w-28 h-28 rounded-full ${h.soft}`} aria-hidden />
                <div className="relative">
                  <span className={`inline-flex w-11 h-11 rounded-2xl ${h.solid} items-center justify-center`}><DancersMark className="w-7 h-auto text-white" /></span>
                  <p className="mt-5 font-bricolage text-xl font-bold leading-tight tracking-[-0.02em]">{c.name}</p>
                  <p className="text-sm text-[#6b6478] mt-1">{c.place}</p>
                  <p className="mt-6 font-bricolage text-[44px] font-bold tracking-[-0.04em] leading-none"><CountUp value={c.total} delay={0.8 + i * 0.07} /><span className="text-[0.5em] text-[#6b6478] ml-1">€</span></p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex gap-1.5">
                      {c.last.map((ok, k) => <span key={k} className={`w-3 h-3 rounded-full ${ok ? h.solid : "bg-white ring-1 " + h.ring}`} />)}
                    </div>
                    <span className={`text-sm font-bold ${h.ink}`}>{c.attendance}%</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
    </>
  );
};

export const DirectionB: React.FC<{ mobile?: boolean; initialPage?: string; initialSub?: string }> = ({ mobile, initialPage, initialSub }) => {
  const [active, setActive] = useState(initialPage ?? "inicio");

  return (
    <div className="min-h-screen bg-[#f4f3f8] text-[#17131f] font-geist antialiased">
      {/* Barra superior */}
      <header className={`flex items-center justify-between ${mobile ? "px-4 pt-4" : "px-10 pt-6"}`}>
        <motion.div {...pop(0)} className="flex items-center gap-2.5">
          <span className="w-10 h-10 rounded-2xl bg-[#17131f] flex items-center justify-center"><DancersMark className="w-7 h-auto text-white" /></span>
          <span className="font-bricolage text-xl font-bold tracking-tight">SalsaNova</span>
        </motion.div>

        {!mobile && (
          <LayoutGroup id="b-nav">
            <motion.nav {...pop(1)} className="flex items-center gap-1 p-1.5 rounded-full bg-white border border-[#ebe8f2]">
              {NAV.map(n => {
                const on = active === n.id;
                return (
                  <button key={n.id} onClick={() => setActive(n.id)} className={`relative h-10 px-5 rounded-full text-sm font-semibold flex items-center gap-2 transition-colors ${on ? "text-white" : "text-[#6b6478] hover:text-[#17131f]"}`}>
                    {on && <motion.span layoutId="b-bubble" className="absolute inset-0 rounded-full bg-[#17131f]" transition={{ type: "spring", stiffness: 380, damping: 28 }} />}
                    <n.icon className="relative w-4 h-4" /><span className="relative">{n.label}</span>
                  </button>
                );
              })}
            </motion.nav>
          </LayoutGroup>
        )}

        <motion.div {...pop(2)} className="flex items-center gap-2">
          {!mobile && (
            <button className="h-10 px-4 rounded-full bg-white border border-[#ebe8f2] text-sm font-semibold flex items-center gap-1.5 hover:border-[#d9d4e6] transition-colors">
              {month} <ChevronDown className="w-4 h-4 text-[#6b6478]" />
            </button>
          )}
          <button onClick={() => setActive("perfil")} aria-label="Perfil"
            className={`w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-violet-500 text-white flex items-center justify-center text-sm font-bold transition-shadow ${active === "perfil" ? "ring-4 ring-violet-200" : "hover:ring-4 hover:ring-white"}`}>A</button>
        </motion.div>
      </header>

      <main className={mobile ? "px-4 pt-6 pb-32" : "px-10 pt-10 pb-12 max-w-[1360px] mx-auto"}>
        <AnimatePresence mode="wait">
          <motion.div key={active}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: EASE }}>
            {active === "inicio" ? <HomeB mobile={mobile} />
              : active === "asistencia" ? <AsistenciaB mobile={mobile} initialSub={initialSub} />
              : active === "historial" ? <HistorialB mobile={mobile} />
              : active === "alumnos" ? <AlumnosB mobile={mobile} />
              : <PerfilB mobile={mobile} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navegación flotante en móvil */}
      {mobile && (
        <LayoutGroup id="b-tab">
          <nav className="fixed bottom-5 inset-x-4 h-16 rounded-full bg-[#17131f] px-2 flex items-center justify-between shadow-[0_20px_40px_-16px_rgba(23,19,31,0.6)]">
            {NAV.map(n => {
              const on = active === n.id;
              return (
                <button key={n.id} aria-label={n.label} onClick={() => setActive(n.id)} className={`relative h-12 rounded-full flex items-center justify-center gap-2 text-sm font-semibold ${on ? "px-4 text-[#17131f]" : "w-12 text-white/60"}`}>
                  {on && <motion.span layoutId="b-tab-bubble" className="absolute inset-0 rounded-full bg-white" transition={{ type: "spring", stiffness: 380, damping: 28 }} />}
                  <n.icon className="relative w-5 h-5" />{on && <span className="relative">{n.label}</span>}
                </button>
              );
            })}
          </nav>
        </LayoutGroup>
      )}
    </div>
  );
};
