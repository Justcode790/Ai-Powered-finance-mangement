import React, { createContext, useContext, useEffect, useState } from 'react';
import { getMe } from '../services/api';

const AuthContext = createContext(null);

const STORAGE_KEY = 'smartfin_auth';

function loadStoredAuth() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return { token: null, userId: null, name: null };
  try {
    const parsed = JSON.parse(stored);
    if (parsed?.token && parsed?.userId) {
      return { token: parsed.token, userId: parsed.userId, name: parsed.name || null };
    }
  } catch {
    // ignore parse errors
  }
  return { token: null, userId: null, name: null };
}

export const AuthProvider = ({ children }) => {
  // Initialize synchronously from localStorage to avoid redirecting on refresh
  const [auth, setAuth] = useState(() => loadStoredAuth());
  const [user, setUser] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Load full user data when authenticated
    if (auth.token) {
      getMe()
        .then(userData => setUser(userData))
        .catch(err => console.error('Failed to load user data:', err));
    }
    setHydrated(true);
  }, [auth.token]);

  const login = (data) => {
    const next = {
      token: data.token,
      userId: data.userId,
      name: data.name
    };
    setAuth(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const logout = () => {
    setAuth({ token: null, userId: null, name: null });
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{ ...auth, user, isAuthenticated: !!auth.token, hydrated, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

