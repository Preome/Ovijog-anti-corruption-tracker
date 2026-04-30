import React, { createContext, useState, useContext, useEffect } from 'react';
import API from '../services/api';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser(decoded);
        API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.error('Invalid token:', error);
        logout();
      }
    }
    setLoading(false);
  }, []);

  const register = async (userData) => {
    try {
      const response = await API.post('/auth/register/', userData);
      const { access, refresh, user: userDataResponse } = response.data;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      setUser(userDataResponse);
      API.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      
      return { success: true, user: userDataResponse };
    } catch (error) {
      console.error('Registration error:', error.response?.data);
      return { 
        success: false, 
        error: error.response?.data || 'Registration failed' 
      };
    }
  };

  const login = async (username, password) => {
    try {
      const response = await API.post('/auth/login/', { username, password });
      const { access, refresh, user: userData } = response.data;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      setUser(userData);
      API.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      
      return { success: true, user: userData };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    delete API.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};