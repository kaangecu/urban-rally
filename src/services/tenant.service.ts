import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseFirestore } from './firebase.service';
import type { Tenant } from '../types/schema';

/**
 * Get tenant by slug (e.g., 'esn-berlin')
 */
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  try {
    const db = getFirebaseFirestore();
    
    // In production, you'd query by slug
    // For now, we'll use the slug as the document ID
    const tenantRef = doc(db, 'tenants', slug);
    const tenantDoc = await getDoc(tenantRef);
    
    if (!tenantDoc.exists()) {
      return null;
    }
    
    return tenantDoc.data() as Tenant;
  } catch (error) {
    console.error('Error fetching tenant:', error);
    throw new Error('Failed to fetch organization');
  }
}

/**
 * Get tenant by ID
 */
export async function getTenantById(tenantId: string): Promise<Tenant | null> {
  try {
    const db = getFirebaseFirestore();
    const tenantRef = doc(db, 'tenants', tenantId);
    const tenantDoc = await getDoc(tenantRef);
    
    if (!tenantDoc.exists()) {
      return null;
    }
    
    return tenantDoc.data() as Tenant;
  } catch (error) {
    console.error('Error fetching tenant by ID:', error);
    throw new Error('Failed to fetch organization');
  }
}

/**
 * Apply tenant theme to document
 */
export function applyTenantTheme(tenant: Tenant): void {
  const root = document.documentElement;
  
  if (tenant.logoUrl) {
    // Store logo URL in a data attribute for components to use
    root.setAttribute('data-tenant-logo', tenant.logoUrl);
  }
  
  // Set page title
  document.title = `${tenant.name} - UrbanRally`;
}
