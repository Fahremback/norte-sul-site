import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, AuthContextType } from '../types';
import { login as apiLogin, fetchMyProfile, register as apiRegister } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const logout = () => {
    localStorage.removeItem('authToken');
    setCurrentUser(null);
  };

  const mapUser = (user: User): User => ({
    ...user,
    initial: user.name?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase() || 'U',
  });

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const userProfile = await fetchMyProfile();
          setCurrentUser(mapUser(userProfile));
        } catch (error) {
          console.error("Token validation failed, logging out.", error);
          logout(); // Token is invalid or expired, clear it
        }
      }
      setIsLoadingAuth(false);
    };

    validateToken();
  }, []);

  const login = async (emailInput: string, passwordInput: string): Promise<boolean> => {
    try {
      const { token, user: loggedInUser } = await apiLogin(emailInput, passwordInput);
      localStorage.setItem('authToken', token);
      setCurrentUser(mapUser(loggedInUser));
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };
  
  const register = async (name: string, email: string, password: string): Promise<void> => {
    const { token, user: registeredUser } = await apiRegister(name, email, password);
    localStorage.setItem('authToken', token);
    setCurrentUser(mapUser(registeredUser));
  };

  const isAuthenticated = !!currentUser;

  if (isLoadingAuth) {
    return <div className="fixed inset-0 bg-background-main flex items-center justify-center z-[200]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div></div>;
  }

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated, login, register, logout, isLoadingAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};