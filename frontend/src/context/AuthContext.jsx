import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCurrentUser, loginUser, registerUser } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('jobmatch_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize and check authenticated user on load
  const loadUser = useCallback(async () => {
    const storedToken = localStorage.getItem('jobmatch_token');
    if (!storedToken) {
      setLoading(false);
      return;
    }

    try {
      const response = await getCurrentUser();
      setUser(response.data);
    } catch (err) {
      console.warn('Session expired or invalid token:', err.message);
      localStorage.removeItem('jobmatch_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Login handler
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const result = await loginUser({ email, password });
      const { token: receivedToken, user: receivedUser } = result.data;

      localStorage.setItem('jobmatch_token', receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);
      return receivedUser;
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // Register handler
  const register = async ({ name, email, password, role, companyName, adminAccessCode }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await registerUser({
        name,
        email,
        password,
        role,
        companyName,
        adminAccessCode,
      });
      const { token: receivedToken, user: receivedUser } = result.data;

      localStorage.setItem('jobmatch_token', receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);
      return receivedUser;
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('jobmatch_token');
    setToken(null);
    setUser(null);
    setError(null);
  };

  const clearError = () => setError(null);

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
