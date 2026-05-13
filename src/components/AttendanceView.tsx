import React, { useState, useMemo } from "react";
import { Activity, ClassSession, Student } from "../types";
import { CheckCircle2, XCircle, Search, Calendar as CalendarIcon, Users, Table as TableIcon, List as ListIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { safeFormat, isValidDateStr } from "../lib/dateUtils";

export const AttendanceView = ({
  activities,
  sessions,
  students,
  editSession
}: {
  activities: Activity[];
  sessions: ClassSession[];
  students: Student[];
  editSession: (id: string, updates: Partial<ClassSession>) => void;
}) => {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"pass" | "table">("pass");
  const [selectedActivityId, setSelectedActivityId] = useState<string>("all");

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const recent = [...sessions]
      .filter(s => s.status === "held" && isValidDateStr(s.date))
      .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())[0];
    return recent ? safeFormat(recent.date, "yyyy-MM") : safeFormat(new Date(), "yyyy-MM");
  });

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    sessions.forEach(s => {
      if (isValidDateStr(s.date)) {
        months.add(safeFormat(s.date, "yyyy-MM"));
      }
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [sessions]);

  const recentSessions = useMemo(() => {
    return [...sessions]
      .filter(s => !s.attendanceCompleted && (s.status === "held" || s.status === "cancelled_billed" || s.status === "cancelled_unbilled"))
      .sort((a, b) => {
        const da = isValidDateStr(a.date) ? new Date(a.date!).getTime() : 0;
        const db = isValidDateStr(b.date) ? new Date(b.date!).getTime() : 0;
        return db - da;
      })
      .slice(0, 30); // show last 30 sessions
  }, [sessions]);

  const tableSessions = useMemo(() => {
    let s = [...sessions].filter(s => s.status === "held");
    if (selectedActivityId !== "all") {
      s = s.filter(s => s.activityId === selectedActivityId);
    }
    if (selectedMonth !== "all") {
      s = s.filter(s => isValidDateStr(s.date) && safeFormat(s.date, "yyyy-MM") === selectedMonth);
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
      editSession(selectedSession.id, { attendeeIds: students.map(s => s.id) });
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
    if (!searchQuery) return students;
    const lowerQ = searchQuery.toLowerCase();
    return students.filter(s => s.name.toLowerCase().includes(lowerQ) || (s.email && s.email.toLowerCase().includes(lowerQ)));
  }, [students, searchQuery]);

  if (selectedSession && selectedActivity && viewMode === "pass") {
    const attendees = Array.isArray(selectedSession.attendeeIds) ? selectedSession.attendeeIds : [];
    return (
      <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
        <button 
          onClick={() => setSelectedSessionId(null)} 
          className="self-start text-sm font-semibold text-rose-500 hover:text-rose-600 transition-colors"
        >
          &larr; Volver a clases
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
                  {attendees.length} / {students.length} asist.
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
                        {student.phone && <span className="text-[10px] opacity-70 font-medium">{student.phone}</span>}
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
            <div className="flex gap-3 w-full sm:w-auto sm:flex-1 lg:flex-none">
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="flex-1 w-full lg:w-40 h-10 bg-white dark:bg-zinc-900 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-rose-500/50 transition-all text-zinc-800 dark:text-zinc-100 appearance-none shadow-sm cursor-pointer"
              >
                <option value="all">Meses</option>
                {availableMonths.map(m => {
                  const [year, month] = m.split('-');
                  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
                  return <option key={m} value={m}>{safeFormat(date, "MMM yyyy").charAt(0).toUpperCase() + safeFormat(date, "MMM yyyy").slice(1)}</option>;
                })}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
          {recentSessions.map(session => {
            const activity = activities.find(a => a.id === session.activityId);
            if (!activity) return null;
            
            const attendees = Array.isArray(session.attendeeIds) ? session.attendeeIds : [];
            const percentage = students.length > 0 ? Math.round((attendees.length / students.length) * 100) : 0;
            const safePercentage = isNaN(percentage) ? 0 : percentage;
            
            return (
              <button
                key={session.id}
                onClick={() => setSelectedSessionId(session.id)}
                className="group relative flex flex-col items-start p-5 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-white/5 shadow-sm rounded-3xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-all text-left overflow-hidden hover:shadow-md active:scale-[0.98]"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent dark:from-emerald-500/5 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform" />
                
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 mb-3 uppercase tracking-wider">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {safeFormat(session.date, "dd/MM/yyyy")}
                </div>
                
                <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-4 line-clamp-1">
                  {activity.name}
                </h3>
                
                <div className="w-full mt-auto">
                  <div className="flex justify-between items-end mb-2">
                    <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      <span className="text-2xl font-black text-emerald-500">{attendees.length}</span>
                      <span className="opacity-60"> / {students.length} asist.</span>
                    </div>
                    <div className="text-xs font-bold opacity-60">{safePercentage || 0}%</div>
                  </div>
                  
                  <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out" 
                      style={{ width: `${safePercentage || 0}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
          
          {recentSessions.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white/50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500">
              <CheckCircle2 className="w-12 h-12 mb-4 text-emerald-500/50" />
              <p className="text-center font-medium">No hay clases recientes pendientes de pasar lista.</p>
              <p className="text-sm opacity-70 mt-1">¡Todo al día!</p>
            </div>
          )}
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
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
              {filteredStudents.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white/50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500">
                  <Search className="w-12 h-12 mb-4 opacity-30" />
                  <p className="text-center font-medium">No se encontraron alumnos.</p>
                </div>
              )}
              {filteredStudents.map(student => {
                const attendedCount = tableSessions.filter(s => Array.isArray(s.attendeeIds) && s.attendeeIds.includes(student.id)).length;
                const totalCount = tableSessions.length;
                const attendancePercentage = totalCount > 0 ? Math.round((attendedCount / totalCount) * 100) : 0;
                
                return (
                  <div key={student.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm flex flex-col transition-all hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-900/50 group">
                    <div className="flex justify-between items-start mb-5 pb-5 border-b border-zinc-100 dark:border-zinc-800/80">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-black text-lg text-zinc-400 shrink-0 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 group-hover:text-emerald-500 transition-colors">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 pr-2">
                          <h4 className="font-bold text-zinc-900 dark:text-white text-lg leading-tight truncate">{student.name}</h4>
                          <span className="text-[11px] font-semibold text-zinc-400 mt-1 block tracking-wide uppercase">
                            {attendedCount} / {totalCount} clases
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-2xl font-black text-emerald-500 leading-none">{attendancePercentage}%</span>
                        <div className="w-16 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full mt-2 overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${attendancePercentage}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-wrap gap-2.5">
                        {tableSessions.map(session => {
                          const isPresent = Array.isArray(session.attendeeIds) && session.attendeeIds.includes(student.id);
                          const activityName = selectedActivityId === "all" ? activities.find(a => a.id === session.activityId)?.name || 'Clase' : '';
                          const dateStr = safeFormat(session.date, "dd/MM");
                          
                          return (
                            <button
                              key={session.id}
                              onClick={() => toggleAttendanceTable(session.id, student.id)}
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
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

