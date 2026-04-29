import { useState, useEffect, useMemo } from 'react';
import { Activity, ClassSession, SummaryStats, ActivityStats } from '../types';

export function useDanceStore(selectedMonth?: string) {
  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = localStorage.getItem('dance_activities');
    return saved ? JSON.parse(saved) : [];
  });

  const [sessions, setSessions] = useState<ClassSession[]>(() => {
    const saved = localStorage.getItem('dance_sessions');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('dance_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('dance_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Actions
  const addActivity = (activity: Omit<Activity, 'id'>) => {
    setActivities((prev) => [...prev, { ...activity, id: crypto.randomUUID() }]);
  };

  const editActivity = (id: string, updatedActivity: Omit<Activity, 'id'>) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...updatedActivity, id } : a))
    );
  };

  const addSession = (session: Omit<ClassSession, 'id'>) => {
    setSessions((prev) => [...prev, { ...session, id: crypto.randomUUID() }]);
  };

  const editSession = (id: string, updatedSession: Omit<ClassSession, 'id'>) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...updatedSession, id } : s))
    );
  };

  const deleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const deleteActivity = (id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
    setSessions((prev) => prev.filter((s) => s.activityId !== id));
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
