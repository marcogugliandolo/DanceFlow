import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetToReplace = `                  ) : (
                    students.map((student) => {
                      const isSelected =
                        showAttendeesModal === "create"
                          ? sessionAttendeeIds.includes(student.id)
                          : editSessionAttendeeIds.includes(student.id);`;

const replacement = `                  ) : (
                    students.filter((student) => {
                      const actId = showAttendeesModal === "create" ? sessionActId : editSessionActId;
                      const isEnrolled = student.enrolledActivityIds?.includes(actId);
                      const isAlreadySelected = showAttendeesModal === "create" 
                        ? sessionAttendeeIds.includes(student.id)
                        : editSessionAttendeeIds.includes(student.id);
                      return isEnrolled || isAlreadySelected;
                    }).map((student) => {
                      const isSelected =
                        showAttendeesModal === "create"
                          ? sessionAttendeeIds.includes(student.id)
                          : editSessionAttendeeIds.includes(student.id);`;

code = code.replace(targetToReplace, replacement);
fs.writeFileSync('src/App.tsx', code);
console.log('Fixed attendees display');
