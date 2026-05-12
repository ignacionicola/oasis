import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'oasis_settings';

const DEFAULT_SETTINGS = {
  theme: 'light',
  currency: { code: 'ARS', symbol: '$', name: 'Peso argentino' },
  language: 'es',
};

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD':
      return { ...state, ...action.payload };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_CURRENCY':
      return { ...state, currency: action.payload };
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };
    default:
      return state;
  }
}

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, dispatch] = useReducer(reducer, DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          dispatch({ type: 'LOAD', payload: JSON.parse(raw) });
        } catch (_) {}
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const setTheme = (theme) => dispatch({ type: 'SET_THEME', payload: theme });
  const setCurrency = (currency) => dispatch({ type: 'SET_CURRENCY', payload: currency });
  const setLanguage = (language) => dispatch({ type: 'SET_LANGUAGE', payload: language });

  return (
    <SettingsContext.Provider value={{ settings, loaded, setTheme, setCurrency, setLanguage }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
