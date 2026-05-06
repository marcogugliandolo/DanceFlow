import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoBase64 from "./logo";
import { useDanceStore } from "./hooks/useDanceStore";
import { ClassStatus } from "./types";
import { motion, AnimatePresence } from "motion/react";
import Holidays from "date-holidays";

const hd = new Holidays("ES");

const ProfileView = ({
  isDarkMode,
  setIsDarkMode,
  profile,
  setProfile,
}: {
  isDarkMode: boolean;
  setIsDarkMode: (v: boolean) => void;
  profile: any;
  setProfile: (p: any) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editProfile, setEditProfile] = useState(profile);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordState, setPasswordState] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    setEditProfile(profile);
  }, [profile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 500;
          const MAX_HEIGHT = 500;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with 0.8 quality
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
          setEditProfile(prev => ({ ...prev, avatarUrl: dataUrl }));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editProfile,
          theme: isDarkMode ? 'dark' : 'light'
        })
      });
      if (res.ok) {
        const { user } = await res.json();
        setProfile({
          name: user.name,
          email: user.email,
          avatarUrl: user.avatar_url || "",
          theme: user.theme || "dark",
        });
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

  const toggleTheme = async () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    try {
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profile,
          theme: nextMode ? 'dark' : 'light'
        })
      });
    } catch (e) {}
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordState.new !== passwordState.confirm) {
      alert("Las contraseñas nuevas no coinciden.");
      return;
    }
    try {
      const res = await fetch('/api/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordState.current,
          newPassword: passwordState.new
        })
      });
      if (res.ok) {
        setPasswordSuccess(true);
        setTimeout(() => {
          setShowPasswordChange(false);
          setPasswordSuccess(false);
          setPasswordState({ current: "", new: "", confirm: "" });
        }, 2000);
      } else {
        const data = await res.json();
        alert(data.error || "Error al cambiar la contraseña");
      }
    } catch (err) {
      alert("Error de conexión");
    }
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleExportData = async () => {
    try {
      const res = await fetch('/api/export');
      if (res.ok) {
        const data = await res.json();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
        const downloadAnchorNode = document.createElement("a");
        downloadAnchorNode.setAttribute("href", dataStr);
        const dateObj = new Date();
        const dateStr = `${String(dateObj.getDate()).padStart(2, "0")}_${String(dateObj.getMonth() + 1).padStart(2, "0")}_${dateObj.getFullYear()}`;
        downloadAnchorNode.setAttribute("download", `salsanova_db_export_${dateStr}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
      }
    } catch (err) {
      alert("Error al exportar datos");
    }
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const result = event.target?.result as string;
        const parsed = JSON.parse(result);

        if (!confirm("¿Estás seguro? Esto reemplazará todos los datos actuales.")) return;

        const res = await fetch('/api/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed)
        });

        if (res.ok) {
          alert("Datos importados correctamente. La página se recargará.");
          window.location.reload();
        } else {
          alert("Error al importar datos");
        }
      } catch (err) {
        alert("Archivo no válido");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col mb-6 gap-6 px-1 sm:px-2 max-w-2xl mx-auto">
      <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/50 dark:border-white/5 rounded-[2rem] p-6 sm:p-8 shadow-sm flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
          <div className="relative group flex-shrink-0">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900 shadow-xl border-4 border-white dark:border-zinc-800 flex items-center justify-center text-5xl sm:text-6xl font-black text-rose-500 transition-transform duration-300 group-hover:scale-105">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 sm:w-16 sm:h-16 text-rose-500 opacity-80" />
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-1 w-full text-center sm:text-left mt-2">
            {!isEditing ? (
              <>
                <div className="flex items-center gap-3 justify-center sm:justify-start">
                  <h3 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white break-words">
                    {profile.name}
                  </h3>
                  <span className="px-2.5 py-1 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest rounded-lg">
                    Rol: Profesor
                  </span>
                </div>
                <p className="text-sm font-medium text-zinc-500 break-all mt-1">
                  {profile.email}
                </p>
                <div className="mt-5 flex justify-center sm:justify-start">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-bold rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95 border border-zinc-200/80 dark:border-zinc-700/80 shadow-sm"
                  >
                    Editar Perfil
                  </button>
                </div>
              </>
            ) : (
              <form
                onSubmit={handleSave}
                className="flex flex-col gap-3 w-full animate-in fade-in zoom-in-95 duration-200"
              >
                <input
                  type="text"
                  value={editProfile.name}
                  onChange={(e) =>
                    setEditProfile({ ...editProfile, name: e.target.value })
                  }
                  className="w-full h-10 bg-zinc-100 dark:bg-zinc-800 px-3 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-rose-500/50"
                  placeholder="Nombre"
                  required
                />
                <input
                  type="email"
                  value={editProfile.email}
                  onChange={(e) =>
                    setEditProfile({ ...editProfile, email: e.target.value })
                  }
                  className="w-full h-10 bg-zinc-100 dark:bg-zinc-800 px-3 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-rose-500/50"
                  placeholder="Correo electrónico"
                  required
                />
                <div className="flex flex-col gap-1 w-full max-w-full">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase px-1">
                    Foto de perfil
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full max-w-full h-auto min-h-[40px] bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-rose-500/50 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100 dark:file:bg-rose-500/20 dark:file:text-rose-400 dark:hover:file:bg-rose-500/30 whitespace-normal break-all"
                  />
                </div>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditProfile(profile);
                    }}
                    className="flex-1 px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-xl active:scale-95 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white text-xs font-bold rounded-xl shadow-md active:scale-95 transition-all"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-2">
          Configuración y Seguridad
        </h3>

        <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/50 dark:border-white/5 rounded-[2rem] p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-zinc-900 dark:text-white">
                Modo Oscuro
              </span>
              <span className="text-xs text-zinc-500">
                Alternar entre tema claro y oscuro
              </span>
            </div>
            <button
              onClick={toggleTheme}
              className={`w-12 h-6 rounded-full transition-colors relative ${isDarkMode ? "bg-rose-500" : "bg-zinc-300 dark:bg-zinc-600"}`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${isDarkMode ? "translate-x-7" : "translate-x-1"}`}
              />
            </button>
          </div>

          <div className="h-px bg-zinc-200/50 dark:bg-white/5 w-full my-2" />

          {!showPasswordChange ? (
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-zinc-900 dark:text-white">
                  Contraseña de acceso
                </span>
                <span className="text-xs text-zinc-500">
                  Cambia la contraseña para acceder a la app
                </span>
              </div>
              <button
                onClick={() => setShowPasswordChange(true)}
                className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-bold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all border border-zinc-200 dark:border-zinc-700"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <form
              onSubmit={handlePasswordSave}
              className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2"
            >
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-2">
                Cambiar Contraseña
              </h4>
              <input
                type="password"
                value={passwordState.current}
                onChange={(e) =>
                  setPasswordState({
                    ...passwordState,
                    current: e.target.value,
                  })
                }
                placeholder="Contraseña actual"
                className="w-full h-10 bg-zinc-100 dark:bg-zinc-800 px-3 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-rose-500/50"
                required
              />
              <input
                type="password"
                value={passwordState.new}
                onChange={(e) =>
                  setPasswordState({ ...passwordState, new: e.target.value })
                }
                placeholder="Nueva contraseña"
                className="w-full h-10 bg-zinc-100 dark:bg-zinc-800 px-3 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-rose-500/50"
                required
                minLength={4}
              />
              <input
                type="password"
                value={passwordState.confirm}
                onChange={(e) =>
                  setPasswordState({
                    ...passwordState,
                    confirm: e.target.value,
                  })
                }
                placeholder="Confirmar nueva contraseña"
                className="w-full h-10 bg-zinc-100 dark:bg-zinc-800 px-3 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-rose-500/50"
                required
                minLength={4}
              />
              {passwordSuccess && (
                <p className="text-emerald-500 text-xs font-bold">
                  ¡Contraseña actualizada!
                </p>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordChange(false);
                    setPasswordState({ current: "", new: "", confirm: "" });
                  }}
                  className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold rounded-xl"
                >
                  Actualizar
                </button>
              </div>
            </form>
          )}

          <div className="h-px bg-zinc-200/50 dark:bg-white/5 w-full my-2" />

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-zinc-900 dark:text-white">
                Exportar datos
              </span>
              <span className="text-xs text-zinc-500">
                Descarga un archivo con toda tu información
              </span>
            </div>
            <button
              onClick={handleExportData}
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-bold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all border border-zinc-200 dark:border-zinc-700"
            >
              Exportar
            </button>
          </div>

          <div className="h-px bg-zinc-200/50 dark:bg-white/5 w-full my-2" />

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-zinc-900 dark:text-white">
                Importar datos
              </span>
              <span className="text-xs text-zinc-500">
                Restaura información desde una copia de seguridad
              </span>
            </div>
            <div>
              <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                onChange={handleImportData}
                style={{ display: "none" }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-bold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all border border-zinc-200 dark:border-zinc-700"
              >
                Importar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
  History,
  Pencil,
  X,
  Save,
  Share2,
  FileDown,
  Clock,
  CircleUserRound,
  Grid,
  Check,
} from "lucide-react";

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "tween", duration: 0.15, ease: "easeOut" },
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.02 },
  },
};

export default function App() {
  const [profile, setProfile] = useState<{
    name: string;
    email: string;
    avatarUrl: string;
    theme: 'light' | 'dark';
  }>({
    name: "Profesor",
    email: "profesor@ejemplo.com",
    avatarUrl: "",
    theme: "dark",
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const { user } = await res.json();
          if (user) {
            setIsAuthenticated(true);
            setProfile({
              name: user.name,
              email: user.email,
              avatarUrl: user.avatar_url || "",
              theme: user.theme || "dark",
            });
            setIsDarkMode(user.theme === "dark");
          } else {
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  // Listen for Google OAuth success
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data.type === 'OAUTH_AUTH_SUCCESS') {
        const checkRes = await fetch('/api/auth/me');
        if (checkRes.ok) {
          const { user } = await checkRes.json();
          if (user) {
            setIsAuthenticated(true);
            setProfile({
              name: user.name,
              email: user.email,
              avatarUrl: user.avatar_url || "",
              theme: user.theme || "dark",
            });
            setIsDarkMode(user.theme === "dark");
          }
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [dashboardMonth, setDashboardMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const {
    activities,
    sessions,
    students,
    summary,
    addActivity,
    editActivity,
    addSession,
    editSession,
    deleteSession,
    deleteActivity,
    addStudent,
    editStudent,
    deleteStudent,
  } = useDanceStore(dashboardMonth);

  const [activeTab, setActiveTab] = useState<
    "dashboard" | "historial" | "alumnos" | "perfil"
  >("dashboard");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCreatingActivity, setIsCreatingActivity] = useState(false);

  const [newActName, setNewActName] = useState("");
  const [newActLocation, setNewActLocation] = useState("");
  const [newActPrice, setNewActPrice] = useState("");
  const [newActPaymentType, setNewActPaymentType] = useState<
    "fixed" | "monthly"
  >("fixed");
  const [newActIsRecurring, setNewActIsRecurring] = useState(false);

  const [editingActId, setEditingActId] = useState<string | null>(null);
  const [editActName, setEditActName] = useState("");
  const [editActLocation, setEditActLocation] = useState("");
  const [editActPrice, setEditActPrice] = useState("");
  const [editActPaymentType, setEditActPaymentType] = useState<
    "fixed" | "monthly"
  >("fixed");
  const [editActIsRecurring, setEditActIsRecurring] = useState(false);

  const [activitySearchQuery, setActivitySearchQuery] = useState("");
  const [activityCurrentPage, setActivityCurrentPage] = useState(1);
  const ACTIVITIES_PER_PAGE = 4;

  const [sessionActId, setSessionActId] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [sessionDuration, setSessionDuration] = useState<number>(1);
  const [sessionStatus, setSessionStatus] = useState<ClassStatus>("held");
  const [sessionJustification, setSessionJustification] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");
  const [sessionAttendeeIds, setSessionAttendeeIds] = useState<string[]>([]);

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editSessionActId, setEditSessionActId] = useState("");
  const [editSessionDate, setEditSessionDate] = useState("");
  const [editSessionDuration, setEditSessionDuration] = useState<number>(1);
  const [editSessionStatus, setEditSessionStatus] =
    useState<ClassStatus>("held");
  const [editSessionJustification, setEditSessionJustification] = useState("");
  const [editSessionNotes, setEditSessionNotes] = useState("");
  const [editSessionAttendeeIds, setEditSessionAttendeeIds] = useState<
    string[]
  >([]);

  const [showAttendeesModal, setShowAttendeesModal] = useState<
    "create" | "edit" | null
  >(null);
  const [showStudentModal, setShowStudentModal] = useState<"create" | "edit" | null>(null);
  const [newStudentName, setNewStudentName] = useState("");
  const [studentHistoryId, setStudentHistoryId] = useState<string | null>(null);
  const [studentHistoryPage, setStudentHistoryPage] = useState(1);
  const [studentHistorySearchQuery, setStudentHistorySearchQuery] =
    useState("");
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editStudentData, setEditStudentData] = useState<{
    name: string;
    phone: string;
    email: string;
    notes: string;
  }>({ name: "", phone: "", email: "", notes: "" });

  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [studentCurrentPage, setStudentCurrentPage] = useState(1);
  const STUDENTS_PER_PAGE = 8;

  const [sessionSearchQuery, setSessionSearchQuery] = useState("");
  const [sessionCurrentPage, setSessionCurrentPage] = useState(1);
  const SESSIONS_PER_PAGE = 10;
  const [filterStatuses, setFilterStatuses] = useState<ClassStatus[]>([]);
  const [filterDateStart, setFilterDateStart] = useState("");
  const [filterDateEnd, setFilterDateEnd] = useState("");
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(false);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const { user } = await res.json();
        setIsAuthenticated(true);
        setProfile({
          name: user.name,
          email: user.email,
          avatarUrl: user.avatar_url || "",
          theme: user.theme || "dark",
        });
        setIsDarkMode(user.theme === "dark");
        setUsername("");
        setPassword("");
      } else {
        setLoginError(true);
      }
    } catch (err) {
      setLoginError(true);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const res = await fetch('/api/auth/google/url');
      if (res.ok) {
        const { url } = await res.json();
        // Redirect completely to the Google login URL instead of opening a popup
        // This is necessary for mobile devices and iframes
        window.location.href = url;
      }
    } catch (err) {
      console.error("Google login error:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsAuthenticated(false);
    } catch (err) {
      console.error("Logout error:", err);
      setIsAuthenticated(false);
    }
  };

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActName || !newActLocation || !newActPrice) return;

    addActivity({
      name: newActName,
      location: newActLocation,
      pricePerClass: parseFloat(newActPrice),
      paymentType: newActPaymentType,
      isRecurring: newActPaymentType === "monthly" ? newActIsRecurring : false,
    });
    setNewActName("");
    setNewActLocation("");
    setNewActPrice("");
    setNewActPaymentType("fixed");
    setNewActIsRecurring(false);
    setIsCreatingActivity(false);
  };

  const handleEditActivitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActId || !editActName || !editActLocation || !editActPrice)
      return;
    editActivity(editingActId, {
      name: editActName,
      location: editActLocation,
      pricePerClass: parseFloat(editActPrice),
      paymentType: editActPaymentType,
      isRecurring:
        editActPaymentType === "monthly" ? editActIsRecurring : false,
    });
    setEditingActId(null);
  };

  const startEditingActivity = (activity: any) => {
    setEditingActId(activity.id);
    setEditActName(activity.name);
    setEditActLocation(activity.location);
    setEditActPrice(activity.pricePerClass.toString());
    setEditActPaymentType(activity.paymentType || "fixed");
    setEditActIsRecurring(activity.isRecurring || false);
  };

  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionActId || !sessionDate) return;
    addSession({
      activityId: sessionActId,
      date: sessionDate,
      duration: sessionDuration,
      status: sessionStatus,
      justification:
        sessionStatus === "cancelled_unbilled" ||
        sessionStatus === "cancelled_billed"
          ? sessionJustification
          : undefined,
      notes: sessionNotes || undefined,
      attendeeIds:
        sessionStatus !== "cancelled_unbilled" ? sessionAttendeeIds : [],
    });
    setSessionActId("");
    setSessionDate("");
    setSessionDuration(1);
    setSessionStatus("held");
    setSessionJustification("");
    setSessionNotes("");
    setSessionAttendeeIds([]);
  };

  const handleEditSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSessionId || !editSessionActId || !editSessionDate) return;
    editSession(editingSessionId, {
      activityId: editSessionActId,
      date: editSessionDate,
      duration: editSessionDuration,
      status: editSessionStatus,
      justification:
        editSessionStatus === "cancelled_unbilled" ||
        editSessionStatus === "cancelled_billed"
          ? editSessionJustification
          : undefined,
      notes: editSessionNotes || undefined,
      attendeeIds:
        editSessionStatus !== "cancelled_unbilled"
          ? editSessionAttendeeIds
          : [],
    });
    setEditingSessionId(null);
  };

  const startEditingSession = (session: any) => {
    setEditingSessionId(session.id);
    setEditSessionActId(session.activityId);
    setEditSessionDate(session.date);
    setEditSessionDuration(session.duration ?? 1);
    setEditSessionStatus(session.status);
    setEditSessionJustification(session.justification || "");
    setEditSessionNotes(session.notes || "");
    setEditSessionAttendeeIds(session.attendeeIds || []);
  };

  const handleExportPDF = async () => {
    const doc = new jsPDF();

    // Header background
    doc.setFillColor(244, 63, 94); // rose-500
    doc.rect(0, 0, 210, 40, "F");

    // Logo
    doc.addImage(logoBase64, "PNG", 14, 10, 45, 19);

    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
    doc.text("Seguimiento corporativo de clases", 196, 25, { align: "right" });

    // Report Title
    doc.setFontSize(16);
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "bold");
    doc.text("Registro de Sesiones", 14, 55);

    // Filter summary
    let filterText = `Periodo: ${filterDateStart || "Inicio"} - ${filterDateEnd || "Fin"}`;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(filterText, 14, 62);

    let filtered = sessions;
    if (filterStatuses.length > 0)
      filtered = filtered.filter((s) => filterStatuses.includes(s.status));
    if (filterDateStart)
      filtered = filtered.filter((s) => s.date >= filterDateStart);
    if (filterDateEnd)
      filtered = filtered.filter((s) => s.date <= filterDateEnd);
    if (sessionSearchQuery.trim()) {
      const query = sessionSearchQuery.toLowerCase().trim();
      filtered = filtered.filter((s) => {
        const actName =
          activities.find((a) => a.id === s.activityId)?.name?.toLowerCase() ||
          "";
        const notes = s.notes?.toLowerCase() || "";
        const justification = s.justification?.toLowerCase() || "";
        return (
          actName.includes(query) ||
          notes.includes(query) ||
          justification.includes(query)
        );
      });
    }

    if (filtered.length === 0) {
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "italic");
      doc.text(
        "No hay registros de sesiones para los filtros seleccionados.",
        14,
        80,
      );

      const currentDate = new Date();
      const formattedDate = `${String(currentDate.getDate()).padStart(2, "0")}_${String(currentDate.getMonth() + 1).padStart(2, "0")}_${currentDate.getFullYear()}`;
      doc.save(`registro_sesiones_${formattedDate}.pdf`);
      return;
    }

    filtered.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    let totalRevenue = 0;

    // Calculate total revenue independently
    filtered.forEach((s) => {
      const activity = activities.find((a) => a.id === s.activityId);
      if (!activity) return;
      if (activity.paymentType !== "monthly") {
        if (s.status === "held" || s.status === "cancelled_billed") {
          totalRevenue += activity.pricePerClass;
        }
      }
    });

    const groupedMap = new Map<
      string,
      {
        activity: any;
        sessions: any[];
        totalAmount: number;
        totalHours: number;
        statusCounts: {
          held: number;
          cancelled_billed: number;
          cancelled_unbilled: number;
        };
      }
    >();

    filtered.forEach((s) => {
      const activity = activities.find((a) => a.id === s.activityId);
      if (!activity) return;

      let amount = 0;
      if (activity.paymentType !== "monthly") {
        if (s.status === "held") amount = activity.pricePerClass;
        else if (s.status === "cancelled_billed")
          amount = activity.pricePerClass;
      }

      if (!groupedMap.has(activity.id)) {
        groupedMap.set(activity.id, {
          activity,
          sessions: [],
          totalAmount: 0,
          totalHours: 0,
          statusCounts: { held: 0, cancelled_billed: 0, cancelled_unbilled: 0 },
        });
      }

      const group = groupedMap.get(activity.id)!;
      group.sessions.push(s);
      group.totalAmount += amount;
      group.totalHours += s.duration || 1;

      if (s.status === "held") group.statusCounts.held++;
      else if (s.status === "cancelled_billed")
        group.statusCounts.cancelled_billed++;
      else if (s.status === "cancelled_unbilled")
        group.statusCounts.cancelled_unbilled++;
    });

    // Create table data from grouped map
    const tableData = Array.from(groupedMap.values()).map((group) => {
      const { activity, sessions, totalAmount, statusCounts } = group;
      const actName = activity.name;

      const isMonthly = activity.paymentType === "monthly";

      let revStr = "";
      if (
        statusCounts.held === 0 &&
        statusCounts.cancelled_billed === 0 &&
        statusCounts.cancelled_unbilled > 0
      ) {
        revStr = "-";
      } else {
        revStr = isMonthly ? "Mensual" : `${totalAmount.toFixed(2)}€`;
      }

      // Sort sessions chronologically for parallel lines
      sessions.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

      const dateLines = sessions
        .map((s) => {
          const dateObj = new Date(s.date);
          return dateObj.toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });
        })
        .join("\n");

      const statusLines = sessions
        .map((s) => {
          if (s.status === "held") return "Realizada";
          if (s.status === "cancelled_billed") return "Can. (Cobra)";
          return "Can. (No Cobra)";
        })
        .join("\n");

      const hoursLines = sessions
        .map((s) => {
          return `${s.duration || 1} h`;
        })
        .join("\n");

      const notesLines = sessions
        .map((s) => {
          let noteContent = s.notes || "";
          if (
            s.status === "cancelled_billed" ||
            s.status === "cancelled_unbilled"
          ) {
            noteContent = s.justification || "";
          }
          return noteContent.trim() || "-";
        })
        .join("\n");

      return [actName, dateLines, hoursLines, statusLines, notesLines, revStr];
    });

    autoTable(doc, {
      startY: 70,
      head: [
        [
          "Actividad",
          "Fecha(s)",
          "Horas",
          "Estado",
          "Notas / Just.",
          "Ingreso",
        ],
      ],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [244, 63, 94],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: { fontSize: 9, cellPadding: 4, textColor: [50, 50, 50] },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 25 },
        2: { cellWidth: 18 },
        3: { cellWidth: 25 },
        4: { cellWidth: "auto" },
        5: { cellWidth: 20 },
      },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      margin: { top: 70 },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 70;

    const filteredActivityIds = new Set(filtered.map((s) => s.activityId));

    let numMonths = 1;
    let startDateForMonths = filterDateStart;
    let endDateForMonths = filterDateEnd;

    if (!startDateForMonths && filtered.length > 0) {
      startDateForMonths = filtered[filtered.length - 1].date; // filtered is sorted descending, so last is oldest
    }
    if (!endDateForMonths && filtered.length > 0) {
      endDateForMonths = filtered[0].date;
    }

    if (startDateForMonths && endDateForMonths) {
      const d1 = new Date(startDateForMonths);
      const d2 = new Date(endDateForMonths);
      let months =
        (d2.getFullYear() - d1.getFullYear()) * 12 +
        (d2.getMonth() - d1.getMonth()) +
        1;
      if (months > 0) numMonths = months;
    }

    const monthlyActs = activities.filter((a) => {
      if (a.paymentType !== "monthly") return false;
      if (!filteredActivityIds.has(a.id)) return false;
      const validSessions = filtered.filter(
        (s) => s.activityId === a.id && s.status !== "cancelled_unbilled",
      );
      return validSessions.length > 0;
    });

    const monthlyRec = monthlyActs
      .filter((a) => a.isRecurring)
      .reduce((ac, a) => ac + a.pricePerClass * numMonths, 0);
    const monthlyNonRec = monthlyActs
      .filter((a) => !a.isRecurring)
      .reduce((ac, a) => {
        const classSessions = filtered.filter(
          (s) => s.activityId === a.id && s.status !== "cancelled_unbilled",
        );
        const uniqueMonths = new Set(
          classSessions.map((s) => {
            const d = new Date(s.date);
            return `${d.getFullYear()}-${d.getMonth()}`;
          }),
        );
        return ac + a.pricePerClass * uniqueMonths.size;
      }, 0);
    const totalWithMonthly = totalRevenue + monthlyRec + monthlyNonRec;
    const globalTotalHours = filtered.reduce(
      (acc, s) => acc + (s.duration || 1),
      0,
    );

    const hoursPerAct = Array.from(groupedMap.values())
      .filter((g) => g.totalHours > 0)
      .map((g) => `• ${g.activity.name}: ${g.totalHours} h`);

    const hoursLinesCount = hoursPerAct.length;
    const additionalHeight = hoursLinesCount > 0 ? (hoursLinesCount * 5) + 2 : 0;
    const summaryBoxHeight = 55 + additionalHeight;

    let summaryStartY = finalY + 10;

    // Check if summary box fits on the current page
    if (summaryStartY + summaryBoxHeight > doc.internal.pageSize.getHeight() - 10) {
      doc.addPage();
      summaryStartY = 10;
    }

    // Summary Box
    doc.setFillColor(245, 245, 247);
    doc.roundedRect(14, summaryStartY, 182, summaryBoxHeight, 3, 3, "F");

    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.text("Resumen del Periodo", 20, summaryStartY + 10);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Total de sesiones en el registro: ${filtered.length}`,
      20,
      summaryStartY + 18,
    );
    doc.text(`Total de horas: ${globalTotalHours} h`, 20, summaryStartY + 24);

    let currentY = summaryStartY + 30;

    if (hoursLinesCount > 0) {
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      hoursPerAct.forEach((line) => {
        doc.text(line, 25, currentY);
        currentY += 5;
      });
      currentY += 2; // Extra padding
    }

    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text(
      `Ingresos por sesiones individuales: ${totalRevenue.toFixed(2)}€`,
      20,
      currentY,
    );

    const totalMonthlyText = monthlyRec + monthlyNonRec;
    if (totalMonthlyText > 0) {
      doc.text(
        `Cuotas mensuales${numMonths > 1 ? ` (${numMonths} meses)` : ""}: +${totalMonthlyText.toFixed(2)}€`,
        20,
        currentY + 6,
      );
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(244, 63, 94);
    doc.text(
      `Total Periodo: ${totalWithMonthly.toFixed(2)}€`,
      130,
      currentY + 6,
    );

    const currentDate = new Date();
    const formattedDate = `${String(currentDate.getDate()).padStart(2, "0")}_${String(currentDate.getMonth() + 1).padStart(2, "0")}_${currentDate.getFullYear()}`;
    doc.save(`registro_sesiones_${formattedDate}.pdf`);
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
          <p className="text-zinc-500 font-medium animate-pulse">Iniciando SalsaNova...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="relative min-h-[100dvh] overflow-x-hidden font-sans flex items-center justify-center p-4 selection:bg-rose-500/30">
        {/* Fondo Decorativo Login */}
        <div className="fixed inset-0 z-[-1] bg-zinc-50 dark:bg-[#09090b] overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-rose-500/15 dark:bg-rose-500/20 blur-[120px] rounded-full pointer-events-none animate-pulse duration-1000" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-fuchsia-600/15 dark:bg-fuchsia-600/20 blur-[120px] rounded-full pointer-events-none animate-pulse duration-1000 delay-500" />
        </div>

        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="absolute top-6 right-6 w-10 h-10 z-[100] rounded-full flex items-center justify-center bg-white/50 dark:bg-zinc-800/50 backdrop-blur-md text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.2, type: "spring", bounce: 0.25 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl border border-white/20 dark:border-white/10 p-8 sm:p-10 rounded-[2.5rem] shadow-2xl shadow-rose-500/10">
            <div className="flex flex-col items-center mb-10">
              <div className="relative flex items-center justify-center w-28 h-28 rounded-full bg-zinc-900 shadow-xl shadow-black/20 overflow-hidden mb-4 border-[3px] border-zinc-200 dark:border-zinc-800">
                <img
                  src={logoBase64}
                  alt="SalsaNova Logo"
                  className="w-full h-full object-contain p-4 z-20 relative"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextElementSibling?.classList.remove(
                      "hidden",
                    );
                  }}
                />
                <div className="hidden absolute inset-0 z-10 flex flex-col items-center justify-center text-white">
                  <span className="font-black text-4xl tracking-tighter leading-none">
                    SSN
                  </span>
                  <span className="text-[7px] uppercase tracking-widest mt-1">
                    SalsaNova
                  </span>
                </div>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white mt-2">
                Salsa
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-fuchsia-500">
                  Nova
                </span>
              </h1>
              <p className="text-zinc-500 text-sm font-medium mt-2">
                Escuela de Baile • Panel de Gestión
              </p>
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
                    className="w-full pl-12 bg-zinc-100/50 dark:bg-zinc-800/50 px-4 py-4 rounded-2xl text-base sm:text-sm border-none outline-none focus:ring-2 focus:ring-rose-500/50 transition-all font-medium placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100"
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
                    className="w-full pl-12 bg-zinc-100/50 dark:bg-zinc-800/50 px-4 py-4 rounded-2xl text-base sm:text-sm border-none outline-none focus:ring-2 focus:ring-rose-500/50 transition-all font-medium placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <AnimatePresence>
                {loginError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
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
                disabled={isLoggingIn}
                className="group w-full py-4 px-4 bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white text-sm font-bold rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoggingIn ? "Entrando..." : "Entrar"}
                {!isLoggingIn && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              </button>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-zinc-900 px-2 text-zinc-500 font-bold">O continuar con</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-4 px-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 text-sm font-bold rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-[100dvh] overflow-x-hidden font-sans selection:bg-rose-500/30">
      {/* Fondo Decorativo */}
      <div className="fixed inset-0 z-[-1] bg-zinc-50 dark:bg-[#09090b] overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-rose-500/10 dark:bg-rose-500/20 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-fuchsia-600/10 dark:bg-fuchsia-600/20 blur-[100px] rounded-full pointer-events-none" />
      </div>

      {/* Header Flotante */}
      <header className="absolute top-3 inset-x-0 mx-auto z-[100] w-[96%] max-w-6xl">
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/60 dark:border-white/10 rounded-3xl lg:rounded-full p-2 flex flex-col lg:flex-row items-center justify-between shadow-lg shadow-zinc-200/50 dark:shadow-black/50 gap-3 lg:gap-0">
          {/* Fila superior en móvil: Logo + Acciones */}
          <div className="flex items-center justify-between w-full lg:w-auto px-2 lg:px-0">
            <div className="flex items-center gap-2 lg:gap-3 lg:pl-2">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-zinc-900 shadow-md overflow-hidden border border-zinc-200 dark:border-zinc-700 flex-shrink-0">
                <img
                  src={logoBase64}
                  alt="SalsaNova Logo"
                  className="w-full h-full object-contain p-1.5 z-20 relative"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextElementSibling?.classList.remove(
                      "hidden",
                    );
                  }}
                />
                <div className="hidden absolute inset-0 z-10 flex flex-col items-center justify-center text-white">
                  <span className="font-black text-xs tracking-tighter leading-none">
                    SSN
                  </span>
                </div>
              </div>
              <span className="font-bold tracking-tight text-zinc-900 dark:text-white text-lg">
                Salsa
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-fuchsia-500">
                  Nova
                </span>
              </span>
            </div>

            {/* Acciones en Móvil */}
            <div className="flex lg:hidden items-center gap-1.5">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-100/50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Grid className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-100/50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
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

          {/* Menú de pestañas - Desktop */}
          <div className="hidden lg:flex w-auto items-center p-1 bg-zinc-100/80 dark:bg-zinc-800/80 rounded-full border border-zinc-200/50 dark:border-zinc-700/50 backdrop-blur-md overflow-hidden">
            {(["dashboard", "historial", "alumnos", "perfil"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`group relative flex-none px-6 py-2 text-[13px] font-semibold rounded-full outline-none transition-all ${
                  activeTab === tab
                    ? "text-zinc-900 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="pill"
                    className="absolute inset-0 bg-white dark:bg-zinc-700 rounded-full shadow-sm"
                    transition={{
                      type: "tween",
                      duration: 0.15,
                      ease: "easeOut",
                    }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center gap-2 capitalize">
                  {tab === "dashboard" ? (
                    <LayoutDashboard className="w-4 h-4 text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300" />
                  ) : tab === "historial" ? (
                    <History className="w-4 h-4 text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300" />
                  ) : tab === "alumnos" ? (
                    <User className="w-4 h-4 text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300" />
                  ) : profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt="Avatar"
                      className="w-5 h-5 rounded-full object-cover shadow-sm border border-zinc-200 dark:border-zinc-700"
                    />
                  ) : (
                    <CircleUserRound className="w-4 h-4 text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300" />
                  )}
                  <span className="truncate">{tab}</span>
                </span>
              </button>
            ))}
          </div>

          {/* Acciones en Desktop */}
          <div className="hidden lg:flex items-center pr-1 gap-1">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-100/50 dark:bg-zinc-800/50 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
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

        {/* Mobile Navigation Menu Dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="lg:hidden mt-2 mx-auto max-w-6xl"
            >
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-700/50 rounded-3xl p-2 shadow-xl flex flex-col gap-1 mx-2">
                {(["dashboard", "historial", "alumnos", "perfil"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                      activeTab === tab
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    }`}
                  >
                    {tab === "dashboard" ? (
                      <LayoutDashboard className="w-5 h-5 opacity-70" />
                    ) : tab === "historial" ? (
                      <History className="w-5 h-5 opacity-70" />
                    ) : tab === "alumnos" ? (
                      <User className="w-5 h-5 opacity-70" />
                    ) : profile.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt="Avatar"
                        className="w-6 h-6 rounded-full object-cover shadow-sm border border-zinc-200 dark:border-zinc-700"
                      />
                    ) : (
                      <CircleUserRound className="w-5 h-5 opacity-70" />
                    )}
                    <span className="capitalize text-sm">{tab}</span>
                    {activeTab === tab && (
                      <Check className="w-4 h-4 ml-auto text-rose-500" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="pt-32 lg:pt-28 pb-12 px-4 max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === "dashboard" ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 px-2">
                <span className="text-zinc-500 font-medium text-sm">
                  ¡Hola de nuevo,{" "}
                  <strong className="text-zinc-900 dark:text-white">Ana</strong>
                  ! ✨
                </span>
                <input
                  type="month"
                  value={dashboardMonth}
                  onChange={(e) => setDashboardMonth(e.target.value)}
                  style={{ colorScheme: isDarkMode ? "dark" : "light" }}
                  className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/50 dark:border-white/5 rounded-xl px-4 py-2 text-sm font-bold text-zinc-700 dark:text-zinc-300 outline-none focus:ring-2 focus:ring-rose-500/50 transition-all shadow-sm"
                />
              </div>

              {/* Bento Grid Stats */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 md:grid-cols-6 gap-3 sm:gap-4"
              >
                <motion.div
                  variants={cardVariants}
                  className="col-span-2 md:col-span-2 bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-zinc-100 dark:to-zinc-300 text-white dark:text-zinc-900 rounded-3xl sm:rounded-[2rem] p-5 sm:p-6 relative overflow-hidden flex flex-col justify-between group shadow-sm"
                >
                  <div className="absolute right-0 top-0 w-48 h-48 bg-white/5 dark:bg-black/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-125" />
                  <span className="text-sm font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Wallet className="w-4 h-4" /> Ingresos Totales
                  </span>
                  <div className="flex items-baseline gap-1 mt-4">
                    <span className="text-4xl sm:text-5xl font-black tracking-tighter">
                      {summary.totalRevenue.toFixed(2)}
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-zinc-500 dark:text-zinc-400">
                      €
                    </span>
                  </div>
                </motion.div>

                <motion.div
                  variants={cardVariants}
                  className="col-span-1 md:col-span-1 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/50 dark:border-white/5 rounded-3xl sm:rounded-[2rem] p-5 sm:p-6 flex flex-col justify-between shadow-sm"
                >
                  <span className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1 leading-tight">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />{" "}
                    Realiz.
                  </span>
                  <div className="text-3xl sm:text-4xl font-black mt-4 text-emerald-500">
                    {summary.totalHeld}
                  </div>
                </motion.div>

                <motion.div
                  variants={cardVariants}
                  className="col-span-1 md:col-span-1 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/50 dark:border-white/5 rounded-3xl sm:rounded-[2rem] p-5 sm:p-6 flex flex-col justify-between shadow-sm"
                >
                  <span className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1 leading-tight">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />{" "}
                    Cancel.
                  </span>
                  <div className="text-3xl sm:text-4xl font-black mt-4 text-rose-500">
                    {summary.totalCancelled}
                  </div>
                </motion.div>

                <motion.div
                  variants={cardVariants}
                  className="col-span-1 md:col-span-1 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/50 dark:border-white/5 rounded-3xl sm:rounded-[2rem] p-5 sm:p-6 flex flex-col justify-between shadow-sm"
                >
                  <span className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1 leading-tight">
                    <User className="w-3.5 h-3.5 text-fuchsia-500 flex-shrink-0" />{" "}
                    Alumnos
                  </span>
                  <div className="text-3xl sm:text-4xl font-black mt-4 text-fuchsia-500">
                    {summary.totalAttendees}
                  </div>
                </motion.div>

                <motion.div
                  variants={cardVariants}
                  className="col-span-1 md:col-span-1 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/50 dark:border-white/5 rounded-3xl sm:rounded-[2rem] p-5 sm:p-6 flex flex-col justify-between shadow-sm"
                >
                  <span className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1 leading-tight">
                    <AudioLines className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />{" "}
                    Media
                  </span>
                  <div className="flex items-baseline gap-0.5 mt-4">
                    <span className="text-3xl sm:text-4xl font-black text-blue-500">
                      {summary.totalAttendees > 0
                        ? (
                            summary.totalRevenue / summary.totalAttendees
                          ).toFixed(1)
                        : "0"}
                    </span>
                    <span className="text-sm font-bold text-blue-500/50">
                      €
                    </span>
                  </div>
                </motion.div>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Visual Activities List */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-2 gap-3">
                    <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                      Tus Clases
                    </h2>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <input
                        type="text"
                        placeholder="Buscar clase..."
                        value={activitySearchQuery}
                        onChange={(e) => {
                          setActivitySearchQuery(e.target.value);
                          setActivityCurrentPage(1);
                        }}
                        className="flex-1 sm:w-48 h-10 bg-white dark:bg-zinc-800 px-3 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-rose-500/50 transition-all text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 m-0 block appearance-none shadow-sm"
                      />
                      <button
                        onClick={() =>
                          setIsCreatingActivity(!isCreatingActivity)
                        }
                        className={`p-2 rounded-full transition-colors flex-shrink-0 ${
                          isCreatingActivity
                            ? "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400"
                            : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700 shadow-sm"
                        }`}
                      >
                        <Plus
                          className={`w-5 h-5 transition-transform ${isCreatingActivity ? "rotate-45" : ""}`}
                        />
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isCreatingActivity && (
                      <motion.form
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                        onSubmit={handleAddActivity}
                      >
                        <div className="p-4 mb-2 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-rose-200/50 dark:border-rose-500/20 rounded-3xl space-y-3">
                          <div className="flex flex-col sm:flex-row gap-3">
                            <input
                              required
                              placeholder="Estilo (ej. Bachata)"
                              value={newActName}
                              onChange={(e) => setNewActName(e.target.value)}
                              className="flex-1 min-w-0 w-full sm:w-auto h-[52px] sm:h-12 bg-zinc-100/50 dark:bg-zinc-800/50 px-4 rounded-2xl text-base sm:text-sm border-none outline-none focus:ring-2 focus:ring-rose-500/50 transition-all font-medium placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100"
                            />
                            <input
                              required
                              placeholder="Lugar"
                              value={newActLocation}
                              onChange={(e) =>
                                setNewActLocation(e.target.value)
                              }
                              className="flex-1 min-w-0 w-full sm:w-auto h-[52px] sm:h-12 bg-zinc-100/50 dark:bg-zinc-800/50 px-4 rounded-2xl text-base sm:text-sm border-none outline-none focus:ring-2 focus:ring-rose-500/50 transition-all font-medium placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100"
                            />
                          </div>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <select
                              value={newActPaymentType}
                              onChange={(e) =>
                                setNewActPaymentType(e.target.value as any)
                              }
                              className="flex-1 min-w-0 w-full sm:w-auto h-[52px] sm:h-12 bg-zinc-100/50 dark:bg-zinc-800/50 px-4 rounded-2xl text-base sm:text-sm border-none outline-none focus:ring-2 focus:ring-rose-500/50 transition-all font-medium text-zinc-900 dark:text-zinc-100 appearance-none cursor-pointer"
                            >
                              <option value="fixed">
                                Sueldo fijo por clase impartida
                              </option>
                              <option value="monthly">Cuota mensual</option>
                            </select>

                            <input
                              required
                              type="number"
                              step="0.01"
                              placeholder="Precio (€)"
                              value={newActPrice}
                              onChange={(e) => setNewActPrice(e.target.value)}
                              className="w-full sm:w-32 min-w-0 h-[52px] sm:h-12 bg-zinc-100/50 dark:bg-zinc-800/50 px-4 rounded-2xl text-base sm:text-sm border-none outline-none focus:ring-2 focus:ring-rose-500/50 transition-all font-medium placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100"
                            />
                            <button
                              type="submit"
                              className="w-full sm:w-auto px-8 h-[52px] sm:h-12 bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white shadow-lg shadow-rose-500/20 text-sm font-bold rounded-2xl hover:opacity-90 active:scale-95 transition-all"
                            >
                              Crear
                            </button>
                          </div>
                          {newActPaymentType === "monthly" && (
                            <div
                              className="flex items-center gap-4 px-4 py-3 mt-3 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm cursor-pointer"
                              onClick={() =>
                                setNewActIsRecurring(!newActIsRecurring)
                              }
                            >
                              <button
                                type="button"
                                role="switch"
                                aria-checked={newActIsRecurring}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${newActIsRecurring ? "bg-gradient-to-r from-rose-500 to-fuchsia-600" : "bg-zinc-200 dark:bg-zinc-700"}`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${newActIsRecurring ? "translate-x-6" : "translate-x-1"}`}
                                />
                              </button>
                              <div className="flex flex-col">
                                <span className="leading-tight text-sm font-bold text-zinc-800 dark:text-zinc-200">
                                  Recurrente
                                </span>
                                <span className="leading-tight text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                                  Automáticamente suma el ingreso sin registrar
                                  sesiones.
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  {activities.length === 0 ? (
                    <div className="bg-white/40 dark:bg-zinc-900/40 rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-700 p-10 text-center">
                      <Activity className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
                      <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
                        No hay actividades aún.
                      </p>
                    </div>
                  ) : (
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="grid gap-3"
                    >
                      {(() => {
                        let filteredActivities = activities;
                        if (activitySearchQuery.trim()) {
                          const query = activitySearchQuery
                            .toLowerCase()
                            .trim();
                          filteredActivities = filteredActivities.filter(
                            (a) =>
                              a.name.toLowerCase().includes(query) ||
                              a.location.toLowerCase().includes(query),
                          );
                        }

                        const totalActPages = Math.ceil(
                          filteredActivities.length / ACTIVITIES_PER_PAGE,
                        );
                        const paginatedActivities = filteredActivities.slice(
                          (activityCurrentPage - 1) * ACTIVITIES_PER_PAGE,
                          activityCurrentPage * ACTIVITIES_PER_PAGE,
                        );

                        if (activities.length === 0) {
                          return (
                            <div className="text-center p-8 text-zinc-500 font-medium">
                              No has creado ninguna clase todavía.
                            </div>
                          );
                        }

                        if (filteredActivities.length === 0) {
                          return (
                            <div className="text-center p-8 text-zinc-500 font-medium">
                              No hay clases que coincidan con tu búsqueda.
                            </div>
                          );
                        }

                        return (
                          <>
                            {paginatedActivities.map((activity) => {
                              const actStats = summary.activities[activity.id];
                              return (
                                <motion.div
                                  key={activity.id}
                                  variants={cardVariants}
                                  className="group bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/50 dark:border-white/5 rounded-[2rem] p-5 relative overflow-hidden transition-all hover:border-rose-200 dark:hover:border-rose-500/30 shadow-sm"
                                >
                                  <div className="absolute top-4 right-4 transition-opacity flex gap-2 sm:opacity-0 sm:group-hover:opacity-100">
                                    <button
                                      onClick={() =>
                                        startEditingActivity(activity)
                                      }
                                      className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 p-2 rounded-full transition-colors shadow-sm"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        deleteActivity(activity.id)
                                      }
                                      className="text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-500/10 p-2 rounded-full shadow-sm"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>

                                  {editingActId === activity.id ? (
                                    <form
                                      onSubmit={handleEditActivitySubmit}
                                      className="space-y-3 pb-2 pt-2"
                                    >
                                      <div className="flex flex-col gap-2">
                                        <input
                                          required
                                          placeholder="Estilo (ej. Bachata)"
                                          value={editActName}
                                          onChange={(e) =>
                                            setEditActName(e.target.value)
                                          }
                                          className="w-full min-w-0 h-[52px] sm:h-10 bg-zinc-100/50 dark:bg-zinc-800/50 px-3 rounded-xl text-base sm:text-sm border-none outline-none focus:ring-2 focus:ring-rose-500/50 transition-all font-medium placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100"
                                        />
                                        <div className="flex flex-col gap-2">
                                          <div className="flex flex-col sm:flex-row gap-2">
                                            <input
                                              required
                                              placeholder="Lugar"
                                              value={editActLocation}
                                              onChange={(e) =>
                                                setEditActLocation(
                                                  e.target.value,
                                                )
                                              }
                                              className="flex-1 min-w-0 h-[52px] sm:h-10 bg-zinc-100/50 dark:bg-zinc-800/50 px-3 rounded-xl text-base sm:text-sm border-none outline-none focus:ring-2 focus:ring-rose-500/50 transition-all font-medium placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100"
                                            />
                                            <div className="flex flex-1 gap-2 min-w-0">
                                              <select
                                                value={editActPaymentType}
                                                onChange={(e) =>
                                                  setEditActPaymentType(
                                                    e.target.value as any,
                                                  )
                                                }
                                                className="flex-[2] min-w-0 h-[52px] sm:h-10 bg-zinc-100/50 dark:bg-zinc-800/50 px-3 rounded-xl text-base sm:text-sm border-none outline-none focus:ring-2 focus:ring-rose-500/50 transition-all font-medium text-zinc-900 dark:text-zinc-100 appearance-none cursor-pointer"
                                              >
                                                <option value="fixed">
                                                  Fijo
                                                </option>
                                                <option value="monthly">
                                                  Cuota
                                                </option>
                                              </select>

                                              <input
                                                required
                                                type="number"
                                                step="0.01"
                                                placeholder="Precio (€)"
                                                value={editActPrice}
                                                onChange={(e) =>
                                                  setEditActPrice(
                                                    e.target.value,
                                                  )
                                                }
                                                className="flex-1 min-w-0 h-[52px] sm:h-10 bg-zinc-100/50 dark:bg-zinc-800/50 px-3 rounded-xl text-base sm:text-sm border-none outline-none focus:ring-2 focus:ring-rose-500/50 transition-all font-medium placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100"
                                              />
                                            </div>
                                          </div>

                                          {editActPaymentType === "monthly" && (
                                            <div
                                              className="flex items-center gap-3 px-3 py-2 bg-white dark:bg-zinc-800/80 rounded-xl shadow-sm border border-zinc-200/50 dark:border-zinc-700/50 cursor-pointer"
                                              onClick={() =>
                                                setEditActIsRecurring(
                                                  !editActIsRecurring,
                                                )
                                              }
                                            >
                                              <button
                                                type="button"
                                                role="switch"
                                                aria-checked={
                                                  editActIsRecurring
                                                }
                                                className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${editActIsRecurring ? "bg-gradient-to-r from-rose-500 to-fuchsia-600" : "bg-zinc-200 dark:bg-zinc-700"}`}
                                              >
                                                <span
                                                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${editActIsRecurring ? "translate-x-4" : "translate-x-[2px]"}`}
                                                />
                                              </button>
                                              <div className="flex flex-col">
                                                <span className="leading-tight text-sm font-bold text-zinc-800 dark:text-zinc-200">
                                                  Recurrente
                                                </span>
                                                <span className="leading-tight text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                                                  Automáticamente suma el
                                                  ingreso todos los meses sin
                                                  registrar sesiones.
                                                </span>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex gap-2 justify-end mt-2">
                                        <button
                                          type="button"
                                          onClick={() => setEditingActId(null)}
                                          className="px-3 py-1.5 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                                        >
                                          <X className="w-3.5 h-3.5" /> Cancelar
                                        </button>
                                        <button
                                          type="submit"
                                          className="px-3 py-1.5 bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white shadow-md shadow-rose-500/20 text-xs font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-1"
                                        >
                                          <Save className="w-3.5 h-3.5" />{" "}
                                          Guardar
                                        </button>
                                      </div>
                                    </form>
                                  ) : (
                                    <>
                                      <div className="flex items-center space-x-4 mb-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700 rounded-[14px] flex items-center justify-center text-zinc-600 dark:text-zinc-300 flex-shrink-0">
                                          <Activity className="w-6 h-6" />
                                        </div>
                                        <div className="pr-16">
                                          <h3 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight">
                                            {activity.name}
                                          </h3>
                                          <p className="text-xs font-semibold text-zinc-500 flex flex-wrap items-center gap-y-1 gap-x-2 mt-1">
                                            <span className="flex items-center">
                                              <MapPin className="w-3 h-3 mr-0.5" />
                                              {activity.location}
                                            </span>
                                            <span>•</span>
                                            <span className="text-rose-500/80 font-bold dark:text-rose-400/80">
                                              {activity.paymentType ===
                                              "monthly"
                                                ? `Cuota mensual${activity.isRecurring ? " (Recurrente)" : ""}: ${activity.pricePerClass.toFixed(2)}€`
                                                : `${activity.pricePerClass.toFixed(2)}€ / sesión`}
                                            </span>
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex bg-zinc-100/50 dark:bg-zinc-800/50 rounded-2xl p-3 items-center justify-between">
                                        <div className="text-center px-1 flex-1 border-r border-zinc-200 dark:border-zinc-700">
                                          <div className="text-xs font-bold tracking-widest text-zinc-400 uppercase mb-1">
                                            Total
                                          </div>
                                          <div className="text-xl font-black text-rose-500">
                                            {(
                                              actStats?.totalRevenue || 0
                                            ).toFixed(0)}
                                            €
                                          </div>
                                        </div>
                                        <div className="text-center px-1 flex-1 border-r border-zinc-200 dark:border-zinc-700">
                                          <div className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-1">
                                            Horas
                                          </div>
                                          <div className="text-lg font-bold text-zinc-700 dark:text-zinc-300">
                                            {actStats?.totalDuration || 0}
                                          </div>
                                        </div>
                                        <div className="text-center px-1 flex-1 border-r border-zinc-200 dark:border-zinc-700">
                                          <div className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-1">
                                            Realiz.
                                          </div>
                                          <div className="text-lg font-bold text-zinc-700 dark:text-zinc-300">
                                            {actStats?.heldCount || 0}
                                          </div>
                                        </div>
                                        <div className="text-center px-1 flex-1">
                                          <div className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-1">
                                            Cancel.
                                          </div>
                                          <div className="text-lg font-bold text-zinc-700 dark:text-zinc-300">
                                            {actStats?.cancelledBilledCount ||
                                              0}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="mt-3 flex justify-between items-center text-xs text-zinc-500 font-medium px-1">
                                        <span className="flex items-center gap-1.5">
                                          <User className="w-3.5 h-3.5" />{" "}
                                          {actStats?.totalAttendees || 0}{" "}
                                          alumnos
                                        </span>
                                        <span>
                                          Media:{" "}
                                          {actStats?.totalAttendees > 0
                                            ? (
                                                actStats.totalRevenue /
                                                actStats.totalAttendees
                                              ).toFixed(2)
                                            : "0.00"}
                                          €/pers.
                                        </span>
                                      </div>
                                    </>
                                  )}
                                </motion.div>
                              );
                            })}

                            {totalActPages > 0 && (
                              <div className="flex justify-center items-center gap-2 mt-1">
                                <button
                                  onClick={() =>
                                    setActivityCurrentPage((p) =>
                                      Math.max(1, p - 1),
                                    )
                                  }
                                  disabled={activityCurrentPage === 1}
                                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-bold shadow-sm disabled:opacity-50 transition-all active:scale-95 border border-zinc-200 dark:border-zinc-700"
                                >
                                  Anterior
                                </button>
                                <span className="text-zinc-500 dark:text-zinc-400 text-sm font-bold px-2">
                                  {activityCurrentPage} / {totalActPages}
                                </span>
                                <button
                                  onClick={() =>
                                    setActivityCurrentPage((p) =>
                                      Math.min(totalActPages, p + 1),
                                    )
                                  }
                                  disabled={
                                    activityCurrentPage === totalActPages
                                  }
                                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-bold shadow-sm disabled:opacity-50 transition-all active:scale-95 border border-zinc-200 dark:border-zinc-700"
                                >
                                  Siguiente
                                </button>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </motion.div>
                  )}
                </div>

                {/* Registrar Clase Form */}
                <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-zinc-200/60 dark:border-white/10 shadow-xl shadow-zinc-200/20 dark:shadow-black/50 rounded-[2rem] p-6 sticky top-28">
                  <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center mb-6">
                    <CalendarDays className="w-5 h-5 mr-2 text-rose-500" />
                    Registrar Asistencia
                  </h2>
                  <form onSubmit={handleAddSession} className="space-y-5">
                    <div className="relative">
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1 mb-2">
                        Actividad
                      </label>
                      <select
                        required
                        value={sessionActId}
                        onChange={(e) => {
                          const actId = e.target.value;
                          setSessionActId(actId);
                          if (actId) {
                            const previousSessions = sessions.filter(s => s.activityId === actId);
                            if (previousSessions.length > 0) {
                              const latestSession = previousSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                              setSessionAttendeeIds(latestSession.attendeeIds || []);
                            } else {
                              setSessionAttendeeIds([]);
                            }
                          } else {
                            setSessionAttendeeIds([]);
                          }
                        }}
                        className="w-full min-w-0 h-[52px] sm:h-14 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 pr-10 rounded-2xl text-base sm:text-sm font-semibold outline-none focus:border-rose-500 dark:focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all appearance-none cursor-pointer text-zinc-800 dark:text-zinc-100 shadow-sm overflow-hidden text-ellipsis"
                      >
                        <option value="" disabled hidden>
                          Seleccionar Actividad...
                        </option>
                        {activities.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name} - {a.location}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-[3.25rem] pointer-events-none text-zinc-400">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </div>
                    </div>

                    <div className="flex flex-col min-w-0">
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1 mb-2 truncate">
                        Fecha
                      </label>
                      <input
                        type="date"
                        required
                        value={sessionDate}
                        onChange={(e) => setSessionDate(e.target.value)}
                        style={{ colorScheme: isDarkMode ? "dark" : "light" }}
                        className="w-full max-w-full min-w-0 h-[52px] sm:h-14 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 rounded-2xl text-base sm:text-sm font-semibold outline-none focus:border-rose-500 dark:focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all text-zinc-800 dark:text-zinc-100 shadow-sm appearance-none"
                      />
                      {sessionDate && hd.isHoliday(new Date(sessionDate)) && (
                        <div className="mt-2 flex items-center gap-1.5 text-rose-500 bg-rose-500/10 px-3 py-1.5 rounded-lg text-xs font-semibold">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>
                            ¡Atención! Es{" "}
                            {hd.isHoliday(new Date(sessionDate))?.[0]?.name ||
                              "festivo"}
                            .
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1 mb-2 truncate">
                        Horas
                      </label>
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        required
                        value={sessionDuration}
                        onChange={(e) =>
                          setSessionDuration(Number(e.target.value))
                        }
                        className="w-full max-w-full min-w-0 h-[52px] sm:h-14 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 rounded-2xl text-base sm:text-sm font-semibold outline-none focus:border-rose-500 dark:focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all text-zinc-800 dark:text-zinc-100 shadow-sm"
                      />
                    </div>

                    <div className="bg-zinc-100 dark:bg-zinc-800/80 p-1.5 rounded-[1.25rem] flex flex-col sm:flex-row gap-1 shadow-inner border border-zinc-200/50 dark:border-zinc-700/50">
                      <button
                        type="button"
                        onClick={() => setSessionStatus("held")}
                        className={`flex-1 py-1 px-1 text-[10px] sm:text-xs font-bold uppercase tracking-wide rounded-xl transition-all flex flex-col items-center justify-center min-h-[48px] text-center ${
                          sessionStatus === "held"
                            ? "bg-white dark:bg-zinc-700 shadow-sm text-emerald-600 dark:text-emerald-400"
                            : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                        }`}
                      >
                        Realizada
                      </button>
                      <button
                        type="button"
                        onClick={() => setSessionStatus("cancelled_billed")}
                        className={`flex-1 py-1 px-1 text-[10px] sm:text-xs font-bold uppercase tracking-wide rounded-xl transition-all flex flex-col items-center justify-center min-h-[48px] leading-tight text-center ${
                          sessionStatus === "cancelled_billed"
                            ? "bg-white dark:bg-zinc-700 shadow-sm text-amber-600 dark:text-amber-400"
                            : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                        }`}
                      >
                        <span className="block">No Realizada</span>
                        <span className="block text-[8px] sm:text-[9px] opacity-80 mt-0.5">
                          (Se cobra)
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSessionStatus("cancelled_unbilled")}
                        className={`flex-1 py-1 px-1 text-[10px] sm:text-xs font-bold uppercase tracking-wide rounded-xl transition-all flex flex-col items-center justify-center min-h-[48px] leading-tight text-center ${
                          sessionStatus === "cancelled_unbilled"
                            ? "bg-white dark:bg-zinc-700 shadow-sm text-rose-600 dark:text-rose-400"
                            : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                        }`}
                      >
                        <span className="block">No Realizada</span>
                        <span className="block text-[8px] sm:text-[9px] opacity-80 mt-0.5">
                          (No cobra)
                        </span>
                      </button>
                    </div>

                    <AnimatePresence mode="wait">
                      {sessionStatus !== "cancelled_unbilled" && (
                        <motion.div
                          key="held"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden px-1 -mx-1"
                        >
                          <div className="pt-1 pb-1">
                            <label className="block mt-1 text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1 mb-2">
                              Asistentes
                            </label>
                            <button
                              type="button"
                              onClick={() => setShowAttendeesModal("create")}
                              className="w-full h-[52px] sm:h-14 flex items-center justify-between px-4 bg-zinc-100/50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl text-base sm:text-sm text-zinc-700 dark:text-zinc-300 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            >
                              <span>
                                {sessionAttendeeIds.length > 0
                                  ? `${sessionAttendeeIds.length} Asistentes seleccionados`
                                  : "Seleccionar Asistentes"}
                              </span>
                              <User className="w-4 h-4 text-zinc-400" />
                            </button>
                            <label className="block mt-4 text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1 mb-2">
                              Notas
                            </label>
                            <input
                              type="text"
                              placeholder="Ej. Clase enfocada en giros"
                              value={sessionNotes}
                              onChange={(e) => setSessionNotes(e.target.value)}
                              className="w-full min-w-0 h-[52px] sm:h-14 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 rounded-2xl text-base sm:text-sm font-semibold outline-none focus:border-rose-500 dark:focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100 shadow-sm"
                            />
                          </div>
                        </motion.div>
                      )}
                      {sessionStatus !== "held" && (
                        <motion.div
                          key="other"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden px-1 -mx-1"
                        >
                          <div className="pt-1 pb-1">
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1 mb-2">
                              Motivo / Justificación
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Ej. Lluvia, profesor enfermo..."
                              value={sessionJustification}
                              onChange={(e) =>
                                setSessionJustification(e.target.value)
                              }
                              className="w-full min-w-0 h-[52px] sm:h-14 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 rounded-2xl text-base sm:text-sm font-semibold outline-none focus:border-rose-500 dark:focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100 shadow-sm"
                            />
                          </div>
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
          ) : activeTab === "historial" ? (
            <motion.div
              key="historial"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
            >
              <div className="flex flex-col mb-6 gap-4 px-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    Registro
                  </h2>
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm font-bold shadow-md hover:opacity-90 active:scale-95 transition-all"
                  >
                    <FileDown className="w-4 h-4" /> Exportar a PDF
                  </button>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-3 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200/50 dark:border-white/5 p-3 rounded-2xl shadow-sm relative z-50">
                  <div className="flex flex-col lg:flex-row gap-3">
                    <div className="flex-[1.5] min-w-0 flex flex-col">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase px-1 mb-1 truncate">
                        Buscar en clases
                      </span>
                      <input
                        type="text"
                        placeholder="Buscar por clase, notas..."
                        value={sessionSearchQuery}
                        onChange={(e) => {
                          setSessionSearchQuery(e.target.value);
                          setSessionCurrentPage(1); // Reset page on search
                        }}
                        className="w-full h-10 bg-zinc-100/50 dark:bg-zinc-800/80 px-3 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-rose-500/50 transition-all text-zinc-700 dark:text-zinc-300 border-none m-0 block appearance-none"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col lg:flex-row gap-3">
                    <div className="flex-[1.5] min-w-0 flex flex-col">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase px-1 mb-1 truncate">
                        Estado
                      </span>
                      <div className="relative">
                        <button
                          onClick={() =>
                            setIsStatusDropdownOpen(!isStatusDropdownOpen)
                          }
                          className="w-full h-10 bg-zinc-100/50 dark:bg-zinc-800/80 px-3 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-rose-500/50 transition-all text-zinc-700 dark:text-zinc-300 border-none flex items-center justify-between shadow-sm cursor-pointer"
                        >
                          <span className="truncate">
                            {filterStatuses.length === 0
                              ? "Todos los estados"
                              : filterStatuses
                                  .map((s) =>
                                    s === "held"
                                      ? "Realizadas"
                                      : s === "cancelled_billed"
                                        ? "Can. (Cobra)"
                                        : "Can. (No Cobra)",
                                  )
                                  .join(", ")}
                          </span>
                          <div className="ml-2 text-zinc-400 shrink-0">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="m6 9 6 6 6-6" />
                            </svg>
                          </div>
                        </button>

                        <AnimatePresence>
                          {isStatusDropdownOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setIsStatusDropdownOpen(false)}
                              />
                              <motion.div
                                initial={{ opacity: 0, y: -5, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-200/50 dark:border-white/10 overflow-hidden z-50 p-1"
                              >
                                {[
                                  { id: "held", label: "Realizadas" },
                                  {
                                    id: "cancelled_billed",
                                    label: "Canceladas (Cobra)",
                                  },
                                  {
                                    id: "cancelled_unbilled",
                                    label: "Canceladas (No Cobra)",
                                  },
                                ].map((option) => (
                                  <label
                                    key={option.id}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700/50 cursor-pointer transition-colors"
                                  >
                                    <div
                                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${filterStatuses.includes(option.id) ? "bg-rose-500 border-rose-500 text-white" : "border-zinc-300 dark:border-zinc-600 bg-transparent"}`}
                                    >
                                      {filterStatuses.includes(option.id) && (
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="12"
                                          height="12"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="3"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        >
                                          <path d="M20 6 9 17l-5-5" />
                                        </svg>
                                      )}
                                    </div>
                                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                                      {option.label}
                                    </span>
                                    <input
                                      type="checkbox"
                                      className="hidden"
                                      checked={filterStatuses.includes(
                                        option.id,
                                      )}
                                      onChange={(e) => {
                                        if (e.target.checked)
                                          setFilterStatuses((prev) => [
                                            ...prev,
                                            option.id,
                                          ]);
                                        else
                                          setFilterStatuses((prev) =>
                                            prev.filter((s) => s !== option.id),
                                          );
                                      }}
                                    />
                                  </label>
                                ))}
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    <div className="flex-[2] min-w-0 flex flex-col sm:flex-row gap-2">
                      <div className="flex-1 min-w-0 flex flex-col">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase px-1 mb-1 truncate">
                          Desde
                        </span>
                        <input
                          type="date"
                          value={filterDateStart}
                          onChange={(e) => setFilterDateStart(e.target.value)}
                          style={{ colorScheme: isDarkMode ? "dark" : "light" }}
                          className="w-full max-w-full min-w-0 h-10 bg-zinc-100/50 dark:bg-zinc-800/80 px-3 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-rose-500/50 transition-all text-zinc-700 dark:text-zinc-300 border-none m-0 block appearance-none"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase px-1 mb-1 truncate">
                          Hasta
                        </span>
                        <input
                          type="date"
                          value={filterDateEnd}
                          onChange={(e) => setFilterDateEnd(e.target.value)}
                          style={{ colorScheme: isDarkMode ? "dark" : "light" }}
                          className="w-full max-w-full min-w-0 h-10 bg-zinc-100/50 dark:bg-zinc-800/80 px-3 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-rose-500/50 transition-all text-zinc-700 dark:text-zinc-300 border-none m-0 block appearance-none"
                        />
                      </div>
                    </div>
                    {(filterStatuses.length > 0 ||
                      filterDateStart ||
                      filterDateEnd) && (
                      <div className="flex flex-col justify-end">
                        <button
                          onClick={() => {
                            setFilterStatuses([]);
                            setFilterDateStart("");
                            setFilterDateEnd("");
                          }}
                          className="h-10 px-4 flex items-center justify-center bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-xl text-sm font-bold transition-all whitespace-nowrap"
                        >
                          Limpiar
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {(() => {
                  let filteredSessions = sessions;
                  if (filterStatuses.length > 0) {
                    filteredSessions = filteredSessions.filter((s) =>
                      filterStatuses.includes(s.status),
                    );
                  }
                  if (filterDateStart) {
                    filteredSessions = filteredSessions.filter(
                      (s) => s.date >= filterDateStart,
                    );
                  }
                  if (filterDateEnd) {
                    filteredSessions = filteredSessions.filter(
                      (s) => s.date <= filterDateEnd,
                    );
                  }

                  if (sessionSearchQuery.trim()) {
                    const query = sessionSearchQuery.toLowerCase().trim();
                    filteredSessions = filteredSessions.filter((s) => {
                      const actName =
                        activities
                          .find((a) => a.id === s.activityId)
                          ?.name?.toLowerCase() || "";
                      const notes = s.notes?.toLowerCase() || "";
                      const justification =
                        s.justification?.toLowerCase() || "";
                      return (
                        actName.includes(query) ||
                        notes.includes(query) ||
                        justification.includes(query)
                      );
                    });
                  }

                  filteredSessions.sort(
                    (a, b) =>
                      new Date(b.date).getTime() - new Date(a.date).getTime(),
                  );

                  const totalPages = Math.ceil(
                    filteredSessions.length / SESSIONS_PER_PAGE,
                  );
                  const paginatedSessions = filteredSessions.slice(
                    (sessionCurrentPage - 1) * SESSIONS_PER_PAGE,
                    sessionCurrentPage * SESSIONS_PER_PAGE,
                  );

                  if (sessions.length === 0) {
                    return (
                      <div className="bg-white/40 dark:bg-zinc-900/40 rounded-[2rem] border border-dashed border-zinc-300 dark:border-zinc-700 p-16 text-center">
                        <CalendarDays className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
                        <p className="text-zinc-500 dark:text-zinc-400 font-medium">
                          Aún no hay registros de clases.
                        </p>
                      </div>
                    );
                  }

                  if (filteredSessions.length === 0) {
                    return (
                      <div className="bg-white/40 dark:bg-zinc-900/40 rounded-[2rem] border border-dashed border-zinc-300 dark:border-zinc-700 p-16 text-center">
                        <Activity className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
                        <p className="text-zinc-500 dark:text-zinc-400 font-medium">
                          Ninguna clase coincide con los filtros.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="flex flex-col gap-3"
                    >
                      {paginatedSessions.map((session) => {
                        const activity = activities.find(
                          (a) => a.id === session.activityId,
                        );
                        return (
                          <motion.div
                            key={session.id}
                            variants={cardVariants}
                            className="relative group rounded-3xl overflow-hidden shadow-sm"
                          >
                            {!editingSessionId && (
                              <div className="absolute inset-y-0 right-0 flex items-center justify-end px-4 gap-2 bg-gradient-to-l from-rose-100/50 to-transparent dark:from-rose-900/20 w-full sm:hidden">
                                <button
                                  onClick={() => startEditingSession(session)}
                                  className="p-3 bg-white dark:bg-zinc-800 rounded-2xl text-zinc-700 dark:text-zinc-200 shadow-sm transition-all active:scale-95"
                                >
                                  <Pencil className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => deleteSession(session.id)}
                                  className="p-3 bg-rose-500 rounded-2xl text-white shadow-sm transition-all active:scale-95"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            )}

                            {editingSessionId === session.id ? (
                              <div className="flex flex-col p-4 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/50 dark:border-white/5 rounded-3xl gap-4">
                                <form
                                  onSubmit={handleEditSessionSubmit}
                                  className="flex flex-col gap-3"
                                >
                                  <div className="flex gap-2">
                                    <select
                                      required
                                      value={editSessionActId}
                                      onChange={(e) =>
                                        setEditSessionActId(e.target.value)
                                      }
                                      className="w-full bg-zinc-100/50 dark:bg-zinc-800/50 px-3 py-2 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-rose-500/50 transition-all text-zinc-900 dark:text-zinc-100"
                                    >
                                      <option value="" disabled hidden>
                                        Actividad...
                                      </option>
                                      {activities.map((a) => (
                                        <option key={a.id} value={a.id}>
                                          {a.name}
                                        </option>
                                      ))}
                                    </select>
                                    <div className="w-full relative">
                                      <input
                                        type="date"
                                        required
                                        value={editSessionDate}
                                        onChange={(e) =>
                                          setEditSessionDate(e.target.value)
                                        }
                                        style={{
                                          colorScheme: isDarkMode
                                            ? "dark"
                                            : "light",
                                        }}
                                        className="w-full max-w-full min-w-0 h-10 bg-zinc-100/50 dark:bg-zinc-800/50 px-3 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-rose-500/50 transition-all text-zinc-900 dark:text-zinc-100 appearance-none overflow-hidden text-ellipsis"
                                      />
                                      {editSessionDate &&
                                        hd.isHoliday(
                                          new Date(editSessionDate),
                                        ) && (
                                          <div className="absolute top-11 right-0 text-rose-500 flex items-center gap-1 text-[10px] bg-rose-500/10 px-2 py-0.5 rounded-md whitespace-nowrap z-10 w-max">
                                            <AlertCircle className="w-3 h-3" />
                                            Es festivo
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                  <div className="w-full">
                                    <label className="block text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1 mb-1">
                                      Horas de Clase
                                    </label>
                                    <input
                                      type="number"
                                      step="0.25"
                                      min="0"
                                      required
                                      placeholder="Horas..."
                                      value={editSessionDuration}
                                      onChange={(e) =>
                                        setEditSessionDuration(
                                          Number(e.target.value),
                                        )
                                      }
                                      className="w-full max-w-full min-w-0 h-10 bg-zinc-100/50 dark:bg-zinc-800/50 px-3 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-rose-500/50 transition-all text-zinc-900 dark:text-zinc-100 appearance-none"
                                    />
                                  </div>
                                  <div className="bg-zinc-100 dark:bg-zinc-800/80 p-1.5 rounded-[1.25rem] flex flex-col sm:flex-row gap-1 shadow-inner border border-zinc-200/50 dark:border-zinc-700/50">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditSessionStatus("held")
                                      }
                                      className={`flex-1 py-1 px-1 text-[10px] sm:text-xs font-bold uppercase tracking-wide rounded-xl transition-all flex flex-col items-center justify-center min-h-[48px] text-center ${editSessionStatus === "held" ? "bg-white dark:bg-zinc-700 shadow-sm text-emerald-600 dark:text-emerald-400" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
                                    >
                                      Realizada
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditSessionStatus("cancelled_billed")
                                      }
                                      className={`flex-1 py-1 px-1 text-[10px] sm:text-xs font-bold uppercase tracking-wide rounded-xl transition-all flex flex-col items-center justify-center min-h-[48px] leading-tight text-center ${editSessionStatus === "cancelled_billed" ? "bg-white dark:bg-zinc-700 shadow-sm text-amber-600 dark:text-amber-400" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
                                    >
                                      <span className="block">
                                        No Realizada
                                      </span>
                                      <span className="block text-[8px] sm:text-[9px] opacity-80 mt-0.5">
                                        (Se cobra)
                                      </span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditSessionStatus(
                                          "cancelled_unbilled",
                                        )
                                      }
                                      className={`flex-1 py-1 px-1 text-[10px] sm:text-xs font-bold uppercase tracking-wide rounded-xl transition-all flex flex-col items-center justify-center min-h-[48px] leading-tight text-center ${editSessionStatus === "cancelled_unbilled" ? "bg-white dark:bg-zinc-700 shadow-sm text-rose-600 dark:text-rose-400" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
                                    >
                                      <span className="block">
                                        No Realizada
                                      </span>
                                      <span className="block text-[8px] sm:text-[9px] opacity-80 mt-0.5">
                                        (No cobra)
                                      </span>
                                    </button>
                                  </div>
                                  {editSessionStatus !==
                                  "cancelled_unbilled" ? (
                                    <div className="flex flex-col gap-2">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setShowAttendeesModal("edit")
                                        }
                                        className="w-full h-10 flex items-center justify-between px-3 bg-zinc-100/50 dark:bg-zinc-800/50 rounded-xl text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors"
                                      >
                                        <span>
                                          {editSessionAttendeeIds.length > 0
                                            ? `${editSessionAttendeeIds.length} seleccionados`
                                            : "Asistentes"}
                                        </span>
                                        <User className="w-3.5 h-3.5" />
                                      </button>
                                      <input
                                        type="text"
                                        placeholder="Notas"
                                        value={editSessionNotes}
                                        onChange={(e) =>
                                          setEditSessionNotes(e.target.value)
                                        }
                                        className="w-full bg-zinc-100/50 dark:bg-zinc-800/50 px-3 py-2 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-rose-500/50 transition-all text-zinc-900 dark:text-zinc-100"
                                      />
                                      {editSessionStatus ===
                                        "cancelled_billed" && (
                                        <input
                                          type="text"
                                          required
                                          placeholder="Motivo"
                                          value={editSessionJustification}
                                          onChange={(e) =>
                                            setEditSessionJustification(
                                              e.target.value,
                                            )
                                          }
                                          className="w-full bg-zinc-100/50 dark:bg-zinc-800/50 px-3 py-2 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-rose-500/50 transition-all text-zinc-900 dark:text-zinc-100"
                                        />
                                      )}
                                    </div>
                                  ) : (
                                    <input
                                      type="text"
                                      required
                                      placeholder="Motivo"
                                      value={editSessionJustification}
                                      onChange={(e) =>
                                        setEditSessionJustification(
                                          e.target.value,
                                        )
                                      }
                                      className="w-full bg-zinc-100/50 dark:bg-zinc-800/50 px-3 py-2 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-rose-500/50 transition-all text-zinc-900 dark:text-zinc-100"
                                    />
                                  )}
                                  <div className="flex justify-end gap-2 mt-1">
                                    <button
                                      type="button"
                                      onClick={() => setEditingSessionId(null)}
                                      className="px-3 py-1.5 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                                    >
                                      <X className="w-3.5 h-3.5" /> Cancelar
                                    </button>
                                    <button
                                      type="submit"
                                      className="px-3 py-1.5 bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white shadow-md shadow-rose-500/20 text-xs font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-1"
                                    >
                                      <Save className="w-3.5 h-3.5" /> Guardar
                                    </button>
                                  </div>
                                </form>
                              </div>
                            ) : (
                              <motion.div
                                drag="x"
                                dragConstraints={{ left: -120, right: 0 }}
                                dragElastic={0.1}
                                className="relative flex flex-col p-4 sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 sm:bg-white/60 sm:dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/50 dark:border-white/5 rounded-3xl z-10 hover:border-zinc-300 dark:hover:border-white/10 transition-colors"
                              >
                                <div className="flex items-center gap-3 sm:gap-4 pr-10 sm:pr-0">
                                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 border border-zinc-200/50 dark:border-zinc-700/50">
                                    <span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 tracking-widest uppercase">
                                      {new Date(
                                        session.date,
                                      ).toLocaleDateString("es-ES", {
                                        month: "short",
                                      })}
                                    </span>
                                    <span className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white leading-none mt-0.5">
                                      {activity?.paymentType === "monthly"
                                        ? new Date(session.date).getFullYear()
                                        : new Date(session.date).getDate()}
                                    </span>
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-zinc-900 dark:text-white text-sm sm:text-base leading-tight">
                                      {activity ? (
                                        activity.name
                                      ) : (
                                        <span className="text-zinc-400 italic">
                                          Desconocida
                                        </span>
                                      )}
                                    </h4>
                                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1 sm:mt-1.5">
                                      {activity && (
                                        <span className="text-[11px] sm:text-xs font-semibold text-zinc-500 flex items-center">
                                          <MapPin className="w-3 h-3 mr-1" />{" "}
                                          {activity.location}
                                        </span>
                                      )}
                                      {session.status === "held" &&
                                        session.attendeeIds &&
                                        session.attendeeIds.length > 0 && (
                                          <div className="relative group/attendees flex items-center">
                                            <span className="text-[11px] sm:text-xs font-semibold text-zinc-500 flex items-center cursor-help">
                                              <User className="w-3 h-3 mx-1" />{" "}
                                              {session.attendeeIds.length}
                                            </span>
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] p-2 bg-zinc-900 dark:bg-white text-zinc-100 dark:text-zinc-900 text-xs rounded-xl shadow-xl opacity-0 invisible group-hover/attendees:opacity-100 group-hover/attendees:visible transition-all z-20 pointer-events-none">
                                              <div className="font-bold mb-1 border-b border-zinc-700 dark:border-zinc-200 pb-1">
                                                Asistentes:
                                              </div>
                                              <div className="flex flex-col gap-0.5 mt-1 max-h-32 overflow-y-auto hidden-scrollbar">
                                                {session.attendeeIds.map(
                                                  (id) => {
                                                    const student =
                                                      students.find(
                                                        (s) => s.id === id,
                                                      );
                                                    return (
                                                      <span
                                                        key={id}
                                                        className="truncate"
                                                      >
                                                        {student?.name ||
                                                          "Alumno eliminado"}
                                                      </span>
                                                    );
                                                  },
                                                )}
                                              </div>
                                              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-zinc-900 dark:border-t-white"></div>
                                            </div>
                                          </div>
                                        )}

                                      {session.status === "held" && (
                                        <span className="px-1.5 py-0.5 rounded-md text-[9px] uppercase tracking-widest font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                                          Realizadas
                                        </span>
                                      )}
                                      {session.status ===
                                        "cancelled_billed" && (
                                        <span className="px-1.5 py-0.5 rounded-md text-[9px] uppercase tracking-widest font-black bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                                          Canceladas (Cobra)
                                        </span>
                                      )}
                                      {session.status ===
                                        "cancelled_unbilled" && (
                                        <span className="px-1.5 py-0.5 rounded-md text-[9px] uppercase tracking-widest font-black bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400">
                                          Canceladas (No Cobra)
                                        </span>
                                      )}
                                      <span className="px-2 py-0.5 rounded-md text-[10px] uppercase tracking-widest font-black bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400 whitespace-nowrap flex items-center gap-1 shadow-sm">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="10"
                                          height="10"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          className="lucide lucide-clock"
                                        >
                                          <circle cx="12" cy="12" r="10" />
                                          <polyline points="12 6 12 12 16 14" />
                                        </svg>
                                        {session.duration ?? 1}{" "}
                                        {session.duration === 1
                                          ? "hora"
                                          : "horas"}
                                      </span>
                                    </div>
                                    {session.justification && (
                                      <p className="text-[11px] sm:text-xs font-medium text-zinc-400 mt-1.5 sm:mt-2 flex items-center">
                                        <Info className="w-3 h-3 mr-1 flex-shrink-0" />{" "}
                                        <span className="truncate max-w-[180px] sm:max-w-xs">
                                          {session.justification}
                                        </span>
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between sm:flex-col sm:items-end pl-14 sm:pl-0 pt-3 sm:pt-0 border-t border-zinc-100 dark:border-zinc-800/50 sm:border-0 relative">
                                  {activity ? (
                                    session.status === "cancelled_unbilled" ? (
                                      <div className="text-base sm:text-lg font-black text-zinc-300 dark:text-zinc-700 mt-2 sm:mt-0">
                                        -
                                      </div>
                                    ) : activity.paymentType === "monthly" ? (
                                      <div className="text-base sm:text-lg font-black text-zinc-400 dark:text-zinc-600 mt-2 sm:mt-0">
                                        Mensual
                                      </div>
                                    ) : (
                                      <div className="text-base sm:text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-rose-500 to-fuchsia-600 mt-2 sm:mt-0">
                                        +{activity.pricePerClass.toFixed(2)}€
                                      </div>
                                    )
                                  ) : (
                                    <div className="text-base sm:text-lg font-black text-zinc-300 dark:text-zinc-700 mt-2 sm:mt-0">
                                      -
                                    </div>
                                  )}
                                </div>

                                <div className="hidden absolute top-1/2 -translate-y-1/2 right-4 transition-opacity gap-2 sm:flex sm:opacity-0 sm:group-hover:opacity-100">
                                  <button
                                    onClick={() => startEditingSession(session)}
                                    className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 p-2.5 rounded-2xl transition-all shadow-sm active:scale-95 hover:shadow-md"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteSession(session.id)}
                                    className="text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-white bg-rose-50 dark:bg-rose-500/10 p-2.5 rounded-2xl shadow-sm transition-all active:scale-95 hover:shadow-md"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </motion.div>
                        );
                      })}

                      {totalPages > 0 && (
                        <div className="flex justify-center items-center gap-2 mt-4 pb-2">
                          <button
                            onClick={() =>
                              setSessionCurrentPage((p) => Math.max(1, p - 1))
                            }
                            disabled={sessionCurrentPage === 1}
                            className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-bold shadow-sm disabled:opacity-50 transition-all active:scale-95 border border-zinc-200 dark:border-zinc-700"
                          >
                            Anterior
                          </button>
                          <span className="text-zinc-500 dark:text-zinc-400 text-sm font-bold px-2">
                            {sessionCurrentPage} / {totalPages}
                          </span>
                          <button
                            onClick={() =>
                              setSessionCurrentPage((p) =>
                                Math.min(totalPages, p + 1),
                              )
                            }
                            disabled={sessionCurrentPage === totalPages}
                            className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-bold shadow-sm disabled:opacity-50 transition-all active:scale-95 border border-zinc-200 dark:border-zinc-700"
                          >
                            Siguiente
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })()}
              </div>
            </motion.div>
          ) : activeTab === "alumnos" ? (
            <motion.div
              key="alumnos"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    Gestión de Alumnos
                  </h2>
                  <p className="text-sm text-zinc-500 font-medium">
                    Administra el listado completo de tus estudiantes
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingStudentId(null);
                      setEditStudentData({ name: "", phone: "", email: "", notes: "" });
                      setShowStudentModal("create");
                    }}
                    className="h-11 px-6 bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white text-sm font-bold rounded-2xl flex items-center gap-2 shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Nuevo Alumno</span>
                    <span className="sm:hidden">Nuevo</span>
                  </button>
                  <div className="relative flex-1 sm:w-64">
                    <input
                      type="text"
                      placeholder="Buscar alumno..."
                      value={studentSearchQuery}
                      onChange={(e) => {
                        setStudentSearchQuery(e.target.value);
                        setStudentCurrentPage(1);
                      }}
                      className="w-full h-11 pl-10 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200/50 dark:border-white/5 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-rose-500/50 transition-all text-zinc-700 dark:text-zinc-300 shadow-sm"
                    />
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(() => {
                  let filtered = students;
                  if (studentSearchQuery.trim()) {
                    const q = studentSearchQuery.toLowerCase().trim();
                    filtered = filtered.filter(s => 
                      s.name.toLowerCase().includes(q) || 
                      (s.email || "").toLowerCase().includes(q) ||
                      (s.phone || "").includes(q)
                    );
                  }

                  const totalPages = Math.ceil(filtered.length / STUDENTS_PER_PAGE);
                  const startIndex = (studentCurrentPage - 1) * STUDENTS_PER_PAGE;
                  const paginated = filtered.slice(startIndex, startIndex + STUDENTS_PER_PAGE);

                  if (students.length === 0) {
                    return (
                      <div className="col-span-full py-16 text-center bg-white/40 dark:bg-zinc-900/40 rounded-[2.5rem] border border-dashed border-zinc-300 dark:border-zinc-700">
                        <User className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                        <p className="text-zinc-500 font-medium">No has registrado ningún alumno.</p>
                      </div>
                    );
                  }

                  if (filtered.length === 0) {
                    return (
                      <div className="col-span-full py-16 text-center">
                        <p className="text-zinc-500 font-medium">No hay alumnos que coincidan con tu búsqueda.</p>
                      </div>
                    );
                  }

                  return (
                    <>
                      {paginated.map((student) => (
                        <motion.div
                          key={student.id}
                          variants={cardVariants}
                          className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/50 dark:border-white/5 rounded-[2rem] p-5 flex flex-col gap-4 shadow-sm hover:border-rose-500/30 transition-all relative group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-50 to-fuchsia-50 dark:from-rose-500/10 dark:to-fuchsia-500/10 flex items-center justify-center text-rose-500">
                              <User className="w-6 h-6" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-bold text-zinc-900 dark:text-white truncate">
                                {student.name}
                              </h3>
                              <div className="flex flex-col gap-0.5 mt-1">
                                {student.phone && (
                                  <span className="text-[11px] font-medium text-zinc-500 flex items-center gap-1">
                                    {student.phone}
                                  </span>
                                )}
                                {student.email && (
                                  <span className="text-[11px] font-medium text-zinc-500 flex items-center gap-1">
                                    {student.email}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {student.notes && (
                            <div className="bg-zinc-100/50 dark:bg-zinc-800/50 p-3 rounded-xl">
                              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium line-clamp-2 italic">
                                "{student.notes}"
                              </p>
                            </div>
                          )}

                          <div className="mt-auto flex items-center justify-between pt-2 border-t border-zinc-200/50 dark:border-white/5">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                               ID: {student.id.slice(0, 8)}
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setStudentHistoryId(student.id);
                                }}
                                className="p-2 text-blue-500 bg-blue-50 dark:bg-blue-500/10 rounded-xl hover:bg-blue-100 transition-colors"
                              >
                                <History className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingStudentId(student.id);
                                  setEditStudentData({
                                    name: student.name,
                                    phone: student.phone || "",
                                    email: student.email || "",
                                    notes: student.notes || "",
                                  });
                                  setShowStudentModal("edit");
                                }}
                                className="p-2 text-amber-500 bg-amber-50 dark:bg-amber-500/10 rounded-xl hover:bg-amber-100 transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteStudent(student.id)}
                                className="p-2 text-rose-500 bg-rose-50 dark:bg-rose-500/10 rounded-xl hover:bg-rose-100 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}

                      {totalPages > 1 && (
                        <div className="col-span-full flex justify-center items-center gap-3 mt-4">
                          <button
                            onClick={() => setStudentCurrentPage(p => Math.max(1, p - 1))}
                            disabled={studentCurrentPage === 1}
                            className="px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold disabled:opacity-50 transition-all active:scale-95"
                          >
                            Anterior
                          </button>
                          <span className="text-sm font-bold text-zinc-500">
                            {studentCurrentPage} / {totalPages}
                          </span>
                          <button
                            onClick={() => setStudentCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={studentCurrentPage === totalPages}
                            className="px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold disabled:opacity-50 transition-all active:scale-95"
                          >
                            Siguiente
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </motion.div>
          ) : activeTab === "perfil" ? (
            <motion.div
              key="perfil"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
            >
              <ProfileView
                isDarkMode={isDarkMode}
                setIsDarkMode={setIsDarkMode}
                profile={profile}
                setProfile={setProfile}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      {/* Student Modal (Create/Edit) */}
      <AnimatePresence>
        {showStudentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 10, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-zinc-200/50 dark:border-white/10"
            >
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <h3 className="font-black text-xl text-zinc-900 dark:text-white">
                  {showStudentModal === "create" ? "Nuevo Alumno" : "Editar Alumno"}
                </h3>
                <button
                  onClick={() => {
                    setShowStudentModal(null);
                    setEditingStudentId(null);
                  }}
                  className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (editStudentData.name.trim()) {
                    if (showStudentModal === "create") {
                      addStudent({
                        id: crypto.randomUUID(),
                        name: editStudentData.name.trim(),
                        phone: editStudentData.phone.trim(),
                        email: editStudentData.email.trim(),
                        notes: editStudentData.notes.trim(),
                      });
                    } else if (editingStudentId) {
                      editStudent(editingStudentId, {
                        name: editStudentData.name.trim(),
                        phone: editStudentData.phone.trim(),
                        email: editStudentData.email.trim(),
                        notes: editStudentData.notes.trim(),
                      });
                    }
                    setShowStudentModal(null);
                    setEditingStudentId(null);
                    setEditStudentData({ name: "", phone: "", email: "", notes: "" });
                  }
                }}
                className="p-6 space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={editStudentData.name}
                    onChange={(e) => setEditStudentData(d => ({ ...d, name: e.target.value }))}
                    className="w-full h-12 bg-zinc-100/50 dark:bg-zinc-800/50 px-4 rounded-2xl text-sm font-medium border-none outline-none focus:ring-2 focus:ring-rose-500/50 transition-all text-zinc-900 dark:text-zinc-100"
                    placeholder="Ej: Juan Pérez"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Teléfono</label>
                    <input
                      type="tel"
                      value={editStudentData.phone}
                      onChange={(e) => setEditStudentData(d => ({ ...d, phone: e.target.value }))}
                      className="w-full h-12 bg-zinc-100/50 dark:bg-zinc-800/50 px-4 rounded-2xl text-sm font-medium border-none outline-none focus:ring-2 focus:ring-rose-500/50 transition-all text-zinc-900 dark:text-zinc-100"
                      placeholder="600000000"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Email</label>
                    <input
                      type="email"
                      value={editStudentData.email}
                      onChange={(e) => setEditStudentData(d => ({ ...d, email: e.target.value }))}
                      className="w-full h-12 bg-zinc-100/50 dark:bg-zinc-800/50 px-4 rounded-2xl text-sm font-medium border-none outline-none focus:ring-2 focus:ring-rose-500/50 transition-all text-zinc-900 dark:text-zinc-100"
                      placeholder="alumno@email.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Notas / Observaciones</label>
                  <textarea
                    rows={3}
                    value={editStudentData.notes}
                    onChange={(e) => setEditStudentData(d => ({ ...d, notes: e.target.value }))}
                    className="w-full bg-zinc-100/50 dark:bg-zinc-800/50 px-4 py-3 rounded-2xl text-sm font-medium border-none outline-none focus:ring-2 focus:ring-rose-500/50 transition-all text-zinc-900 dark:text-zinc-100 resize-none"
                    placeholder="Detalles adicionales..."
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowStudentModal(null);
                      setEditingStudentId(null);
                    }}
                    className="flex-1 h-12 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-2 h-12 bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white font-bold rounded-2xl shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
                  >
                    {showStudentModal === "create" ? "Añadir Alumno" : "Guardar Cambios"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attendees Modal */}
      <AnimatePresence>
        {showAttendeesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 10, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
                  Asistentes
                </h3>
                <button
                  onClick={() => setShowAttendeesModal(null)}
                  className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 flex-1 overflow-y-auto">
                <div className="flex gap-2 mb-6">
                  <input
                    type="text"
                    placeholder="Nuevo asistente..."
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    className="flex-1 bg-zinc-100 dark:bg-zinc-800 px-4 py-3 rounded-xl border-none outline-none focus:ring-2 focus:ring-rose-500/50 text-zinc-900 dark:text-zinc-100 text-sm font-medium"
                  />
                  <button
                    onClick={() => {
                      if (newStudentName.trim()) {
                        const id = crypto.randomUUID();
                        addStudent({ id, name: newStudentName.trim() });
                        setNewStudentName("");
                        if (showAttendeesModal === "create") {
                          setSessionAttendeeIds([...sessionAttendeeIds, id]);
                        } else {
                          setEditSessionAttendeeIds([
                            ...editSessionAttendeeIds,
                            id,
                          ]);
                        }
                      }
                    }}
                    className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-3 rounded-xl font-bold flex items-center justify-center transition-transform active:scale-95"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2">
                  {students.length === 0 ? (
                    <p className="text-center text-sm text-zinc-500 py-4 font-medium">
                      No hay alumnos aún. Crealos arriba.
                    </p>
                  ) : (
                    students.map((student) => {
                      const isSelected =
                        showAttendeesModal === "create"
                          ? sessionAttendeeIds.includes(student.id)
                          : editSessionAttendeeIds.includes(student.id);

                      return (
                        <div
                          key={student.id}
                          className="flex items-center gap-3 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-800/20"
                        >
                          <button
                            onClick={() => {
                              if (showAttendeesModal === "create") {
                                setSessionAttendeeIds((prev) =>
                                  isSelected
                                    ? prev.filter((id) => id !== student.id)
                                    : [...prev, student.id],
                                );
                              } else {
                                setEditSessionAttendeeIds((prev) =>
                                  isSelected
                                    ? prev.filter((id) => id !== student.id)
                                    : [...prev, student.id],
                                );
                              }
                            }}
                            className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center transition-colors border ${isSelected ? "bg-rose-500 border-rose-500 text-white" : "bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600"}`}
                          >
                            {isSelected && <CheckCircle2 className="w-4 h-4" />}
                          </button>
                          <div className="flex-1 flex flex-col min-w-0">
                            <span className="font-medium text-base text-zinc-900 dark:text-zinc-100 truncate">
                              {student.name}
                            </span>
                            {(student.phone ||
                              student.email ||
                              student.notes) && (
                              <span className="text-xs text-zinc-500 truncate">
                                {[student.phone, student.email, student.notes]
                                  .filter(Boolean)
                                  .join(" • ")}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30">
                <button
                  onClick={() => setShowAttendeesModal(null)}
                  className="w-full py-4 bg-rose-500 text-white font-bold rounded-2xl shadow-lg shadow-rose-500/20 active:scale-[0.98] transition-transform"
                >
                  Terminar Selección
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {studentHistoryId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-zinc-200/50 dark:border-white/10"
            >
              {(() => {
                const student = students.find((s) => s.id === studentHistoryId);
                if (!student) return null;

                // Encontrar sesiones de este usuario ordenadas por fecha descendente
                const studentSessions = sessions
                  .filter((s) => s.attendeeIds?.includes(student.id))
                  .sort(
                    (a, b) =>
                      new Date(b.date).getTime() - new Date(a.date).getTime(),
                  );

                // Agrupar contador por actividad
                const activityCounts = studentSessions.reduce(
                  (acc, session) => {
                    if (session.status !== "held") return acc;
                    acc[session.activityId] =
                      (acc[session.activityId] || 0) + 1;
                    return acc;
                  },
                  {} as Record<string, number>,
                );

                return (
                  <>
                    <div className="p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/20">
                      <div>
                        <h2 className="text-xl font-black text-zinc-900 dark:text-white capitalize">
                          {student.name}
                        </h2>
                        <p className="text-sm font-medium text-zinc-500 mt-1">
                          {studentSessions.length}{" "}
                          {studentSessions.length === 1
                            ? "clase asistida"
                            : "clases registradas"}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setStudentHistoryId(null);
                          setStudentHistoryPage(1);
                          setStudentHistorySearchQuery("");
                        }}
                        className="w-10 h-10 flex items-center justify-center bg-zinc-200/50 dark:bg-zinc-800 rounded-full text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="overflow-y-auto p-4 sm:p-6 space-y-6 bg-zinc-50/30 dark:bg-zinc-900/30">
                      {/* Resumen por Actividad */}
                      {Object.keys(activityCounts).length > 0 && (
                        <div className="space-y-3">
                          <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-2">
                            Asistencia por Actividad
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(activityCounts).map(
                              ([actId, count]) => {
                                const act = activities.find(
                                  (a) => a.id === actId,
                                );
                                if (!act) return null;
                                return (
                                  <div
                                    key={actId}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-semibold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/50"
                                  >
                                    <span className="truncate max-w-[120px]">
                                      {act.name}
                                    </span>
                                    <span className="text-rose-500 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded-md text-xs">
                                      {count}
                                    </span>
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </div>
                      )}

                      {/* Listado de Sesiones */}
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center">
                          <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-2">
                            Historial de Clases
                          </h3>
                          <input
                            type="text"
                            placeholder="Buscar clase..."
                            value={studentHistorySearchQuery}
                            onChange={(e) => {
                              setStudentHistorySearchQuery(e.target.value);
                              setStudentHistoryPage(1);
                            }}
                            className="w-full sm:w-auto h-8 bg-white dark:bg-zinc-800 px-3 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-rose-500/50 transition-all text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 m-0 block"
                          />
                        </div>
                        {studentSessions.length === 0 ? (
                          <div className="text-center p-8 bg-zinc-100/50 dark:bg-zinc-800/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700">
                            <p className="text-sm font-medium text-zinc-500">
                              Aún no tiene clases registradas.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {(() => {
                              let filteredStudentSessions = studentSessions;
                              if (studentHistorySearchQuery.trim()) {
                                const query = studentHistorySearchQuery
                                  .toLowerCase()
                                  .trim();
                                filteredStudentSessions =
                                  filteredStudentSessions.filter((s) => {
                                    const actName =
                                      activities
                                        .find((a) => a.id === s.activityId)
                                        ?.name?.toLowerCase() || "";
                                    return (
                                      actName.includes(query) ||
                                      (s.notes || "")
                                        .toLowerCase()
                                        .includes(query)
                                    );
                                  });
                              }

                              const totalStudentPages = Math.ceil(
                                filteredStudentSessions.length / 6,
                              );
                              const paginatedStudentSessions =
                                filteredStudentSessions.slice(
                                  (studentHistoryPage - 1) * 6,
                                  studentHistoryPage * 6,
                                );

                              return (
                                <>
                                  {paginatedStudentSessions.map((session) => {
                                    const activity = activities.find(
                                      (a) => a.id === session.activityId,
                                    );
                                    const isHeld = session.status === "held";
                                    const dateObj = new Date(session.date);
                                    const formattedDate =
                                      dateObj.toLocaleDateString("es-ES", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                      });

                                    return (
                                      <div
                                        key={session.id}
                                        className="flex items-center p-3 sm:p-4 bg-white dark:bg-zinc-800/80 rounded-2xl border border-zinc-200 dark:border-zinc-700/50 shadow-sm transition-all hover:shadow-md"
                                      >
                                        <div className="flex flex-col items-center justify-center w-12 h-12 bg-zinc-100 dark:bg-zinc-900 rounded-xl mr-3 sm:mr-4 border border-zinc-200 dark:border-zinc-700 flex-shrink-0">
                                          <span className="text-[10px] font-bold text-zinc-400 uppercase">
                                            {formattedDate.split(" ")[1]}
                                          </span>
                                          <span className="text-lg font-black text-zinc-700 dark:text-zinc-200 leading-none">
                                            {formattedDate.split(" ")[0]}
                                          </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                                            {activity?.name ||
                                              "Actividad Borrada"}
                                          </h4>
                                          <p className="text-xs font-semibold text-zinc-500 truncate mt-0.5">
                                            {isHeld
                                              ? "Realizada"
                                              : "No asistió"}
                                            {session.duration
                                              ? ` • ${session.duration} hora${session.duration !== 1 ? "s" : ""}`
                                              : " • 1 hora"}
                                            {session.notes &&
                                              ` • ${session.notes}`}
                                          </p>
                                        </div>
                                        <div className="ml-2 flex-shrink-0">
                                          {isHeld ? (
                                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                              <CheckCircle2 className="w-4 h-4" />
                                            </div>
                                          ) : (
                                            <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
                                              <X className="w-4 h-4" />
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}

                                  {totalStudentPages > 0 && (
                                    <div className="flex justify-center items-center gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800 mt-4">
                                      <button
                                        onClick={() =>
                                          setStudentHistoryPage((p) =>
                                            Math.max(1, p - 1),
                                          )
                                        }
                                        disabled={studentHistoryPage === 1}
                                        className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-bold shadow-sm disabled:opacity-50 transition-all hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                      >
                                        Anterior
                                      </button>
                                      <span className="text-zinc-500 dark:text-zinc-400 text-xs font-bold px-1">
                                        {studentHistoryPage} /{" "}
                                        {totalStudentPages}
                                      </span>
                                      <button
                                        onClick={() =>
                                          setStudentHistoryPage((p) =>
                                            Math.min(totalStudentPages, p + 1),
                                          )
                                        }
                                        disabled={
                                          studentHistoryPage ===
                                          totalStudentPages
                                        }
                                        className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-bold shadow-sm disabled:opacity-50 transition-all hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                      >
                                        Siguiente
                                      </button>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
