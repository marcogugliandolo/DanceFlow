import { useState, useEffect } from 'react';
import { useDanceStore } from './hooks/useDanceStore';
import { ClassStatus } from './types';
import { motion, AnimatePresence } from 'motion/react';
import {
  CalendarDays,
  CheckCircle2,
  Trash2,
  Moon,
  Sun,
  MapPin,
  Info,
  Plus,
  Wallet,
  Activity,
  AlertCircle,
  AudioLines,
  User,
  Lock,
  LogOut,
  ArrowRight,
  LayoutDashboard,
  History
} from 'lucide-react';

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('auth_danceflow') === 'true';
  });

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  const {
    activities,
    sessions,
    summary,
    addActivity,
    addSession,
    deleteSession,
    deleteActivity,
  } = useDanceStore();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'historial'>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Attempt to load dark mode preference, default to dark if not set
    const saved = localStorage.getItem('theme_danceflow');
    return saved ? saved === 'dark' : true; 
  });
  const [isCreatingActivity, setIsCreatingActivity] = useState(false);

  const [newActName, setNewActName] = useState('');
  const [newActLocation, setNewActLocation] = useState('');
  const [newActPrice, setNewActPrice] = useState('');

  const [sessionActId, setSessionActId] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionStatus, setSessionStatus] = useState<ClassStatus>('held');
  const [sessionJustification, setSessionJustification] = useState('');

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme_danceflow', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme_danceflow', 'light');
    }
  }, [isDarkMode]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.toLowerCase() === 'ana' && password === 'salsanova') {
      setIsAuthenticated(true);
      localStorage.setItem('auth_danceflow', 'true');
      setLoginError(false);
      setUsername('');
      setPassword('');
    } else {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('auth_danceflow');
  };

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActName || !newActLocation || !newActPrice) return;
    addActivity({
      name: newActName,
      location: newActLocation,
      pricePerClass: parseFloat(newActPrice),
    });
    setNewActName('');
    setNewActLocation('');
    setNewActPrice('');
    setIsCreatingActivity(false);
  };

  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionActId || !sessionDate) return;
    addSession({
      activityId: sessionActId,
      date: sessionDate,
      status: sessionStatus,
      justification: sessionStatus !== 'held' ? sessionJustification : undefined,
    });
    setSessionActId('');
    setSessionDate('');
    setSessionStatus('held');
    setSessionJustification('');
    alert('¡Clase registrada correctamente!');
  };

  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen overflow-hidden font-sans flex items-center justify-center p-4 selection:bg-rose-500/30">
        {/* Fondo Decorativo Login */}
        <div className="fixed inset-0 z-[-1] bg-zinc-50 dark:bg-[#09090b] transition-colors duration-500">
          <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-rose-500/15 dark:bg-rose-500/20 blur-[120px] rounded-full pointer-events-none animate-pulse duration-1000" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-fuchsia-600/15 dark:bg-fuchsia-600/20 blur-[120px] rounded-full pointer-events-none animate-pulse duration-1000 delay-500" />
        </div>

        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center bg-white/50 dark:bg-zinc-800/50 backdrop-blur-md text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl border border-white/20 dark:border-white/10 p-8 sm:p-10 rounded-[2.5rem] shadow-2xl shadow-rose-500/10">
            <div className="flex flex-col items-center mb-10">
              <div className="relative flex items-center justify-center w-28 h-28 rounded-full bg-black shadow-xl shadow-black/20 overflow-hidden mb-4 border-[3px] border-zinc-200 dark:border-zinc-800">
                <img src="/logo.png" alt="SalsaNova Logo" className="w-full h-full object-cover z-20 relative" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                <div className="hidden absolute inset-0 z-10 flex flex-col items-center justify-center text-white">
                  <span className="font-black text-4xl tracking-tighter leading-none">SSN</span>
                  <span className="text-[7px] uppercase tracking-widest mt-1">SalsaNova</span>
                </div>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white mt-2">
                Salsa<span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-fuchsia-500">Nova</span>
              </h1>
              <p className="text-zinc-500 text-sm font-medium mt-2">Escuela de Baile • Panel de Gestión</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-zinc-400" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 bg-zinc-100/50 dark:bg-zinc-800/50 px-4 py-4 rounded-2xl text-sm border-none outline-none focus:ring-2 focus:ring-rose-500/50 transition-all font-medium placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-zinc-400" />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 bg-zinc-100/50 dark:bg-zinc-800/50 px-4 py-4 rounded-2xl text-sm border-none outline-none focus:ring-2 focus:ring-rose-500/50 transition-all font-medium placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <AnimatePresence>
                {loginError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 bg-rose-100 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl text-rose-600 dark:text-rose-400 text-sm font-medium flex items-center justify-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Credenciales incorrectas
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                className="group w-full py-4 px-4 bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white text-sm font-bold rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2"
              >
                Entrar
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden font-sans selection:bg-rose-500/30">
      {/* Fondo Decorativo */}
      <div className="fixed inset-0 z-[-1] bg-zinc-50 dark:bg-[#09090b] transition-colors duration-500">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-rose-500/10 dark:bg-rose-500/20 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-fuchsia-600/10 dark:bg-fuchsia-600/20 blur-[100px] rounded-full pointer-events-none" />
      </div>

      {/* Header Flotante */}
      <header className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[96%] max-w-4xl">
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/60 dark:border-white/10 rounded-3xl sm:rounded-full p-2 flex flex-col sm:flex-row items-center justify-between shadow-lg shadow-zinc-200/50 dark:shadow-black/50 transition-colors gap-3 sm:gap-0">
          
          {/* Fila superior en móvil: Logo + Acciones */}
          <div className="flex items-center justify-between w-full sm:w-auto px-2 sm:px-0">
            <div className="flex items-center gap-2 sm:gap-3 sm:pl-2">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-black shadow-md overflow-hidden border border-zinc-200 dark:border-zinc-700 flex-shrink-0">
                <img src="/logo.png" alt="SalsaNova Logo" className="w-full h-full object-cover z-20 relative" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                <div className="hidden absolute inset-0 z-10 flex flex-col items-center justify-center text-white">
                  <span className="font-black text-xs tracking-tighter leading-none">SSN</span>
                </div>
              </div>
              <span className="font-bold tracking-tight text-zinc-900 dark:text-white text-lg">
                Salsa<span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-fuchsia-500">Nova</span>
              </span>
            </div>

            {/* Acciones en Móvil */}
            <div className="flex sm:hidden items-center gap-1.5">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-100/50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={handleLogout}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Menú de pestañas */}
          <div className="flex w-full sm:w-auto items-center p-1 bg-zinc-100/80 dark:bg-zinc-800/80 rounded-2xl sm:rounded-full border border-zinc-200/50 dark:border-zinc-700/50 backdrop-blur-md">
            {(['dashboard', 'historial'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-2 text-sm font-bold sm:font-semibold rounded-xl sm:rounded-full outline-none transition-colors ${
                  activeTab === tab ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="pill"
                    className="absolute inset-0 bg-white dark:bg-zinc-700 rounded-xl sm:rounded-full shadow-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center gap-2 capitalize">
                  {tab === 'dashboard' ? <LayoutDashboard className="w-4 h-4 sm:hidden" /> : <History className="w-4 h-4 sm:hidden" />}
                  {tab}
                </span>
              </button>
            ))}
          </div>

          {/* Acciones en Desktop */}
          <div className="hidden sm:flex items-center pr-1 gap-1">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-100/50 dark:bg-zinc-800/50 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors tooltip-trigger relative group"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-40 sm:pt-28 pb-12 px-4 max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2 mb-2 px-2">
                <span className="text-zinc-500 font-medium text-sm">¡Hola de nuevo, <strong className="text-zinc-900 dark:text-white">Ana</strong>! ✨</span>
              </div>
              
              {/* Bento Grid Stats */}
              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <motion.div variants={cardVariants} className="col-span-2 bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-zinc-100 dark:to-zinc-300 text-white dark:text-zinc-900 rounded-3xl sm:rounded-[2rem] p-5 sm:p-6 relative overflow-hidden flex flex-col justify-between group shadow-sm">
                  <div className="absolute right-0 top-0 w-48 h-48 bg-white/5 dark:bg-black/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-125" />
                  <span className="text-sm font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Wallet className="w-4 h-4" /> Ingresos Totales
                  </span>
                  <div className="flex items-baseline gap-1 mt-4">
                    <span className="text-4xl sm:text-5xl font-black tracking-tighter">{summary.totalRevenue.toFixed(2)}</span>
                    <span className="text-xl sm:text-2xl font-bold text-zinc-500 dark:text-zinc-400">€</span>
                  </div>
                </motion.div>

                <motion.div variants={cardVariants} className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/50 dark:border-white/5 rounded-3xl sm:rounded-[2rem] p-5 sm:p-6 flex flex-col justify-between shadow-sm">
                  <span className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1 leading-tight">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" /> Realizadas
                  </span>
                  <div className="text-3xl sm:text-4xl font-black mt-4 text-emerald-500">{summary.totalHeld}</div>
                </motion.div>

                <motion.div variants={cardVariants} className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/50 dark:border-white/5 rounded-3xl sm:rounded-[2rem] p-5 sm:p-6 flex flex-col justify-between shadow-sm">
                  <span className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1 leading-tight">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" /> Canceladas
                  </span>
                  <div className="text-3xl sm:text-4xl font-black mt-4 text-rose-500">{summary.totalCancelled}</div>
                </motion.div>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Visual Activities List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">Tus Clases</h2>
                    <button
                      onClick={() => setIsCreatingActivity(!isCreatingActivity)}
                      className={`p-2 rounded-full transition-colors ${
                        isCreatingActivity 
                          ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' 
                          : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700'
                      }`}
                    >
                      <Plus className={`w-5 h-5 transition-transform ${isCreatingActivity ? 'rotate-45' : ''}`} />
                    </button>
                  </div>

                  <AnimatePresence>
                    {isCreatingActivity && (
                      <motion.form
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                        onSubmit={handleAddActivity}
                      >
                        <div className="p-4 mb-2 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-rose-200/50 dark:border-rose-500/20 rounded-3xl space-y-3">
                          <div className="flex flex-col sm:flex-row gap-3">
                            <input
                              required placeholder="Estilo (ej. Bachata)" 
                              value={newActName} onChange={e => setNewActName(e.target.value)}
                              className="flex-1 w-full sm:w-auto bg-zinc-100/50 dark:bg-zinc-800/50 px-4 py-3.5 sm:py-3 rounded-2xl text-sm border-none outline-none focus:ring-2 focus:ring-rose-500/50 transition-all font-medium placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100"
                            />
                            <input
                              required placeholder="Lugar" 
                              value={newActLocation} onChange={e => setNewActLocation(e.target.value)}
                              className="flex-1 w-full sm:w-auto bg-zinc-100/50 dark:bg-zinc-800/50 px-4 py-3.5 sm:py-3 rounded-2xl text-sm border-none outline-none focus:ring-2 focus:ring-rose-500/50 transition-all font-medium placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100"
                            />
                          </div>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <input
                              required type="number" step="0.5" placeholder="Precio (€)" 
                              value={newActPrice} onChange={e => setNewActPrice(e.target.value)}
                              className="flex-1 w-full sm:w-auto bg-zinc-100/50 dark:bg-zinc-800/50 px-4 py-3.5 sm:py-3 rounded-2xl text-sm border-none outline-none focus:ring-2 focus:ring-rose-500/50 transition-all font-medium placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100"
                            />
                            <button type="submit" className="w-full sm:w-auto px-8 py-3.5 sm:py-3 bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white shadow-lg shadow-rose-500/20 text-sm font-bold rounded-2xl hover:opacity-90 active:scale-95 transition-all">
                              Crear
                            </button>
                          </div>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  {activities.length === 0 ? (
                    <div className="bg-white/40 dark:bg-zinc-900/40 rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-700 p-10 text-center">
                      <Activity className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
                      <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">No hay actividades aún.</p>
                    </div>
                  ) : (
                    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid gap-3">
                      {activities.map((activity) => {
                        const actStats = summary.activities[activity.id];
                        return (
                          <motion.div key={activity.id} variants={cardVariants} className="group bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/50 dark:border-white/5 rounded-[2rem] p-5 relative overflow-hidden transition-all hover:border-rose-200 dark:hover:border-rose-500/30 shadow-sm">
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => deleteActivity(activity.id)}
                                className="text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-500/10 p-2 rounded-full"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <div className="flex items-center space-x-4 mb-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700 rounded-[14px] flex items-center justify-center text-zinc-600 dark:text-zinc-300">
                                <Activity className="w-6 h-6" />
                              </div>
                              <div className="pr-10">
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight">{activity.name}</h3>
                                <p className="text-xs font-semibold text-zinc-500 flex items-center mt-0.5">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {activity.location}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex bg-zinc-100/50 dark:bg-zinc-800/50 rounded-2xl p-3 items-center justify-between">
                              <div className="text-center px-1 flex-1 border-r border-zinc-200 dark:border-zinc-700">
                                <div className="text-xs font-bold tracking-widest text-zinc-400 uppercase mb-1">Total</div>
                                <div className="text-xl font-black text-rose-500">{(actStats?.totalRevenue || 0).toFixed(0)}€</div>
                              </div>
                              <div className="text-center px-1 flex-1 border-r border-zinc-200 dark:border-zinc-700">
                                <div className="text-xs font-bold tracking-widest text-zinc-400 uppercase mb-1">Realiz.</div>
                                <div className="text-lg font-bold text-zinc-700 dark:text-zinc-300">{actStats?.heldCount || 0}</div>
                              </div>
                              <div className="text-center px-1 flex-1">
                                <div className="text-xs font-bold tracking-widest text-zinc-400 uppercase mb-1">Cancel.</div>
                                <div className="text-lg font-bold text-zinc-700 dark:text-zinc-300">{actStats?.cancelledBilledCount || 0}</div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </div>

                {/* Registrar Clase Form */}
                <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-zinc-200/60 dark:border-white/10 shadow-xl shadow-zinc-200/20 dark:shadow-black/50 rounded-[2rem] p-6 sticky top-28">
                  <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center mb-6">
                    <CalendarDays className="w-5 h-5 mr-2 text-rose-500" />
                    Registrar Asistencia
                  </h2>
                  <form onSubmit={handleAddSession} className="space-y-4">
                    <div>
                      <select
                        required
                        value={sessionActId}
                        onChange={(e) => setSessionActId(e.target.value)}
                        className="w-full bg-zinc-100/50 dark:bg-zinc-800/50 px-4 py-4 rounded-2xl text-sm font-semibold border-none outline-none focus:ring-2 focus:ring-rose-500/50 transition-all appearance-none cursor-pointer text-zinc-800 dark:text-zinc-100"
                      >
                        <option value="" disabled hidden>Seleccionar Actividad...</option>
                        {activities.map((a) => (
                          <option key={a.id} value={a.id}>{a.name} - {a.location}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <input
                        type="date"
                        required
                        value={sessionDate}
                        onChange={(e) => setSessionDate(e.target.value)}
                        className="w-full bg-zinc-100/50 dark:bg-zinc-800/50 px-4 py-4 rounded-2xl text-sm font-semibold border-none outline-none focus:ring-2 focus:ring-rose-500/50 transition-all text-zinc-800 dark:text-zinc-100 cursor-text"
                      />
                    </div>

                    <div className="bg-zinc-100/50 dark:bg-zinc-800/50 p-1.5 rounded-[1.25rem] flex flex-col sm:flex-row gap-1">
                      <button
                        type="button"
                        onClick={() => setSessionStatus('held')}
                        className={`flex-1 py-3 px-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                          sessionStatus === 'held' ? 'bg-white dark:bg-zinc-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                        }`}
                      >
                        Realizada
                      </button>
                      <button
                        type="button"
                        onClick={() => setSessionStatus('cancelled_billed')}
                        className={`flex-1 py-3 px-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                          sessionStatus === 'cancelled_billed' ? 'bg-white dark:bg-zinc-700 shadow-sm text-amber-600 dark:text-amber-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                        }`}
                      >
                        Se Cobra
                      </button>
                      <button
                        type="button"
                        onClick={() => setSessionStatus('cancelled_unbilled')}
                        className={`flex-1 py-3 px-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                          sessionStatus === 'cancelled_unbilled' ? 'bg-white dark:bg-zinc-700 shadow-sm text-rose-600 dark:text-rose-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                        }`}
                      >
                        No se Cobra
                      </button>
                    </div>

                    <AnimatePresence>
                      {sessionStatus !== 'held' && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <input
                            type="text"
                            required
                            placeholder="Motivo (ej. Puente)"
                            value={sessionJustification}
                            onChange={(e) => setSessionJustification(e.target.value)}
                            className="w-full bg-zinc-100/50 dark:bg-zinc-800/50 px-4 py-4 rounded-2xl text-sm font-semibold border-none outline-none focus:ring-2 focus:ring-rose-500/50 transition-all font-medium mt-1 placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      type="submit"
                      disabled={activities.length === 0}
                      className="w-full mt-2 py-4 px-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-bold rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      Guardar Asistencia
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="historial"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-6 px-2">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Registro</h2>
              </div>

              {sessions.length === 0 ? (
                <div className="bg-white/40 dark:bg-zinc-900/40 rounded-[2rem] border border-dashed border-zinc-300 dark:border-zinc-700 p-16 text-center">
                  <CalendarDays className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
                  <p className="text-zinc-500 dark:text-zinc-400 font-medium">Aún no hay registros de clases.</p>
                </div>
              ) : (
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="flex flex-col gap-3">
                  {sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(session => {
                    const activity = activities.find(a => a.id === session.activityId);
                    return (
                      <motion.div 
                        key={session.id} 
                        variants={cardVariants} 
                        className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/50 dark:border-white/5 rounded-3xl hover:border-zinc-300 dark:hover:border-white/10 transition-colors shadow-sm gap-4 relative"
                      >
                        <div className="flex items-center gap-3 sm:gap-4 pr-10 sm:pr-0">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 border border-zinc-200/50 dark:border-zinc-700/50">
                            <span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 tracking-widest uppercase">{new Date(session.date).toLocaleDateString('es-ES', { month: 'short' })}</span>
                            <span className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white leading-none mt-0.5">{new Date(session.date).getDate()}</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-zinc-900 dark:text-white text-sm sm:text-base leading-tight">
                              {activity ? activity.name : <span className="text-zinc-400 italic">Desconocida</span>}
                            </h4>
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1 sm:mt-1.5">
                              {activity && (
                                <span className="text-[11px] sm:text-xs font-semibold text-zinc-500 flex items-center">
                                  <MapPin className="w-3 h-3 mr-1" /> {activity.location}
                                </span>
                              )}
                              
                              {session.status === 'held' && (
                                <span className="px-1.5 py-0.5 rounded-md text-[9px] uppercase tracking-widest font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">Realizada</span>
                              )}
                              {session.status === 'cancelled_billed' && (
                                <span className="px-1.5 py-0.5 rounded-md text-[9px] uppercase tracking-widest font-black bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">Cobrada</span>
                              )}
                              {session.status === 'cancelled_unbilled' && (
                                <span className="px-1.5 py-0.5 rounded-md text-[9px] uppercase tracking-widest font-black bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400">No Cobrada</span>
                              )}
                            </div>
                            {session.justification && (
                              <p className="text-[11px] sm:text-xs font-medium text-zinc-400 mt-1.5 sm:mt-2 flex items-center">
                                <Info className="w-3 h-3 mr-1 flex-shrink-0" /> <span className="truncate max-w-[180px] sm:max-w-xs">{session.justification}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 pl-14 sm:pl-0 pt-3 sm:pt-0 border-t border-zinc-100 dark:border-zinc-800/50 sm:border-0 relative">
                          {session.status !== 'cancelled_unbilled' && activity ? (
                            <div className="text-base sm:text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-rose-500 to-fuchsia-600">
                              +{activity.pricePerClass.toFixed(2)}€
                            </div>
                          ) : (
                            <div className="text-base sm:text-lg font-black text-zinc-300 dark:text-zinc-700">0.00€</div>
                          )}
                          
                          <button
                            onClick={() => deleteSession(session.id)}
                            className="text-xs font-bold text-rose-500 hover:text-rose-600 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-rose-50 dark:bg-rose-500/10 sm:bg-transparent px-3 py-1.5 sm:px-0 sm:py-0 rounded-lg sm:rounded-none"
                          >
                            Eliminar
                          </button>
                        </div>
                        
                        <div className="absolute top-4 right-4 sm:hidden">
                          <button
                            onClick={() => deleteSession(session.id)}
                            className="p-1.5 text-zinc-400 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
