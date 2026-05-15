import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `                  <input
                    type="text"
                    value={editStudentData.location}
                    onChange={(e) => setEditStudentData(d => ({ ...d, location: e.target.value }))}
                    className="w-full h-12 bg-zinc-100/50 dark:bg-zinc-800/50 px-4 rounded-2xl text-sm font-medium border-none outline-none focus:ring-2 focus:ring-rose-500/50 transition-all text-zinc-900 dark:text-zinc-100"
                    placeholder="Ciudad, barrio..."
                  />
                </div>

                <div className="space-y-1.5">`,
  `                  <input
                    type="text"
                    value={editStudentData.location}
                    onChange={(e) => setEditStudentData(d => ({ ...d, location: e.target.value }))}
                    className="w-full h-12 bg-zinc-100/50 dark:bg-zinc-800/50 px-4 rounded-2xl text-sm font-medium border-none outline-none focus:ring-2 focus:ring-rose-500/50 transition-all text-zinc-900 dark:text-zinc-100"
                    placeholder="Ciudad, barrio..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
                    Clases asociadas
                  </label>
                  <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {activities.length === 0 ? (
                      <div className="text-xs text-zinc-500 italic">No hay clases creadas.</div>
                    ) : (
                      activities.map((act) => {
                        const isEnrolled = editStudentData.enrolledActivityIds.includes(act.id);
                        return (
                          <div
                            key={act.id}
                            onClick={() => {
                              setEditStudentData(d => ({
                                ...d,
                                enrolledActivityIds: isEnrolled 
                                  ? d.enrolledActivityIds.filter(id => id !== act.id)
                                  : [...d.enrolledActivityIds, act.id]
                              }));
                            }}
                            className={\`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all \${isEnrolled ? "bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30" : "bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent"}\`}
                          >
                            <span className={\`text-sm font-medium \${isEnrolled ? "text-rose-700 dark:text-rose-400" : "text-zinc-700 dark:text-zinc-300"}\`}>
                              {act.name}
                            </span>
                            <div className={\`w-5 h-5 rounded-md flex items-center justify-center transition-colors \${isEnrolled ? "bg-rose-500 text-white" : "border-2 border-zinc-300 dark:border-zinc-600"}\`}>
                              {isEnrolled && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">`
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed UI in App.tsx');
