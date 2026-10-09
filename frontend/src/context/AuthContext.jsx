import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getStoredToken, setStoredToken, clearStoredToken } from '../api/client';
import { authApi } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const userData = await authApi.getMe();
      setUser(userData);
    } catch (err) {
      console.warn('Session verification failed, clearing token:', err);
      clearStoredToken();
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();

    // Listen for auth expiration events from API client
    const handleAuthExpired = () => {
      setToken(null);
      setUser(null);
    };

    window.addEventListener('kivora:auth-expired', handleAuthExpired);
    return () => window.removeEventListener('kivora:auth-expired', handleAuthExpired);
  }, [refreshUser]);

  const login = (newToken, newUser) => {
    setStoredToken(newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    clearStoredToken();
    setToken(null);
    setUser(null);
  };

  const value = {
    token,
    user,
    isLoading,
    isAuthenticated: Boolean(token && user),
    isCreator: user?.role === 'CREATOR',
    isBrand: user?.role === 'BRAND',
    isAdmin: user?.role === 'ADMIN',
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
