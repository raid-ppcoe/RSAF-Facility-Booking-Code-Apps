/**
 * Utility functions for time-based calculations and comparisons
 */

/**
 * Checks if two time ranges overlap
 * @param startTime1 - Start time in HH:mm format (e.g., "14:00")
 * @param endTime1 - End time in HH:mm format (e.g., "15:30")
 * @param startTime2 - Start time of second range in HH:mm format
 * @param endTime2 - End time of second range in HH:mm format
 * @returns true if the time ranges overlap, false otherwise
 *
 * @example
 * checkTimeOverlap("14:00", "15:00", "14:30", "16:00") // true (overlap from 14:30-15:00)
 * checkTimeOverlap("14:00", "15:00", "15:00", "16:00") // false (touching but not overlapping)
 * checkTimeOverlap("14:00", "15:00", "16:00", "17:00") // false (no overlap)
 */
export function checkTimeOverlap(
  startTime1: string,
  endTime1: string,
  startTime2: string,
  endTime2: string
): boolean {
  // String comparison works for HH:mm format because it's lexically sortable
  return startTime1 < endTime2 && endTime1 > startTime2;
}

/**
 * Validates booking date and time ranges
 * Supports same-day and unlimited multi-day bookings
 * @param startDate - Start date in yyyy-MM-dd format
 * @param startTime - Start time in HH:mm format
 * @param endDate - End date in yyyy-MM-dd format
 * @param endTime - End time in HH:mm format
 * @returns Object with isValid flag and optional error message
 * 
 * Rules:
 * - Start and end dates must be valid date strings
 * - If same date: end time must be > start time
 * - If different date (multi-day): end date must be >= start date (unlimited span allowed)
 * 
 * @example
 * validateBookingDateRange("2026-04-06", "08:00", "2026-04-06", "14:00") // { isValid: true } (same day)
 * validateBookingDateRange("2026-04-06", "08:00", "2026-04-07", "08:00") // { isValid: true } (overnight)
 * validateBookingDateRange("2026-04-06", "08:00", "2026-04-10", "17:00") // { isValid: true } (multi-day)
 * validateBookingDateRange("2026-04-06", "08:00", "2026-04-06", "08:00") // { isValid: false, error: "..." } (same day, equal times)
 */
export function validateBookingDateRange(
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string
): { isValid: boolean; error?: string } {
  try {
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');

    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { isValid: false, error: 'Invalid date format' };
    }

    // Calculate day difference
    const dayDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

    // Same day booking
    if (dayDiff === 0) {
      if (endTime <= startTime) {
        return { isValid: false, error: 'End time must be after start time for same-day bookings' };
      }
      return { isValid: true };
    }

    // Multi-day booking (allowed - unlimited span, any end time is valid)
    if (dayDiff > 0) {
      return { isValid: true };
    }

    // End date before start date
    return { isValid: false, error: 'End date cannot be before start date' };
  } catch (err) {
    return { isValid: false, error: 'Error validating date range' };
  }
}

/**
 * Calculates a human-readable duration between two date-time pairs
 * @param startDate - Start date in yyyy-MM-dd format
 * @param startTime - Start time in HH:mm format
 * @param endDate - End date in yyyy-MM-dd format
 * @param endTime - End time in HH:mm format
 * @returns Formatted duration string (e.g., "2 hrs 15 mins", "1 day, 4 hrs") or null if invalid
 */
export function calculateBookingDuration(
  startDate: string, 
  startTime: string, 
  endDate: string, 
  endTime: string
): string | null {
  try {
    const start = new Date(`${startDate}T${startTime}:00`);
    const end = new Date(`${endDate}T${endTime}:00`);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    
    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) return null;
    
    const diffMins = Math.floor(diffMs / 60000);
    const days = Math.floor(diffMins / (24 * 60));
    const hours = Math.floor((diffMins % (24 * 60)) / 60);
    const mins = diffMins % 60;
    
    const parts = [];
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hr${hours > 1 ? 's' : ''}`);
    if (mins > 0) parts.push(`${mins} min${mins > 1 ? 's' : ''}`);
    
    return parts.length > 0 ? parts.join(' ') : null;
  } catch (err) {
    return null;
  }
}
/**
 * Checks if two date-time ranges overlap robustly
 * Supports overnight and multi-day spans
 * @param start1 - Start of first range (Date or string ISO/yyyy-MM-dd HH:mm)
 * @param end1 - End of first range
 * @param start2 - Start of second range
 * @param end2 - End of second range
 */
export function checkDateTimeOverlap(
  start1: Date | string,
  end1: Date | string,
  start2: Date | string,
  end2: Date | string
): boolean {
  const s1 = typeof start1 === 'string' ? new Date(start1.includes('T') ? start1 : start1.replace(' ', 'T') + ':00') : start1;
  const e1 = typeof end1 === 'string' ? new Date(end1.includes('T') ? end1 : end1.replace(' ', 'T') + ':00') : end1;
  const s2 = typeof start2 === 'string' ? new Date(start2.includes('T') ? start2 : start2.replace(' ', 'T') + ':00') : start2;
  const e2 = typeof end2 === 'string' ? new Date(end2.includes('T') ? end2 : end2.replace(' ', 'T') + ':00') : end2;

  if (isNaN(s1.getTime()) || isNaN(e1.getTime()) || isNaN(s2.getTime()) || isNaN(e2.getTime())) return false;

  // Overlap condition: (StartA < EndB) AND (EndA > StartB)
  return s1 < e2 && e1 > s2;
}
