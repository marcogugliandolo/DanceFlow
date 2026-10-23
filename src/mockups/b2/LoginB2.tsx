import React, { useState } from "react";
import { motion } from "motion/react";
import { Eye, EyeOff, Moon, Sun } from "lucide-react";
import { DANCERS_PATH, DANCERS_VIEWBOX } from "../../assets/dancers";
import { enter, hueBg, type Hue } from "./tokens";
import { Stripe } from "./AppB2";

const GoogleIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" aria-hidden>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

// Login del estilo B v2: una sola escena tranquila. La pareja del logo se dibuja con una línea
// del color de la marca y se rellena; debajo, los estilos de la escuela con su color.
export const LoginB2: React.FC<{ initialDark?: boolean }> = ({ initialDark }) => {
  const [dark, setDark] = useState(!!initialDark);
  const [show, setShow] = useState(false);
  const input = "w-full h-12 px-3.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-[15px] outline-none focus:border-[var(--ink)] focus:ring-4 focus:ring-[var(--fill)]";
  return (
    <div className={`b2 ${dark ? "dark" : ""} min-h-screen font-geist antialiased flex flex-col`}>
      <Stripe />
      <div className="flex justify-end px-5 pt-4">
        <button onClick={() => setDark(d => !d)} aria-label={dark ? "Usar tema claro" : "Usar tema oscuro"} className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--muted)] hover:bg-[var(--fill)] hover:text-[var(--ink)]">
          {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center px-5 pb-12">
        <div className="w-full max-w-[380px]">
          <svg viewBox={DANCERS_VIEWBOX} className="w-[120px] h-auto" aria-label="SalsaNova">
            <motion.path d={DANCERS_PATH} fillRule="evenodd" style={{ fill: "var(--ink)" }}
              initial={{ fillOpacity: 0 }} animate={{ fillOpacity: 1 }} transition={{ delay: 1.2, duration: 0.6 }} />
            <motion.path d={DANCERS_PATH} fill="none" style={{ stroke: "var(--brand)" }} strokeWidth={9} strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 1 }} animate={{ pathLength: 1, opacity: [1, 1, 0] }}
              transition={{ pathLength: { delay: 0.15, duration: 1.3, ease: [0.65, 0, 0.35, 1] }, opacity: { delay: 0.15, duration: 2.0, times: [0, 0.75, 1] } }} />
          </svg>
          <motion.h1 {...enter(0, 0.6)} className="mt-6 font-bricolage text-[40px] font-bold tracking-[-0.035em] leading-none">SalsaNova</motion.h1>
          <motion.p {...enter(1, 0.6)} className="mt-2 text-[15px] text-[var(--muted)]">Escuela de Baile en Betanzos. Entra para pasar lista y ver tus clases.</motion.p>

          <form className="mt-8 flex flex-col gap-4" onSubmit={e => e.preventDefault()}>
            <motion.label {...enter(2, 0.6)} className="block">
              <span className="text-sm font-semibold">Usuario o correo</span>
              <input className={`${input} mt-1.5`} autoComplete="username" />
            </motion.label>
            <motion.label {...enter(3, 0.6)} className="block">
              <span className="text-sm font-semibold">Contraseña</span>
              <span className="relative block mt-1.5">
                <input type={show ? "text" : "password"} className={`${input} pr-11`} autoComplete="current-password" />
                <button type="button" onClick={() => setShow(s => !s)} aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-[var(--muted)] hover:text-[var(--ink)]">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </span>
            </motion.label>
            <motion.button {...enter(4, 0.6)} whileTap={{ scale: 0.98 }} className="mt-1 h-12 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-[var(--on-brand)] font-semibold">Entrar</motion.button>
            <motion.button {...enter(5, 0.6)} type="button" whileTap={{ scale: 0.98 }} className="h-12 rounded-xl border border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-strong)] font-semibold flex items-center justify-center gap-2.5"><GoogleIcon /> Entrar con Google</motion.button>
          </form>

          <motion.ul {...enter(6, 0.6)} className="mt-10 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-[var(--muted)]">
            {([["salon", "Salón"], ["bachata", "Bachata"], ["danzas", "Danzas"], ["pilates", "Pilates"]] as [Hue, string][]).map(([h, l]) => (
              <li key={h} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={hueBg(h)} />{l}</li>
            ))}
          </motion.ul>
          <motion.p {...enter(7, 0.6)} className="mt-3 text-[13px] text-[var(--muted)]">¿No puedes entrar? Pide a quien administra SalsaNova que revise tu cuenta.</motion.p>
        </div>
      </div>
    </div>
  );
};
