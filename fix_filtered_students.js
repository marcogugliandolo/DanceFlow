import fs from 'fs';

let code = fs.readFileSync('src/components/AttendanceView.tsx', 'utf8');

const targetToReplace = `  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;
    const lowerQ = searchQuery.toLowerCase();
    return students.filter(s => s.name.toLowerCase().includes(lowerQ) || (s.email && s.email.toLowerCase().includes(lowerQ)));
  }, [students, searchQuery]);`;

const replacement = `  const filteredStudents = useMemo(() => {
    let result = students;

    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(lowerQ) || (s.email && s.email.toLowerCase().includes(lowerQ)));
    }

    if (viewMode === "pass" && selectedSessionId) {
      const session = sessions.find(s => s.id === selectedSessionId);
      if (session) {
        result = result.filter(student => {
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
  }, [students, searchQuery, viewMode, selectedSessionId, sessions, selectedActivityId, tableSessions]);`;

code = code.replace(targetToReplace, replacement);

fs.writeFileSync('src/components/AttendanceView.tsx', code);
console.log('Fixed filteredStudents in AttendanceView.tsx');
