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

// Paso básico de salsa: 1-2-3, pausa, 5-6-7, pausa.
// Los tiempos con paso se rellenan con el degradado de la marca; las pausas (4 y 8) quedan huecas.
const BEATS = [1, 2, 3, 4, 5, 6, 7, 8];
const isPause = (b: number) => b === 4 || b === 8;

const ROSE = [244, 63, 94];
const FUCHSIA = [217, 70, 239];
const beatColor = (b: number) => {
  const t = (b - 1) / 6;
  const c = ROSE.map((v, i) => Math.round(v + (FUCHSIA[i] - v) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
};

const BeatRow: React.FC<{ size: number; tone: "stage" | "auto" }> = ({ size, tone }) => {
  const reduce = useReducedMotion();
  const pauseRing = tone === "stage" ? "border-zinc-700" : "border-zinc-300 dark:border-zinc-700";
  const number = tone === "stage" ? "text-zinc-500" : "text-zinc-400 dark:text-zinc-500";
  return (
    <div className="flex items-start justify-between w-full" aria-hidden>
      {BEATS.map((b, i) => (
        <div key={b} className="flex flex-col items-center gap-2.5">
          {isPause(b) ? (
            <motion.span
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: reduce ? 0 : 0.3 + i * 0.2, duration: 0.2 }}
              className={`rounded-full border-2 ${pauseRing}`}
              style={{ width: size, height: size }}
            />
          ) : (
            <motion.span
              initial={reduce ? false : { scale: 0.4, opacity: 0.15 }}
              animate={{ scale: reduce ? 1 : [0.4, 1.18, 1], opacity: 1 }}
              transition={{ delay: reduce ? 0 : 0.3 + i * 0.2, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-full"
              style={{ width: size, height: size, background: beatColor(b) }}
            />
          )}
          <span className={`text-xs font-bold tabular-nums ${number}`}>{b}</span>
        </div>
      ))}
    </div>
  );
};

const Wordmark: React.FC<{ logoSrc: string; tone: "stage" | "auto" }> = ({ logoSrc, tone }) => (
  <div className="flex items-center gap-3">
    <span className="w-10 h-10 rounded-full bg-zinc-900 ring-1 ring-white/10 overflow-hidden flex items-center justify-center shrink-0">
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
    <div className="min-h-[100dvh] grid lg:grid-cols-[1.05fr_1fr] bg-white dark:bg-[#09090b] font-sans selection:bg-rose-500/30">
      {/* Escenario (solo en pantallas grandes): siempre oscuro */}
      <section className="hidden lg:flex flex-col justify-between bg-black text-white px-14 xl:px-20 py-12 border-r border-white/5">
        <Wordmark logoSrc={logoSrc} tone="stage" />

        <div className="max-w-[520px]">
          <h2 className="text-[56px] xl:text-[64px] font-black leading-[0.95] tracking-[-0.035em]">
            Lleva la cuenta de tus clases.
          </h2>
          <p className="mt-6 text-lg text-zinc-400 leading-relaxed max-w-[440px]">
            Pasa lista, mira la asistencia de cada mes y comparte la hoja con quien la necesite.
          </p>
          <div className="mt-14 max-w-[460px]">
            <BeatRow size={40} tone="stage" />
          </div>
        </div>

        <p className="text-sm text-zinc-500">Panel de gestión de la escuela de baile SalsaNova</p>
      </section>

      {/* Formulario */}
      <section className="relative flex flex-col px-5 sm:px-10 py-6 sm:py-10">
        <div className="flex items-center justify-between lg:justify-end">
          <div className="lg:hidden"><Wordmark logoSrc={logoSrc} tone="auto" /></div>
          <button
            onClick={onToggleTheme}
            aria-label={isDarkMode ? "Usar tema claro" : "Usar tema oscuro"}
            className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center w-full max-w-[380px] mx-auto py-10">
          {/* En móvil, el compás va arriba del formulario */}
          <div className="lg:hidden mb-10 px-1">
            <BeatRow size={22} tone="auto" />
          </div>

          <h1 className="text-[32px] font-black tracking-[-0.025em] text-zinc-900 dark:text-white leading-tight">Entra en tu panel</h1>
          <p className="mt-2 text-[15px] text-zinc-500 dark:text-zinc-400">Con tu usuario y contraseña, o con tu cuenta de Google.</p>

          <motion.form animate={shake} onSubmit={onSubmit} className="mt-8 flex flex-col gap-5" noValidate={false}>
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

          <p className="mt-10 text-sm text-zinc-500 dark:text-zinc-500 leading-relaxed">
            ¿No puedes entrar? Pide a quien administra SalsaNova que revise tu cuenta.
          </p>
        </div>
      </section>
    </div>
  );
};
