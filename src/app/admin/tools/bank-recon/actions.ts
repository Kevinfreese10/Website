'use server';

import { extractStatementMetadata } from '@/ai/flows/extract-statement-metadata';
import { extractStatementData } from '@/ai/flows/extract-statement-data';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { User } from '@/lib/types';

// Admin actions for bank statement metadata and transaction extraction
export async function extractStatementMetadataAction({ fileBase64 }: { fileBase64: string }) {
    try {
        const result = await extractStatementMetadata({ statementPdf: fileBase64 });
        return { success: true, metadata: result };
    } catch (e) {
        console.error("Statement metadata extraction failed:", e);
        return { success: false, error: e instanceof Error ? e.message : "Failed to extract metadata" };
    }
}

export async function extractStatementTransactionsAction({ fileBase64 }: { fileBase64: string }) {
    try {
        const result = await extractStatementData({ statementFile: fileBase64 });
        return { success: true, transactions: result.transactions };
    } catch (e) {
        console.error("Statement transactions extraction failed:", e);
        return { success: false, error: e instanceof Error ? e.message : "Failed to extract transactions" };
    }
}

// Fetch all clients in the system so the admin can assign extracted cashbooks to specific clients
export async function getClientsListAction() {
    try {
        const db = getFirestore(firebaseApp);
        const snap = await getDocs(collection(db, 'aiAccountantClients'));
        const clients = snap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name || data.companyName || "Unnamed Client",
                chartOfAccounts: data.chartOfAccounts || []
            };
        });
        return { success: true, clients };
    } catch (e) {
        console.error("Failed to fetch clients:", e);
        return { success: false, error: "Failed to fetch clients list" };
    }
}
