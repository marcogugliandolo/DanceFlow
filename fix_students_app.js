import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

// Update editStudentData state to include enrolledActivityIds
code = code.replace(
  `  const [editStudentData, setEditStudentData] = useState<{
    name: string;
    phone: string;
    email: string;
    notes: string;
    location: string;
  }>({ name: "", phone: "", email: "", notes: "", location: "" });`,
  `  const [editStudentData, setEditStudentData] = useState<{
    name: string;
    phone: string;
    email: string;
    notes: string;
    location: string;
    enrolledActivityIds: string[];
  }>({ name: "", phone: "", email: "", notes: "", location: "", enrolledActivityIds: [] });`
);

// Update calls to setEditStudentData
code = code.replaceAll(
  `setEditStudentData({ name: "", phone: "", email: "", notes: "", location: "" });`,
  `setEditStudentData({ name: "", phone: "", email: "", notes: "", location: "", enrolledActivityIds: [] });`
);

code = code.replace(
  `                                  setEditStudentData({
                                    name: student.name,
                                    phone: student.phone || "",
                                    email: student.email || "",
                                    notes: student.notes || "",
                                    location: student.location || "",
                                  });`,
  `                                  setEditStudentData({
                                    name: student.name,
                                    phone: student.phone || "",
                                    email: student.email || "",
                                    notes: student.notes || "",
                                    location: student.location || "",
                                    enrolledActivityIds: student.enrolledActivityIds || [],
                                  });`
);

// Update addStudent call
code = code.replace(
  `                      addStudent({
                        name: editStudentData.name.trim(),
                        phone: editStudentData.phone.trim(),
                        email: editStudentData.email.trim(),
                        notes: editStudentData.notes.trim(),
                        location: editStudentData.location.trim(),
                      });`,
  `                      addStudent({
                        name: editStudentData.name.trim(),
                        phone: editStudentData.phone.trim(),
                        email: editStudentData.email.trim(),
                        notes: editStudentData.notes.trim(),
                        location: editStudentData.location.trim(),
                        enrolledActivityIds: editStudentData.enrolledActivityIds,
                      });`
);

// Update editStudent call
code = code.replace(
  `                      editStudent(editingStudentId, {
                        name: editStudentData.name.trim(),
                        phone: editStudentData.phone.trim(),
                        email: editStudentData.email.trim(),
                        notes: editStudentData.notes.trim(),
                        location: editStudentData.location.trim(),
                      });`,
  `                      editStudent(editingStudentId, {
                        name: editStudentData.name.trim(),
                        phone: editStudentData.phone.trim(),
                        email: editStudentData.email.trim(),
                        notes: editStudentData.notes.trim(),
                        location: editStudentData.location.trim(),
                        enrolledActivityIds: editStudentData.enrolledActivityIds,
                      });`
);


// Now inject the UI for checkboxes in the student edit modal. It's inside a `div` for the form.
// Let's find a good spot. Under location is usually good.
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
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">
                    Clases (Opcional)
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
                            className={\`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all \${isEnrolled ? "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30" : "bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent"}\`}
                          >
                            <span className={\`text-sm font-medium \${isEnrolled ? "text-rose-700 dark:text-rose-400" : "text-zinc-700 dark:text-zinc-300"}\`}>
                              {act.name}
                            </span>
                            <div className={\`w-5 h-5 rounded-md flex items-center justify-center transition-colors \${isEnrolled ? "bg-rose-500 text-white" : "border-2 border-zinc-300 dark:border-zinc-600"}\`}>
                              {isEnrolled && <Check className="w-3.5 h-3.5" />}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">`
);

// We need to also show enrolled classes in the student card.
// Let's find where the MapPin is shown.
code = code.replace(
  `                                {student.location && (
                                  <span className="text-[11px] font-medium text-zinc-500 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {student.location}
                                  </span>
                                )}`,
  `                                {student.location && (
                                  <span className="text-[11px] font-medium text-zinc-500 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {student.location}
                                  </span>
                                )}
                                {student.enrolledActivityIds && student.enrolledActivityIds.length > 0 && (
                                  <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1 mt-1 flex-wrap">
                                    {student.enrolledActivityIds.map((actId: string) => {\n                                      const act = activities.find((a: any) => a.id === actId);\n                                      return act ? (<span key={actId} className="bg-rose-100 dark:bg-rose-500/20 px-1.5 py-0.5 rounded-md">{act.name}</span>) : null;\n                                    })}
                                  </span>
                                )}`
);



// Important: update session creation to prefill `attendeeIds` from `enrolledActivityIds` if it's the very first session
code = code.replace(
  `                            const previousSessions = sessions.filter(s => s.activityId === actId);
                            if (previousSessions.length > 0) {
                              const latestSession = previousSessions.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())[0];
                              setSessionAttendeeIds(latestSession.attendeeIds || []);
                            } else {
                              setSessionAttendeeIds([]);
                            }`,
  `                            const previousSessions = sessions.filter(s => s.activityId === actId);
                            if (previousSessions.length > 0) {
                              const latestSession = previousSessions.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())[0];
                              
                              // Merge latest session attendees with actively enrolled students who might be new
                              const latestIds = latestSession.attendeeIds || [];
                              const additionalEnrolled = students.filter(student => student.enrolledActivityIds?.includes(actId) && !latestIds.includes(student.id)).map(student => student.id);
                              
                              setSessionAttendeeIds([...latestIds, ...additionalEnrolled]);
                            } else {
                              // If first session, use enrolled students
                              const enrolledStudents = students.filter(student => student.enrolledActivityIds?.includes(actId)).map(student => student.id);
                              setSessionAttendeeIds(enrolledStudents);
                            }`
);


fs.writeFileSync('src/App.tsx', code);
console.log('Fixed App.tsx');
