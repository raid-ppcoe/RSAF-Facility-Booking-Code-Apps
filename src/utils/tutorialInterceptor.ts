/**
 * Utility for intercepting and mocking service calls during tutorial mode
 * Allows realistic user interactions without persisting to Dataverse
 */

export interface InterceptionResult<T> {
  isMocked: boolean;
  data: T;
  message?: string;
}

/**
 * Higher-order function that wraps async service calls with tutorial mode interception
 * @param asyncFn The original async service call
 * @param isTutorialMode Whether tutorial mode is enabled
 * @param operationType Name of the operation for logging
 * @param mockReturnFn Function to generate mock return value
 */
export async function withTutorialInterception<T>(
  asyncFn: () => Promise<T>,
  isTutorialMode: boolean,
  operationType: string,
  mockReturnFn?: () => T
): Promise<InterceptionResult<T>> {
  if (!isTutorialMode) {
    // Normal flow: execute real service call
    try {
      const data = await asyncFn();
      return { isMocked: false, data };
    } catch (error) {
      throw error;
    }
  }

  // Tutorial mode: intercept and mock
  logTutorialOperation(operationType, 'INTERCEPTED');
  
  if (mockReturnFn) {
    return {
      isMocked: true,
      data: mockReturnFn(),
      message: `Tutorial Mode: ${operationType} - Data not persisted to Dataverse`,
    };
  }

  throw new Error(`Tutorial mode: No mock function provided for ${operationType}`);
}

/**
 * Generates a mock booking ID for demo bookings
 */
export function generateMockBookingId(): string {
  return `demo-booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generates a mock facility ID for demo facilities
 */
export function generateMockFacilityId(): string {
  return `demo-facility-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Logs tutorial operations to console for transparency
 */
export function logTutorialOperation(
  operationType: string,
  status: 'INTERCEPTED' | 'EXECUTED' | 'FAILED',
  details?: any
) {
  const timestamp = new Date().toLocaleTimeString();
  const color = status === 'INTERCEPTED' ? '#FFA500' : status === 'EXECUTED' ? '#4CAF50' : '#F44336';
  
  console.log(
    `%c[TUTORIAL ${timestamp}] ${operationType}: ${status}`,
    `color: white; background-color: ${color}; padding: 2px 6px; border-radius: 3px;`,
    details || ''
  );
}

/**
 * Creates a mock response for booking creation
 */
export function createMockBookingResponse(bookingId: string) {
  return {
    data: {
      cr71a_booking2id: bookingId,
    },
  };
}

/**
 * Creates a mock response for facility creation
 */
export function createMockFacilityResponse(facilityId: string) {
  return {
    data: {
      cr71a_facilityid: facilityId,
    },
  };
}

/**
 * Validation helper: Check if an operation should be intercepted
 */
export function shouldInterceptOperation(
  isTutorialMode: boolean,
  allowedOperations?: string[],
  currentOperation?: string
): boolean {
  if (!isTutorialMode) return false;
  
  if (allowedOperations && currentOperation) {
    return allowedOperations.includes(currentOperation);
  }
  
  return true;
}

/**
 * Enhanced async wrapper that handles both normal and tutorial modes
 * More flexible version with configuration options
 */
export async function callServiceWithTutorialMode<T>(
  config: {
    isTutorialMode: boolean;
    operationType: string;
    realFn: () => Promise<T>;
    mockFn?: () => T;
    onMockSuccess?: () => void;
    onRealSuccess?: (result: T) => void;
    logToConsole?: boolean;
  }
): Promise<T> {
  const {
    isTutorialMode,
    operationType,
    realFn,
    mockFn,
    onMockSuccess,
    onRealSuccess,
    logToConsole = true,
  } = config;

  if (!isTutorialMode) {
    // Execute real operation
    if (logToConsole) {
      logTutorialOperation(operationType, 'EXECUTED');
    }
    const result = await realFn();
    onRealSuccess?.(result);
    return result;
  }

  // Execute mock operation
  if (logToConsole) {
    logTutorialOperation(operationType, 'INTERCEPTED', {
      message: 'Data will NOT be saved to Dataverse',
    });
  }
  
  if (!mockFn) {
    throw new Error(`Tutorial mode: No mock function provided for ${operationType}`);
  }

  const result = mockFn();
  onMockSuccess?.();
  return result;
}
