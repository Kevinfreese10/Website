'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { User, Job } from '@/lib/types';

export async function getPublicJobsAction(): Promise<Job[]> {
  try {
    const adminDb = getAdminDb();
    const snap = await adminDb.collection('jobs').orderBy('createdAt', 'desc').get();
    return snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
      } as any;
    });
  } catch (err) {
    console.error('[jobs-actions] Error fetching public jobs:', err);
    return [];
  }
}

export async function getPublicTalentAction(): Promise<User[]> {
  try {
    const adminDb = getAdminDb();
    const snap = await adminDb.collection('users')
      .where('talentProfile.isLookingForWork', '==', true)
      .get();

    // This action is unauthenticated and feeds a public talent board, so the projection must not
    // include directly-identifying or contactable data. It previously returned email, home
    // address, professional registration number, expected rate and a downloadable CV URL for
    // every candidate — a complete scrape in one call, and a POPIA exposure.
    return snap.docs.map(doc => {
      const data = doc.data();
      const profile = data.talentProfile || {};
      const { cvUrl, registrationNumber, idNumber, contactNumber, ...safeProfile } = profile as Record<string, any>;
      return {
        id: doc.id,
        uid: doc.id,
        name: data.name || 'Candidate',
        surname: data.surname || '',
        // Contact details are deliberately omitted — introductions must go through an
        // authenticated, rate-limited server-mediated flow rather than a public listing.
        email: '',
        role: data.role || 'client',
        address: data.address?.city || data.address?.province
          ? { city: data.address.city || '', province: data.address.province || '' }
          : null,
        talentProfile: safeProfile,
      } as unknown as User;
    });
  } catch (err) {
    console.error('[jobs-actions] Error fetching public talent:', err);
    return [];
  }
}

export async function getGlobalSkillsAction(): Promise<string[]> {
  try {
    const adminDb = getAdminDb();
    const snap = await adminDb.collection('system_settings').doc('talent_skills').get();
    if (snap.exists) {
      return snap.data()?.skills || [];
    }
    return [];
  } catch (err) {
    console.error('[jobs-actions] Error fetching global skills:', err);
    return [];
  }
}

export async function addCustomSkillAction(skill: string): Promise<boolean> {
  try {
    const trimmed = skill.trim();
    if (!trimmed) return false;
    const adminDb = getAdminDb();
    const { FieldValue } = await import('firebase-admin/firestore');
    await adminDb.collection('system_settings').doc('talent_skills').set({
      skills: FieldValue.arrayUnion(trimmed)
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('[jobs-actions] Error adding custom skill:', err);
    return false;
  }
}
