import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetToReplace = `                  ) : (
                    students.filter((student) => {
                      const actId = showAttendeesModal === "create" ? sessionActId : editSessionActId;
                      const isEnrolled = student.enrolledActivityIds?.includes(actId);
                      const isAlreadySelected = showAttendeesModal === "create" 
                        ? sessionAttendeeIds.includes(student.id)
                        : editSessionAttendeeIds.includes(student.id);
                      return isEnrolled || isAlreadySelected;
                    }).map((student) => {
                      const isSelected =`;

const replacement = `                  ) : (() => {
                    const filteredStudents = students.filter((student) => {
                      const actId = showAttendeesModal === "create" ? sessionActId : editSessionActId;
                      const isEnrolled = student.enrolledActivityIds?.includes(actId);
                      const isAlreadySelected = showAttendeesModal === "create" 
                        ? sessionAttendeeIds.includes(student.id)
                        : editSessionAttendeeIds.includes(student.id);
                      return isEnrolled || isAlreadySelected;
                    });
                    
                    if (filteredStudents.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                            Sin estudiantes
                          </p>
                          <p className="text-xs text-zinc-500">
                            No hay estudiantes inscritos en esta actividad. Puedes inscribirlos desde su perfil en "Gestión de Alumnos".
                          </p>
                        </div>
                      );
                    }
                    
                    return filteredStudents.map((student) => {
                      const isSelected =`;

code = code.replace(targetToReplace, replacement);

const targetEndReplacement = `                          </div>
                        </div>
                      );
                    })
                  )}
                </div>`;

const endReplacement = `                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>`;

code = code.replace(targetEndReplacement, endReplacement);
fs.writeFileSync('src/App.tsx', code);
console.log('Fixed attendees display empty state');
