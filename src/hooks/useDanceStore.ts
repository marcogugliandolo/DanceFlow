import { useState, useEffect, useMemo, useRef } from 'react';
import { Activity, ClassSession, SummaryStats, ActivityStats, Student } from '../types';

export function useDanceStore(selectedMonth?: string) {
  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = localStorage.getItem('dance_activities');
    return saved ? JSON.parse(saved) : [];
  });

  const [sessions, setSessions] = useState<ClassSession[]>(() => {
    const saved = localStorage.getItem('dance_sessions');
    return saved ? JSON.parse(saved) : [];
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('dance_students');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    // localStorage.setItem('dance_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    // localStorage.setItem('dance_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    // localStorage.setItem('dance_students', JSON.stringify(students));
  }, [students]);

  const lastLocalUpdate = useRef<number>(0);

  const fetchData = async () => {
    // Don't poll if we just updated locally in the last 3 seconds
    if (Date.now() - lastLocalUpdate.current < 3000) {
      return;
    }

    try {
      const [actRes, sesRes, stuRes] = await Promise.all([
        fetch('/api/activities', { cache: 'no-store' }),
        fetch('/api/sessions', { cache: 'no-store' }),
        fetch('/api/students', { cache: 'no-store' })
      ]);
      if (actRes.ok && sesRes.ok && stuRes.ok) {
        const acts = await actRes.json();
        const sessRaw = await sesRes.json();
        const stus = await stuRes.json();

        setActivities(acts);
        setSessions(sessRaw);
        setStudents(stus);
      }
    } catch (err) {
      console.error("Failed to fetch from server", err);
    }
  };

  // Sync with Backend Server (Data + Telegram integration)
  useEffect(() => {
    // Initial fetch
    fetchData();
    
    // Poll the server every 5 seconds to get updates from Telegram bot
    const intervalId = setInterval(fetchData, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const syncActivity = async (a: Activity) => {
    lastLocalUpdate.current = Date.now();
    try { await fetch(`/api/activities/${a.id}`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(a) }); } catch(e) {}
  };

  const syncSession = async (s: ClassSession) => {
    lastLocalUpdate.current = Date.now();
    try { await fetch(`/api/sessions/${s.id}`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(s) }); } catch(e) {}
  };

  const syncStudent = async (student: Student) => {
    lastLocalUpdate.current = Date.now();
    try { await fetch(`/api/students/${student.id}`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(student) }); } catch(e) {}
  };

  const deleteActivityFromServer = async (id: string) => {
    lastLocalUpdate.current = Date.now();
    try { await fetch(`/api/activities/${id}`, { method: 'DELETE' }); } catch(e) {}
  };

  const deleteSessionFromServer = async (id: string) => {
    lastLocalUpdate.current = Date.now();
    try { await fetch(`/api/sessions/${id}`, { method: 'DELETE' }); } catch(e) {}
  };

  const deleteStudentFromServer = async (id: string) => {
    lastLocalUpdate.current = Date.now();
    try { await fetch(`/api/students/${id}`, { method: 'DELETE' }); } catch(e) {}
  };

  // Actions
  const addActivity = (activity: Omit<Activity, 'id'>) => {
    const newA = { ...activity, id: crypto.randomUUID() };
    setActivities((prev) => [...prev, newA]);
    syncActivity(newA);
  };

  const editActivity = (id: string, updatedActivity: Omit<Activity, 'id'>) => {
    const newA = { ...updatedActivity, id };
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? newA : a))
    );
    syncActivity(newA);
  };

  const addSession = (session: Omit<ClassSession, 'id'>) => {
    const newS = { ...session, id: crypto.randomUUID() };
    setSessions((prev) => [...prev, newS]);
    syncSession(newS);
  };

  const editSession = (id: string, updatedSession: Omit<ClassSession, 'id'>) => {
    const newS = { ...updatedSession, id };
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? newS : s))
    );
    syncSession(newS);
  };

  const deleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    deleteSessionFromServer(id);
  };

  const deleteActivity = (id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
    setSessions((prev) => prev.filter((s) => s.activityId !== id));
    deleteActivityFromServer(id);
  };

  const addStudent = (student: Student) => {
    setStudents((prev) => [...prev, student]);
    syncStudent(student);
  };

  const editStudent = (id: string, updatedStudent: Omit<Student, 'id'>) => {
    const newStudent = { ...updatedStudent, id };
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? newStudent : s))
    );
    syncStudent(newStudent);
  };

  const deleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    setSessions((prev) => {
      let changed = false;
      const nextSessions = prev.map(s => {
        if (s.attendeeIds && s.attendeeIds.includes(id)) {
          changed = true;
          const newS = { ...s, attendeeIds: s.attendeeIds.filter(aid => aid !== id) };
          syncSession(newS);
          return newS;
        }
        return s;
      });
      return changed ? nextSessions : prev;
    });
    deleteStudentFromServer(id);
  };

  // Computations
  const summary = useMemo((): SummaryStats => {
    const stats: SummaryStats = {
      totalHeld: 0,
      totalCancelled: 0,
      totalBilled: 0,
      totalRevenue: 0,
      totalAttendees: 0,
      activities: {},
    };

    const filteredSessions = selectedMonth 
      ? sessions.filter(s => s.date.startsWith(selectedMonth))
      : sessions;

    // Initialize activities
    activities.forEach((act) => {
      stats.activities[act.id] = {
        heldCount: 0,
        cancelledBilledCount: 0,
        cancelledUnbilledCount: 0,
        totalRevenue: 0,
        totalAttendees: 0,
        totalDuration: 0,
        justifications: [],
      };

      // Add monthly fee if they have any sessions in this month, or if it's recurring
      if (act.paymentType === 'monthly') {
        const hasSessions = filteredSessions.some(s => s.activityId === act.id);
        if (hasSessions || act.isRecurring) {
          stats.activities[act.id].totalRevenue = act.pricePerClass;
          stats.totalRevenue += act.pricePerClass;
        }
      }
    });

    filteredSessions.forEach((session) => {
      const activity = activities.find((a) => a.id === session.activityId);
      if (!activity) return;

      const actStats = stats.activities[session.activityId];

      if (session.status === 'held') {
        const attendees = session.attendeeIds?.length || 0;
        
        // Calculate revenue based on payment type
        let sessionRevenue = 0;
        if (activity.paymentType !== 'monthly') {
          sessionRevenue = activity.pricePerClass * (session.duration ?? 1);
        }
        
        stats.totalHeld++;
        stats.totalBilled++;
        stats.totalRevenue += sessionRevenue;
        stats.totalAttendees += attendees;
        
        actStats.heldCount++;
        actStats.totalRevenue += sessionRevenue;
        actStats.totalAttendees += attendees;
        if (session.duration) {
          actStats.totalDuration += session.duration;
        }
      } else {
        stats.totalCancelled++;
        
        if (session.status === 'cancelled_billed') {
          let cancelRevenue = 0;
          if (activity.paymentType !== 'monthly') {
             cancelRevenue = activity.pricePerClass * (session.duration ?? 1);
          }

          stats.totalBilled++;
          stats.totalRevenue += cancelRevenue;
          
          actStats.cancelledBilledCount++;
          actStats.totalRevenue += cancelRevenue;
        } else {
          actStats.cancelledUnbilledCount++;
        }

        if (session.justification && session.justification.trim() !== '') {
          actStats.justifications.push(session.justification);
        }
      }
    });

    return stats;
  }, [activities, sessions, selectedMonth]);

  return {
    activities,
    sessions,
    students,
    summary,
    addActivity,
    editActivity,
    addSession,
    editSession,
    deleteSession,
    deleteActivity,
    addStudent,
    editStudent,
    deleteStudent,
    fetchData,
  };
}
