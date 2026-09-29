import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { playTimerStartSound, playSuccessSound } from '../utils/audio';

const TimerContext = createContext(null);

export function TimerProvider({ children }) {
  const { user, token } = useAuth();
  const [activeTimer, setActiveTimer] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPomodoro, setIsPomodoro] = useState(false);
  const [pomodoroSecondsLeft, setPomodoroSecondsLeft] = useState(25 * 60);
  const intervalRef = useRef(null);

  // Sync active timer from server when user switches or loads
  useEffect(() => {
    if (!user) return;

    const checkActiveTimer = async () => {
      try {
        const res = await fetch('/api/timer/active', {
          headers: {
            'x-demo-user-id': user.id,
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        const data = await res.json();
        if (data.active && data.task) {
          const startedAt = new Date(data.active.startedAt).getTime();
          const initialElapsed = Math.floor((Date.now() - startedAt) / 1000);
          setActiveTimer({ ...data.active, task: data.task });
          setElapsedSeconds(Math.max(0, initialElapsed));
        } else {
          setActiveTimer(null);
          setElapsedSeconds(0);
        }
      } catch (err) {
        console.error('Error fetching active timer:', err);
      }
    };

    checkActiveTimer();
  }, [user, token]);

  // Timer tick interval
  useEffect(() => {
    if (activeTimer) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);

        if (isPomodoro) {
          setPomodoroSecondsLeft(prev => {
            if (prev <= 1) {
              playSuccessSound();
              if (window.Notification && Notification.permission === 'granted') {
                new Notification('PulseFlow Pomodoro Complete! 🎉', {
                  body: 'Time to take a well-deserved 5-minute break.'
                });
              }
              return 25 * 60;
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setElapsedSeconds(0);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeTimer, isPomodoro]);

  const startTaskTimer = async (task) => {
    try {
      playTimerStartSound();
      const res = await fetch('/api/timer/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': user.id,
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ taskId: task.id })
      });
      const data = await res.json();
      if (res.ok) {
        setActiveTimer({ ...data.active, task });
        setElapsedSeconds(0);
        if (isPomodoro) setPomodoroSecondsLeft(25 * 60);
      }
    } catch (err) {
      console.error('Failed to start timer:', err);
    }
  };

  const stopTaskTimer = async (note = '') => {
    if (!activeTimer) return null;
    try {
      const res = await fetch('/api/timer/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': user.id,
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ note })
      });
      const data = await res.json();
      setActiveTimer(null);
      setElapsedSeconds(0);
      return data;
    } catch (err) {
      console.error('Failed to stop timer:', err);
      return null;
    }
  };

  const togglePomodoroMode = () => {
    setIsPomodoro(prev => !prev);
    setPomodoroSecondsLeft(25 * 60);
  };

  return (
    <TimerContext.Provider
      value={{
        activeTimer,
        elapsedSeconds,
        isPomodoro,
        pomodoroSecondsLeft,
        startTaskTimer,
        stopTaskTimer,
        togglePomodoroMode
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (!context) throw new Error('useTimer must be used within a TimerProvider');
  return context;
}
