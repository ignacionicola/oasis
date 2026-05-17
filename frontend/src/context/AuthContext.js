import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const initialState = { user: null, token: null, loading: true };

function reducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload.user, token: action.payload.token, loading: false };
    case 'CLEAR':
      return { user: null, token: null, loading: false };
    case 'LOADED':
      return { ...state, loading: false };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    (async () => {
      const token = await api.getToken();
      if (!token) {
        dispatch({ type: 'LOADED' });
        return;
      }
      try {
        const user = await api.getMe();
        dispatch({ type: 'SET_USER', payload: { user, token } });
      } catch {
        await api.logout();
        dispatch({ type: 'CLEAR' });
      }
    })();
  }, []);

  const login = async (email, password) => {
    const { access_token } = await api.login(email, password);
    await api.setToken(access_token);
    const user = await api.getMe();
    dispatch({ type: 'SET_USER', payload: { user, token: access_token } });
  };

  const register = async (email, password) => {
    const { access_token } = await api.register(email, password);
    await api.setToken(access_token);
    const user = await api.getMe();
    dispatch({ type: 'SET_USER', payload: { user, token: access_token } });
  };

  const loginWithGoogle = async (idToken) => {
    const { access_token } = await api.loginWithGoogle(idToken);
    await api.setToken(access_token);
    const user = await api.getMe();
    dispatch({ type: 'SET_USER', payload: { user, token: access_token } });
  };

  const logout = async () => {
    await api.logout();
    dispatch({ type: 'CLEAR' });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
