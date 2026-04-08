import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  TutorialModeState,
  TutorialStepName,
  TutorialProgress,
  DemoBooking,
  DemoFacility,
} from '../types/tutorialTypes';

interface TutorialModeContextType {
  state: TutorialModeState;
  enableTutorialMode: (currentStep: TutorialStepName) => void;
  disableTutorialMode: () => void;
  setCurrentStep: (step: TutorialStepName | null) => void;
  completeCheckpoint: (checkpointId: string) => void;
  isCheckpointCompleted: (checkpointId: string) => boolean;
  addDemoBooking: (booking: DemoBooking) => void;
  addDemoFacility: (facility: DemoFacility) => void;
  getDemoBookings: () => DemoBooking[];
  getDemoFacilities: () => DemoFacility[];
  clearDemoCache: () => void;
  updateTutorialProgress: (progress: Partial<TutorialProgress>) => void;
  getTutorialProgress: () => TutorialProgress;
  setIsReplay: (isReplay: boolean) => void;
}

const TutorialModeContext = createContext<TutorialModeContextType | undefined>(undefined);

const DEFAULT_PROGRESS: TutorialProgress = {
  userBookingDemo: false,
  adminFacilityBeginner: false,
  adminFacilityAdvanced: false,
  adminFacilityEditing: false,
  superAdminFacility: false,
  lastUpdated: 0,
};

export const TutorialModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<TutorialModeState>({
    isTutorialMode: false,
    currentStep: null,
    completedCheckpoints: new Set<string>(),
    demoBookings: [],
    demoFacilities: [],
    progress: loadTutorialProgress(),
    isReplay: false,
  });

  const enableTutorialMode = useCallback((currentStep: TutorialStepName) => {
    setState((prev) => ({
      ...prev,
      isTutorialMode: true,
      currentStep,
      completedCheckpoints: new Set<string>(),
    }));
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('tutorial_mode_enabled', 'true');
    }
  }, []);

  const disableTutorialMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isTutorialMode: false,
      currentStep: null,
      completedCheckpoints: new Set<string>(),
      demoBookings: [],
      demoFacilities: [],
    }));
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('tutorial_mode_enabled');
    }
  }, []);

  const setCurrentStep = useCallback((step: TutorialStepName | null) => {
    setState((prev) => ({
      ...prev,
      currentStep: step,
    }));
  }, []);

  const completeCheckpoint = useCallback((checkpointId: string) => {
    setState((prev) => {
      const newCheckpoints = new Set(prev.completedCheckpoints);
      newCheckpoints.add(checkpointId);
      return {
        ...prev,
        completedCheckpoints: newCheckpoints,
      };
    });
  }, []);

  const isCheckpointCompleted = useCallback((checkpointId: string) => {
    return state.completedCheckpoints.has(checkpointId);
  }, [state.completedCheckpoints]);

  const addDemoBooking = useCallback((booking: DemoBooking) => {
    setState((prev) => ({
      ...prev,
      demoBookings: [...prev.demoBookings, booking],
    }));
  }, []);

  const addDemoFacility = useCallback((facility: DemoFacility) => {
    setState((prev) => ({
      ...prev,
      demoFacilities: [...prev.demoFacilities, facility],
    }));
  }, []);

  const getDemoBookings = useCallback(() => {
    return state.demoBookings;
  }, [state.demoBookings]);

  const getDemoFacilities = useCallback(() => {
    return state.demoFacilities;
  }, [state.demoFacilities]);

  const clearDemoCache = useCallback(() => {
    setState((prev) => ({
      ...prev,
      demoBookings: [],
      demoFacilities: [],
      completedCheckpoints: new Set<string>(),
    }));
  }, []);

  const updateTutorialProgress = useCallback((updates: Partial<TutorialProgress>) => {
    setState((prev) => {
      const newProgress: TutorialProgress = {
        ...prev.progress,
        ...updates,
        lastUpdated: Date.now(),
      };
      saveTutorialProgress(newProgress);
      return {
        ...prev,
        progress: newProgress,
      };
    });
  }, []);

  const getTutorialProgress = useCallback(() => {
    return state.progress;
  }, [state.progress]);

  const setIsReplay = useCallback((isReplay: boolean) => {
    setState((prev) => ({
      ...prev,
      isReplay,
    }));
  }, []);

  const contextValue: TutorialModeContextType = {
    state,
    enableTutorialMode,
    disableTutorialMode,
    setCurrentStep,
    completeCheckpoint,
    isCheckpointCompleted,
    addDemoBooking,
    addDemoFacility,
    getDemoBookings,
    getDemoFacilities,
    clearDemoCache,
    updateTutorialProgress,
    getTutorialProgress,
    setIsReplay,
  };

  return (
    <TutorialModeContext.Provider value={contextValue}>
      {children}
    </TutorialModeContext.Provider>
  );
};

export const useTutorialModeContext = () => {
  const context = useContext(TutorialModeContext);
  if (context === undefined) {
    throw new Error('useTutorialModeContext must be used within a TutorialModeProvider');
  }
  return context;
};

// ─────────────────────────────────────────────────────────────────
// LocalStorage Persistence Helpers
// ─────────────────────────────────────────────────────────────────

function loadTutorialProgress(): TutorialProgress {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS;
  
  try {
    const stored = localStorage.getItem('tutorial_progress');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (err) {
    console.warn('Failed to load tutorial progress:', err);
  }
  
  return DEFAULT_PROGRESS;
}

function saveTutorialProgress(progress: TutorialProgress) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('tutorial_progress', JSON.stringify(progress));
  } catch (err) {
    console.warn('Failed to save tutorial progress:', err);
  }
}
