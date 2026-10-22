import React, { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion, useAnimationControls } from "motion/react";
import { Eye, EyeOff, Sun, Moon, AlertCircle, Loader2 } from "lucide-react";

type LoginScreenProps = {
  username: string;
  setUsername: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoggingIn: boolean;
  loginError: boolean;
  onGoogle: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  logoSrc: string;
};

// ---------- Escenario de baile ----------
// Un único foco suave que cae desde arriba sobre el logo. Solo aparece al cargar; no se mueve.
const SoftSpotlight: React.FC = () => {
  const reduce = useReducedMotion();
  return (
    <div className="absolute inset-x-0 top-0 h-[78%] flex justify-center pointer-events-none" aria-hidden>
      <motion.div
        className="h-full w-[460px] sm:w-[560px]"
        style={{
          background: "linear-gradient(to bottom, rgba(255,255,255,0.13), rgba(244,63,94,0.07) 60%, transparent 95%)",
          clipPath: "polygon(43% 0, 57% 0, 100% 100%, 0 100%)",
          filter: "blur(14px)",
        }}
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
      />
    </div>
  );
};

// Logo de la escuela (blanco sobre transparente) directamente sobre el escenario,
// bajo el foco y con el reflejo de luz en el suelo
const StageLogo: React.FC<{ logoSrc: string }> = ({ logoSrc }) => {
  const reduce = useReducedMotion();
  return (
    <div className="relative flex flex-col items-center">
      <motion.img
        src={logoSrc}
        alt="Escuela de Baile SalsaNova"
        draggable={false}
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="w-[230px] sm:w-[320px] lg:w-[380px] xl:w-[420px] h-auto select-none drop-shadow-[0_0_28px_rgba(255,255,255,0.12)]"
      />
      <div
        className="w-[280px] sm:w-[360px] lg:w-[420px] h-5 sm:h-7 mt-2 sm:mt-3 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(244,63,94,0.32),transparent_70%)] blur-[6px]"
        aria-hidden
      />
    </div>
  );
};

// Estilos de baile de la escuela, en una línea discreta
const DANCE_STYLES = ["Salsa", "Bachata", "Salón", "Kizomba", "Pilates"];

const StyleList: React.FC<{ className?: string }> = ({ className = "" }) => (
  <ul className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm font-medium text-zinc-500 ${className}`} aria-label="Estilos de baile">
    {DANCE_STYLES.map((s, i) => (
      <li key={s} className="flex items-center gap-3">
        {i > 0 && <span className="w-1 h-1 rounded-full bg-rose-500/70" aria-hidden />}
        {s}
      </li>
    ))}
  </ul>
);

const Wordmark: React.FC<{ logoSrc: string; tone: "stage" | "auto"; showLogo?: boolean }> = ({ logoSrc, tone, showLogo = true }) => (
  <div className="flex items-center gap-3 min-h-10">
    <span className={`${showLogo ? "flex" : "hidden"} w-10 h-10 rounded-full bg-zinc-900 ring-1 ring-white/10 overflow-hidden items-center justify-center shrink-0`}>
      <img src={logoSrc} alt="" className="w-full h-full object-contain p-1.5" />
    </span>
    <span className={`text-xl font-black tracking-tight ${tone === "stage" ? "text-white" : "text-zinc-900 dark:text-white"}`}>
      Salsa<span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-fuchsia-500">Nova</span>
    </span>
  </div>
);

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

export const LoginScreen: React.FC<LoginScreenProps> = ({
  username, setUsername, password, setPassword, onSubmit, isLoggingIn, loginError,
  onGoogle, isDarkMode, onToggleTheme, logoSrc,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const reduce = useReducedMotion();
  const shake = useAnimationControls();

  // Al fallar, el formulario hace un pequeño "no" con la cabeza
  useEffect(() => {
    if (loginError && !reduce) shake.start({ x: [0, -8, 7, -5, 3, 0], transition: { duration: 0.36 } });
  }, [loginError]);

  const field =
    "w-full h-12 px-4 rounded-xl bg-white dark:bg-zinc-900 border text-[15px] font-medium text-zinc-900 dark:text-zinc-100 " +
    "placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none transition-[border-color,box-shadow] " +
    "focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15";
  const fieldBorder = loginError ? "border-rose-400 dark:border-rose-500/60" : "border-zinc-300 dark:border-zinc-800";

  return (
    <div className="min-h-[100dvh] flex flex-col lg:grid lg:grid-cols-[1.05fr_1fr] bg-white dark:bg-[#09090b] font-sans selection:bg-rose-500/30">
      {/* Escenario de baile: siempre oscuro. Panel izquierdo en ordenador; cabecera en tablet y móvil */}
      <section className="relative isolate overflow-hidden flex flex-col bg-black text-white pt-5 sm:pt-8 lg:pt-12 pb-7 sm:pb-10 lg:pb-12 rounded-b-[28px] sm:rounded-b-[36px] lg:rounded-none border-b border-white/5 lg:border-b-0 lg:border-r">
        <div className="absolute inset-0 -z-10" aria-hidden>
          <SoftSpotlight />
        </div>

        <div className="px-5 sm:px-10 lg:px-14 xl:px-20 flex items-center justify-end lg:hidden">
          <button
            onClick={onToggleTheme}
            aria-label={isDarkMode ? "Usar tema claro" : "Usar tema oscuro"}
            className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center px-5 sm:px-10 lg:px-14 mt-3 sm:mt-4 lg:mt-0">
          <StageLogo logoSrc={logoSrc} />
          <h2 className="mt-4 sm:mt-6 text-[30px] sm:text-[44px] lg:text-[52px] xl:text-[58px] font-black leading-[1] tracking-[-0.035em] text-balance max-w-[560px]">
            Lleva la cuenta de tus clases.
          </h2>
          <p className="hidden sm:block mt-4 text-base lg:text-lg text-zinc-400 leading-relaxed max-w-[440px] text-balance">
            Pasa lista, mira la asistencia de cada mes y comparte la hoja con quien la necesite.
          </p>
        </div>

        <StyleList className="hidden sm:flex mt-10 lg:mt-0 px-10" />
      </section>

      {/* Formulario */}
      <section className="relative flex-1 flex flex-col px-5 sm:px-10 py-7 sm:py-12 lg:py-10">
        <div className="hidden lg:flex justify-end">
          <button
            onClick={onToggleTheme}
            aria-label={isDarkMode ? "Usar tema claro" : "Usar tema oscuro"}
            className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex-1 flex flex-col lg:justify-center w-full max-w-[400px] mx-auto lg:py-10">
          <h1 className="text-[26px] sm:text-[32px] font-black tracking-[-0.025em] text-zinc-900 dark:text-white leading-tight">Entra en tu panel</h1>
          <p className="hidden sm:block mt-2 text-[15px] text-zinc-500 dark:text-zinc-400">Con tu usuario y contraseña, o con tu cuenta de Google.</p>

          <motion.form animate={shake} onSubmit={onSubmit} className="mt-5 sm:mt-8 flex flex-col gap-5" noValidate={false}>
            <div>
              <label htmlFor="login-user" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Usuario o correo</label>
              <input
                id="login-user"
                type="text"
                required
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={username}
                onChange={e => setUsername(e.target.value)}
                aria-invalid={loginError}
                className={`${field} ${fieldBorder}`}
              />
            </div>

            <div>
              <label htmlFor="login-pass" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  id="login-pass"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  aria-invalid={loginError}
                  className={`${field} ${fieldBorder} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60"
                >
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {loginError && (
                <motion.p
                  role="alert"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="overflow-hidden text-sm font-medium text-rose-600 dark:text-rose-400 flex gap-2"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  El usuario o la contraseña no son correctos. Revísalos e inténtalo de nuevo.
                </motion.p>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="mt-1 h-12 w-full rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-[15px] font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-[0.98] transition-[background-color,transform] disabled:opacity-60 outline-none focus-visible:ring-4 focus-visible:ring-rose-500/30"
            >
              {isLoggingIn ? <><Loader2 className="w-4 h-4 animate-spin" /> Entrando…</> : "Entrar"}
            </button>
          </motion.form>

          <div className="flex items-center gap-4 my-6" aria-hidden>
            <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
            <span className="text-sm text-zinc-400">o</span>
            <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          </div>

          <button
            type="button"
            onClick={onGoogle}
            className="h-12 w-full rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[15px] font-semibold text-zinc-800 dark:text-zinc-100 flex items-center justify-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/70 active:scale-[0.98] transition-[background-color,transform] outline-none focus-visible:ring-4 focus-visible:ring-rose-500/30"
          >
            <GoogleIcon /> Entrar con Google
          </button>

          <p className="mt-8 sm:mt-10 text-sm text-zinc-500 dark:text-zinc-500 leading-relaxed">
            ¿No puedes entrar? Pide a quien administra SalsaNova que revise tu cuenta.
          </p>
        </div>
      </section>
    </div>
  );
};
