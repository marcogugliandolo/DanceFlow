import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Modificar modal de Alumnos para que sea max-h-[90vh] y añada overflow-y-auto en el form
const modalDefTarget = `className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-zinc-200/50 dark:border-white/10"`;
const modalDefReplacement = `className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-zinc-200/50 dark:border-white/10"`;
code = code.replace(modalDefTarget, modalDefReplacement);

const formClassTarget = `className="p-6 space-y-4"`;
const formClassReplacement = `className="p-6 space-y-4 overflow-y-auto custom-scrollbar"`;
code = code.replace(formClassTarget, formClassReplacement);

// 2. Modificar cómo se cuentan las asistencias en el historial, para que incluya las clases inscritas en las que tiene 0 asistencias
const countsTarget = `                // Agrupar contador por actividad
                const activityCounts = studentSessions.reduce(
                  (acc, session) => {
                    if (session.status !== "held") return acc;
                    acc[session.activityId] =
                      (acc[session.activityId] || 0) + 1;
                    return acc;
                  },
                  {} as Record<string, number>,
                );`;

const countsReplacement = `                // Agrupar contador por actividad
                const activityCounts = (student.enrolledActivityIds || []).reduce((acc, actId) => {
                    acc[actId] = 0;
                    return acc;
                }, {} as Record<string, number>);
                
                studentSessions.forEach(session => {
                    if (session.status === "held") {
                        activityCounts[session.activityId] = (activityCounts[session.activityId] || 0) + 1;
                    }
                });`;

code = code.replace(countsTarget, countsReplacement);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed modal styles and history summary');
