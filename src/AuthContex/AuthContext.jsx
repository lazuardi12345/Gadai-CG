import React, { createContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasNewNotification, setHasNewNotification] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
        setIsAuthenticated(true);

        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      } catch (error) {
        localStorage.clear();
      }
    }

    setLoading(false); 
  }, []);

  const login = (userData, accessToken) => {

    if (!userData || !accessToken) return;

    setUser(userData);
    setToken(accessToken);
    setIsAuthenticated(true);

    localStorage.setItem('auth_user', JSON.stringify(userData));
    localStorage.setItem('auth_token', accessToken);

    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);

    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');

    delete axiosInstance.defaults.headers.common['Authorization'];

    setHasNewNotification(false);
  };

  const hasRole = (roles) => {
    if (!user || !user.role) return false;

    const rolesToChecked = Array.isArray(roles) ? roles : [roles];
    return rolesToChecked.includes(user.role.toLowerCase());
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
        loading, 
        hasNewNotification,
        setHasNewNotification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};