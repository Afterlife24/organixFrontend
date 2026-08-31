import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { followUpsAPI } from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const FollowUpContext = createContext();

export const FollowUpProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [todayCount, setTodayCount] = useState(0); // total follow-ups due today
  const [todayBreakdown, setTodayBreakdown] = useState({ outreach: 0, leads: 0 });

  const getTodayStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const fetchTodayFollowUps = useCallback(async () => {
    if (!isAuthenticated || !user?.isAdmin) return;
    try {
      const res = await followUpsAPI.getDateDetails(getTodayStr());
      const outreach = res.data.outreach?.length || 0;
      const leads = res.data.leads?.length || 0;
      const total = outreach + leads;
      setTodayCount(total);
      setTodayBreakdown({ outreach, leads });
      return { total, outreach, leads };
    } catch {
      return null;
    }
  }, [isAuthenticated, user]);

  // Fetch on login / on auth state change
  useEffect(() => {
    if (!isAuthenticated || !user?.isAdmin) {
      setTodayCount(0);
      setTodayBreakdown({ outreach: 0, leads: 0 });
      return;
    }

    fetchTodayFollowUps().then(result => {
      if (result && result.total > 0) {
        // Show notification toast
        const parts = [];
        if (result.outreach > 0) parts.push(`${result.outreach} outreach`);
        if (result.leads > 0) parts.push(`${result.leads} lead${result.leads > 1 ? 's' : ''}`);
        toast(
          `📅 ${result.total} follow-up${result.total > 1 ? 's' : ''} due today — ${parts.join(' & ')}`,
          {
            duration: 6000,
            style: {
              background: '#fff7ed',
              color: '#c2410c',
              border: '1px solid #fed7aa',
              fontWeight: '600',
            },
            icon: '🔔',
          }
        );
      }
    });
  }, [isAuthenticated, user, fetchTodayFollowUps]);

  return (
    <FollowUpContext.Provider value={{ todayCount, todayBreakdown, refetch: fetchTodayFollowUps }}>
      {children}
    </FollowUpContext.Provider>
  );
};

export const useFollowUps = () => {
  const context = useContext(FollowUpContext);
  if (!context) throw new Error('useFollowUps must be used within FollowUpProvider');
  return context;
};
