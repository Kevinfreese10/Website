'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { PartnerLead } from '@/lib/types';

export async function savePartnerLead(data: {
  partnerId: string;
  name: string;
  email: string;
  phone: string;
  message: string;
}) {
  try {
    const adminDb = getAdminDb();
    
    // Check if the partner exists first
    const partnerSnap = await adminDb.collection('users').doc(data.partnerId).get();
    if (!partnerSnap.exists) {
      return { success: false, error: 'Partner not found' };
    }

    const docRef = adminDb.collection('partnerLeads').doc();
    const newLead: PartnerLead = {
      id: docRef.id,
      partnerId: data.partnerId,
      name: data.name,
      email: data.email.toLowerCase().trim(),
      phone: data.phone,
      message: data.message,
      createdAt: new Date(), // Local fallback, server will set timestamp
    };

    await docRef.set({
      ...newLead,
      createdAt: FieldValue.serverTimestamp(),
    });

    return { success: true, id: docRef.id };
  } catch (e: any) {
    console.error('Error saving partner lead:', e);
    return { success: false, error: e.message || 'Failed to submit inquiry' };
  }
}

export async function getPartnerLeads(partnerId: string) {
  try {
    const adminDb = getAdminDb();
    const snap = await adminDb.collection('partnerLeads')
      .where('partnerId', '==', partnerId)
      .orderBy('createdAt', 'desc')
      .get();

    const leads = snap.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : new Date(data.createdAt).toISOString()) : null,
      } as any;
    });

    return { success: true, leads };
  } catch (e: any) {
    console.error('Error fetching partner leads:', e);
    return { success: false, error: e.message || 'Failed to fetch leads', leads: [] };
  }
}
