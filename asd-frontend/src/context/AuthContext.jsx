import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Mock auth state: null (logged out), 'doctor', or 'patient'
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);

  useEffect(() => {
    if (userRole) {
      localStorage.setItem('userRole', userRole);
    } else {
      localStorage.removeItem('userRole');
    }

    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [userRole, user]);

  const login = (role, userData) => {
    setUserRole(role);
    setUser(userData);
  };

  const logout = () => {
    setUserRole(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ userRole, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
