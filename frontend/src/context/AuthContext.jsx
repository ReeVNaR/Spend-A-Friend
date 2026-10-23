import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Read saved session synchronously from localStorage for instant 0ms render
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('token') || null;
    } catch {
      return null;
    }
  });

  // If user and token already exist in localStorage, do NOT block the UI
  const [loading, setLoading] = useState(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      // If we already have token and user in localStorage, don't show blocking spinner
      return !(storedToken && storedUser);
    } catch {
      return false;
    }
  });

  // Background silent token verification & sync
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (res.data?.user && isMounted) {
          setUser(res.data.user);
          localStorage.setItem('user', JSON.stringify(res.data.user));
        }
      } catch (error) {
        // ONLY log out if the backend explicitly tells us the token is invalid/expired (401)
        if (error.response?.status === 401) {
          console.warn('Session expired or invalid token. Logging out.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (isMounted) {
            setUser(null);
            setToken(null);
          }
        } else {
          // If network error, 500, or temporary serverless spin-up delay:
          // Keep the cached user session so the user remains logged in!
          console.warn('Background auth refresh skipped (retaining cached session):', error.message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Multi-window & Multi-tab Storage Event Listener
  // Keeps session in perfect sync across all opened windows and tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        setToken(e.newValue);
        if (!e.newValue) setUser(null);
      }
      if (e.key === 'user') {
        try {
          setUser(e.newValue ? JSON.parse(e.newValue) : null);
        } catch {
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token: receivedToken, user: receivedUser } = response.data;
    localStorage.setItem('token', receivedToken);
    localStorage.setItem('user', JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);
    setLoading(false);
    return response.data;
  };

  const register = async (name, email, password, defaultCurrency) => {
    const payload = { name, email, password };
    if (defaultCurrency) payload.defaultCurrency = defaultCurrency;
    const response = await api.post('/auth/register', payload);
    const { token: receivedToken, user: receivedUser } = response.data;
    localStorage.setItem('token', receivedToken);
    localStorage.setItem('user', JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);
    setLoading(false);
    return response.data;
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  }, []);

  const updateUser = async (data) => {
    const response = await api.put('/auth/me', data);
    if (response.data?.user) {
      setUser(response.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
