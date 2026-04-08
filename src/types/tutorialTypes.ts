/**
 * Tutorial System Types
 * Defines data structures for the interactive tutorial framework
 */

export type TutorialStepName = 
  | 'userBookingDemo'
  | 'adminFacilityBeginner'
  | 'adminFacilityAdvanced'
  | 'adminFacilityEditing'
  | 'superAdminFacility';

export interface TutorialProgress {
  userBookingDemo: boolean;
  adminFacilityBeginner: boolean;
  adminFacilityAdvanced: boolean;
  adminFacilityEditing: boolean;
  superAdminFacility: boolean;
  lastUpdated: number;
}

export interface TutorialCheckpoint {
  stepName: TutorialStepName;
  checkpointId: string;
  completed: boolean;
  timestamp: number;
}

export interface DemoBooking {
  id: string;
  facilityId: string;
  facilityName: string;
  date: string;
  endDate?: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: 'pending' | 'approved';
  createdAt: string;
  isDemo: true;
}

export interface DemoFacility {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
  capacity: number;
  description: string;
  locationId?: string;
  locationName?: string;
  maxRecurrenceWeeks: number;
  autoApprove: boolean;
  approvalMode: 'department_admins' | 'specific_approvers';
  approvers: Array<{ id: string; name: string; type: 'user' | 'department' }>;
  isDemo: true;
}

export interface TutorialModeState {
  isTutorialMode: boolean;
  currentStep: TutorialStepName | null;
  completedCheckpoints: Set<string>;
  demoBookings: DemoBooking[];
  demoFacilities: DemoFacility[];
  progress: TutorialProgress;
  isReplay: boolean;
}

export interface CheckpointValidation {
  isValid: boolean;
  message?: string;
}

export interface TutorialInterceptionConfig {
  isTutorialMode: boolean;
  currentStep?: TutorialStepName;
  mockReturnHandler?: (operationType: string) => any;
  logToConsole?: boolean;
}
