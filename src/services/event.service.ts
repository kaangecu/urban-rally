/**
 * Event Service
 * Handles event operations including event code validation
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs,
  query, 
  where, 
  limit,
  orderBy 
} from 'firebase/firestore';
import { getFirebaseFirestore } from './firebase.service';
import type { Event } from '../types/schema';

/**
 * Get event by ID
 * 
 * @param eventId - Event ID
 * @returns Event data or null if not found
 */
export async function getEventById(eventId: string): Promise<Event | null> {
  try {
    const db = getFirebaseFirestore();
    const eventDoc = await getDoc(doc(db, 'events', eventId));
    
    if (!eventDoc.exists()) {
      console.log(`❌ Event not found: ${eventId}`);
      return null;
    }
    
    const event = { id: eventDoc.id, ...eventDoc.data() } as Event;
    console.log(`✅ Event found: ${event.name}`);
    return event;
    
  } catch (error) {
    console.error('Error fetching event:', error);
    throw new Error('Failed to fetch event');
  }
}

/**
 * Validate event code and return event data
 * Only returns ACTIVE events
 * 
 * @param code - Event code (e.g., "BERLIN2025")
 * @returns Event data if valid and active, null if invalid/not found/inactive
 * 
 * @example
 * const event = await validateEventCode("BERLIN2025");
 * if (event) {
 *   console.log(`Joining event: ${event.name}`);
 * }
 */
export async function validateEventCode(code: string): Promise<Event | null> {
  try {
    const db = getFirebaseFirestore();
    
    // Normalize code (trim whitespace, uppercase)
    const normalizedCode = code.trim().toUpperCase();
    
    if (!normalizedCode) {
      console.log('❌ Empty event code');
      return null;
    }
    
    // Query by event code
    const q = query(
      collection(db, 'events'),
      where('eventCode', '==', normalizedCode),
      where('isActive', '==', true),  // Only active events
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log(`❌ Event code not found or inactive: ${normalizedCode}`);
      return null;
    }
    
    const eventDoc = snapshot.docs[0];
    const event = { id: eventDoc.id, ...eventDoc.data() } as Event;
    
    console.log(`✅ Event code validated: ${normalizedCode} → ${event.name}`);
    return event;
    
  } catch (error) {
    console.error('Error validating event code:', error);
    throw new Error('Failed to validate event code');
  }
}

/**
 * Get event by code (includes inactive events)
 * Used by organizers to manage events
 * 
 * @param code - Event code
 * @returns Event data or null
 */
export async function getEventByCode(code: string): Promise<Event | null> {
  try {
    const db = getFirebaseFirestore();
    
    const normalizedCode = code.trim().toUpperCase();
    
    const q = query(
      collection(db, 'events'),
      where('eventCode', '==', normalizedCode),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const eventDoc = snapshot.docs[0];
    const event = { id: eventDoc.id, ...eventDoc.data() } as Event;
    
    console.log(`✅ Event found by code: ${normalizedCode} → ${event.name}`);
    return event;
    
  } catch (error) {
    console.error('Error getting event by code:', error);
    throw new Error('Failed to get event by code');
  }
}

/**
 * Get all events for a tenant
 * 
 * @param tenantId - Tenant ID
 * @param includeInactive - Include inactive events (default: false)
 * @returns Array of events
 */
export async function getEventsForTenant(
  tenantId: string,
  includeInactive: boolean = false
): Promise<Event[]> {
  try {
    const db = getFirebaseFirestore();
    
    const constraints = [
      where('tenantId', '==', tenantId),
      orderBy('startDate', 'desc')
    ];
    
    if (!includeInactive) {
      constraints.push(where('isActive', '==', true));
    }
    
    const q = query(
      collection(db, 'events'),
      ...constraints
    );
    
    const snapshot = await getDocs(q);
    
    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Event));
    
    console.log(`✅ Found ${events.length} events for tenant ${tenantId}`);
    return events;
    
  } catch (error) {
    console.error('Error fetching tenant events:', error);
    throw new Error('Failed to fetch tenant events');
  }
}
