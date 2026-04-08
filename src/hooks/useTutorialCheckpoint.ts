import { useCallback } from 'react';
import { useTutorialModeContext } from '../contexts/TutorialModeContext';
import { TutorialStepName } from '../types/tutorialTypes';

/**
 * Hook for managing tutorial checkpoints
 * Tracks which interactive steps users have completed within a tutorial
 */
export function useTutorialCheckpoint() {
  const { completeCheckpoint, isCheckpointCompleted } = useTutorialModeContext();

  const markCheckpointComplete = useCallback(
    (checkpointId: string, metadata?: Record<string, any>) => {
      completeCheckpoint(checkpointId);
      
      // Optional: Log checkpoint completion
      if (metadata) {
        console.log(`[Checkpoint Completed] ${checkpointId}`, metadata);
      } else {
        console.log(`[Checkpoint Completed] ${checkpointId}`);
      }
    },
    [completeCheckpoint]
  );

  const getCheckpointStatus = useCallback(
    (checkpointId: string): { completed: boolean } => {
      return {
        completed: isCheckpointCompleted(checkpointId),
      };
    },
    [isCheckpointCompleted]
  );

  const createCheckpointId = useCallback(
    (stepName: TutorialStepName, checkpointIndex: number): string => {
      return `${stepName}-checkpoint-${checkpointIndex}`;
    },
    []
  );

  const createNamedCheckpointId = useCallback(
    (stepName: TutorialStepName, checkpointName: string): string => {
      return `${stepName}-${checkpointName}`;
    },
    []
  );

  return {
    markCheckpointComplete,
    isCheckpointCompleted,
    getCheckpointStatus,
    createCheckpointId,
    createNamedCheckpointId,
  };
}

/**
 * Specific checkpoint validators for different tutorial types
 */

export function useBookingCheckpoints() {
  const { createNamedCheckpointId, markCheckpointComplete, isCheckpointCompleted } =
    useTutorialCheckpoint();

  const checkpoints = {
    locationSelected: createNamedCheckpointId('userBookingDemo', 'location-selected'),
    dateSelected: createNamedCheckpointId('userBookingDemo', 'date-selected'),
    purposeEntered: createNamedCheckpointId('userBookingDemo', 'purpose-entered'),
    bookingSubmitted: createNamedCheckpointId('userBookingDemo', 'booking-submitted'),
  };

  return {
    checkpoints,
    markLocationSelected: () => markCheckpointComplete(checkpoints.locationSelected),
    markDateSelected: () => markCheckpointComplete(checkpoints.dateSelected),
    markPurposeEntered: () => markCheckpointComplete(checkpoints.purposeEntered),
    markBookingSubmitted: () => markCheckpointComplete(checkpoints.bookingSubmitted),
    isLocationSelected: () => isCheckpointCompleted(checkpoints.locationSelected),
    isDateSelected: () => isCheckpointCompleted(checkpoints.dateSelected),
    isPurposeEntered: () => isCheckpointCompleted(checkpoints.purposeEntered),
    isBookingSubmitted: () => isCheckpointCompleted(checkpoints.bookingSubmitted),
  };
}

export function useFacilityCheckpoints() {
  const { createNamedCheckpointId, markCheckpointComplete, isCheckpointCompleted } =
    useTutorialCheckpoint();

  // Beginner checkpoints
  const beginnerCheckpoints = {
    managementTabClicked: createNamedCheckpointId('adminFacilityBeginner', 'management-tab-clicked'),
    facilitiesTabClicked: createNamedCheckpointId('adminFacilityBeginner', 'facilities-tab-clicked'),
    facilityNameEntered: createNamedCheckpointId('adminFacilityBeginner', 'facility-name-entered'),
    capacitySet: createNamedCheckpointId('adminFacilityBeginner', 'capacity-set'),
    descriptionEntered: createNamedCheckpointId('adminFacilityBeginner', 'description-entered'),
    departmentSelected: createNamedCheckpointId('adminFacilityBeginner', 'department-selected'),
    locationSelected: createNamedCheckpointId('adminFacilityBeginner', 'location-selected'),
    facilitySaved: createNamedCheckpointId('adminFacilityBeginner', 'facility-saved'),
  };

  // Advanced checkpoints
  const advancedCheckpoints = {
    autoApproveChecked: createNamedCheckpointId('adminFacilityAdvanced', 'auto-approve-checked'),
    customApproversSelected: createNamedCheckpointId('adminFacilityAdvanced', 'custom-approvers-selected'),
    userApproverAdded: createNamedCheckpointId('adminFacilityAdvanced', 'user-approver-added'),
    departmentApproverAdded: createNamedCheckpointId('adminFacilityAdvanced', 'dept-approver-added'),
    advancedSettingsSaved: createNamedCheckpointId('adminFacilityAdvanced', 'advanced-settings-saved'),
  };

  // Editing checkpoints
  const editingCheckpoints = {
    facilityNameChanged: createNamedCheckpointId('adminFacilityEditing', 'facility-name-changed'),
    descriptionChanged: createNamedCheckpointId('adminFacilityEditing', 'description-changed'),
    capacityChanged: createNamedCheckpointId('adminFacilityEditing', 'capacity-changed'),
    approvalsChanged: createNamedCheckpointId('adminFacilityEditing', 'approvals-changed'),
    editSaved: createNamedCheckpointId('adminFacilityEditing', 'edit-saved'),
  };

  return {
    beginnerCheckpoints,
    advancedCheckpoints,
    editingCheckpoints,
    markBeginnerCheckpoint: (key: keyof typeof beginnerCheckpoints) =>
      markCheckpointComplete(beginnerCheckpoints[key]),
    markAdvancedCheckpoint: (key: keyof typeof advancedCheckpoints) =>
      markCheckpointComplete(advancedCheckpoints[key]),
    markEditingCheckpoint: (key: keyof typeof editingCheckpoints) =>
      markCheckpointComplete(editingCheckpoints[key]),
    isBeginnnerCheckpointComplete: (key: keyof typeof beginnerCheckpoints) =>
      isCheckpointCompleted(beginnerCheckpoints[key]),
    isAdvancedCheckpointComplete: (key: keyof typeof advancedCheckpoints) =>
      isCheckpointCompleted(advancedCheckpoints[key]),
    isEditingCheckpointComplete: (key: keyof typeof editingCheckpoints) =>
      isCheckpointCompleted(editingCheckpoints[key]),
  };
}
