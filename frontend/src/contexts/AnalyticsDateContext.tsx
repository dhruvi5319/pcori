'use client';
import { createContext, useContext, useState, useCallback } from 'react';

interface AnalyticsDateContextValue {
  startDate: string; // ISO date string YYYY-MM-DD
  endDate: string;
  isLoading: boolean;
  setDateRange: (start: string, end: string) => void;
  setIsLoading: (loading: boolean) => void;
}

const AnalyticsDateContext = createContext<AnalyticsDateContextValue | null>(null);

export function AnalyticsDateProvider({ children }: { children: React.ReactNode }) {
  // Default: last 30 days
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(now.toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);

  const setDateRange = useCallback((start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setIsLoading(true);
    // isLoading returns to false when queries complete — each chart section manages this
  }, []);

  return (
    <AnalyticsDateContext.Provider value={{ startDate, endDate, isLoading, setDateRange, setIsLoading }}>
      {children}
    </AnalyticsDateContext.Provider>
  );
}

export function useAnalyticsDate() {
  const ctx = useContext(AnalyticsDateContext);
  if (!ctx) throw new Error('useAnalyticsDate must be used within AnalyticsDateProvider');
  return ctx;
}
