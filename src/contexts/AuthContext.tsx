import React, { createContext, useContext } from 'react';
import { User } from '../types';
import { useProfile } from '../hooks/useProfile';
import { TutorialModeProvider } from './TutorialModeContext';

interface AuthContextType {
  user: User | null;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  updatePhone: (phone: string) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  updateTutorialRole: (tutorialRole: string) => Promise<void>;
  noProfile: boolean;
  envEmail: string;
  envDisplayName: string;
  register: (data: { fullName: string; phone: string; departmentId: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, error, isAuthenticated, logout, updatePhone, updateName, updateTutorialRole, noProfile, envEmail, envDisplayName, register } = useProfile();

  return (
    <AuthContext.Provider value={{ user, logout, isAuthenticated, loading, error, updatePhone, updateName, updateTutorialRole, noProfile, envEmail, envDisplayName, register }}>
      <TutorialModeProvider>
        {children}
      </TutorialModeProvider>
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
