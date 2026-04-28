import { useState, useEffect, useMemo } from 'react';
import { Activity, ClassSession, SummaryStats, ActivityStats } from '../types';

export function useDanceStore() {
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
    });

    sessions.forEach((session) => {
      const activity = activities.find((a) => a.id === session.activityId);
      if (!activity) return;

      const actStats = stats.activities[session.activityId];

      if (session.status === 'held') {
        const attendees = session.attendeesCount || 0;
        const sessionRevenue = attendees * activity.pricePerClass;
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
          stats.totalBilled++;
          stats.totalRevenue += activity.pricePerClass;
          
          actStats.cancelledBilledCount++;
          actStats.totalRevenue += activity.pricePerClass;
        } else {
          actStats.cancelledUnbilledCount++;
        }

        if (session.justification && session.justification.trim() !== '') {
          actStats.justifications.push(session.justification);
        }
      }
    });

    return stats;
  }, [activities, sessions]);

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
