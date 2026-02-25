import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';

export type TimerMode = 'focus' | 'happypause';

type TimerContextType = {
  mode: TimerMode;
  remainingSeconds: number;
  isRunning: boolean;
  focusMinutes: number;
  pauseMinutes: number;
  startFocus: () => void;
  startHappyPause: () => void;
  togglePause: () => void;
  stop: () => void;
  restart: () => void;
  setFocusMinutes: (m: number) => void;
  setPauseMinutes: (m: number) => void;
  registerOnFocusEnd: (cb: () => void) => () => void;
  registerOnHappyPauseEnd: (cb: () => void) => () => void;
};

const TimerContext = createContext<TimerContextType | null>(null);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<TimerMode>('focus');
  const [remainingSeconds, setRemainingSeconds] = useState(55 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [focusMinutes, setFocusMinutes] = useState(55);
  const [pauseMinutes, setPauseMinutes] = useState(5);
  const onFocusEndRef = useRef<(() => void) | null>(null);
  const onHappyPauseEndRef = useRef<(() => void) | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const registerOnFocusEnd = (cb: () => void) => {
    onFocusEndRef.current = cb;
    return () => { onFocusEndRef.current = null; };
  };

  const registerOnHappyPauseEnd = (cb: () => void) => {
    onHappyPauseEndRef.current = cb;
    return () => { onHappyPauseEndRef.current = null; };
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setRemainingSeconds(s => {
        if (s <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setIsRunning(false);
          if (mode === 'focus') {
            (async () => {
              try {
                const { sound } = await Audio.Sound.createAsync(
                  require('../assets/sounds/Chimes.mp3')
                );
                await sound.playAsync();
              } catch {}
            })();
            onFocusEndRef.current?.();
          } else {
            onHappyPauseEndRef.current?.();
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode]);

  const startFocus = () => {
    setMode('focus');
    setRemainingSeconds(focusMinutes * 60);
    setIsRunning(true);
  };

  const startHappyPause = () => {
    setMode('happypause');
    setRemainingSeconds(pauseMinutes * 60);
    setIsRunning(true);
  };

  const togglePause = () => setIsRunning(r => !r);

  const stop = () => {
    setIsRunning(false);
    setRemainingSeconds(mode === 'focus' ? focusMinutes * 60 : pauseMinutes * 60);
  };

  const restart = () => {
    if (mode === 'focus') {
      setRemainingSeconds(focusMinutes * 60);
    } else {
      setRemainingSeconds(pauseMinutes * 60);
    }
    setIsRunning(true);
  };

  return (
    <TimerContext.Provider
      value={{
        mode,
        remainingSeconds,
        isRunning,
        focusMinutes,
        pauseMinutes,
        startFocus,
        startHappyPause,
        togglePause,
        stop,
        restart,
        setFocusMinutes,
        setPauseMinutes,
        registerOnFocusEnd,
        registerOnHappyPauseEnd,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimer must be used within TimerProvider');
  return ctx;
}
