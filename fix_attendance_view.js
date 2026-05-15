import fs from 'fs';

let code = fs.readFileSync('src/components/AttendanceView.tsx', 'utf8');

const targetToReplace = `  const [isExpanded, setIsExpanded] = useState(false);
  const attendedCount = tableSessions.filter(s => Array.isArray(s.attendeeIds) && s.attendeeIds.includes(student.id)).length;
  const totalCount = tableSessions.length;
  const attendancePercentage = totalCount > 0 ? Math.round((attendedCount / totalCount) * 100) : 0;
  
  const displaySessions = isExpanded ? tableSessions : tableSessions.slice(0, 5);
  const hasMore = tableSessions.length > 5;`;

const replacement = `  const [isExpanded, setIsExpanded] = useState(false);
  
  // Filter sessions that only belong to activities the student is enrolled in, or if they actually attended
  const relevantSessions = tableSessions.filter(s => {
    const isEnrolled = student.enrolledActivityIds?.includes(s.activityId);
    const hasAttended = Array.isArray(s.attendeeIds) && s.attendeeIds.includes(student.id);
    return isEnrolled || hasAttended;
  });

  const attendedCount = relevantSessions.filter(s => Array.isArray(s.attendeeIds) && s.attendeeIds.includes(student.id)).length;
  const totalCount = relevantSessions.length;
  const attendancePercentage = totalCount > 0 ? Math.round((attendedCount / totalCount) * 100) : 0;
  
  const displaySessions = isExpanded ? relevantSessions : relevantSessions.slice(0, 5);
  const hasMore = relevantSessions.length > 5;`;

code = code.replace(targetToReplace, replacement);

const targetReplaceMap = `        <div className="flex flex-wrap gap-2.5">
          {displaySessions.map((session, index) => {`;

const mapReplacement = `        <div className="flex flex-wrap gap-2.5">
          {displaySessions.map((session, index) => {`;

// Well just checking if mapping is fine, its fine.
const renderStudentPassModeSearch = `                      <div className="flex flex-col items-start gap-1 text-left">
                        <span className="font-bold text-[13px]">{student.name}</span>
                        {student.phone && <span className="text-[10px] opacity-70 font-medium">{student.phone}</span>}
                      </div>`;

const replacePassModeSearch = `                      <div className="flex flex-col items-start gap-1 text-left">
                        <span className="font-bold text-[13px]">{student.name}</span>
                        <div className="flex gap-2 items-center">
                          {student.phone && <span className="text-[10px] opacity-70 font-medium">{student.phone}</span>}
                          {student.enrolledActivityIds?.includes(selectedSessionId ? sessions.find(s => s.id === selectedSessionId)?.activityId || "" : "") && (
                            <span className="text-[9px] font-bold text-rose-500 bg-rose-100 dark:bg-rose-500/20 px-1.5 py-0.5 rounded-md uppercase tracking-wide">
                              Inscrito
                            </span>
                          )}
                        </div>
                      </div>`;

code = code.replace(renderStudentPassModeSearch, replacePassModeSearch);

fs.writeFileSync('src/components/AttendanceView.tsx', code);
console.log('Fixed StudentTableCard and pass mode UI');
