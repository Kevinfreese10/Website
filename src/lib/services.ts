import { getAdminDb } from './firebase-admin';
import { services as fallbackServices } from './data';
import { Service } from './types';
import { cache } from 'react';

let cachedServicesPromise: Promise<Service[]> | null = null;

async function fetchServicesFromDb(): Promise<Service[]> {
  try {
    const adminDb = getAdminDb();
    const snap = await adminDb.collection('services').orderBy('title').get();
    
    if (snap.empty) {
      console.warn('[getServices] Services collection in Firestore is empty, falling back to static services');
      return fallbackServices;
    }
    
    return snap.docs.map(doc => {
      const data = doc.data();
      const serviceData = { ...data, id: doc.id } as any;
      if (data.createdAt && data.createdAt.toDate) {
        serviceData.createdAt = data.createdAt.toDate().toISOString();
      }
      return serviceData as Service;
    });
  } catch (error) {
    console.error('[getServices] Error fetching services from Firestore, falling back to static services:', error);
    return fallbackServices;
  }
}

/**
 * Retrieves all services, prioritizing Firestore database data with fallback to static local data.
 * Features request-level React caching and serverless container-level caching.
 */
export const getServices = cache(async (): Promise<Service[]> => {
  if (!cachedServicesPromise) {
    cachedServicesPromise = fetchServicesFromDb();
  }
  return cachedServicesPromise;
});

/**
 * Invalidates the cached services. Call this after updating services in the admin dashboard.
 */
export function clearServicesCache() {
  cachedServicesPromise = null;
}
