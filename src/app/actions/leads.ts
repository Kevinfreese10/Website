'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { DemoLead } from '@/lib/types';

export async function saveDemoLead(data: Omit<DemoLead, 'id' | 'createdAt'>) {
    try {
        const adminDb = getAdminDb();
        const docRef = adminDb.collection('demoLeads').doc();
        await docRef.set({
            ...data,
            id: docRef.id,
            createdAt: FieldValue.serverTimestamp(),
        });
        return { success: true, id: docRef.id };
    } catch (e) {
        console.error("Save Demo lead failed:", e);
        return { success: false };
    }
}
