import fs from 'fs';

let code = fs.readFileSync('src/components/AttendanceView.tsx', 'utf8');

const target1 = `<span className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                  <Users className="w-3.5 h-3.5" />
                  {attendees.length} / {students.length} asist.
                </span>`;
const repl1 = `<span className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                  <Users className="w-3.5 h-3.5" />
                  {attendees.length} / {students.filter(s => s.enrolledActivityIds?.includes(selectedSession.activityId) || attendees.includes(s.id)).length} asist.
                </span>`;
code = code.replace(target1, repl1);

const target2 = `const activityName = activities.find(a => a.id === session.activityId)?.name || 'Clase';
            const attendees = Array.isArray(session.attendeeIds) ? session.attendeeIds : [];
            const safePercentage = Math.round((attendees.length / Math.max(1, students.length)) * 100);`;
const repl2 = `const activityName = activities.find(a => a.id === session.activityId)?.name || 'Clase';
            const attendees = Array.isArray(session.attendeeIds) ? session.attendeeIds : [];
            const associatedCount = students.filter(s => s.enrolledActivityIds?.includes(session.activityId) || attendees.includes(s.id)).length;
            const safePercentage = Math.round((attendees.length / Math.max(1, associatedCount)) * 100);`;
code = code.replace(target2, repl2);

const target3 = `<span className="text-2xl font-black text-emerald-500">{attendees.length}</span>
                      <span className="opacity-60"> / {students.length} asist.</span>`;
const repl3 = `<span className="text-2xl font-black text-emerald-500">{attendees.length}</span>
                      <span className="opacity-60"> / {associatedCount} asist.</span>`;
code = code.replace(target3, repl3);

fs.writeFileSync('src/components/AttendanceView.tsx', code);
console.log('Fixed attendance counts');
