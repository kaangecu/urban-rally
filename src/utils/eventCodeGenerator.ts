/**
 * Event Code Generator
 * Generates unique, human-readable event codes
 */

import { collection, query, where, getDocs } from 'firebase/firestore';
import { getFirebaseFirestore } from '../services/firebase.service';

/**
 * Generate event code from event name
 * 
 * @param eventName - Event name (e.g., "Berlin Winter Hunt 2025")
 * @returns Suggested event code (e.g., "BERLIN2025")
 * 
 * @example
 * generateEventCodeFromName("Berlin Winter Hunt 2025") → "BERLIN2025"
 * generateEventCodeFromName("Munich Christmas Rally") → "MUNICH"
 * generateEventCodeFromName("ESN Welcome Week 2025") → "ESNWEL2025"
 */
export function generateEventCodeFromName(eventName: string): string {
  // Remove common words
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
  
  // Split into words, remove special chars
  const words = eventName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => !stopWords.includes(word) && word.length > 0);
  
  if (words.length === 0) {
    return `EVT${Date.now().toString(36).toUpperCase().substring(0, 6)}`;
  }
  
  let code = '';
  
  // Extract year if present
  const yearMatch = eventName.match(/20\d{2}/);
  const year = yearMatch ? yearMatch[0] : '';
  
  // Strategy 1: First word + Year (most common)
  // "Berlin Winter Hunt 2025" → "BERLIN2025"
  if (words.length >= 1 && year) {
    const firstWord = words[0].substring(0, 12 - year.length).toUpperCase();
    code = firstWord + year;
  }
  // Strategy 2: First two words abbreviated + Year
  // "Welcome Week 2025" → "WELWEK2025"
  else if (words.length >= 2 && year) {
    const first = words[0].substring(0, 3).toUpperCase();
    const second = words[1].substring(0, 3).toUpperCase();
    code = first + second + year;
  }
  // Strategy 3: First word only (no year)
  // "Christmas Rally" → "CHRISTMAS"
  else if (words.length >= 1) {
    code = words[0].substring(0, 12).toUpperCase();
  }
  // Fallback: Random
  else {
    code = `EVT${Date.now().toString(36).toUpperCase().substring(0, 6)}`;
  }
  
  // Ensure 6-12 characters
  if (code.length < 6) {
    code += Math.random().toString(36).substring(2, 8 - code.length).toUpperCase();
  }
  
  return code.substring(0, 12);
}

/**
 * Check if event code is available (not taken by another event)
 * 
 * @param code - Event code to check
 * @returns true if available, false if taken
 */
export async function isEventCodeAvailable(code: string): Promise<boolean> {
  try {
    const db = getFirebaseFirestore();
    const normalizedCode = code.trim().toUpperCase();
    
    const q = query(
      collection(db, 'events'),
      where('eventCode', '==', normalizedCode)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.empty;
    
  } catch (error) {
    console.error('Error checking event code availability:', error);
    throw new Error('Failed to check event code availability');
  }
}

/**
 * Generate unique event code (ensures no collision)
 * Tries suggested code, adds numeric suffix if taken
 * 
 * @param eventName - Event name
 * @returns Unique event code guaranteed to be available
 * 
 * @example
 * // First "Berlin Rally 2025" → "BERLIN2025"
 * // Second "Berlin Rally 2025" → "BERLIN20251"
 * // Third "Berlin Rally 2025" → "BERLIN20252"
 */
export async function generateUniqueEventCode(eventName: string): Promise<string> {
  let baseCode = generateEventCodeFromName(eventName);
  let code = baseCode;
  let suffix = 1;
  
  // Try base code first
  if (await isEventCodeAvailable(code)) {
    console.log(`✅ Event code generated: ${code}`);
    return code;
  }
  
  console.log(`⚠️ Event code ${code} already taken, trying with suffix...`);
  
  // Try with numeric suffix (1-99)
  while (suffix <= 99) {
    code = `${baseCode}${suffix}`;
    
    // Trim base if code too long
    if (code.length > 12) {
      const suffixLength = suffix.toString().length;
      baseCode = baseCode.substring(0, 12 - suffixLength);
      code = `${baseCode}${suffix}`;
    }
    
    if (await isEventCodeAvailable(code)) {
      console.log(`✅ Event code generated: ${code} (with suffix ${suffix})`);
      return code;
    }
    
    suffix++;
  }
  
  // Fallback: Random code (should be extremely rare)
  const randomCode = `EVT${Date.now().toString(36).toUpperCase().substring(0, 8)}`;
  console.log(`⚠️ Using random fallback code: ${randomCode}`);
  return randomCode;
}

/**
 * Validate event code format
 * 
 * @param code - Event code to validate
 * @returns true if format is valid, false otherwise
 * 
 * Rules:
 * - 6-12 characters
 * - Alphanumeric only (A-Z, 0-9)
 * - Uppercase
 */
export function validateEventCodeFormat(code: string): boolean {
  const normalized = code.trim().toUpperCase();
  const regex = /^[A-Z0-9]{6,12}$/;
  return regex.test(normalized);
}

/**
 * Format event code for display
 * Ensures consistent uppercase formatting
 * 
 * @param code - Event code
 * @returns Formatted code
 */
export function formatEventCode(code: string): string {
  return code.trim().toUpperCase();
}
