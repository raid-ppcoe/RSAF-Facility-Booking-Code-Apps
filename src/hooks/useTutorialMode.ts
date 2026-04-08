import { useTutorialModeContext } from '../contexts/TutorialModeContext';
import { TutorialStepName } from '../types/tutorialTypes';

/**
 * Hook to access and manage tutorial mode
 * Provides a clean API for components to interact with the tutorial system
 */
export function useTutorialMode() {
  const context = useTutorialModeContext();

  return {
    // State accessors
    isTutorialMode: context.state.isTutorialMode,
    currentStep: context.state.currentStep,
    isReplay: context.state.isReplay,
    demoBookings: context.state.demoBookings,
    demoFacilities: context.state.demoFacilities,
    progress: context.state.progress,
    completedCheckpoints: context.state.completedCheckpoints,

    // Tutorial mode control
    enableTutorialMode: context.enableTutorialMode,
    disableTutorialMode: context.disableTutorialMode,
    setCurrentStep: context.setCurrentStep,
    setIsReplay: context.setIsReplay,

    // Checkpoint management
    completeCheckpoint: context.completeCheckpoint,
    isCheckpointCompleted: context.isCheckpointCompleted,

    // Demo data management
    addDemoBooking: context.addDemoBooking,
    addDemoFacility: context.addDemoFacility,
    getDemoBookings: context.getDemoBookings,
    getDemoFacilities: context.getDemoFacilities,
    clearDemoCache: context.clearDemoCache,

    // Progress tracking
    updateTutorialProgress: context.updateTutorialProgress,
    getTutorialProgress: context.getTutorialProgress,

    // Helper methods
    markTutorialCompleted: (tutorialName: TutorialStepName) => {
      context.updateTutorialProgress({
        [tutorialName]: true,
      } as any);
    },
    isTutorialCompleted: (tutorialName: TutorialStepName) => {
      return context.state.progress[tutorialName];
    },
    hasCompletedPrerequisite: (tutorialName: TutorialStepName) => {
      const { progress } = context.state;
      
      // Define dependencies
      const deps: Record<TutorialStepName, TutorialStepName[]> = {
        adminFacilityBeginner: [],
        adminFacilityAdvanced: ['adminFacilityBeginner'],
        adminFacilityEditing: ['adminFacilityBeginner'],
        superAdminFacility: [],
        userBookingDemo: [],
      };

      const required = deps[tutorialName] || [];
      return required.every(dep => progress[dep]);
    },
  };
}
