import React, { createContext, useContext } from 'react';
import { User } from '../types';
import { useProfile } from '../hooks/useProfile';

interface AuthContextType {
  user: User | null;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  updatePhone: (phone: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, error, isAuthenticated, logout, updatePhone } = useProfile();

  return (
    <AuthContext.Provider value={{ user, logout, isAuthenticated, loading, error, updatePhone }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
