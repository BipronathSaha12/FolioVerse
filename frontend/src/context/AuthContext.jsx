import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('folioverse_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('folioverse_token') || null);
  const [loading, setLoading] = useState(true);

  // Validate stored token on mount and fetch authoritative profile
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await authService.getProfile();
          const profileData = res.data;
          // Authoritative role directly from backend database schema (no username guessing)
          const authoritativeRole = profileData.role || (profileData.is_staff || profileData.is_superuser ? 'admin' : 'buyer');
          const enrichedUser = { ...profileData, role: authoritativeRole };
          setUser(enrichedUser);
          localStorage.setItem('folioverse_user', JSON.stringify(enrichedUser));
          localStorage.setItem('folioverse_role', authoritativeRole);
        } catch (err) {
          console.warn('Session expired or invalid token:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (username, password) => {
    const res = await authService.login({ username, password });
    const { token: newToken, user: userData } = res.data;
    // Database-backed authoritative role
    const authoritativeRole = userData.role || (userData.is_staff || userData.is_superuser ? 'admin' : 'buyer');
    const enrichedUser = { ...userData, role: authoritativeRole };
    setToken(newToken);
    setUser(enrichedUser);
    localStorage.setItem('folioverse_token', newToken);
    localStorage.setItem('folioverse_role', authoritativeRole);
    localStorage.setItem('folioverse_user', JSON.stringify(enrichedUser));
    return res.data;
  };

  const register = async (username, email, password, passwordConfirm, role = 'buyer') => {
    const res = await authService.register({
      username,
      email,
      password,
      password_confirm: passwordConfirm,
      role, // Pass explicit role to the database backend
    });
    const { token: newToken, user: userData } = res.data;
    const authoritativeRole = userData.role || role;
    const enrichedUser = { ...userData, role: authoritativeRole };
    setToken(newToken);
    setUser(enrichedUser);
    localStorage.setItem('folioverse_token', newToken);
    localStorage.setItem('folioverse_role', authoritativeRole);
    localStorage.setItem('folioverse_user', JSON.stringify(enrichedUser));
    return res.data;
  };

  const logout = async () => {
    try {
      if (token) {
        await authService.logout();
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('folioverse_token');
      localStorage.removeItem('folioverse_user');
      localStorage.removeItem('folioverse_role');
    }
  };

  // Strictly database-enforced RBAC (zero username guessing)
  const isAdmin = Boolean(user?.role === 'admin' || user?.is_staff || user?.is_superuser);
  const isSeller = Boolean(user?.role === 'seller');
  const isBuyer = Boolean(user?.role === 'buyer' || (!isAdmin && !isSeller));
  const canManageBooks = Boolean(isAdmin || isSeller);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isAdmin,
        isSeller,
        isBuyer,
        canManageBooks,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
