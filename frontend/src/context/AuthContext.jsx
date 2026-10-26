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

  // Validate stored token on mount
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await authService.getProfile();
          setUser(res.data);
          localStorage.setItem('folioverse_user', JSON.stringify(res.data));
        } catch (err) {
          console.warn('Session expired or invalid token:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (username, password, roleHint = null) => {
    const res = await authService.login({ username, password });
    const { token: newToken, user: userData } = res.data;
    const computedRole = roleHint || (userData.is_staff || userData.is_superuser || userData.username === 'admin' ? 'admin' : userData.username?.includes('seller') ? 'seller' : 'buyer');
    const enrichedUser = { ...userData, role: computedRole };
    setToken(newToken);
    setUser(enrichedUser);
    localStorage.setItem('folioverse_token', newToken);
    localStorage.setItem('folioverse_user', JSON.stringify(enrichedUser));
    return res.data;
  };

  const register = async (username, email, password, passwordConfirm, role = 'buyer') => {
    const res = await authService.register({
      username,
      email,
      password,
      password_confirm: passwordConfirm,
    });
    const { token: newToken, user: userData } = res.data;
    const enrichedUser = { ...userData, role: role || 'buyer' };
    setToken(newToken);
    setUser(enrichedUser);
    localStorage.setItem('folioverse_token', newToken);
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
    }
  };

  const isAdmin = Boolean(user?.is_staff || user?.is_superuser || user?.username === 'admin' || user?.role === 'admin');
  const isSeller = Boolean(user?.role === 'seller' || user?.username?.includes('seller'));
  const isBuyer = Boolean(!isAdmin && !isSeller);
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
