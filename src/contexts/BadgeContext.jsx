import React, { createContext, useState, useCallback } from 'react';

export const BadgeContext = createContext();

export const BadgeProvider = ({ children }) => {
  const [badges, setBadges] = useState({
    NEW_PAWN: 0,
    REPEAT_ORDER: 0,
    NOTIF_LIST: 0, 
    APPROVAL_HM: 0,
    LAPORAN_TERBARU: 0,
    AUCTION_NOTIF: 0, 
    DUE_DATE_NOTIF: 0 
  });

  const incrementBadge = useCallback((key) => {
    setBadges((prev) => ({
      ...prev,
      [key]: (prev[key] || 0) + 1,
    }));
  }, []);

  const resetBadge = useCallback((key) => {
    setBadges((prev) => ({
      ...prev,
      [key]: 0,
    }));
  }, []);

  return (
    <BadgeContext.Provider value={{ badges, incrementBadge, resetBadge }}>
      {children}
    </BadgeContext.Provider>
  );
};