import { useState, useEffect, useMemo, useRef } from 'react';
import { Activity, ClassSession, SummaryStats, ActivityStats } from '../types';

export function useDanceStore(selectedMonth?: string) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);

  // Sync with Backend Server (Data + Telegram integration)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [actRes, sesRes] = await Promise.all([
          fetch('/api/activities'),
          fetch('/api/sessions')
        ]);
        if (actRes.ok && sesRes.ok) {
          const acts = await actRes.json();
          const sess = await sesRes.json();
          
          setActivities(acts);
          setSessions(sess);
        }
      } catch (err) {
        console.error("Failed to fetch from server", err);
      }
    };
    
    // Initial fetch
    fetchData();
    
    // Poll the server every 5 seconds to get updates from Telegram bot
    const intervalId = setInterval(fetchData, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const syncActivity = async (a: Activity) => {
    try { await fetch(`/api/activities/${a.id}`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(a) }); } catch(e) {}
  };

  const syncSession = async (s: ClassSession) => {
    try { await fetch(`/api/sessions/${s.id}`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(s) }); } catch(e) {}
  };

  const deleteActivityFromServer = async (id: string) => {
    try { await fetch(`/api/activities/${id}`, { method: 'DELETE' }); } catch(e) {}
  };

  const deleteSessionFromServer = async (id: string) => {
    try { await fetch(`/api/sessions/${id}`, { method: 'DELETE' }); } catch(e) {}
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
        const attendees = session.attendeesCount || 0;
        
        // Calculate revenue based on payment type
        let sessionRevenue = 0;
        if (activity.paymentType !== 'monthly') {
          sessionRevenue = activity.pricePerClass;
        }
        
        stats.totalHeld++;
        stats.totalBilled++;
        stats.totalRevenue += sessionRevenue;
        stats.totalAttendees += attendees;
        
        actStats.heldCount++;
        actStats.totalRevenue += sessionRevenue;
        actStats.totalAttendees += attendees;
      } else {
        stats.totalCancelled++;
        
        if (session.status === 'cancelled_billed') {
          let cancelRevenue = 0;
          if (activity.paymentType !== 'monthly') {
             cancelRevenue = activity.pricePerClass;
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
    summary,
    addActivity,
    editActivity,
    addSession,
    editSession,
    deleteSession,
    deleteActivity,
  };
}
