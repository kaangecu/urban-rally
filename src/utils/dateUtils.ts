/**
 * Date Utilities
 * 
 * Helper functions for safely handling dates from Firestore
 * 
 * Firestore returns Timestamp objects that need to be converted to Date objects.
 * These utilities handle the conversion defensively to prevent "Invalid time value" errors.
 * 
 * @version 1.0
 * @date December 30, 2025
 */

/**
 * Safely parse a date from Firestore
 * 
 * Handles multiple date formats:
 * - Firestore Timestamp (has toDate method)
 * - JavaScript Date object
 * - ISO string or timestamp number
 * 
 * Returns null if the date is invalid
 * 
 * @param dateValue - The date value from Firestore
 * @returns Date object or null
 */
export function parseFirestoreDate(dateValue: any): Date | null {
  if (!dateValue) return null;
  
  // If it's already a Date
  if (dateValue instanceof Date) {
    return isNaN(dateValue.getTime()) ? null : dateValue;
  }
  
  // If it's a Firestore Timestamp (has toDate method)
  if (dateValue && typeof dateValue.toDate === 'function') {
    try {
      const date = dateValue.toDate();
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }
  
  // If it's a string or number, try to parse
  try {
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Check if a date is valid
 * 
 * @param date - Date to validate
 * @returns true if date is valid
 */
export function isValidDate(date: any): date is Date {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Convert any date-like value to a Date or return null
 * Alias for parseFirestoreDate for backward compatibility
 * 
 * @param dateValue - The date value to convert
 * @returns Date object or null
 */
export function toDate(dateValue: any): Date | null {
  return parseFirestoreDate(dateValue);
}

/**
 * Format a Firestore date safely
 * Returns formatted string or fallback
 * 
 * @param dateValue - The date value from Firestore
 * @param formatter - Function to format the date
 * @param fallback - Fallback string if date is invalid
 * @returns Formatted date string or fallback
 */
export function formatFirestoreDate(
  dateValue: any,
  formatter: (date: Date) => string,
  fallback: string = 'N/A'
): string {
  const date = parseFirestoreDate(dateValue);
  return date ? formatter(date) : fallback;
}
