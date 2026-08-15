'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { PartnerLead } from '@/lib/types';
import { getVerifiedAuthContext, verifyPartnerAccess } from '@/lib/server-auth';

export async function savePartnerLead(data: {
  partnerId: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  // Bot-mitigation fields, both optional so older/cached clients don't break: `website` is a
  // honeypot input that's hidden from real users via CSS but visible to bots that auto-fill
  // every field in the DOM; `formRenderedAt` is a client timestamp used to reject submissions
  // that arrive implausibly fast for a human to have read and filled the form.
  website?: string;
  formRenderedAt?: number;
}) {
  try {
    // Honeypot tripped — pretend success so the bot doesn't learn to adapt, but don't write.
    if (data.website) {
      return { success: true, id: 'ok' };
    }
    // Submitted in under 2 seconds of the form appearing — not humanly plausible.
    if (data.formRenderedAt && Date.now() - data.formRenderedAt < 2000) {
      return { success: true, id: 'ok' };
    }

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

export async function getPartnerLeads(partnerId: string, idToken: string) {
  try {
    // Leads contain a prospect's name, email, phone and message — only the practice that
    // owns them (or an active staff member of it, or an admin) may read them back.
    const authCtx = await getVerifiedAuthContext(idToken);
    if (!authCtx) return { success: false, error: 'Unauthorized', leads: [] };
    if (!(await verifyPartnerAccess(authCtx.userId, partnerId))) {
      return { success: false, error: 'Unauthorized: you do not have access to this practice', leads: [] };
    }

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
