import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('civicfix_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('civicfix_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await authApi.getMe();
          setUser(res.data);
          localStorage.setItem('civicfix_user', JSON.stringify(res.data));
        } catch (err) {
          console.error("Session fetch failed:", err);
          logout();
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    const data = res.data;
    setToken(data.access_token);
    const userData = { id: data.user_id, name: data.name, email: data.email, role: data.role };
    setUser(userData);
    localStorage.setItem('civicfix_token', data.access_token);
    localStorage.setItem('civicfix_user', JSON.stringify(userData));
    return userData;
  };

  const register = async (name, email, password, role = 'CITIZEN') => {
    const res = await authApi.register({ name, email, password, role });
    const data = res.data;
    setToken(data.access_token);
    const userData = { id: data.user_id, name: data.name, email: data.email, role: data.role };
    setUser(userData);
    localStorage.setItem('civicfix_token', data.access_token);
    localStorage.setItem('civicfix_user', JSON.stringify(userData));
    return userData;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('civicfix_token');
    localStorage.removeItem('civicfix_user');
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!token,
    isAuthority: user?.role === 'AUTHORITY',
    isCitizen: user?.role === 'CITIZEN'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
