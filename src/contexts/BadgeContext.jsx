import React, { createContext, useState, useCallback, useEffect } from 'react';
import axiosInstance from 'api/axiosInstance';
export const BadgeContext = createContext();

export const BadgeProvider = ({ children }) => {
  const [badges, setBadges] = useState({
    NEW_PAWN: 0,
    REPEAT_ORDER: 0,
    NOTIF_LIST: 0, 
    APPROVAL_HM: 0,
    AUCTION_NOTIF: 0, 
  });

  const fetchBadges = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/notifications/badge-counters');
      if (res.data.success) setBadges(res.data.data);
    } catch (error) { console.error("Badge Sync Error"); }
  }, []);

  useEffect(() => { fetchBadges(); }, [fetchBadges]);

  const incrementBadge = useCallback((key) => {
    setBadges((prev) => (key in prev ? { ...prev, [key]: (prev[key] || 0) + 1 } : prev));
  }, []);

  const resetBadge = useCallback((key) => {
    setBadges((prev) => ({ ...prev, [key]: 0 }));
  }, []);

  return (
    <BadgeContext.Provider value={{ badges, incrementBadge, resetBadge, refreshBadges: fetchBadges }}>
      {children}
    </BadgeContext.Provider>
  );
};