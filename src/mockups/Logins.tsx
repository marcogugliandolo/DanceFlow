import React, { useState } from "react";
import { motion } from "motion/react";
import { Eye, EyeOff } from "lucide-react";
import { DANCERS_PATH, DANCERS_VIEWBOX } from "../assets/dancers";
import { EASE } from "./shared";

const GoogleIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" aria-hidden>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const item = (i: number, base: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: base + i * 0.06, duration: 0.5, ease: EASE },
});

// ---------- Login A · "Escenario" ----------
// Oscuro y sobrio. La pareja del logo se dibuja con una línea y se rellena; el resto entra en cascada.
export const LoginA: React.FC = () => {
  const [show, setShow] = useState(false);
  const input = "w-full h-11 px-3.5 rounded-[10px] bg-white/[0.04] border border-white/[0.09] text-[15px] text-white placeholder:text-zinc-600 outline-none focus:border-rose-500/70 focus:ring-4 focus:ring-rose-500/15 transition";
  return (
    <div className="dark min-h-screen bg-[#0b0a0d] text-zinc-100 font-geist antialiased relative overflow-hidden flex items-center justify-center px-5">
      {/* Rejilla tenue que se desvanece hacia los bordes */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" aria-hidden />
      <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[85%] w-[520px] h-[520px] rounded-full bg-[radial-gradient(circle,rgba(244,63,94,0.18),transparent_60%)]"
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.4, ease: EASE }} aria-hidden />

      <div className="relative w-full max-w-[360px]">
        <svg viewBox={DANCERS_VIEWBOX} className="w-[150px] h-auto mx-auto" aria-label="SalsaNova">
          <motion.path d={DANCERS_PATH} fillRule="evenodd" fill="#fafafa"
            initial={{ fillOpacity: 0 }} animate={{ fillOpacity: 1 }} transition={{ delay: 1.5, duration: 0.7 }} />
          <motion.path d={DANCERS_PATH} fill="none" stroke="#f43f5e" strokeWidth={7} strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 1 }} animate={{ pathLength: 1, opacity: [1, 1, 0] }}
            transition={{ pathLength: { delay: 0.2, duration: 1.5, ease: [0.65, 0, 0.35, 1] }, opacity: { delay: 0.2, duration: 2.3, times: [0, 0.75, 1] } }} />
        </svg>

        <motion.h1 {...item(0, 0.9)} className="mt-6 text-center text-[24px] font-semibold tracking-[-0.02em]">Entra en SalsaNova</motion.h1>
        <motion.p {...item(1, 0.9)} className="mt-1.5 text-center text-sm text-zinc-500">Tu panel de clases, asistencia y facturación.</motion.p>

        <form className="mt-8 flex flex-col gap-3" onSubmit={e => e.preventDefault()}>
          <motion.label {...item(2, 0.9)} className="block">
            <span className="text-[13px] font-medium text-zinc-400">Usuario o correo</span>
            <input className={`${input} mt-1.5`} autoComplete="username" />
          </motion.label>
          <motion.label {...item(3, 0.9)} className="block">
            <span className="text-[13px] font-medium text-zinc-400">Contraseña</span>
            <span className="relative block mt-1.5">
              <input type={show ? "text" : "password"} className={`${input} pr-11`} autoComplete="current-password" />
              <button type="button" onClick={() => setShow(s => !s)} aria-label="Mostrar contraseña" className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-zinc-500 hover:text-zinc-200">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </span>
          </motion.label>
          <motion.button {...item(4, 0.9)} whileTap={{ scale: 0.98 }} className="mt-2 h-11 rounded-[10px] bg-rose-500 hover:bg-rose-400 text-white text-[15px] font-semibold transition-colors">Entrar</motion.button>
          <motion.div {...item(5, 0.9)} className="flex items-center gap-3 my-1 text-xs text-zinc-600"><span className="h-px flex-1 bg-white/[0.07]" />o<span className="h-px flex-1 bg-white/[0.07]" /></motion.div>
          <motion.button {...item(6, 0.9)} type="button" whileTap={{ scale: 0.98 }} className="h-11 rounded-[10px] border border-white/[0.09] hover:bg-white/[0.04] text-[15px] font-medium flex items-center justify-center gap-2.5 transition-colors"><GoogleIcon /> Entrar con Google</motion.button>
        </form>
        <motion.p {...item(7, 0.9)} className="mt-8 text-center text-xs text-zinc-600">¿No puedes entrar? Pide a quien administra SalsaNova que revise tu cuenta.</motion.p>
      </div>
    </div>
  );
};

// ---------- Login B · "Ritmo" ----------
// Una sola escena clara. Formas con los colores de las clases que entran "bailando" con rebote
// y luego flotan muy despacio alrededor del formulario.
const SHAPES = [
  { c: "bg-rose-400", w: 150, h: 150, r: "rounded-full", x: "-3%", y: "8%", d: 0.1 },
  { c: "bg-violet-400", w: 230, h: 100, r: "rounded-full", x: "74%", y: "6%", d: 0.2 },
  { c: "bg-amber-300", w: 120, h: 120, r: "rounded-[38px]", x: "82%", y: "62%", d: 0.3 },
  { c: "bg-teal-300", w: 190, h: 190, r: "rounded-full", x: "6%", y: "70%", d: 0.4 },
  { c: "bg-rose-300", w: 64, h: 64, r: "rounded-full", x: "64%", y: "84%", d: 0.5 },
];

export const LoginB: React.FC<{ mobile?: boolean }> = ({ mobile }) => {
  const [show, setShow] = useState(false);
  const input = "w-full h-12 px-4 rounded-2xl bg-[#f4f3f8] border border-transparent text-[15px] text-[#17131f] placeholder:text-[#a49fb1] outline-none focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-500/15 transition";
  const k = mobile ? 0.55 : 1;
  return (
    <div className="min-h-screen bg-[#f4f3f8] text-[#17131f] font-geist antialiased relative overflow-hidden flex flex-col items-center justify-center px-5 py-10">
      {SHAPES.map((s, i) => (
        <motion.div key={i} className={`absolute ${s.c} ${s.r} opacity-90`} aria-hidden
          style={{ width: s.w * k, height: s.h * k, left: s.x, top: s.y }}
          initial={{ scale: 0, rotate: -40 }}
          animate={{ scale: 1, rotate: 0, y: [0, -12, 0] }}
          transition={{ scale: { delay: s.d, type: "spring", stiffness: 220, damping: 11 }, rotate: { delay: s.d, type: "spring", stiffness: 220, damping: 11 }, y: { delay: 1.2 + i * 0.3, duration: 4 + i, repeat: Infinity, ease: "easeInOut" } }} />
      ))}

      <div className="relative w-full max-w-[400px] flex flex-col items-center">
        <motion.svg viewBox={DANCERS_VIEWBOX} className={mobile ? "w-[110px]" : "w-[140px]"} initial={{ opacity: 0, y: 16, rotate: -6 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ delay: 0.45, type: "spring", stiffness: 200, damping: 14 }} aria-label="SalsaNova">
          <path d={DANCERS_PATH} fillRule="evenodd" fill="#17131f" />
        </motion.svg>
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, type: "spring", stiffness: 200, damping: 18 }}
          className={`mt-4 text-center font-bricolage font-bold tracking-[-0.045em] leading-[0.92] ${mobile ? "text-[40px]" : "text-[56px]"}`}>
          Tu escuela,<br />al ritmo.
        </motion.h1>

        <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.75, type: "spring", stiffness: 200, damping: 20 }}
          className="mt-8 w-full rounded-[28px] bg-white/85 backdrop-blur-xl border border-white p-6 sm:p-7 shadow-[0_30px_60px_-30px_rgba(23,19,31,0.35)]">
          <form className="flex flex-col gap-3" onSubmit={e => e.preventDefault()}>
            <motion.input {...item(0, 0.95)} placeholder="Usuario o correo" aria-label="Usuario o correo" className={input} autoComplete="username" />
            <motion.span {...item(1, 0.95)} className="relative block">
              <input type={show ? "text" : "password"} placeholder="Contraseña" aria-label="Contraseña" className={`${input} pr-12`} autoComplete="current-password" />
              <button type="button" onClick={() => setShow(s => !s)} aria-label="Mostrar contraseña" className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-[#a49fb1] hover:text-[#17131f]">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </motion.span>
            <motion.button {...item(2, 0.95)} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
              className="mt-1 h-12 rounded-full bg-gradient-to-r from-rose-500 to-violet-500 text-white font-semibold shadow-[0_12px_30px_-12px_rgba(244,63,94,0.8)]">Entrar</motion.button>
            <motion.button {...item(3, 0.95)} type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
              className="h-12 rounded-full bg-white border border-[#ebe8f2] font-semibold flex items-center justify-center gap-2.5"><GoogleIcon /> Entrar con Google</motion.button>
          </form>
        </motion.div>
        <motion.p {...item(4, 0.95)} className="mt-5 text-center text-xs text-[#6b6478]">¿No puedes entrar? Pide a quien administra SalsaNova que revise tu cuenta.</motion.p>
      </div>
    </div>
  );
};
