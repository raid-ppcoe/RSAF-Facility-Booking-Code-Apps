/**
 * Booking status codes and constants
 * Maps between human-readable status names and Dataverse numeric values
 */

export const BOOKING_STATUS_CODES = {
  PENDING: 406210000,
  APPROVED: 406210001,
  REJECTED: 406210002,
  CANCELLED: 406210002, // Dataverse has no Cancelled choice; maps to Rejected
} as const;

export const RECURRENCE_PATTERN = {
  WEEKLY: 406210001,
} as const;
