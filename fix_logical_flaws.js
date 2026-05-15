import fs from 'fs';

let code = fs.readFileSync('src/components/AttendanceView.tsx', 'utf8');

const targetToReplace = `    if (viewMode === "pass" && selectedSessionId) {
      const session = sessions.find(s => s.id === selectedSessionId);
      if (session) {
        result = result.filter(student => {
          const isEnrolled = student.enrolledActivityIds?.includes(session.activityId);
          const isAlreadyAttending = session.attendeeIds?.includes(student.id);
          return isEnrolled || isAlreadyAttending;
        });
      }
    }`;

const replacement = `    if (viewMode === "pass" && selectedSessionId) {
      const session = sessions.find(s => s.id === selectedSessionId);
      if (session) {
        result = result.filter(student => {
          if (searchQuery) return true; // Si hay búsqueda, mostrar de todos los alumnos
          const isEnrolled = student.enrolledActivityIds?.includes(session.activityId);
          const isAlreadyAttending = session.attendeeIds?.includes(student.id);
          return isEnrolled || isAlreadyAttending;
        });
      }
    }`;

code = code.replace(targetToReplace, replacement);

const targetRecentSessions = `  const recentSessions = useMemo(() => {
    return [...sessions]
      .filter(s => !s.attendanceCompleted && (s.status === "held" || s.status === "cancelled_billed" || s.status === "cancelled_unbilled"))`;

const replacementRecentSessions = `  const recentSessions = useMemo(() => {
    return [...sessions]
      .filter(s => !s.attendanceCompleted && s.status === "held")`;

code = code.replace(targetRecentSessions, replacementRecentSessions);

fs.writeFileSync('src/components/AttendanceView.tsx', code);
console.log('Fixed logical flaws in AttendanceView.tsx');
