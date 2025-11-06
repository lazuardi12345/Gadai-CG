import React, { createContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

// Buat Context
export const AuthContext = createContext();

// Provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // menandai proses load auth

  // Load data dari localStorage saat pertama kali mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (storedToken && storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setToken(storedToken);
      setIsAuthenticated(true);

      // Set default header axios
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }

    setLoading(false); // selesai load
  }, []);

  // Fungsi login → update state & localStorage
  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    setIsAuthenticated(true);

    localStorage.setItem('auth_user', JSON.stringify(userData));
    localStorage.setItem('auth_token', authToken);

    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
  };

  // Fungsi logout → hapus semua data
  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);

    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');

    delete axiosInstance.defaults.headers.common['Authorization'];
  };

  // Cek role user (helper)
  const hasRole = (roles) => {
    if (!user || !user.role) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        login,
        logout,
        hasRole,
        loading, // supaya komponen bisa menunggu auth siap
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
