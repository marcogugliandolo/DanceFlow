import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

const doubleTag = `                                {student.enrolledActivityIds && student.enrolledActivityIds.length > 0 && (
                                  <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1 mt-1 flex-wrap">
                                    {student.enrolledActivityIds.map((actId: string) => {
                                      const act = activities.find((a: any) => a.id === actId);
                                      return act ? (<span key={actId} className="bg-rose-100 dark:bg-rose-500/20 px-1.5 py-0.5 rounded-md">{act.name}</span>) : null;
                                    })}
                                  </span>
                                )}
                                {student.enrolledActivityIds && student.enrolledActivityIds.length > 0 && (
                                  <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1 mt-1 flex-wrap">
                                    {student.enrolledActivityIds.map((actId: string) => {
                                      const act = activities.find((a: any) => a.id === actId);
                                      return act ? (<span key={actId} className="bg-rose-100 dark:bg-rose-500/20 px-1.5 py-0.5 rounded-md">{act.name}</span>) : null;
                                    })}
                                  </span>
                                )}`;

const singleTag = `                                {student.enrolledActivityIds && student.enrolledActivityIds.length > 0 && (
                                  <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1 mt-1 flex-wrap">
                                    {student.enrolledActivityIds.map((actId: string) => {
                                      const act = activities.find((a: any) => a.id === actId);
                                      return act ? (<span key={actId} className="bg-rose-100 dark:bg-rose-500/20 px-1.5 py-0.5 rounded-md">{act.name}</span>) : null;
                                    })}
                                  </span>
                                )}`;

code = code.replace(doubleTag, singleTag);
fs.writeFileSync('src/App.tsx', code);
console.log('Fixed duplication in App.tsx');
