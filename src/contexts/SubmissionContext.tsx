import React, { createContext, useContext, useState, useCallback } from 'react';

interface SubmissionContextType {
  pendingSubmissions: Set<string>;
  registerSubmission: (id: string) => void;
  unregisterSubmission: (id: string) => void;
  hasPendingSubmissions: () => boolean;
  getPendingCount: () => number;
}

const SubmissionContext = createContext<SubmissionContextType | undefined>(undefined);

export const SubmissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pendingSubmissions, setPendingSubmissions] = useState<Set<string>>(new Set());

  const registerSubmission = useCallback((id: string) => {
    setPendingSubmissions(prev => new Set([...prev, id]));
  }, []);

  const unregisterSubmission = useCallback((id: string) => {
    setPendingSubmissions(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const hasPendingSubmissions = useCallback(() => {
    return pendingSubmissions.size > 0;
  }, [pendingSubmissions]);

  const getPendingCount = useCallback(() => {
    return pendingSubmissions.size;
  }, [pendingSubmissions]);

  return (
    <SubmissionContext.Provider value={{ pendingSubmissions, registerSubmission, unregisterSubmission, hasPendingSubmissions, getPendingCount }}>
      {children}
    </SubmissionContext.Provider>
  );
};

export const useSubmission = (): SubmissionContextType => {
  const context = useContext(SubmissionContext);
  if (context === undefined) {
    throw new Error('useSubmission must be used within a SubmissionProvider');
  }
  return context;
};
