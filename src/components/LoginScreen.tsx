import React, { useEffect, useState } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useAnimationControls,
  useMotionValue,
  useSpring,
  useMotionTemplate,
} from "motion/react";
import { Eye, EyeOff, Sun, Moon, AlertCircle, Loader2 } from "lucide-react";
import { DANCERS_PATH, DANCERS_VIEWBOX } from "../assets/dancers";

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
  logoSrc?: string;
};

// Curva de entrada suave usada en toda la escena
const EASE_OUT = [0.22, 1, 0.36, 1] as const;

// ---------- La pareja de baile ----------
// La silueta del logo se dibuja sola con una línea de luz rosa-fucsia y después se rellena.
// Al final queda un borde de neón muy suave alrededor.
const Dancers: React.FC<{ className?: string }> = ({ className }) => {
  const reduce = useReducedMotion();
  return (
    <svg viewBox={DANCERS_VIEWBOX} className={className} role="img" aria-label="Pareja bailando, del logo de SalsaNova">
      <defs>
        <linearGradient id="dancers-stroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="55%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#d946ef" />
        </linearGradient>
        <filter id="dancers-glow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <motion.path
        d={DANCERS_PATH}
        fillRule="evenodd"
        className="fill-zinc-900 dark:fill-white"
        initial={reduce ? false : { fillOpacity: 0 }}
        animate={{ fillOpacity: 1 }}
        transition={{ delay: reduce ? 0 : 2.0, duration: 0.9, ease: "easeOut" }}
      />
      {!reduce && (
        <motion.path
          d={DANCERS_PATH}
          fill="none"
          stroke="url(#dancers-stroke)"
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#dancers-glow)"
          initial={{ pathLength: 0, opacity: 1 }}
          animate={{ pathLength: 1, opacity: [1, 1, 0.45] }}
          transition={{
            pathLength: { delay: 0.35, duration: 1.9, ease: [0.65, 0, 0.35, 1] },
            opacity: { delay: 0.35, duration: 3.1, times: [0, 0.7, 1] },
          }}
        />
      )}
    </svg>
  );
};

// Escena: foco desde arriba, pareja, reflejo en el suelo y nombre de la escuela
const Stage: React.FC = () => {
  const reduce = useReducedMotion();
  return (
    <div className="relative flex flex-col items-center lg:items-start text-center lg:text-left">
      <div className="relative">
        {/* Foco */}
        <div className="absolute -top-[70%] inset-x-0 h-[170%] flex justify-center pointer-events-none" aria-hidden>
          <motion.div
            className="h-full w-[150%] shrink-0"
            style={{
              background: "linear-gradient(to bottom, rgba(244,63,94,0.20), rgba(217,70,239,0.08) 55%, transparent 90%)",
              clipPath: "polygon(44% 0, 56% 0, 100% 100%, 0 100%)",
              filter: "blur(18px)",
            }}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </div>

        <Dancers className="relative w-[200px] sm:w-[300px] lg:w-[440px] xl:w-[500px] h-auto" />

        {/* Reflejo de luz en el suelo, que "respira" muy despacio */}
        <motion.div
          className="mx-auto w-[85%] h-6 sm:h-8 -mt-1 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(244,63,94,0.45),transparent_70%)] blur-[8px]"
          aria-hidden
          initial={reduce ? false : { opacity: 0, scaleX: 0.6 }}
          animate={reduce ? { opacity: 1 } : { opacity: [0, 1, 0.75, 1], scaleX: [0.6, 1, 1.06, 1] }}
          transition={reduce ? { duration: 0 } : { duration: 6, delay: 1.2, times: [0, 0.2, 0.6, 1], repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        />
      </div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduce ? 0 : 2.1, duration: 0.7, ease: EASE_OUT }}
        className="mt-4 sm:mt-6"
      >
        <p className="text-sm sm:text-base font-semibold text-zinc-500 dark:text-zinc-400">Escuela de Baile</p>
        <p className="text-[40px] sm:text-[56px] lg:text-[72px] font-black tracking-[-0.045em] leading-[0.95] text-zinc-900 dark:text-white">
          Salsa<span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-fuchsia-500">Nova</span>
        </p>
        <p className="hidden sm:block mt-4 lg:mt-5 text-base lg:text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-[420px] mx-auto lg:mx-0">
          Lleva la cuenta de tus clases: pasa lista, mira la asistencia de cada mes y compártela.
        </p>
      </motion.div>
    </div>
  );
};

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
  onGoogle, isDarkMode, onToggleTheme,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const reduce = useReducedMotion();
  const shake = useAnimationControls();

  // Luz que sigue suavemente al ratón (solo se ve en pantallas grandes)
  const mx = useMotionValue(-1000);
  const my = useMotionValue(-1000);
  const sx = useSpring(mx, { stiffness: 90, damping: 22 });
  const sy = useSpring(my, { stiffness: 90, damping: 22 });
  const cursorLight = useMotionTemplate`radial-gradient(560px circle at ${sx}px ${sy}px, rgba(244,63,94,0.10), transparent 65%)`;

  // Al fallar, el formulario hace un pequeño "no" con la cabeza
  useEffect(() => {
    if (loginError && !reduce) shake.start({ x: [0, -8, 7, -5, 3, 0], transition: { duration: 0.36 } });
  }, [loginError]);

  const field =
    "w-full h-12 px-4 rounded-2xl border text-[15px] font-medium outline-none transition-[border-color,box-shadow,background-color] " +
    "bg-white text-zinc-900 placeholder:text-zinc-400 " +
    "dark:bg-white/[0.04] dark:text-white dark:placeholder:text-zinc-600 " +
    "focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15 dark:focus:border-rose-400 dark:focus:bg-white/[0.06]";
  const fieldBorder = loginError ? "border-rose-400 dark:border-rose-500/60" : "border-zinc-200 dark:border-white/10";

  // Entrada escalonada de los elementos del formulario
  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
  };

  return (
    <div
      className="relative min-h-[100dvh] overflow-hidden bg-zinc-50 dark:bg-[#070609] font-sans selection:bg-rose-500/30"
      onPointerMove={e => { mx.set(e.clientX); my.set(e.clientY); }}
    >
      {/* Fondo: trama de puntos de pista de baile + luz del ratón + resplandor de suelo */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(rgba(24,24,27,0.07)_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_75%)]" />
        <motion.div className="absolute inset-0 hidden lg:block" style={{ background: cursorLight }} />
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[900px] h-[360px] rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(217,70,239,0.16),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(217,70,239,0.20),transparent_70%)] blur-2xl" />
      </div>

      <button
        onClick={onToggleTheme}
        aria-label={isDarkMode ? "Usar tema claro" : "Usar tema oscuro"}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 w-10 h-10 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-900/5 dark:hover:bg-white/10 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60"
      >
        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      <div className="relative z-10 min-h-[100dvh] w-full max-w-6xl mx-auto px-5 sm:px-8 py-10 sm:py-14 flex flex-col lg:flex-row items-center justify-center gap-8 sm:gap-12 lg:gap-20">
        <div className="lg:flex-1 flex justify-center lg:justify-start">
          <Stage />
        </div>

        {/* Tarjeta del formulario, flotando sobre la escena */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: reduce ? 0 : 0.9, type: "spring", stiffness: 140, damping: 20 }}
          className="w-full max-w-[420px] rounded-[28px] border border-zinc-200/80 dark:border-white/10 bg-white/80 dark:bg-white/[0.035] backdrop-blur-xl shadow-[0_24px_80px_-24px_rgba(24,24,27,0.25)] dark:shadow-[0_24px_80px_-24px_rgba(0,0,0,0.8)] p-6 sm:p-8"
        >
          <motion.div
            initial={reduce ? false : "hidden"}
            animate="show"
            variants={{ hidden: {}, show: { transition: { delayChildren: reduce ? 0 : 1.15, staggerChildren: 0.06 } } }}
          >
            <motion.h1 variants={item} className="text-[26px] sm:text-[30px] font-black tracking-[-0.03em] text-zinc-900 dark:text-white leading-tight">
              Entra en tu panel
            </motion.h1>
            <motion.p variants={item} className="mt-1.5 text-[15px] text-zinc-500 dark:text-zinc-400">
              Con tu usuario y contraseña, o con Google.
            </motion.p>

            <motion.form animate={shake} onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
              <motion.div variants={item}>
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
              </motion.div>

              <motion.div variants={item}>
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
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60"
                  >
                    {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                  </button>
                </div>
              </motion.div>

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

              <motion.div variants={item}>
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="group relative overflow-hidden mt-1 h-12 w-full rounded-2xl bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white text-[15px] font-bold flex items-center justify-center gap-2 shadow-[0_10px_30px_-10px_rgba(244,63,94,0.7)] hover:shadow-[0_14px_36px_-10px_rgba(244,63,94,0.85)] active:scale-[0.98] transition-[transform,box-shadow] disabled:opacity-70 outline-none focus-visible:ring-4 focus-visible:ring-rose-500/30"
                >
                  {/* Destello que cruza el botón al pasar el ratón */}
                  <span className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent skew-x-[-20deg] -translate-x-full group-hover:translate-x-[420%] transition-transform duration-700 ease-out" aria-hidden />
                  <span className="relative flex items-center gap-2">
                    {isLoggingIn ? <><Loader2 className="w-4 h-4 animate-spin" /> Entrando…</> : "Entrar"}
                  </span>
                </button>
              </motion.div>
            </motion.form>

            <motion.div variants={item} className="flex items-center gap-4 my-5" aria-hidden>
              <span className="h-px flex-1 bg-zinc-200 dark:bg-white/10" />
              <span className="text-sm text-zinc-400">o</span>
              <span className="h-px flex-1 bg-zinc-200 dark:bg-white/10" />
            </motion.div>

            <motion.div variants={item}>
              <button
                type="button"
                onClick={onGoogle}
                className="h-12 w-full rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-[15px] font-semibold text-zinc-800 dark:text-zinc-100 flex items-center justify-center gap-3 hover:bg-zinc-50 dark:hover:bg-white/[0.08] active:scale-[0.98] transition-[background-color,transform] outline-none focus-visible:ring-4 focus-visible:ring-rose-500/30"
              >
                <GoogleIcon /> Entrar con Google
              </button>
            </motion.div>

            <motion.p variants={item} className="mt-6 text-[13px] text-zinc-500 leading-relaxed">
              ¿No puedes entrar? Pide a quien administra SalsaNova que revise tu cuenta.
            </motion.p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};
