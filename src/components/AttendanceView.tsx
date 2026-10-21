import React, { useState, useMemo } from "react";
import { Activity, ClassSession, Student } from "../types";
import { CheckCircle2, XCircle, Search, Calendar as CalendarIcon, Users, Table as TableIcon, List as ListIcon, ChevronRight, ChevronLeft, Check, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { safeFormat, isValidDateStr } from "../lib/dateUtils";

// Clave de mes "yyyy-MM" a partir de la fecha de la sesión ("yyyy-MM-dd")
const monthKeyOf = (date: string | undefined | null): string | null => {
  if (!date) return null;
  if (/^\d{4}-\d{2}/.test(date)) return date.slice(0, 7);
  return isValidDateStr(date) ? safeFormat(date, "yyyy-MM") : null;
};

// "2026-10" -> "Octubre 2026"
const monthLabel = (key: string): string => {
  const [year, month] = key.split("-").map(Number);
  const label = format(new Date(year, month - 1, 1), "MMMM yyyy", { locale: es });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const StudentTableCard: React.FC<{
  student: Student;
  tableSessions: ClassSession[];
  activities: Activity[];
  selectedActivityId: string;
  toggleAttendanceTable: (sessionId: string, studentId: string) => void;
}> = ({
  student,
  tableSessions,
  activities,
  selectedActivityId,
  toggleAttendanceTable
}) => {
  // Meses que el usuario ha desplegado/plegado a mano
  const [toggledMonths, setToggledMonths] = useState<Set<string>>(new Set());

  // Filter sessions that only belong to activities the student is enrolled in, or if they actually attended
  const relevantSessions = useMemo(() => tableSessions.filter(s => {
    const isEnrolled = student.enrolledActivityIds?.includes(s.activityId);
    const hasAttended = Array.isArray(s.attendeeIds) && s.attendeeIds.includes(student.id);
    return isEnrolled || hasAttended;
  }), [tableSessions, student]);

  const isPresentIn = (s: ClassSession) => Array.isArray(s.attendeeIds) && s.attendeeIds.includes(student.id);

  const attendedCount = relevantSessions.filter(isPresentIn).length;
  const totalCount = relevantSessions.length;
  const attendancePercentage = totalCount > 0 ? Math.round((attendedCount / totalCount) * 100) : 0;

  // Agrupar las clases por mes (yyyy-MM), del más reciente al más antiguo
  const monthGroups = useMemo(() => {
    const groups = new Map<string, ClassSession[]>();
    for (const s of relevantSessions) {
      const key = monthKeyOf(s.date);
      if (!key) continue;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(s);
    }
    return Array.from(groups.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, monthSessions]) => {
        const attended = monthSessions.filter(isPresentIn).length;
        const total = monthSessions.length;
        return { key, sessions: monthSessions, attended, total, pct: total > 0 ? Math.round((attended / total) * 100) : 0 };
      });
  }, [relevantSessions, student.id]);

  // Todos los meses salen plegados; se despliegan al tocarlos
  const isMonthOpen = (key: string) => toggledMonths.has(key);
  const toggleMonth = (key: string) => {
    setToggledMonths(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm flex flex-col transition-all hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-900/50 group">
      <div className="flex justify-between items-start mb-5 pb-5 border-b border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-black text-lg text-zinc-400 shrink-0 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 group-hover:text-emerald-500 transition-colors">
            {student.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 pr-2">
            <h4 className="font-bold text-zinc-900 dark:text-white text-lg leading-tight truncate">{student.name}</h4>
            <span className="text-[11px] font-semibold text-zinc-400 mt-1 block tracking-wide uppercase">
              Asistencia
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end shrink-0 ml-3">
          <div className="flex items-baseline gap-1 text-emerald-500">
            <span className="text-2xl font-black leading-none">{attendedCount}</span>
            <span className="text-xs font-bold opacity-60">/ {totalCount}</span>
          </div>
          <div className="w-16 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${attendancePercentage}%` }} />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-1.5">
        {monthGroups.length === 0 && (
          <p className="text-xs font-medium text-zinc-400 py-2">Sin clases en este periodo.</p>
        )}
        {monthGroups.map(group => {
          const open = isMonthOpen(group.key);
          return (
            <div key={group.key} className="rounded-2xl">
              <button
                onClick={() => toggleMonth(group.key)}
                aria-expanded={open}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                  open ? "bg-zinc-50 dark:bg-zinc-800/60" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                }`}
              >
                <ChevronRight className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""}`} />
                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100 w-32 shrink-0 truncate">{monthLabel(group.key)}</span>
                <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden min-w-[40px]">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${group.pct}%` }} />
                </div>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 tabular-nums shrink-0 w-12 text-right">
                  {group.attended}<span className="font-bold opacity-60">/{group.total}</span>
                </span>
              </button>

              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-wrap gap-2 px-3 pt-2 pb-3 pl-10">
                      {group.sessions.map(session => {
                        const isPresent = isPresentIn(session);
                        const activityName = selectedActivityId === "all" ? activities.find(a => a.id === session.activityId)?.name || 'Clase' : '';
                        const dateStr = safeFormat(session.date, "dd/MM");
                        return (
                          <button
                            key={session.id}
                            onClick={() => toggleAttendanceTable(session.id, student.id)}
                            title={isPresent ? "Asistió · pulsa para quitar" : "No asistió · pulsa para marcar"}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all shadow-sm active:scale-95 ${
                              isPresent
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 ring-1 ring-emerald-200/50 dark:ring-emerald-800/50"
                                : "bg-zinc-50 text-zinc-400 dark:bg-zinc-800/30 dark:text-zinc-500 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-400 ring-1 ring-zinc-200/50 dark:ring-zinc-700/50"
                            }`}
                          >
                            {isPresent ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3 h-3 opacity-60" />}
                            <span>{dateStr}</span>
                            {activityName && <span className="opacity-60 max-w-[80px] truncate ml-0.5 font-medium">{activityName}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Alumnos de una clase en un periodo: inscritos en la clase o que asistieron a alguna de esas sesiones
const studentsInClass = (allStudents: Student[], activityId: string, classSessions: ClassSession[]) =>
  allStudents
    .filter(st =>
      st.enrolledActivityIds?.includes(activityId) ||
      classSessions.some(s => Array.isArray(s.attendeeIds) && s.attendeeIds.includes(st.id))
    )
    .sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));

const attendedIn = (s: ClassSession, studentId: string) => Array.isArray(s.attendeeIds) && s.attendeeIds.includes(studentId);

// ---------- Relación de Clases por clase ----------
type MonthStat = {
  key: string;
  sessions: ClassSession[]; // ordenadas por fecha
  rows: { student: Student; marks: boolean[]; attended: number }[];
  pct: number;
};

// Color según el nivel de asistencia
const levelOf = (pct: number) => (pct >= 80 ? "high" : pct >= 50 ? "mid" : "low");
const LEVEL = {
  high: { stroke: "stroke-emerald-500", bg: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", soft: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" },
  mid: { stroke: "stroke-amber-500", bg: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", soft: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" },
  low: { stroke: "stroke-rose-500", bg: "bg-rose-500", text: "text-rose-600 dark:text-rose-400", soft: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400" },
} as const;

const buildMonthStats = (activityId: string, classSessions: ClassSession[], allStudents: Student[]): MonthStat[] => {
  const groups = new Map<string, ClassSession[]>();
  classSessions.forEach(s => {
    const k = monthKeyOf(s.date);
    if (!k) return;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(s);
  });
  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, list]) => {
      const sessionsSorted = [...list].sort((a, b) => (a.date || "").localeCompare(b.date || "") || a.id.localeCompare(b.id));
      const rows = studentsInClass(allStudents, activityId, sessionsSorted).map(student => {
        const marks = sessionsSorted.map(s => attendedIn(s, student.id));
        return { student, marks, attended: marks.filter(Boolean).length };
      });
      const present = rows.reduce((acc, r) => acc + r.attended, 0);
      const possible = rows.length * sessionsSorted.length;
      return { key, sessions: sessionsSorted, rows, pct: possible > 0 ? Math.round((present / possible) * 100) : 0 };
    });
};

const shortMonth = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return format(new Date(y, m - 1, 1), "MMM", { locale: es }).replace(".", "");
};

// Anillo de porcentaje
const Ring: React.FC<{ pct: number; size?: number; stroke?: number; label?: boolean }> = ({ pct, size = 64, stroke = 7, label = true }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const lvl = LEVEL[levelOf(pct)];
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-zinc-100 dark:stroke-zinc-800" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round"
          className={lvl.stroke}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(100, Math.max(0, pct)) / 100)}
          style={{ transition: "stroke-dashoffset 600ms cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </svg>
      {label && (
        <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-zinc-900 dark:text-white tabular-nums">
          {pct}<span className="text-[10px] font-bold opacity-60">%</span>
        </span>
      )}
    </div>
  );
};

// Tarjeta de una clase (vista general). Sale plegada: al tocarla se despliega
// con el gráfico de los últimos meses y el acceso a la ficha de la clase.
const ClassOverviewCard: React.FC<{
  activity: Activity;
  months: MonthStat[]; // todos los meses de la clase, de más antiguo a más reciente
  currentKey: string;
  onOpen: (month: string) => void;
}> = ({ activity, months, currentKey, onOpen }) => {
  const [expanded, setExpanded] = useState(false);
  const idx = Math.max(0, months.findIndex(m => m.key === currentKey));
  const current = months[idx];
  const windowMonths = months.slice(Math.max(0, idx - 5), idx + 1);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`group bg-white dark:bg-zinc-900 border rounded-3xl shadow-sm transition-colors ${
        expanded ? "border-zinc-300 dark:border-zinc-700" : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
      }`}
    >
      <button
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
        className="w-full flex items-center gap-4 p-4 sm:p-5 text-left rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 active:scale-[0.99] transition-transform"
      >
        <Ring pct={current.pct} size={56} stroke={6} />
        <div className="flex-1 min-w-0">
          <h4 className="font-black text-zinc-900 dark:text-white text-lg leading-tight line-clamp-2">{activity.name}</h4>
          {activity.location && <p className="text-xs font-medium text-zinc-500 truncate mt-0.5">{activity.location}</p>}
          <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mt-1.5">
            {monthLabel(current.key)} · {current.sessions.length} {current.sessions.length === 1 ? "clase" : "clases"} · {current.rows.length} {current.rows.length === 1 ? "alumno" : "alumnos"}
          </p>
        </div>
        <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${expanded ? "bg-zinc-100 dark:bg-zinc-800" : "group-hover:bg-zinc-100 dark:group-hover:bg-zinc-800"}`}>
          <ChevronRight className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`} />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 pb-4 sm:pb-5">
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-end gap-2">
                {windowMonths.map(m => {
                  const isCurrent = m.key === current.key;
                  return (
                    <button
                      key={m.key}
                      onClick={() => onOpen(m.key)}
                      title={`${monthLabel(m.key)}: ${m.pct}% · ver ficha`}
                      className="flex-1 max-w-[48px] flex flex-col items-center gap-1 group/bar"
                    >
                      <span className={`text-[10px] font-black tabular-nums leading-none ${isCurrent ? LEVEL[levelOf(m.pct)].text : "text-zinc-400 dark:text-zinc-500"}`}>{m.pct}%</span>
                      <div className="w-full h-12 flex items-end rounded-md bg-zinc-50 dark:bg-zinc-800/40">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(6, m.pct)}%` }}
                          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                          className={`w-full rounded-md ${isCurrent ? LEVEL[levelOf(m.pct)].bg : "bg-zinc-300 dark:bg-zinc-600 group-hover/bar:bg-zinc-400 dark:group-hover/bar:bg-zinc-500"}`}
                        />
                      </div>
                      <span className={`text-[10px] font-bold uppercase ${isCurrent ? "text-zinc-800 dark:text-zinc-200" : "text-zinc-400"}`}>{shortMonth(m.key)}</span>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => onOpen(current.key)}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
              >
                Ver alumnos y asistencia <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Ficha de una clase: meses, cifras y alumnos
const ClassDetail: React.FC<{
  activity: Activity;
  months: MonthStat[];
  initialMonth: string;
  searchQuery: string;
  onBack: () => void;
  onOpenSheet: (month: string) => void;
  toggleAttendance: (sessionId: string, studentId: string) => void;
}> = ({ activity, months, initialMonth, searchQuery, onBack, onOpenSheet, toggleAttendance }) => {
  const [monthKey, setMonthKey] = useState(initialMonth);
  const [sortBy, setSortBy] = useState<"name" | "attendance">("name");
  const [openStudent, setOpenStudent] = useState<string | null>(null);
  const month = months.find(m => m.key === monthKey) ?? months[months.length - 1];
  const q = searchQuery.trim().toLowerCase();

  if (!month) return null;

  const n = month.sessions.length;
  const present = month.rows.reduce((acc, r) => acc + r.attended, 0);
  const avgPerClass = n > 0 ? present / n : 0;
  const rows = month.rows
    .filter(r => !q || r.student.name.toLowerCase().includes(q) || (r.student.email || "").toLowerCase().includes(q))
    .sort((a, b) => sortBy === "attendance"
      ? b.attended - a.attended || a.student.name.localeCompare(b.student.name, "es")
      : a.student.name.localeCompare(b.student.name, "es", { sensitivity: "base" }));

  const kpi = "flex flex-col justify-center rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} className="flex flex-col gap-4">
      <button onClick={onBack} className="self-start text-sm font-semibold text-rose-500 hover:text-rose-600 transition-colors">
        &larr; Todas las clases
      </button>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 md:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white leading-tight">{activity.name}</h3>
            {activity.location && <p className="text-sm font-medium text-zinc-500 mt-1">{activity.location}</p>}
          </div>
          <button
            onClick={() => onOpenSheet(month.key)}
            className="shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm"
          >
            <TableIcon className="w-4 h-4" /> Hoja del mes y compartir
          </button>
        </div>

        {/* Selector de meses */}
        <div className="flex gap-2 overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0 mt-5 pb-1 [scrollbar-width:none]">
          {[...months].reverse().map(m => {
            const active = m.key === month.key;
            const lvl = LEVEL[levelOf(m.pct)];
            return (
              <button
                key={m.key}
                onClick={() => { setMonthKey(m.key); setOpenStudent(null); }}
                className={`shrink-0 flex flex-col gap-1.5 px-3.5 py-2.5 rounded-2xl border text-left transition-all active:scale-95 ${
                  active
                    ? "bg-zinc-900 border-zinc-900 text-white dark:bg-white dark:border-white dark:text-zinc-900 shadow-sm"
                    : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                <span className="text-xs font-bold whitespace-nowrap">{monthLabel(m.key)}</span>
                <div className="flex items-center gap-2">
                  <div className={`w-12 h-1 rounded-full overflow-hidden ${active ? "bg-white/20 dark:bg-zinc-900/15" : "bg-zinc-100 dark:bg-zinc-800"}`}>
                    <div className={`h-full rounded-full ${lvl.bg}`} style={{ width: `${m.pct}%` }} />
                  </div>
                  <span className="text-[10px] font-black tabular-nums opacity-80">{m.pct}%</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Cifras del mes */}
        <AnimatePresence mode="wait">
          <motion.div
            key={month.key}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
              <div className={`${kpi} flex-row items-center gap-3`}>
                <Ring pct={month.pct} size={46} stroke={5} label={false} />
                <div>
                  <p className={`text-xl font-black tabular-nums leading-none ${LEVEL[levelOf(month.pct)].text}`}>{month.pct}%</p>
                  <p className="text-[11px] font-semibold text-zinc-500 mt-1">asistencia</p>
                </div>
              </div>
              <div className={kpi}>
                <p className="text-xl font-black text-zinc-900 dark:text-white tabular-nums leading-none">{n}</p>
                <p className="text-[11px] font-semibold text-zinc-500 mt-1">{n === 1 ? "clase" : "clases"}</p>
              </div>
              <div className={kpi}>
                <p className="text-xl font-black text-zinc-900 dark:text-white tabular-nums leading-none">{month.rows.length}</p>
                <p className="text-[11px] font-semibold text-zinc-500 mt-1">{month.rows.length === 1 ? "alumno" : "alumnos"}</p>
              </div>
              <div className={kpi}>
                <p className="text-xl font-black text-zinc-900 dark:text-white tabular-nums leading-none">{avgPerClass.toLocaleString("es-ES", { maximumFractionDigits: 1 })}</p>
                <p className="text-[11px] font-semibold text-zinc-500 mt-1">media por clase</p>
              </div>
            </div>

            {/* Alumnos */}
            <div className="flex items-center justify-between mt-6 mb-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Alumnos</p>
              <div className="flex bg-zinc-100 dark:bg-zinc-800/80 p-0.5 rounded-lg">
                {([["name", "A–Z"], ["attendance", "Asistencia"]] as const).map(([v, label]) => (
                  <button
                    key={v}
                    onClick={() => setSortBy(v)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                      sortBy === v ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {rows.length === 0 && (
              <p className="text-sm font-medium text-zinc-500 py-6 text-center">{q ? "Ningún alumno coincide con la búsqueda." : "No hay alumnos inscritos."}</p>
            )}

            <div className="flex flex-col">
              {rows.map(r => {
                const pct = n > 0 ? Math.round((r.attended / n) * 100) : 0;
                const lvl = LEVEL[levelOf(pct)];
                const isOpen = openStudent === r.student.id;
                return (
                  <motion.div layout="position" key={r.student.id} transition={{ duration: 0.2, ease: "easeOut" }} className="border-t border-zinc-100 dark:border-zinc-800/80 first:border-t-0">
                    <button
                      onClick={() => setOpenStudent(isOpen ? null : r.student.id)}
                      aria-expanded={isOpen}
                      className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-xl text-left transition-colors ${isOpen ? "bg-zinc-50 dark:bg-zinc-800/50" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/30"}`}
                    >
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${lvl.soft}`}>
                        {r.student.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="flex-1 min-w-0 truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100" title={r.student.name}>{r.student.name}</span>
                      <span className="hidden sm:flex items-center gap-1 shrink-0" aria-hidden>
                        {r.marks.map((m, i) => (
                          <span key={i} className={`w-2.5 h-2.5 rounded-full ${m ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-700"}`} />
                        ))}
                      </span>
                      <span className="text-xs font-black tabular-nums text-zinc-800 dark:text-zinc-100 shrink-0 w-9 text-right">
                        {r.attended}<span className="font-bold text-zinc-400">/{n}</span>
                      </span>
                      <span className={`text-[11px] font-black tabular-nums px-2 py-0.5 rounded-md shrink-0 w-12 text-center ${lvl.soft}`}>{pct}%</span>
                    </button>
                    {/* Puntos por día en móvil */}
                    {!isOpen && (
                      <div className="sm:hidden flex items-center gap-1 pl-[3.25rem] -mt-1 pb-2" aria-hidden>
                        {r.marks.map((m, i) => (
                          <span key={i} className={`w-2 h-2 rounded-full ${m ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-700"}`} />
                        ))}
                      </div>
                    )}
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-wrap gap-1.5 pl-[3.25rem] pr-2 pt-1 pb-3">
                            {month.sessions.map((s, i) => {
                              const present = r.marks[i];
                              return (
                                <button
                                  key={s.id}
                                  onClick={() => toggleAttendance(s.id, r.student.id)}
                                  title={present ? "Asistió · pulsa para quitar" : "No asistió · pulsa para marcar"}
                                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all active:scale-95 ${
                                    present
                                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/60"
                                      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                  }`}
                                >
                                  {present ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5 opacity-60" />}
                                  <span className="capitalize">{safeFormat(s.date, "EEE d", "")}</span>
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ---------- Imagen de la hoja del mes (para compartir) ----------
// Se dibuja a mano en un canvas: sale siempre igual, sin menús de la app y sin depender de librerías.
type SheetImageData = {
  activityName: string;
  location?: string;
  monthLabel: string;
  teacherName?: string;
  days: { weekday: string; day: string }[];
  rows: { name: string; marks: boolean[]; count: number }[];
  perDay: number[];
  totalPresent: number;
  pct: number;
};

const IMG_FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const fillRoundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
};

const fitText = (ctx: CanvasRenderingContext2D, text: string, maxW: number) => {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
  return t + "…";
};

const renderSheetImage = (d: SheetImageData): HTMLCanvasElement => {
  const scale = 2;
  const pad = 36, cell = 34, rowH = 38, totalW = 60, nameGap = 18;
  const m = document.createElement("canvas").getContext("2d")!;
  m.font = `600 15px ${IMG_FONT}`;
  const nameW = Math.min(280, Math.max(110, ...d.rows.map(r => m.measureText(r.name).width)));
  const tableW = nameW + nameGap + d.days.length * cell + totalW;
  m.font = `800 28px ${IMG_FONT}`;
  const titleW = Math.min(m.measureText(d.activityName).width, 900);
  const W = Math.ceil(Math.max(tableW, titleW, 440) + pad * 2);
  const headerH = 22 + 38 + (d.location ? 24 : 0) + 34 + 22;
  const H = Math.ceil(pad + headerH + 46 + d.rows.length * rowH + 46 + 36 + pad);

  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = "alphabetic";

  // Cabecera
  let y = pad + 12;
  ctx.fillStyle = "#e11d48";
  ctx.font = `800 12px ${IMG_FONT}`;
  ctx.fillText(`ASISTENCIA · ${d.monthLabel.toUpperCase()}`, pad, y);
  y += 36;
  ctx.fillStyle = "#18181b";
  ctx.font = `800 28px ${IMG_FONT}`;
  ctx.fillText(fitText(ctx, d.activityName, W - pad * 2), pad, y);
  if (d.location) {
    y += 24;
    ctx.fillStyle = "#71717a";
    ctx.font = `500 15px ${IMG_FONT}`;
    ctx.fillText(fitText(ctx, d.location, W - pad * 2), pad, y);
  }
  y += 32;
  ctx.fillStyle = "#3f3f46";
  ctx.font = `700 14px ${IMG_FONT}`;
  const n = d.days.length;
  ctx.fillText(`${n} ${n === 1 ? "clase" : "clases"} · ${d.rows.length} ${d.rows.length === 1 ? "alumno" : "alumnos"} · ${d.pct}% asistencia`, pad, y);
  y += 22;
  ctx.fillStyle = "#e4e4e7";
  ctx.fillRect(pad, y, W - pad * 2, 1);

  // Columnas
  const xName = pad;
  const xDays = pad + nameW + nameGap;
  const xTotalRight = xDays + n * cell + totalW;
  const colCenter = (i: number) => xDays + i * cell + cell / 2;

  // Cabecera de la tabla
  y += 22;
  ctx.fillStyle = "#a1a1aa";
  ctx.font = `700 11px ${IMG_FONT}`;
  ctx.textAlign = "left";
  ctx.fillText("ALUMNO", xName, y + 16);
  ctx.textAlign = "right";
  ctx.fillText("TOTAL", xTotalRight, y + 16);
  ctx.textAlign = "center";
  d.days.forEach((dd, i) => {
    ctx.fillStyle = "#a1a1aa";
    ctx.font = `700 10px ${IMG_FONT}`;
    ctx.fillText(dd.weekday.toUpperCase(), colCenter(i), y + 2);
    ctx.fillStyle = "#18181b";
    ctx.font = `800 15px ${IMG_FONT}`;
    ctx.fillText(dd.day, colCenter(i), y + 18);
  });
  y += 26;

  // Filas de alumnos
  d.rows.forEach(r => {
    ctx.fillStyle = "#f4f4f5";
    ctx.fillRect(pad, y, xTotalRight - pad, 1);
    const mid = y + rowH / 2;
    ctx.textAlign = "left";
    ctx.fillStyle = "#27272a";
    ctx.font = `600 15px ${IMG_FONT}`;
    ctx.fillText(fitText(ctx, r.name, nameW), xName, mid + 5);
    r.marks.forEach((present, i) => {
      const bx = colCenter(i) - 12, by = mid - 12;
      ctx.fillStyle = present ? "#10b981" : "#f4f4f5";
      fillRoundRect(ctx, bx, by, 24, 24, 6);
      if (present) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2.6;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(bx + 7, by + 12.5);
        ctx.lineTo(bx + 10.5, by + 16);
        ctx.lineTo(bx + 17.5, by + 8.5);
        ctx.stroke();
      }
    });
    ctx.textAlign = "right";
    ctx.font = `700 14px ${IMG_FONT}`;
    ctx.fillStyle = "#a1a1aa";
    const rest = `/${n}`;
    ctx.fillText(rest, xTotalRight, mid + 5);
    const restW = ctx.measureText(rest).width; // medido con la fuente de "/n"
    ctx.fillStyle = "#059669";
    ctx.font = `800 14px ${IMG_FONT}`;
    ctx.fillText(String(r.count), xTotalRight - restW, mid + 5);
    y += rowH;
  });

  // Fila de asistentes por día
  ctx.fillStyle = "#d4d4d8";
  ctx.fillRect(pad, y, xTotalRight - pad, 2);
  y += 28;
  ctx.textAlign = "left";
  ctx.fillStyle = "#a1a1aa";
  ctx.font = `700 11px ${IMG_FONT}`;
  ctx.fillText("ASISTENTES", xName, y);
  ctx.fillStyle = "#18181b";
  ctx.font = `800 14px ${IMG_FONT}`;
  ctx.textAlign = "center";
  d.perDay.forEach((c, i) => ctx.fillText(String(c), colCenter(i), y));
  ctx.textAlign = "right";
  ctx.fillText(String(d.totalPresent), xTotalRight, y);

  // Pie
  y += 36;
  ctx.textAlign = "left";
  ctx.fillStyle = "#a1a1aa";
  ctx.font = `500 11px ${IMG_FONT}`;
  const credit = ["SalsaNova", d.teacherName, `generado el ${format(new Date(), "dd/MM/yyyy")}`].filter(Boolean).join(" · ");
  ctx.fillText(credit, pad, y);

  // Recortar el espacio sobrante de abajo
  const finalH = Math.ceil(y + pad - 8);
  if (finalH < H) {
    const cropped = document.createElement("canvas");
    cropped.width = W * scale;
    cropped.height = finalH * scale;
    cropped.getContext("2d")!.drawImage(canvas, 0, 0);
    return cropped;
  }
  return canvas;
};

const canShareImages = (() => {
  try {
    const nav = navigator as any;
    return !!(nav.canShare && nav.canShare({ files: [new File([new Uint8Array(1)], "x.png", { type: "image/png" })] }));
  } catch {
    return false;
  }
})();

// Abre el menú de compartir del móvil con la imagen; si no se puede, la descarga.
// Ojo: todo hasta navigator.share es síncrono para no perder el "toque" del usuario (Safari lo exige).
const shareSheetImage = async (d: SheetImageData, fileName: string): Promise<"shared" | "cancelled" | "downloaded"> => {
  const dataUrl = renderSheetImage(d).toDataURL("image/png");
  const nav = navigator as any;
  if (canShareImages) {
    const bin = atob(dataUrl.split(",")[1]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const file = new File([bytes], fileName, { type: "image/png" });
    try {
      await nav.share({ files: [file], title: fileName.replace(/\.png$/, "") });
      return "shared";
    } catch (e: any) {
      if (e?.name === "AbortError") return "cancelled";
      // Si el navegador lo rechaza por otro motivo, se descarga
    }
  }
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  return "downloaded";
};

// Selector de mes con flechas (anterior / siguiente)
const MonthStepper: React.FC<{ label: string; onPrev?: () => void; onNext?: () => void }> = ({ label, onPrev, onNext }) => (
  <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl w-full sm:w-auto">
    <button
      onClick={onPrev}
      disabled={!onPrev}
      aria-label="Mes anterior"
      className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
    >
      <ChevronLeft className="w-4 h-4" />
    </button>
    <span className="flex-1 sm:w-40 text-center text-sm font-bold text-zinc-900 dark:text-white">{label}</span>
    <button
      onClick={onNext}
      disabled={!onNext}
      aria-label="Mes siguiente"
      className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
    >
      <ChevronRight className="w-4 h-4" />
    </button>
  </div>
);

export const AttendanceView = ({
  activities,
  sessions,
  students,
  editSession,
  teacherName
}: {
  activities: Activity[];
  sessions: ClassSession[];
  students: Student[];
  editSession: (id: string, updates: Partial<ClassSession>) => void;
  teacherName?: string;
}) => {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"pass" | "table">("pass");
  const [selectedActivityId, setSelectedActivityId] = useState<string>("all");

  // La Relación de Clases agrupa por mes, así que por defecto se muestran todos los meses
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    sessions.forEach(s => {
      const key = monthKeyOf(s.date);
      if (key) months.add(key);
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [sessions]);

  // ---------- Pasar Lista: una tarjeta por clase y mes ----------
  const heldSessions = useMemo(() => sessions.filter(s => s.status === "held"), [sessions]);
  const todayKey = format(new Date(), "yyyy-MM");

  // Meses navegables en Pasar Lista: los que tienen clases realizadas + el mes actual
  const passMonths = useMemo(() => {
    const months = new Set<string>([todayKey]);
    heldSessions.forEach(s => { const k = monthKeyOf(s.date); if (k) months.add(k); });
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [heldSessions, todayKey]);

  const [passMonth, setPassMonth] = useState<string>(() => {
    const months = Array.from(new Set(sessions.filter(s => s.status === "held").map(s => monthKeyOf(s.date)).filter(Boolean) as string[]))
      .sort((a, b) => b.localeCompare(a));
    if (months.includes(todayKey)) return todayKey;
    return months.find(m => m <= todayKey) ?? months[0] ?? todayKey;
  });

  // Hoja mensual abierta (clase + mes)
  const [sheet, setSheet] = useState<{ activityId: string; month: string; from?: "table" } | null>(null);

  // Alumnos que salen en la hoja de una clase/mes: inscritos en la clase o que asistieron algún día de ese mes
  const studentsForSheet = (activityId: string, monthSessions: ClassSession[]) =>
    studentsInClass(students, activityId, monthSessions);

  // Relación de Clases: por clase (por defecto) o por alumno
  const [relationBy, setRelationBy] = useState<"clase" | "alumno">("clase");
  // Ficha de clase abierta en la Relación de Clases
  const [relationClass, setRelationClass] = useState<{ activityId: string; month: string } | null>(null);

  // Estadísticas por clase y mes (todas las clases realizadas)
  const classStats = useMemo(() => {
    const byActivity = new Map<string, ClassSession[]>();
    heldSessions.forEach(s => {
      if (!byActivity.has(s.activityId)) byActivity.set(s.activityId, []);
      byActivity.get(s.activityId)!.push(s);
    });
    return Array.from(byActivity.entries())
      .map(([activityId, list]) => ({ activity: activities.find(a => a.id === activityId), months: buildMonthStats(activityId, list, students) }))
      .filter((g): g is { activity: Activity; months: MonthStat[] } => !!g.activity && g.months.length > 0)
      .sort((a, b) => a.activity.name.localeCompare(b.activity.name, "es"));
  }, [heldSessions, activities, students]);
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  const sortByDate = (a: ClassSession, b: ClassSession) => {
    const byDate = (a.date || "").localeCompare(b.date || "");
    return byDate !== 0 ? byDate : a.id.localeCompare(b.id);
  };

  const monthCards = useMemo(() => {
    const byActivity = new Map<string, ClassSession[]>();
    heldSessions.forEach(s => {
      if (monthKeyOf(s.date) !== passMonth) return;
      if (!byActivity.has(s.activityId)) byActivity.set(s.activityId, []);
      byActivity.get(s.activityId)!.push(s);
    });
    return Array.from(byActivity.entries())
      .map(([activityId, monthSessions]) => {
        const activity = activities.find(a => a.id === activityId);
        if (!activity) return null;
        const sorted = [...monthSessions].sort(sortByDate);
        const rows = studentsForSheet(activityId, sorted);
        const present = sorted.reduce((acc, s) => acc + rows.filter(st => s.attendeeIds?.includes(st.id)).length, 0);
        const possible = rows.length * sorted.length;
        return {
          activity,
          sessions: sorted,
          studentCount: rows.length,
          pct: possible > 0 ? Math.round((present / possible) * 100) : 0,
          pending: sorted.filter(s => !s.attendanceCompleted),
        };
      })
      .filter(Boolean)
      .sort((a, b) => a!.activity.name.localeCompare(b!.activity.name, "es")) as {
        activity: Activity; sessions: ClassSession[]; studentCount: number; pct: number; pending: ClassSession[];
      }[];
  }, [heldSessions, passMonth, activities, students]);

  // Clases pendientes de pasar lista en otros meses (para no perderlas de vista)
  const pendingOtherMonths = useMemo(() => {
    const counts = new Map<string, number>();
    heldSessions.forEach(s => {
      const k = monthKeyOf(s.date);
      if (!k || k === passMonth || s.attendanceCompleted || !activities.some(a => a.id === s.activityId)) return;
      counts.set(k, (counts.get(k) || 0) + 1);
    });
    return Array.from(counts.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [heldSessions, passMonth, activities]);

  const shiftMonth = (list: string[], current: string, dir: -1 | 1) => {
    // list está ordenada de más reciente a más antiguo: "anterior" = índice + 1
    const i = list.indexOf(current);
    const next = list[i - dir];
    return next ?? null;
  };

  const tableSessions = useMemo(() => {
    let s = [...sessions].filter(s => s.status === "held");
    if (selectedActivityId !== "all") {
      s = s.filter(s => s.activityId === selectedActivityId);
    }
    if (selectedMonth !== "all") {
      s = s.filter(s => monthKeyOf(s.date) === selectedMonth);
    }
    return s.sort((a, b) => {
      const da = isValidDateStr(a.date) ? new Date(a.date!).getTime() : 0;
      const db = isValidDateStr(b.date) ? new Date(b.date!).getTime() : 0;
      return da - db;
    });
  }, [sessions, selectedActivityId, selectedMonth]);

  const selectedSession = sessions.find(s => s.id === selectedSessionId);
  const selectedActivity = activities.find(a => a.id === selectedSession?.activityId);

  const toggleStudentAttendance = (studentId: string) => {
    if (!selectedSession) return;
    
    const currentAttendees = Array.isArray(selectedSession.attendeeIds) ? selectedSession.attendeeIds : [];
    
    const newAttendees = currentAttendees.includes(studentId)
      ? currentAttendees.filter(id => id !== studentId)
      : [...currentAttendees, studentId];
    
    const nonStudentAttendees = currentAttendees.filter(id => !students.some(s => s.id === id));
    
    const finalAttendees = Array.from(new Set([...newAttendees.filter(id => students.some(s => s.id === id)), ...nonStudentAttendees]));
    
    editSession(selectedSession.id, { attendeeIds: finalAttendees });
  };

  const markAllStatus = (present: boolean) => {
    if (!selectedSession) return;
    if (present) {
      // "Todos" = todos los alumnos inscritos en ESTA clase, conservando a quien ya estuviera marcado
      // (p. ej. un alumno de otra clase añadido a mano). Nunca marca a alumnos de otras clases.
      const currentAttendees = Array.isArray(selectedSession.attendeeIds) ? selectedSession.attendeeIds : [];
      const enrolledIds = students
        .filter(s => s.enrolledActivityIds?.includes(selectedSession.activityId))
        .map(s => s.id);
      editSession(selectedSession.id, { attendeeIds: Array.from(new Set([...currentAttendees, ...enrolledIds])) });
    } else {
      editSession(selectedSession.id, { attendeeIds: [] });
    }
  };

  const toggleAttendanceTable = (sessionId: string, studentId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    const currentAttendees = Array.isArray(session.attendeeIds) ? session.attendeeIds : [];
    const newAttendees = currentAttendees.includes(studentId)
      ? currentAttendees.filter(id => id !== studentId)
      : [...currentAttendees, studentId];
    editSession(sessionId, { attendeeIds: newAttendees });
  };

  const filteredStudents = useMemo(() => {
    let result = students;

    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(lowerQ) || (s.email && s.email.toLowerCase().includes(lowerQ)));
    }

    if (viewMode === "pass" && selectedSessionId) {
      const session = sessions.find(s => s.id === selectedSessionId);
      if (session) {
        result = result.filter(student => {
          if (searchQuery) return true; // Si hay búsqueda, mostrar de todos los alumnos
          const isEnrolled = student.enrolledActivityIds?.includes(session.activityId);
          const isAlreadyAttending = session.attendeeIds?.includes(student.id);
          return isEnrolled || isAlreadyAttending;
        });
      }
    }

    if (viewMode === "table" && selectedActivityId !== "all") {
      result = result.filter(student => {
        const isEnrolled = student.enrolledActivityIds?.includes(selectedActivityId);
        const hasAttendedAny = tableSessions.some(session => session.attendeeIds?.includes(student.id));
        return isEnrolled || hasAttendedAny;
      });
    }

    return result;
  }, [students, searchQuery, viewMode, selectedSessionId, sessions, selectedActivityId, tableSessions]);

  if (selectedSession && selectedActivity && viewMode === "pass") {
    const attendees = Array.isArray(selectedSession.attendeeIds) ? selectedSession.attendeeIds : [];
    return (
      <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
        <button 
          onClick={() => setSelectedSessionId(null)}
          className="self-start text-sm font-semibold text-rose-500 hover:text-rose-600 transition-colors"
        >
          &larr; {sheet ? `Volver a ${monthLabel(sheet.month).toLowerCase()}` : "Volver a clases"}
        </button>

        <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/50 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <h2 className="text-3xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
                {selectedActivity.name}
              </h2>
              <div className="flex items-center gap-4 mt-2 text-zinc-500 font-medium">
                <span className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {safeFormat(selectedSession.date, "dd 'de' MMMM, yyyy")}
                </span>
                <span className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                  <Users className="w-3.5 h-3.5" />
                  {attendees.length} / {students.filter(s => s.enrolledActivityIds?.includes(selectedSession.activityId) || attendees.includes(s.id)).length} asist.
                </span>
              </div>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
              <button
                onClick={() => markAllStatus(true)}
                className="flex-1 md:flex-none justify-center px-4 py-3 md:py-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-bold rounded-xl hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors text-xs flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Todos
              </button>
              <button
                onClick={() => markAllStatus(false)}
                className="flex-1 md:flex-none justify-center px-4 py-3 md:py-2 bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 font-bold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-xs flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" /> Ninguno
              </button>
            </div>
          </div>

          <div className="mb-6 relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar alumno..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all shadow-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <AnimatePresence>
              {filteredStudents.map(student => {
                const isPresent = attendees.includes(student.id);
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                    key={student.id}
                  >
                    <button
                      onClick={() => toggleStudentAttendance(student.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-95 ${
                        isPresent
                          ? "bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-500/30 text-rose-900 dark:text-rose-100"
                          : "bg-white border-zinc-200 hover:border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700 dark:hover:border-zinc-600 text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      <div className="flex flex-col items-start gap-1 text-left">
                        <span className="font-bold text-[13px]">{student.name}</span>
                        <div className="flex gap-2 items-center">
                          {student.phone && <span className="text-[10px] opacity-70 font-medium">{student.phone}</span>}
                          {student.enrolledActivityIds?.includes(selectedSessionId ? sessions.find(s => s.id === selectedSessionId)?.activityId || "" : "") && (
                            <span className="text-[9px] font-bold text-rose-500 bg-rose-100 dark:bg-rose-500/20 px-1.5 py-0.5 rounded-md uppercase tracking-wide">
                              Inscrito
                            </span>
                          )}
                        </div>
                      </div>

                      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm transition-colors ${
                        isPresent
                          ? "bg-rose-500 text-white"
                          : "bg-zinc-100 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500"
                      }`}>
                        <CheckCircle2 className={`w-5 h-5 ${isPresent ? "opacity-100" : "opacity-0"}`} />
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          {filteredStudents.length === 0 && (
            <div className="text-center py-10 text-zinc-500 font-medium">
              No se encontraron alumnos.
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-zinc-200/50 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Los cambios se guardan automáticamente
            </p>
            <button
              onClick={() => {
                editSession(selectedSession.id, { attendanceCompleted: true });
                setSelectedSessionId(null);
              }}
              className="w-full sm:w-auto px-8 py-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
            >
              Finalizar paso de lista
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Hoja mensual de una clase (alumnos × días) ----------
  const sheetActivity = sheet ? activities.find(a => a.id === sheet.activityId) : undefined;
  if (viewMode === "pass" && sheet && sheetActivity) {
    const sheetSessions = heldSessions
      .filter(s => s.activityId === sheet.activityId && monthKeyOf(s.date) === sheet.month)
      .sort(sortByDate);
    const rows = studentsForSheet(sheet.activityId, sheetSessions);
    const isIn = (s: ClassSession, studentId: string) => Array.isArray(s.attendeeIds) && s.attendeeIds.includes(studentId);
    const totalPresent = sheetSessions.reduce((acc, s) => acc + rows.filter(st => isIn(s, st.id)).length, 0);
    const possible = rows.length * sheetSessions.length;
    const pct = possible > 0 ? Math.round((totalPresent / possible) * 100) : 0;
    const hasPending = sheetSessions.some(s => !s.attendanceCompleted);

    const activityMonths = Array.from(new Set(
      heldSessions.filter(s => s.activityId === sheet.activityId).map(s => monthKeyOf(s.date)).filter(Boolean) as string[]
    )).sort((a, b) => b.localeCompare(a));
    const prevMonth = shiftMonth(activityMonths, sheet.month, -1);
    const nextMonth = shiftMonth(activityMonths, sheet.month, 1);

    const cellBorder = "border-t border-zinc-100 dark:border-zinc-800";
    const deskBorder = "sm:border-t sm:border-zinc-100 sm:dark:border-zinc-800";
    const deskFootBorder = "sm:border-t-2 sm:border-zinc-200 sm:dark:border-zinc-700";
    const stickyCell = "sticky left-0 z-10 bg-white dark:bg-zinc-900";

    return (
      <div className="flex flex-col gap-5 max-w-5xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            onClick={() => { setPassMonth(sheet.month); if (sheet.from === "table") setViewMode("table"); setSheet(null); }}
            className="self-start text-sm font-semibold text-rose-500 hover:text-rose-600 transition-colors"
          >
            &larr; {sheet.from === "table" ? "Volver a Relación de Clases" : "Volver a clases"}
          </button>
          <MonthStepper
            label={monthLabel(sheet.month)}
            onPrev={prevMonth ? () => setSheet({ ...sheet, month: prevMonth }) : undefined}
            onNext={nextMonth ? () => setSheet({ ...sheet, month: nextMonth }) : undefined}
          />
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-white/5 rounded-3xl p-4 sm:p-5 md:p-8 shadow-sm">
          <div className="mb-5 pb-5 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-500 mb-1">Asistencia · {monthLabel(sheet.month)}</p>
            <h2 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white leading-tight">{sheetActivity.name}</h2>
            {sheetActivity.location && <p className="text-sm text-zinc-500 font-medium mt-1">{sheetActivity.location}</p>}
            <div className="flex flex-wrap gap-2 mt-4 text-xs font-bold">
              <span className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2.5 py-1 rounded-lg">
                <CalendarIcon className="w-3.5 h-3.5" /> {sheetSessions.length} {sheetSessions.length === 1 ? "clase" : "clases"}
              </span>
              <span className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2.5 py-1 rounded-lg">
                <Users className="w-3.5 h-3.5" /> {rows.length} {rows.length === 1 ? "alumno" : "alumnos"}
              </span>
              <span className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5" /> {pct}% asistencia
              </span>
            </div>
          </div>
          {sheetSessions.length > 0 && rows.length > 0 && (
            <div className="flex flex-col items-stretch sm:items-end gap-1.5 shrink-0">
              <button
                onClick={async () => {
                  const result = await shareSheetImage(
                    {
                      activityName: sheetActivity.name,
                      location: sheetActivity.location,
                      monthLabel: monthLabel(sheet.month),
                      teacherName,
                      days: sheetSessions.map(s => ({ weekday: safeFormat(s.date, "EEEEEE"), day: safeFormat(s.date, "dd") })),
                      rows: rows.map(st => ({
                        name: st.name,
                        marks: sheetSessions.map(s => isIn(s, st.id)),
                        count: sheetSessions.filter(s => isIn(s, st.id)).length,
                      })),
                      perDay: sheetSessions.map(s => rows.filter(st => isIn(s, st.id)).length),
                      totalPresent,
                      pct,
                    },
                    `Asistencia ${sheetActivity.name} - ${monthLabel(sheet.month)}.png`.replace(/[\\/:*?"<>|]/g, "-")
                  );
                  if (result === "downloaded") {
                    setShareMsg("Imagen descargada");
                    setTimeout(() => setShareMsg(null), 2500);
                  }
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm"
              >
                <Share2 className="w-4 h-4" /> {canShareImages ? "Compartir" : "Descargar imagen"}
              </button>
              {shareMsg && <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 text-center sm:text-right">{shareMsg}</span>}
            </div>
          )}
          </div>

          {sheetSessions.length === 0 ? (
            <p className="text-center py-10 text-zinc-500 font-medium">No hay clases realizadas este mes.</p>
          ) : rows.length === 0 ? (
            <p className="text-center py-10 text-zinc-500 font-medium">No hay alumnos inscritos en esta clase.</p>
          ) : (
            // En móvil el nombre va en su propia fila, encima de las casillas, para que la hoja
            // quepa entera en vertical y se pueda hacer captura. En pantallas grandes, nombre a la izquierda.
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
              <table className="w-full border-separate border-spacing-0 text-sm">
                <thead>
                  <tr>
                    <th className={`${stickyCell} hidden sm:table-cell w-full text-left align-bottom pb-2 pr-3 text-[11px] font-bold uppercase tracking-wider text-zinc-400`}>Alumno</th>
                    {sheetSessions.map(s => (
                      <th key={s.id} className="pb-2 px-px sm:px-0.5 font-normal align-bottom">
                        <button
                          onClick={() => setSelectedSessionId(s.id)}
                          title="Pasar lista de este día"
                          className="relative w-7 sm:w-8 mx-auto flex flex-col items-center rounded-lg py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <span className="text-[9px] font-bold uppercase text-zinc-400 leading-none mb-0.5">{safeFormat(s.date, "EEEEEE")}</span>
                          <span className="text-sm font-black text-zinc-800 dark:text-zinc-100 tabular-nums leading-none">{safeFormat(s.date, "dd")}</span>
                          {!s.attendanceCompleted && <span className="absolute top-0 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-500" />}
                        </button>
                      </th>
                    ))}
                    <th className="pb-2 pl-2 sm:pl-3 text-right align-bottom text-[11px] font-bold uppercase tracking-wider text-zinc-400">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(st => {
                    const count = sheetSessions.filter(s => isIn(s, st.id)).length;
                    return (
                      <React.Fragment key={st.id}>
                        <tr className="sm:hidden">
                          <td colSpan={sheetSessions.length + 1} className={`${cellBorder} pt-2 pb-0.5 text-[13px] font-semibold text-zinc-800 dark:text-zinc-100`}>
                            {st.name}
                          </td>
                        </tr>
                        <tr>
                          <td className={`${stickyCell} ${deskBorder} hidden sm:table-cell py-1.5 pr-3`}>
                            <div className="max-w-[420px] truncate font-semibold text-zinc-800 dark:text-zinc-100" title={st.name}>{st.name}</div>
                          </td>
                          {sheetSessions.map(s => {
                            const present = isIn(s, st.id);
                            return (
                              <td key={s.id} className={`${deskBorder} pb-2 sm:py-1.5 px-px sm:px-0.5 text-center`}>
                                <button
                                  onClick={() => toggleAttendanceTable(s.id, st.id)}
                                  aria-label={`${st.name}, ${safeFormat(s.date, "dd/MM")}: ${present ? "asistió" : "no asistió"}`}
                                  className={`w-6 h-6 sm:w-7 sm:h-7 mx-auto flex items-center justify-center rounded-md sm:rounded-lg transition-colors ${
                                    present
                                      ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                      : "bg-zinc-100 dark:bg-zinc-800 text-transparent hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                  }`}
                                >
                                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={3} />
                                </button>
                              </td>
                            );
                          })}
                          <td className={`${deskBorder} pb-2 sm:py-1.5 pl-2 sm:pl-3 text-right tabular-nums whitespace-nowrap font-black text-emerald-600 dark:text-emerald-400`}>
                            {count}<span className="font-bold text-zinc-400">/{sheetSessions.length}</span>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="sm:hidden">
                    <td colSpan={sheetSessions.length + 1} className="pt-2.5 border-t-2 border-zinc-200 dark:border-zinc-700 text-[11px] font-bold uppercase tracking-wider text-zinc-400">Asistentes</td>
                  </tr>
                  <tr>
                    <td className={`${stickyCell} hidden sm:table-cell pt-2.5 pr-3 border-t-2 border-zinc-200 dark:border-zinc-700 text-[11px] font-bold uppercase tracking-wider text-zinc-400`}>Asistentes</td>
                    {sheetSessions.map(s => (
                      <td key={s.id} className={`pt-1 sm:pt-2.5 ${deskFootBorder} text-center font-black tabular-nums text-zinc-800 dark:text-zinc-100`}>
                        {rows.filter(st => isIn(s, st.id)).length}
                      </td>
                    ))}
                    <td className={`pt-1 sm:pt-2.5 pl-2 sm:pl-3 ${deskFootBorder} text-right font-black tabular-nums text-zinc-800 dark:text-zinc-100`}>{totalPresent}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {sheetSessions.length > 0 && rows.length > 0 && (
            <p className="mt-5 text-[11px] text-zinc-400 font-medium leading-relaxed">
              Toca un día para pasar lista con «Todos» o «Ninguno», o una casilla para cambiarla.
              {hasPending && <> <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 align-middle mx-0.5" /> lista sin finalizar.</>}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-zinc-900 dark:text-white">Asistencia</h2>
            <p className="text-zinc-500 text-sm font-medium">Gestiona y consulta la asistencia de los alumnos.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 w-full">
        <div className="flex bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl w-full sm:w-fit shrink-0">
          <button
            onClick={() => setViewMode("pass")}
            className={`flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
              viewMode === "pass"
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            <ListIcon className="w-4 h-4" /> Pasar Lista
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
              viewMode === "table"
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            <TableIcon className="w-4 h-4" /> Relación de Clases
          </button>
        </div>

        {viewMode === "pass" && (
          <MonthStepper
            label={monthLabel(passMonth)}
            onPrev={shiftMonth(passMonths, passMonth, -1) ? () => setPassMonth(shiftMonth(passMonths, passMonth, -1)!) : undefined}
            onNext={shiftMonth(passMonths, passMonth, 1) ? () => setPassMonth(shiftMonth(passMonths, passMonth, 1)!) : undefined}
          />
        )}

        {viewMode === "table" && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto lg:justify-end">
            <div className="relative w-full sm:w-auto sm:flex-1 lg:flex-none lg:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar alumno..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 h-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-rose-500/50 transition-all text-zinc-800 dark:text-zinc-100 shadow-sm"
              />
            </div>
            <div className={`flex gap-3 w-full sm:w-auto sm:flex-1 lg:flex-none ${relationBy === "clase" && relationClass ? "hidden" : ""}`}>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="flex-1 w-full lg:w-40 h-10 bg-white dark:bg-zinc-900 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-rose-500/50 transition-all text-zinc-800 dark:text-zinc-100 appearance-none shadow-sm cursor-pointer"
              >
                <option value="all">Todos los meses</option>
                {availableMonths.map(m => (
                  <option key={m} value={m}>{monthLabel(m)}</option>
                ))}
              </select>
              <select
                value={selectedActivityId}
                onChange={e => setSelectedActivityId(e.target.value)}
                className="flex-1 w-full lg:w-48 h-10 bg-white dark:bg-zinc-900 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-rose-500/50 transition-all text-zinc-800 dark:text-zinc-100 appearance-none shadow-sm cursor-pointer"
              >
                <option value="all">Todas las clases</option>
                {activities.map(act => (
                  <option key={act.id} value={act.id}>{act.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {viewMode === "pass" && (
        <div className="flex flex-col gap-4 mt-2">
          {pendingOtherMonths.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-500">
              <span>Pendientes de pasar lista en:</span>
              {pendingOtherMonths.map(([m, n]) => (
                <button
                  key={m}
                  onClick={() => setPassMonth(m)}
                  className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-500/25 font-bold transition-colors"
                >
                  {monthLabel(m)} · {n}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {monthCards.map(card => (
              <div
                key={card.activity.id}
                className="group relative flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-white/5 shadow-sm rounded-3xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-all overflow-hidden hover:shadow-md"
              >
                <button
                  onClick={() => setSheet({ activityId: card.activity.id, month: passMonth })}
                  className="flex flex-col items-start p-5 pb-4 text-left w-full active:scale-[0.99] transition-transform"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent dark:from-emerald-500/5 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform" />
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 mb-3 uppercase tracking-wider">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    {monthLabel(passMonth)}
                  </div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white line-clamp-2 leading-tight">
                    {card.activity.name}
                  </h3>
                  {card.activity.location && (
                    <p className="text-xs font-medium text-zinc-500 mt-1 truncate max-w-full">{card.activity.location}</p>
                  )}
                  <div className="w-full mt-4">
                    <div className="flex justify-between items-end mb-2">
                      <div className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                        {card.sessions.length} {card.sessions.length === 1 ? "clase" : "clases"} · {card.studentCount} {card.studentCount === 1 ? "alumno" : "alumnos"}
                      </div>
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{card.pct}%</div>
                    </div>
                    <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out" style={{ width: `${card.pct}%` }} />
                    </div>
                  </div>
                </button>
                {card.pending.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 px-5 pb-4 -mt-1">
                    <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mr-0.5">Pasar lista:</span>
                    {card.pending.map(s => (
                      <button
                        key={s.id}
                        onClick={() => { setSheet({ activityId: card.activity.id, month: passMonth }); setSelectedSessionId(s.id); }}
                        className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-500/25 transition-colors"
                      >
                        {safeFormat(s.date, "dd/MM")}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {monthCards.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white/50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500">
                <CalendarIcon className="w-12 h-12 mb-4 text-emerald-500/50" />
                <p className="text-center font-medium">No hay clases realizadas en {monthLabel(passMonth).toLowerCase()}.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {viewMode === "table" && (
        <div className="mt-6">
          {tableSessions.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm flex flex-col items-center justify-center p-12 text-zinc-500">
              <TableIcon className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-center font-medium">No hay historial de clases para mostrar.</p>
            </div>
          ) : (
            <>
              <div className={`flex items-center gap-2 mb-4 ${relationBy === "clase" && relationClass ? "hidden" : ""}`}>
                <span className="text-xs font-semibold text-zinc-500">Ver por:</span>
                <div className="flex bg-zinc-100 dark:bg-zinc-800/80 p-0.5 rounded-lg">
                  {(["clase", "alumno"] as const).map(v => (
                    <button
                      key={v}
                      onClick={() => setRelationBy(v)}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                        relationBy === v
                          ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                          : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                      }`}
                    >
                      {v === "clase" ? "Clase" : "Alumno"}
                    </button>
                  ))}
                </div>
              </div>

              {relationBy === "clase" ? (() => {
                const openSheetFor = (activityId: string, month: string) => {
                  setPassMonth(month);
                  setSheet({ activityId, month, from: "table" });
                  setViewMode("pass");
                };

                // Ficha de una clase
                const detail = relationClass && classStats.find(g => g.activity.id === relationClass.activityId);
                if (relationClass && detail) {
                  return (
                    <ClassDetail
                      key={detail.activity.id}
                      activity={detail.activity}
                      months={detail.months}
                      initialMonth={relationClass.month}
                      searchQuery={searchQuery}
                      onBack={() => setRelationClass(null)}
                      onOpenSheet={(month) => openSheetFor(detail.activity.id, month)}
                      toggleAttendance={toggleAttendanceTable}
                    />
                  );
                }

                // Vista general: una tarjeta compacta por clase
                const q = searchQuery.trim().toLowerCase();
                const cards = classStats
                  .filter(g => selectedActivityId === "all" || g.activity.id === selectedActivityId)
                  .filter(g => selectedMonth === "all" || g.months.some(m => m.key === selectedMonth))
                  .filter(g => !q || g.months.some(m => m.rows.some(r =>
                    r.student.name.toLowerCase().includes(q) || (r.student.email || "").toLowerCase().includes(q))));

                return (
                  <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 items-start">
                    {cards.length === 0 && (
                      <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white/50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500">
                        <Search className="w-12 h-12 mb-4 opacity-30" />
                        <p className="text-center font-medium">{q ? "No se encontraron alumnos." : "No hay clases en este periodo."}</p>
                      </div>
                    )}
                    {cards.map(g => (
                      <ClassOverviewCard
                        key={g.activity.id}
                        activity={g.activity}
                        months={g.months}
                        currentKey={selectedMonth !== "all" ? selectedMonth : g.months[g.months.length - 1].key}
                        onOpen={(month) => setRelationClass({ activityId: g.activity.id, month })}
                      />
                    ))}
                  </div>
                );
              })() : (
                <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                  {filteredStudents.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white/50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500">
                      <Search className="w-12 h-12 mb-4 opacity-30" />
                      <p className="text-center font-medium">No se encontraron alumnos.</p>
                    </div>
                  )}
                  {filteredStudents.map(student => (
                    <StudentTableCard
                      key={student.id}
                      student={student}
                      tableSessions={tableSessions}
                      activities={activities}
                      selectedActivityId={selectedActivityId}
                      toggleAttendanceTable={toggleAttendanceTable}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

