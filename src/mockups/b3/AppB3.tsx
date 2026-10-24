import React, { useState } from "react";
import { motion, LayoutGroup, AnimatePresence } from "motion/react";
import { Home, CheckCircle2, History, Users, ChevronDown, Plus, ArrowUpRight } from "lucide-react";
import { kpis, incomeTrend, classes, pending, month, teacher, students } from "../data";
import { CountUp, DancersMark, EASE } from "../shared";
import { HUE_OF, hueBg, hueSoft, hueInk, hueColor, type Hue } from "../b2/tokens";
import { pop, STYLE } from "./motion";
import { AsistenciaB3, HistorialB3, AlumnosB3, PerfilB3 } from "./PagesB3";

// Estilo B3 · intermedio entre la primera versión (mosaico, números grandes, color por clase,
// rebote) y la depurada (paleta propia, modo oscuro, sin manchas ni degradados de relleno).

const NAV = [
  { id: "inicio", label: "Inicio", icon: Home },
  { id: "asistencia", label: "Asistencia", icon: CheckCircle2 },
  { id: "historial", label: "Historial", icon: History },
  { id: "alumnos", label: "Alumnos", icon: Users },
];

export const AppB3: React.FC<{ mobile?: boolean; initialPage?: string; initialSub?: string; initialDark?: boolean }> = ({ mobile, initialPage, initialSub, initialDark }) => {
  const [active, setActive] = useState(initialPage ?? "inicio");
  const [dark, setDark] = useState(!!initialDark);

  return (
    <div className={`b2 ${dark ? "dark" : ""} min-h-screen font-geist antialiased`}>
      <header className={`flex items-center justify-between ${mobile ? "px-4 pt-4" : "px-10 pt-6"}`}>
        <motion.div {...pop(0)} className="flex items-center gap-2.5">
          <span className="w-10 h-10 rounded-[14px] bg-[var(--ink)] flex items-center justify-center"><DancersMark className="w-7 h-auto text-[var(--on-ink)]" /></span>
          <span className="font-bricolage text-[21px] font-bold tracking-[-0.02em]">SalsaNova</span>
        </motion.div>

        {!mobile && (
          <LayoutGroup id="b3-nav">
            <motion.nav {...pop(1)} className="flex items-center gap-1 p-1.5 rounded-full bg-[var(--surface)] border border-[var(--line)]">
              {NAV.map(n => {
                const on = active === n.id;
                return (
                  <button key={n.id} onClick={() => setActive(n.id)}
                    className={`relative h-10 px-5 rounded-full text-sm font-semibold flex items-center gap-2 ${on ? "text-[var(--on-ink)]" : "text-[var(--muted)] hover:text-[var(--ink)]"}`}>
                    {on && <motion.span layoutId="b3-bubble" className="absolute inset-0 rounded-full bg-[var(--ink)]" transition={{ type: "spring", stiffness: 380, damping: 30 }} />}
                    <n.icon className="relative w-4 h-4" /><span className="relative">{n.label}</span>
                  </button>
                );
              })}
            </motion.nav>
          </LayoutGroup>
        )}

        <motion.div {...pop(2)} className="flex items-center gap-2">
          {!mobile && (
            <button className="h-10 px-4 rounded-full bg-[var(--surface)] border border-[var(--line)] text-sm font-semibold flex items-center gap-1.5 hover:border-[var(--line-strong)]">
              {month} <ChevronDown className="w-4 h-4 text-[var(--muted)]" />
            </button>
          )}
          <button onClick={() => setActive("perfil")} aria-label="Perfil"
            className={`w-10 h-10 rounded-full bg-[var(--brand)] text-[var(--on-brand)] font-bricolage font-bold flex items-center justify-center ${active === "perfil" ? "ring-4 ring-[var(--brand-soft)]" : "hover:ring-4 hover:ring-[var(--brand-soft)]"}`}>A</button>
        </motion.div>
      </header>

      <main className={mobile ? "px-4 pt-7 pb-32" : "px-10 pt-10 pb-14 max-w-[1320px] mx-auto"}>
        <AnimatePresence mode="wait">
          <motion.div key={active} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.26, ease: EASE }}>
            {active === "inicio" ? <HomeB3 mobile={mobile} />
              : active === "asistencia" ? <AsistenciaB3 mobile={mobile} initialSub={initialSub} />
              : active === "historial" ? <HistorialB3 mobile={mobile} />
              : active === "alumnos" ? <AlumnosB3 mobile={mobile} />
              : <PerfilB3 mobile={mobile} dark={dark} onToggleDark={() => setDark(d => !d)} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Menú flotante en móvil, con la burbuja que se desliza */}
      {mobile && (
        <LayoutGroup id="b3-tab">
          <nav className="fixed bottom-5 inset-x-4 h-16 rounded-full bg-[var(--feature)] dark:border dark:border-[var(--line-strong)] px-2 flex items-center justify-between shadow-[0_18px_40px_-18px_rgba(25,22,30,0.6)]">
            {NAV.map(n => {
              const on = active === n.id;
              return (
                <button key={n.id} aria-label={n.label} onClick={() => setActive(n.id)}
                  className={`relative h-12 rounded-full flex items-center justify-center gap-2 text-sm font-semibold ${on ? "px-4 text-[var(--feature)]" : "w-12 text-[var(--feature-muted)]"}`}>
                  {on && <motion.span layoutId="b3-tab-bubble" className="absolute inset-0 rounded-full bg-[var(--on-feature)]" transition={{ type: "spring", stiffness: 380, damping: 30 }} />}
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

// Anillo de asistencia con el color de la marca
export const BigRing: React.FC<{ pct: number; size?: number; color?: string; sw?: number; delay?: number }> = ({ pct, size = 148, color = "var(--brand)", sw = 14, delay = 0.45 }) => {
  const r = (size - sw) / 2, c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={sw} style={{ stroke: "var(--fill)" }} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={sw} strokeLinecap="round" style={{ stroke: color }}
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct / 100) }}
          transition={{ delay, duration: 1.2, ease: EASE }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-bricolage font-bold leading-none tracking-[-0.03em]" style={{ fontSize: size * 0.24 }}>
          <CountUp value={pct} delay={delay} /><span className="text-[0.5em] text-[var(--muted)]"> %</span>
        </span>
      </div>
    </div>
  );
};

const initials = (n: string) => n.split(" ").filter(w => /^[A-ZÁÉÍÓÚÑ]/.test(w)).slice(0, 2).map(w => w[0]).join("");

// ---------- Inicio ----------
const HomeB3: React.FC<{ mobile?: boolean }> = ({ mobile }) => {
  const max = Math.max(...incomeTrend.map(p => p.v));
  const prev = incomeTrend[incomeTrend.length - 2].v;
  const growth = Math.round(((kpis.income - prev) / prev) * 100);
  const card = "rounded-[28px] bg-[var(--surface)] border border-[var(--line)] shadow-lift";
  const label = "text-sm font-semibold text-[var(--muted)]";

  return (
    <>
      {/* Saludo */}
      <div className={`flex ${mobile ? "flex-col gap-5" : "items-end justify-between gap-8"}`}>
        <motion.div {...pop(0, 0.05)}>
          <p className="text-[15px] font-medium text-[var(--muted)]">Jueves, 22 de octubre</p>
          <h1 className={`mt-1.5 font-bricolage font-bold tracking-[-0.04em] leading-[0.95] ${mobile ? "text-[42px]" : "text-[68px]"}`}>
            Buenas tardes, {teacher}
          </h1>
          <p className={`mt-3 text-[var(--muted)] ${mobile ? "text-[15px]" : "text-lg"}`}>
            Llevas {kpis.held} clases y {kpis.income} € este mes. Te quedan <span className="font-semibold text-[var(--ink)]">{pending.length} listas</span> por pasar.
          </p>
        </motion.div>
        <motion.button {...pop(1, 0.05)} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
          className="self-start h-12 px-6 rounded-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-[var(--on-brand)] font-semibold flex items-center gap-2 shadow-brand">
          <Plus className="w-5 h-5" /> Registrar clase
        </motion.button>
      </div>

      {/* Mosaico */}
      <div className={`mt-9 grid gap-4 ${mobile ? "grid-cols-2" : "grid-cols-12"}`}>
        {/* Ingresos */}
        <motion.section {...pop(0, 0.15)} className={`rounded-[28px] bg-[var(--feature)] text-[var(--on-feature)] flex flex-col ${mobile ? "col-span-2 p-6" : "col-span-6 row-span-2 p-8"}`}>
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold text-[var(--feature-muted)]">Ingresos de octubre</p>
            <span className="text-xs font-bold text-[#7ee0ae] bg-[rgba(76,195,138,0.16)] rounded-full pl-2 pr-2.5 py-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> {growth} %{mobile ? "" : " más que en septiembre"}
            </span>
          </div>
          <p className={`mt-3 font-bricolage font-bold tracking-[-0.05em] leading-none ${mobile ? "text-[64px]" : "text-[100px]"}`}>
            <CountUp value={kpis.income} /><span className="text-[0.42em] font-semibold text-[var(--feature-muted)] ml-1.5">€</span>
          </p>
          <div className={`mt-auto grid grid-cols-4 gap-3 items-end ${mobile ? "pt-6 h-36" : "pt-8 h-52"}`}>
            {incomeTrend.map((p, i) => {
              const last = i === incomeTrend.length - 1;
              return (
                <div key={p.m} className="h-full flex flex-col justify-end">
                  <span className={`mb-1.5 text-xs tabular-nums ${last ? "font-semibold" : "text-[var(--feature-muted)]"}`}>{p.v} €</span>
                  <motion.div className="w-full max-w-[96px] rounded-[12px]" style={{ backgroundColor: last ? "var(--brand)" : "var(--feature-track)" }}
                    initial={{ height: 0 }} animate={{ height: `${(p.v / max) * 74}%` }}
                    transition={{ delay: 0.5 + i * 0.08, type: "spring", stiffness: 120, damping: 17 }} />
                  <span className={`mt-2 text-xs font-semibold ${last ? "" : "text-[var(--feature-muted)]"}`}>{p.m}</span>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* Asistencia */}
        <motion.section {...pop(1, 0.15)} className={`${card} p-6 flex flex-col ${mobile ? "col-span-2" : "col-span-3 row-span-2"}`}>
          <p className={label}>Asistencia media</p>
          <div className={mobile ? "mt-4 flex items-center gap-5" : "mt-5 flex flex-col items-center text-center"}>
            <BigRing pct={kpis.attendance} size={mobile ? 112 : 150} />
            <p className={`text-sm text-[var(--muted)] leading-snug ${mobile ? "" : "mt-4 max-w-[200px]"}`}>De cada 10 alumnos inscritos, vienen 7.</p>
          </div>
          <ul className="mt-auto pt-5 flex flex-col gap-2">
            {classes.map(c => {
              const h: Hue = HUE_OF[c.id];
              return (
                <li key={c.id} className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full" style={hueBg(h)} />
                  <span className="flex-1 truncate">{STYLE[c.id]}</span>
                  <span className="font-semibold tabular-nums" style={hueInk(h)}>{c.attendance} %</span>
                </li>
              );
            })}
          </ul>
        </motion.section>

        {/* Clases dadas */}
        <motion.section {...pop(2, 0.15)} className={`${card} ${mobile ? "p-5" : "p-6 col-span-3"}`}>
          <p className={label}>Clases dadas</p>
          <p className={`mt-2 font-bricolage font-bold tracking-[-0.04em] leading-none ${mobile ? "text-[44px]" : "text-[56px]"}`}><CountUp value={kpis.held} delay={0.1} /></p>
          <div className="mt-4 flex gap-1">
            {Array.from({ length: kpis.held + kpis.cancelled }).map((_, i) => (
              <motion.span key={i} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.6 + i * 0.03, type: "spring", stiffness: 500, damping: 22 }}
                className="flex-1 h-5 rounded-full origin-bottom"
                style={i < kpis.held ? { backgroundColor: "var(--ink)" } : { backgroundImage: "repeating-linear-gradient(135deg, var(--line-strong) 0 2px, transparent 2px 5px)" }} />
            ))}
          </div>
          <p className="mt-2 text-xs text-[var(--muted)]">y {kpis.cancelled} cancelada</p>
        </motion.section>

        {/* Alumnos */}
        <motion.section {...pop(3, 0.15)} className={`${card} ${mobile ? "p-5" : "p-6 col-span-3"}`}>
          <p className={label}>Alumnos</p>
          <p className={`mt-2 font-bricolage font-bold tracking-[-0.04em] leading-none ${mobile ? "text-[44px]" : "text-[56px]"}`}><CountUp value={kpis.students} delay={0.15} /></p>
          <div className="mt-4 flex -space-x-2">
            {students.slice(0, mobile ? 3 : 4).map((s, i) => {
              const h: Hue = HUE_OF[s.classes[0]];
              return (
                <motion.span key={s.id} initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.75 + i * 0.07, type: "spring", stiffness: 420, damping: 15 }}
                  className="w-9 h-9 rounded-full border-[3px] border-[var(--surface)] text-[11px] font-bold flex items-center justify-center" style={{ ...hueSoft(h), ...hueInk(h) }}>{initials(s.name)}</motion.span>
              );
            })}
            <span className="w-9 h-9 rounded-full border-[3px] border-[var(--surface)] bg-[var(--fill)] text-[11px] font-bold text-[var(--muted)] flex items-center justify-center">+{students.length - (mobile ? 3 : 4)}</span>
          </div>
        </motion.section>

        {/* Por pasar lista */}
        <motion.section {...pop(4, 0.15)} className={`${card} ${mobile ? "col-span-2 p-5" : "col-span-12 py-4 pl-6 pr-4 flex items-center justify-between gap-6"}`}>
          <div className="flex items-center gap-2.5 shrink-0">
            <p className="text-[15px] font-semibold">Por pasar lista</p>
            <span className="min-w-6 h-6 px-2 rounded-full text-xs font-bold flex items-center justify-center bg-[var(--brand-soft)] text-[var(--brand)]">{pending.length}</span>
          </div>
          <div className={mobile ? "mt-4 flex flex-col gap-2" : "flex flex-wrap justify-end gap-2"}>
            {pending.map(p => {
              const h: Hue = HUE_OF[classes.find(c => c.name === p.cls)!.id];
              return (
                <motion.button key={p.id} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                  className={`h-12 pl-4 pr-1.5 rounded-full bg-[var(--fill)] hover:bg-[var(--line)] text-sm font-semibold flex items-center gap-3 ${mobile ? "justify-between" : ""}`}>
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={hueBg(h)} />
                    <span className="truncate">{p.cls}</span>
                    <span className="font-medium text-[var(--muted)] capitalize shrink-0">{p.day}</span>
                  </span>
                  <span className="h-9 px-4 rounded-full bg-[var(--ink)] text-[var(--on-ink)] text-[13px] flex items-center shrink-0">{mobile ? "Pasar" : "Pasar lista"}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.section>
      </div>

      {/* Tus clases: cada una con su color */}
      <motion.div {...pop(0, 0.45)} className="mt-12 flex items-end justify-between">
        <h2 className={`font-bricolage font-bold tracking-[-0.03em] ${mobile ? "text-[26px]" : "text-[32px]"}`}>Tus clases</h2>
        <span className="text-sm text-[var(--muted)]">{classes.length} activas en octubre</span>
      </motion.div>
      <div className={`mt-4 ${mobile ? "flex gap-3 overflow-x-auto -mx-4 px-4 pb-2 snap-x snap-mandatory" : "grid grid-cols-4 gap-4"}`}>
        {classes.map((c, i) => {
          const h: Hue = HUE_OF[c.id];
          return (
            <motion.article key={c.id} {...pop(i, 0.55)} whileHover={{ y: -5 }}
              className={`rounded-[28px] p-6 cursor-pointer flex flex-col ${mobile ? "min-w-[268px] snap-start" : ""}`} style={hueSoft(h)}>
              <div className="flex items-center justify-between gap-2">
                <span className="h-7 pl-2.5 pr-3 rounded-full bg-[var(--surface)] text-xs font-bold flex items-center gap-1.5" style={hueInk(h)}>
                  <span className="w-2 h-2 rounded-full" style={hueBg(h)} />{STYLE[c.id]}
                </span>
                <span className="text-xs font-semibold" style={hueInk(h)}>{c.price}</span>
              </div>
              <p className="mt-6 font-bricolage text-[21px] font-bold leading-tight tracking-[-0.02em]">{c.name}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{c.place}</p>
              <p className="mt-6 font-bricolage text-[50px] font-bold tracking-[-0.045em] leading-none" style={hueInk(h)}>
                <CountUp value={c.total} delay={0.7 + i * 0.06} /><span className="text-[0.44em] ml-1">€</span>
              </p>
              <div className="mt-5 pt-4 flex items-center justify-between gap-3 border-t" style={{ borderColor: `color-mix(in srgb, ${hueColor(h)} 22%, transparent)` }}>
                <span className="text-[13px] text-[var(--muted)]">{c.sessions} clases, {c.students} alumnos</span>
                <span className="text-sm font-bold tabular-nums" style={hueInk(h)}>{c.attendance} %</span>
              </div>
            </motion.article>
          );
        })}
      </div>
    </>
  );
};
