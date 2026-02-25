import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCALE_KEY = 'app_language';

type Locale = 'EN' | 'FR';

type LocaleContextType = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Record<string, string>;
};

const LocaleContext = createContext<LocaleContextType | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('EN');

  useEffect(() => {
    AsyncStorage.getItem(LOCALE_KEY).then(l => {
      if (l === 'FR' || l === 'EN') setLocaleState(l);
    });
  }, []);

  const setLocale = async (l: Locale) => {
    setLocaleState(l);
    await AsyncStorage.setItem(LOCALE_KEY, l);
  };

  const t = (locale === 'FR' ? require('../locales/fr').default : require('../locales/en').default) as Record<string, string>;

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
