import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';

interface ActivityContextType {
  isActive: boolean;
  lastActivityTime: Date | null;
}

const ActivityContext = createContext<ActivityContextType>({
  isActive: false,
  lastActivityTime: null,
});

const IDLE_TIMEOUT = 2 * 60 * 1000;

export const ActivityProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(true);
  const [lastActivityTime, setLastActivityTime] = useState<Date | null>(new Date());
  const lastActivityRef = useRef<Date>(new Date());
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionStartTimeRef = useRef<Date | null>(null);

  useEffect(() => {
    if (!user || user.vaiTro !== 'hocSinh') return;

    const endSession = async () => {
      try {
        if (sessionStartTimeRef.current) {
          await api.appSessions.end(user.id);
          sessionStartTimeRef.current = null;
        }
      } catch (error) {
      }
    };

    const startSession = async () => {
      try {
        sessionStartTimeRef.current = new Date();
        await api.appSessions.start(user.id);
      } catch (error) {
      }
    };

    const handleUserActivity = () => {
      const now = new Date();
      lastActivityRef.current = now;
      setLastActivityTime(now);

      if (!isActive) {
        setIsActive(true);
        startSession();
      }

      resetIdleTimer();
    };

    const resetIdleTimer = () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }

      idleTimerRef.current = setTimeout(() => {
        setIsActive(false);
        endSession();
      }, IDLE_TIMEOUT);
    };

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        const now = new Date();
        const timeSinceLastActivity = now.getTime() - lastActivityRef.current.getTime();
        
        if (timeSinceLastActivity > IDLE_TIMEOUT) {
          setIsActive(false);
          endSession();
        } else {
          setIsActive(true);
          handleUserActivity();
        }
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        setIsActive(false);
        endSession();
      }
    };

    handleUserActivity();
    startSession();

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      subscription.remove();
      if (user && sessionStartTimeRef.current) {
        endSession().catch(() => {
        });
      }
    };
  }, [user, isActive]);

  useEffect(() => {
    const endSession = async () => {
      try {
        if (sessionStartTimeRef.current && user && user.vaiTro === 'hocSinh') {
          await api.appSessions.end(user.id);
          sessionStartTimeRef.current = null;
        }
      } catch (error) {
      }
    };

    (global as any).trackActivity = () => {
      if (user && user.vaiTro === 'hocSinh') {
        const now = new Date();
        lastActivityRef.current = now;
        setLastActivityTime(now);

        if (!isActive) {
          setIsActive(true);
        }

        if (idleTimerRef.current) {
          clearTimeout(idleTimerRef.current);
        }

        idleTimerRef.current = setTimeout(() => {
          setIsActive(false);
          endSession();
        }, IDLE_TIMEOUT);
      }
    };

    const handleTouch = () => {
      if (user && user.vaiTro === 'hocSinh') {
        (global as any).trackActivity?.();
      }
    };

  }, [user, isActive]);

  return (
    <ActivityContext.Provider value={{ isActive, lastActivityTime }}>
      {children}
    </ActivityContext.Provider>
  );
};

export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error('useActivity must be used within ActivityProvider');
  }
  return context;
};

