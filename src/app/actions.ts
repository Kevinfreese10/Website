'use server';

import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { Order, Service, User, OrderNote, Task, DocumentUpload, DemoLead, ImportedTransaction, SmartAllocationResult, AllocationRule, ClientCustomer, Employee, Payslip, Invoice } from '@/lib/types';
import { sendEmail } from '@/lib/email';
import { render } from '@react-email/components';
import React from 'react';
import { ClientDocumentUploadEmail } from '@/components/emails/ClientDocumentUploadEmail';
import { DocumentReviewEmail } from '@/components/emails/DocumentReviewEmail';
import { NewNoteNotificationEmail } from '@/components/emails/NewNoteNotificationEmail';
import { OutstandingDocumentsEmail } from '@/components/emails/OutstandingDocumentsEmail';
import { OrderConfirmationEmail } from '@/components/emails/OrderConfirmationEmail';
import { DocumentRequestEmail } from '@/components/emails/DocumentRequestEmail';
import { services as allServices } from '@/lib/data';
import { format, addDays, addMonths, addYears, parse as parseDate } from 'date-fns';
import { BankCleaner } from '@/lib/bank-cleaner';
import { InvoicePdfDocument } from '@/server/pdf/InvoicePdfDocument';
import { renderToBuffer } from '@react-pdf/renderer';

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

export async function checkSlugAvailability(slug: string) {
    try {
        const adminDb = getAdminDb();
        const snap = await adminDb.collection('users').where('landingPage.slug', '==', slug.toLowerCase().trim()).get();
        return { success: true, isAvailable: snap.empty };
    } catch (e) {
        console.error("Check slug availability failed:", e);
        return { success: false, isAvailable: false };
    }
}


export async function notifyStaffOfDocumentUpload({ orderId, clientName, assignedStaffName, assignedStaffEmail }: { orderId: string, clientName: string, assignedStaffName: string, assignedStaffEmail: string }) {
    const emailHtml = render(
        React.createElement(ClientDocumentUploadEmail, {
            assigneeName: assignedStaffName,
            clientName: clientName,
            orderId: orderId,
            orderUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/orders/${orderId}`,
        })
    );

    await sendEmail({
        to: assignedStaffEmail,
        subject: `Documents Uploaded for Order #${orderId}`,
        html: emailHtml,
    });
}

export async function sendDocumentReviewFeedback({ orderId, clientName, clientEmail, documentUploads, resellerId }: { orderId: string, clientName: string, clientEmail: string, documentUploads: DocumentUpload[], resellerId?: string }) {
    let resellerName = 'The My Accountant Team';
    const adminDb = getAdminDb();
    if (resellerId) {
        const resellerSnap = await adminDb.collection('users').doc(resellerId).get();
        if (resellerSnap.exists) {
            const resellerData = resellerSnap.data() as User;
            resellerName = resellerData.companyName || resellerData.name;
        }
    }

    const emailHtml = render(
        React.createElement(DocumentReviewEmail, {
            clientName,
            orderId,
            documentUploads,
            orderUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/orders/${orderId}`,
            resellerName: `The ${resellerName} Team`
        })
    );

    await sendEmail({
        to: clientEmail,
        subject: `Feedback on Your Submitted Documents for Order #${orderId}`,
        html: emailHtml,
        resellerId: resellerId,
    });
}

export async function notifyOfNewNote({ 
    recipientEmail, 
    recipientName, 
    senderName, 
    orderId, 
    notePreview, 
    actionUrl, 
    isToClient,
    resellerId 
    }: { 
    recipientEmail: string, 
    recipientName: string, 
    senderName: string, 
    orderId: string, 
    notePreview: string, 
    actionUrl: string, 
    isToClient: boolean,
    resellerId?: string 
    }) {
    // Wrapped entirely in try/catch — an email failure must never crash the calling action
    try {
        const safeRecipientName = recipientName || 'Client';
        const safeSenderName = senderName || 'Admin';
        let resellerName = 'My Accountant';
        const adminDb = getAdminDb();
        if (resellerId && isToClient) {
            const resellerSnap = await adminDb.collection('users').doc(resellerId).get();
            if (resellerSnap.exists) {
                const resellerData = resellerSnap.data() as User;
                resellerName = resellerData.companyName || resellerData.name;
            }
        }

        const emailHtml = await render(
            React.createElement(NewNoteNotificationEmail, {
                recipientName: safeRecipientName,
                senderName: safeSenderName,
                orderId,
                notePreview,
                actionUrl,
                isToClient,
                resellerName: isToClient ? `The ${resellerName} Team` : undefined
            })
        );

        await sendEmail({
            to: recipientEmail,
            subject: `New Note on Order #${orderId}`,
            html: emailHtml,
            resellerId: resellerId,
        });
    } catch (err) {
        console.error('[notifyOfNewNote] Failed to send note notification email:', err);
        // Do not re-throw — the note save should still succeed
    }
}

export async function notifyStaffOfClientNote({
    orderId,
    senderName,
    noteText,
}: {
    orderId: string,
    senderName: string,
    noteText: string,
}) {
    try {
        const adminDb = getAdminDb();
        const orderDoc = await adminDb.collection('orders').doc(orderId).get();
        if (!orderDoc.exists) {
            console.error(`[notifyStaffOfClientNote] Order not found: ${orderId}`);
            return;
        }
        const order = orderDoc.data() as Order;

        let recipientEmail = 'info@myacc.co.za';
        let recipientName = 'Support Team';

        if (order.assignedTo && order.assignedTo.length > 0) {
            const assigneeId = order.assignedTo[0];
            const staffSnap = await adminDb.collection('users').doc(assigneeId).get();
            if (staffSnap.exists) {
                const assignedStaffMember = staffSnap.data() as User;
                if (assignedStaffMember && assignedStaffMember.email) {
                    recipientEmail = assignedStaffMember.email;
                    recipientName = assignedStaffMember.name || 'Staff Member';
                }
            }
        }

        const emailHtml = await render(
            React.createElement(NewNoteNotificationEmail, {
                recipientName,
                senderName: senderName || 'Client',
                orderId: order.originalOrderId || orderId,
                notePreview: noteText.substring(0, 150) + (noteText.length > 150 ? '...' : ''),
                actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/orders/${orderId}`,
                isToClient: false
            })
        );

        await sendEmail({
            to: recipientEmail,
            subject: `New Note on Order #${order.originalOrderId || orderId}`,
            html: emailHtml,
        });
    } catch (err) {
        console.error('[notifyStaffOfClientNote] Failed to send email notification:', err);
        // Do not re-throw — the note save should still succeed
    }
}

export async function sendOutstandingDocumentsReminder({ orderId, clientName, clientEmail, resellerId }: { orderId: string, clientName: string, clientEmail: string, resellerId?: string }) {
    let resellerName = 'The My Accountant Team';
    const adminDb = getAdminDb();
    if (resellerId) {
        const resellerSnap = await adminDb.collection('users').doc(resellerId).get();
        if (resellerSnap.exists) {
            const resellerData = resellerSnap.data() as User;
            resellerName = resellerData.companyName || resellerData.name;
        }
    }

    const emailHtml = render(
        React.createElement(OutstandingDocumentsEmail, {
            clientName,
            orderId,
            orderUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/orders/${orderId}`,
            resellerName: `The ${resellerName} Team`
        })
    );

    await sendEmail({
        to: clientEmail,
        subject: `Action Required: Outstanding Documents for Order #${orderId}`,
        html: emailHtml,
        resellerId: resellerId,
    });
}

export async function generateNextTaskOccurrence(taskId: string) {
    const adminDb = getAdminDb();
    const taskRef = adminDb.collection('tasks').doc(taskId);
    const taskSnap = await taskRef.get();
    if (!taskSnap.exists) return;
    const task = taskSnap.data() as Task;

    if (!task.recurrence || task.recurrence === 'None') return;

    let nextDueDate: Date;
    const currentDueDate = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);

    switch (task.recurrence) {
        case 'Daily': nextDueDate = addDays(currentDueDate, 1); break;
        case 'Weekly': nextDueDate = addDays(currentDueDate, 7); break;
        case 'Monthly': nextDueDate = addMonths(currentDueDate, 1); break;
        case 'Bi-Monthly': nextDueDate = addMonths(currentDueDate, 2); break;
        case 'Semi-Annually': nextDueDate = addMonths(currentDueDate, 6); break;
        case 'Annually': nextDueDate = addYears(currentDueDate, 1); break;
        default: return;
    }

    const { id, ...rest } = task;
    
    let newTitle = task.title;
    if (task.createdBy === 'system' && task.type) {
        const clientNameMatch = task.title.match(/ for (.*)$/);
        const clientName = clientNameMatch ? clientNameMatch[1] : "";
        
        if (task.type === 'EMP201' || task.type === 'VAT201' || task.type === 'PAYROLL' || task.type === 'MGMT') {
            const periodDate = addMonths(nextDueDate, task.type === 'MGMT' ? -1 : 0);
            newTitle = `${task.type} Submission - ${format(periodDate, 'MMMM yyyy')} for ${clientName}`;
            if (task.type === 'PAYROLL') newTitle = `Payroll Preparation - ${format(periodDate, 'MMMM yyyy')} for ${clientName}`;
            if (task.type === 'MGMT') newTitle = `Management Accounts - ${format(periodDate, 'MMMM yyyy')} for ${clientName}`;
        } else if (task.type === 'AFS' || task.type === 'ITR') {
            newTitle = task.title.replace(/\d{4}/, (match) => (parseInt(match) + 1).toString());
        } else if (task.type === 'IRP6') {
            const periodMatch = task.title.match(/Period (\d)/);
            if (periodMatch) {
                const currentPeriod = parseInt(periodMatch[1]);
                const nextPeriod = currentPeriod === 1 ? 2 : 1;
                newTitle = task.title.replace(/Period \d/, `Period ${nextPeriod}`);
            }
        }
    }

    const newTaskData = {
        ...rest,
        title: newTitle,
        dueDate: nextDueDate,
        status: 'To-Do' as const,
        createdAt: FieldValue.serverTimestamp(),
        comments: [],
    };

    await adminDb.collection('tasks').add(newTaskData);
}

// AI ACCOUNTANT ACTIONS

export async function extractStatementChunk({ chunkBase64 }: { chunkBase64: string }) {
    try {
        const { extractStatementData } = await import('@/ai/flows/extract-statement-data');
        const result = await extractStatementData({ statementFile: chunkBase64 });
        return { success: true, transactions: result.transactions };
    } catch (e) {
        console.error("Chunk extraction failed:", e);
        return { success: false, error: "Failed to extract data" };
    }
}

export async function prepareAiAccountantAnalysis({ clientId, bankAccountId }: { clientId: string, bankAccountId: string }) {
    const adminDb = getAdminDb();
    const snap = await adminDb.collection('aiAccountantClients').doc(clientId).collection('transactions')
        .where('bankAccountId', '==', bankAccountId)
        .where('status', '==', 'new')
        .where('isExpense', '==', true)
        .get();
    
    if (snap.empty) return { count: 0 };

    const chunks = [];
    for (let i = 0; i < snap.docs.length; i += 450) {
        chunks.push(snap.docs.slice(i, i + 450));
    }
    for (const chunk of chunks) {
        const batch = adminDb.batch();
        chunk.forEach(d => batch.update(d.ref, { status: 'ai_processing' }));
        await batch.commit();
    }

    return { count: snap.size };
}

export async function runAiAccountantAnalysis({ clientId, bankAccountId, initiatorEmail }: { clientId: string, bankAccountId: string, initiatorEmail: string }) {
    const adminDb = getAdminDb();
    const snap = await adminDb.collection('aiAccountantClients').doc(clientId).collection('transactions')
        .where('bankAccountId', '==', bankAccountId)
        .where('status', '==', 'ai_processing')
        .get();

    if (snap.empty) return;

    const clientDoc = await adminDb.collection('aiAccountantClients').doc(clientId).get();
    const clientData = clientDoc.data() as User;
    let allRules = [...(clientData.allocationRules || [])];
    if (!clientData.disableGlobalRules) {
        const globalSnap = await adminDb.collection('allocationRules').get();
        allRules = [...allRules, ...globalSnap.docs.map(d => ({ ...d.data(), id: d.id } as AllocationRule))];
    }

    // Load historical allocations
    const historySnap = await adminDb.collection('aiAccountantClients').doc(clientId).collection('transactions')
        .where('status', 'in', ['allocated', 'reviewed'])
        .get();

    const historyCounts = new Map<string, Map<string, number>>();
    historySnap.docs.forEach(doc => {
        const tx = doc.data() as ImportedTransaction;
        if (!tx.allocatedTo || !tx.allocatedTo.value) return;
        const key = tx.merchantKey || BankCleaner.process(tx.description).merchantKey;
        if (!key) return;

        if (!historyCounts.has(key)) {
            historyCounts.set(key, new Map());
        }
        const allocations = historyCounts.get(key)!;
        const allocKey = `${tx.allocatedTo.type || 'account'}:${tx.allocatedTo.value}|${tx.vatType || 'no_vat'}`;
        allocations.set(allocKey, (allocations.get(allocKey) || 0) + 1);
    });

    const bestHistoryMap = new Map<string, { allocatedTo: { value: string, type: 'account' | 'supplier' | 'customer' }, vatType: string }>();
    historyCounts.forEach((allocations, merchantKey) => {
        let bestKey = '';
        let maxCount = -1;
        allocations.forEach((count, key) => {
            if (count > maxCount) {
                maxCount = count;
                bestKey = key;
            }
        });
        if (bestKey) {
            const [typeVal, vatType] = bestKey.split('|');
            const [type, value] = typeVal.split(':');
            bestHistoryMap.set(merchantKey, {
                allocatedTo: { value, type: type as any },
                vatType
            });
        }
    });

    const chunks = [];
    for (let i = 0; i < snap.docs.length; i += 450) {
        chunks.push(snap.docs.slice(i, i + 450));
    }
    for (const chunk of chunks) {
        const batch = adminDb.batch();
        for (const d of chunk) {
        const tx = d.data() as ImportedTransaction;
        const result = BankCleaner.process(tx.description);
        
        const match = allRules.find(r => r.keywords.some(kw => result.cleanDescription.includes(kw.toUpperCase())));
        
        if (match) {
            batch.update(d.ref, {
                ...result,
                status: 'ai_review',
                smartAllocationResult: {
                    accountId: match.accountId,
                    accountType: match.accountType || 'account',
                    vatType: match.vatType,
                    confidence: 100,
                    summary: `Match found for rule keyword.`,
                    ruleId: match.id,
                    matchedKeyword: match.keywords.find(kw => result.cleanDescription.includes(kw.toUpperCase()))
                },
                allocationSource: 'rule'
            });
        } else {
            const historyMatch = bestHistoryMap.get(result.merchantKey);
            if (historyMatch) {
                batch.update(d.ref, {
                    ...result,
                    status: 'ai_review',
                    smartAllocationResult: {
                        accountId: historyMatch.allocatedTo.value,
                        accountType: historyMatch.allocatedTo.type || 'account',
                        vatType: historyMatch.vatType || 'no_vat',
                        confidence: 95,
                        summary: `Matched with past transaction allocation history.`
                    },
                    allocationSource: 'history'
                });
            } else {
                batch.update(d.ref, {
                    ...result,
                    status: 'ai_review',
                    allocationSource: 'none'
                });
            }
        }
        }
        await batch.commit();
    }
}

export async function moveTransactionToNew({ clientId, transactionId }: { clientId: string, transactionId: string }) {
    const adminDb = getAdminDb();
    const txRef = adminDb.collection('aiAccountantClients').doc(clientId).collection('transactions').doc(transactionId);
    await txRef.update({
        status: 'new',
        allocatedTo: FieldValue.delete(),
        vatType: FieldValue.delete(),
        smartAllocationResult: FieldValue.delete(),
        allocationSource: FieldValue.delete(),
        merchantKey: FieldValue.delete(),
        cleanDescription: FieldValue.delete(),
        rawDescription: FieldValue.delete()
    });
}

export async function bulkMoveTransactionsToNew({ clientId, transactionIds }: { clientId: string, transactionIds: string[] }) {
    const adminDb = getAdminDb();
    const chunks = [];
    for (let i = 0; i < transactionIds.length; i += 450) {
        chunks.push(transactionIds.slice(i, i + 450));
    }
    for (const chunk of chunks) {
        const batch = adminDb.batch();
        chunk.forEach(id => {
            const ref = adminDb.collection('aiAccountantClients').doc(clientId).collection('transactions').doc(id);
            batch.update(ref, {
                status: 'new',
                allocatedTo: FieldValue.delete(),
                vatType: FieldValue.delete(),
                smartAllocationResult: FieldValue.delete(),
                allocationSource: FieldValue.delete()
            });
        });
        await batch.commit();
    }
    return { count: transactionIds.length };
}

export async function researchMerchantWithAi({ clientId, transactionIds, description, chartOfAccounts, isVatRegistered, isExpense }: any) {
    const { suggestTransactionAllocation } = await import('@/ai/flows/suggest-transaction-allocation');
    const res = await suggestTransactionAllocation({
        description,
        chartOfAccounts,
        isVatRegistered
    });

    if (clientId && transactionIds && transactionIds.length > 0) {
        const adminDb = getAdminDb();
        const batch = adminDb.batch();
        transactionIds.forEach((id: string) => {
            const ref = adminDb.collection('aiAccountantClients').doc(clientId).collection('transactions').doc(id);
            batch.update(ref, {
                smartAllocationResult: {
                    accountId: res.accountId,
                    vatType: res.vatType,
                    confidence: res.confidence,
                    summary: res.summary,
                    suggestedKeyword: res.suggestedKeyword
                }
            });
        });
        await batch.commit();
    }

    return res as SmartAllocationResult;
}

export async function updateGlobalMerchantDb(data: any) {
    console.log("Global DB Update:", data);
}

export async function resetAiAccountantAnalysis({ clientId, bankAccountId }: { clientId: string, bankAccountId: string }) {
    const adminDb = getAdminDb();
    const snap = await adminDb.collection('aiAccountantClients').doc(clientId).collection('transactions')
        .where('bankAccountId', '==', bankAccountId)
        .where('status', 'in', ['ai_processing', 'ai_review'])
        .get();
    
    if (snap.empty) return { count: 0 };

    const chunks = [];
    for (let i = 0; i < snap.docs.length; i += 450) {
        chunks.push(snap.docs.slice(i, i + 450));
    }
    for (const chunk of chunks) {
        const batch = adminDb.batch();
        chunk.forEach(d => batch.update(d.ref, { status: 'new', smartAllocationResult: FieldValue.delete() }));
        await batch.commit();
    }

    return { count: snap.size };
}

export async function reanalyzeAndRegroupTransactions({ clientId, bankAccountId, initiatorEmail }: { clientId: string, bankAccountId: string, initiatorEmail: string }) {
    const adminDb = getAdminDb();
    const snap = await adminDb.collection('aiAccountantClients').doc(clientId).collection('transactions')
        .where('bankAccountId', '==', bankAccountId)
        .where('status', 'in', ['ai_processing', 'ai_review'])
        .get();
    
    if (snap.empty) return { count: 0 };

    const chunks = [];
    for (let i = 0; i < snap.docs.length; i += 450) {
        chunks.push(snap.docs.slice(i, i + 450));
    }
    for (const chunk of chunks) {
        const batch = adminDb.batch();
        chunk.forEach(d => {
            batch.update(d.ref, { 
                status: 'ai_processing',
                smartAllocationResult: FieldValue.delete(),
                merchantKey: FieldValue.delete(),
                cleanDescription: FieldValue.delete(),
                rawDescription: FieldValue.delete()
            });
        });
        await batch.commit();
    }

    await runAiAccountantAnalysis({ clientId, bankAccountId, initiatorEmail });

    return { count: snap.size };
}

export async function proposeRegroups({ clientId, bankAccountId }: { clientId: string, bankAccountId: string }) {
    const adminDb = getAdminDb();
    const snap = await adminDb.collection('aiAccountantClients').doc(clientId).collection('transactions')
        .where('bankAccountId', '==', bankAccountId)
        .where('status', '==', 'ai_review')
        .get();
    
    const txs = snap.docs.map(d => ({ ...d.data(), id: d.id } as ImportedTransaction));
    const groups: Record<string, string[]> = {};
    txs.forEach(t => {
        if (!groups[t.merchantKey!]) groups[t.merchantKey!] = [];
        groups[t.merchantKey!].push(t.id);
    });

    const keys = Object.keys(groups);
    const weights: Record<string, number> = {};
    keys.forEach(k => {
        weights[k] = groups[k].length;
    });

    class UnionFind {
        parent: Record<string, string>;
        constructor(keys: string[]) {
            this.parent = {};
            keys.forEach(k => {
                this.parent[k] = k;
            });
        }
        find(i: string): string {
            if (this.parent[i] === i) return i;
            this.parent[i] = this.find(this.parent[i]); // Path compression
            return this.parent[i];
        }
        union(i: string, j: string, weights: Record<string, number>) {
            const rootI = this.find(i);
            const rootJ = this.find(j);
            if (rootI !== rootJ) {
                const weightI = weights[rootI] || 0;
                const weightJ = weights[rootJ] || 0;
                if (weightI >= weightJ) {
                    this.parent[rootJ] = rootI;
                } else {
                    this.parent[rootI] = rootJ;
                }
            }
        }
    }

    const dsu = new UnionFind(keys);
    for (let i = 0; i < keys.length; i++) {
        for (let j = i + 1; j < keys.length; j++) {
            const sim = BankCleaner.getSimilarity(keys[i], keys[j]);
            if (sim.score > 0.85) {
                dsu.union(keys[i], keys[j], weights);
            }
        }
    }

    const proposals = [];
    for (const key of keys) {
        const root = dsu.find(key);
        if (root !== key) {
            const sim = BankCleaner.getSimilarity(key, root);
            proposals.push({
                fromKey: key,
                toKey: root,
                fromImpact: groups[key].length,
                toImpact: groups[root].length,
                score: Math.round(sim.score * 100),
                confidence: 'High',
                reason: sim.reason,
                fromTxIds: groups[key],
                fromExamples: [txs.find(t => t.merchantKey === key)?.description],
                toExamples: [txs.find(t => t.merchantKey === root)?.description]
            });
        }
    }

    return proposals;
}

export async function applyRegroups({ clientId, merges, userId }: { clientId: string, merges: any[], userId: string }) {
    const adminDb = getAdminDb();
    const batch = adminDb.batch();
    merges.forEach(m => {
        if (m.fromTxIds && Array.isArray(m.fromTxIds)) {
            m.fromTxIds.forEach((id: string) => {
                const ref = adminDb.collection('aiAccountantClients').doc(clientId).collection('transactions').doc(id);
                batch.update(ref, { merchantKey: m.toKey });
            });
        }
    });
    await batch.commit();
}

export async function proposeAiRegroups({ clientId, bankAccountId, selectedMerchantKeys }: any) {
    const { aiSmartRegroup } = await import('@/ai/flows/ai-smart-regroup');
    const adminDb = getAdminDb();
    const snap = await adminDb.collection('aiAccountantClients').doc(clientId).collection('transactions')
        .where('bankAccountId', '==', bankAccountId)
        .where('status', '==', 'ai_review')
        .get();
    
    const txs = snap.docs.map(d => ({ ...d.data(), id: d.id } as ImportedTransaction));
    const groupData: any[] = [];
    const merchantMap: Record<string, string[]> = {};

    txs.forEach(t => {
        if (!merchantMap[t.merchantKey!]) {
            merchantMap[t.merchantKey!] = [];
            groupData.push({ key: t.merchantKey, example: t.description, count: 0 });
        }
        merchantMap[t.merchantKey!].push(t.id);
    });

    groupData.forEach(g => g.count = merchantMap[g.key].length);

    const res = await aiSmartRegroup({ groups: groupData });
    return res.proposals
        .filter(p => merchantMap[p.fromKey] && merchantMap[p.fromKey].length > 0)
        .map(p => ({
            ...p,
            fromTxIds: merchantMap[p.fromKey],
            fromImpact: merchantMap[p.fromKey].length,
            toImpact: merchantMap[p.toKey]?.length || 0,
            score: p.confidence,
            reason: p.reasoning,
            fromExamples: [txs.find(t => t.merchantKey === p.fromKey)?.description],
            toExamples: [txs.find(t => t.merchantKey === p.toKey)?.description]
        }));
}

export async function analyzeClientCommentAndSuggest({ clientId, transactionIds, comment, merchantKey, examples, chartOfAccounts, isVatRegistered }: any) {
    const { analyzeClientComment } = await import('@/ai/flows/analyze-client-comment');
    const res = await analyzeClientComment({
        comment,
        merchantKey,
        examples,
        chartOfAccounts,
        isVatRegistered
    });

    const adminDb = getAdminDb();
    const batch = adminDb.batch();
    transactionIds.forEach((id: string) => {
        const ref = adminDb.collection('aiAccountantClients').doc(clientId).collection('transactions').doc(id);
        batch.update(ref, { 
            clientComment: comment,
            smartAllocationResult: {
                accountId: res.accountId,
                vatType: res.vatType,
                confidence: res.confidence,
                summary: `AI Analysis of client comment: ${res.reasoning}`
            }
        });
    });
    await batch.commit();

    return res;
}

export async function matchTransactionsToSuppliers({ clientId, bankAccountId }: { clientId: string, bankAccountId: string }) {
    const adminDb = getAdminDb();
    const supSnap = await adminDb.collection('aiAccountantClients').doc(clientId).collection('suppliers').get();
    const suppliers = supSnap.docs.map(d => ({ id: d.id, name: d.data().name.toUpperCase() }));

    const snap = await adminDb.collection('aiAccountantClients').doc(clientId).collection('transactions')
        .where('bankAccountId', '==', bankAccountId)
        .where('status', 'in', ['new', 'ai_review'])
        .where('isExpense', '==', true)
        .get();

    const batch = adminDb.batch();
    let count = 0;

    snap.docs.forEach(d => {
        const tx = d.data() as ImportedTransaction;
        const match = suppliers.find(s => tx.description.toUpperCase().includes(s.name) || BankCleaner.getSimilarity(tx.description, s.name).score > 0.9);
        if (match) {
            batch.update(d.ref, {
                status: 'reviewed',
                allocatedTo: { value: match.id, type: 'supplier' },
                vatType: 'no_vat',
                allocatedAt: FieldValue.serverTimestamp(),
                allocationSource: 'manual'
            });
            count++;
        }
    });

    if (count > 0) await batch.commit();
    return { count };
}

export async function finalizeChatAllocation({ clientId, transactionId, accountId, vatType, explanation }: any) {
    const adminDb = getAdminDb();
    const txRef = adminDb.collection('aiAccountantClients').doc(clientId).collection('transactions').doc(transactionId);
    await txRef.update({
        status: 'reviewed',
        allocatedTo: { value: accountId, type: 'account' },
        vatType: vatType,
        clientExplanation: explanation,
        allocatedAt: FieldValue.serverTimestamp(),
        allocationSource: 'chat'
    });
}

export async function analyzeSpreadsheetAllocationsAction({
    clientId,
    spreadsheetData,
}: {
    clientId: string;
    spreadsheetData: string;
}) {
    try {
        const adminDb = getAdminDb();

        // 1. Fetch Client Details (to get chartOfAccounts and isVatRegistered)
        const clientDoc = await adminDb.collection('aiAccountantClients').doc(clientId).get();
        if (!clientDoc.exists) {
            return { success: false, error: "Client not found" };
        }
        const clientData = clientDoc.data() as any;
        const chartOfAccounts = clientData.chartOfAccounts || [];
        const isVatRegistered = !!clientData.isVatRegistered;

        // 2. Fetch Unallocated Transactions
        const txsSnap = await adminDb.collection('aiAccountantClients').doc(clientId).collection('transactions')
            .where('status', 'in', ['new', 'ai_review', 'ai_processing'])
            .get();
        
        const unallocatedTransactions = txsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        if (unallocatedTransactions.length === 0) {
            return { success: true, matches: [], summary: "No unallocated transactions found to match." };
        }

        // 3. Fetch Customers
        const custSnap = await adminDb.collection('aiAccountantClients').doc(clientId).collection('customers').get();
        const customers = custSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // 4. Fetch Suppliers
        const supSnap = await adminDb.collection('aiAccountantClients').doc(clientId).collection('suppliers').get();
        const suppliers = supSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // 5. Invoke Genkit Flow
        const { allocateFromSpreadsheet } = await import('@/ai/flows/allocate-from-spreadsheet');
        const result = await allocateFromSpreadsheet({
            spreadsheetData,
            unallocatedTransactions,
            chartOfAccounts: JSON.stringify(chartOfAccounts),
            customers,
            suppliers,
            isVatRegistered
        });

        return { success: true, ...result };
    } catch (e: any) {
        console.error("Spreadsheet analysis action failed:", e);
        return { success: false, error: e.message || "Failed to analyze spreadsheet" };
    }
}

export async function applySpreadsheetAllocationsAction({
    clientId,
    allocations,
}: {
    clientId: string;
    allocations: {
        transactionId: string;
        accountId: string;
        accountType: 'account' | 'supplier' | 'customer';
        vatType: string;
        explanation: string;
    }[];
}) {
    try {
        const adminDb = getAdminDb();
        const batch = adminDb.batch();
        const txCollection = adminDb.collection('aiAccountantClients').doc(clientId).collection('transactions');

        allocations.forEach(alloc => {
            const ref = txCollection.doc(alloc.transactionId);
            batch.update(ref, {
                status: 'reviewed',
                allocatedTo: {
                    value: alloc.accountId,
                    type: alloc.accountType
                },
                vatType: alloc.vatType,
                clientExplanation: alloc.explanation,
                allocatedAt: FieldValue.serverTimestamp(),
                allocationSource: 'chat'
            });
        });

        await batch.commit();
        return { success: true, count: allocations.length };
    } catch (e: any) {
        console.error("Apply spreadsheet allocations action failed:", e);
        return { success: false, error: e.message || "Failed to apply allocations" };
    }
}


// AI PAYROLL ACTIONS

export async function saveEmployeeAction({ clientId, employeeId, data }: { clientId: string, employeeId?: string, data: any }) {
    try {
        const adminDb = getAdminDb();
        const employeesCol = adminDb.collection('aiPayrollClients').doc(clientId).collection('employees');

        if (!employeeId) {
            // New employee — check that the employee code is unique
            const existingSnap = await employeesCol.where('employeeCode', '==', data.employeeCode).limit(1).get();
            if (!existingSnap.empty) {
                return { success: false, error: `Employee code "${data.employeeCode}" is already in use. Each employee must have a unique code.` };
            }
        } else {
            // Editing — strip the employee code so it cannot be changed
            delete data.employeeCode;
        }

        const targetRef = employeeId 
            ? employeesCol.doc(employeeId)
            : employeesCol.doc();
        
        await targetRef.set({ ...data, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        
        if (!employeeId) {
            const { PayrollServiceServer } = await import('@/services/PayrollServiceServer');
            const baseValue = data.payType === 'Hourly' ? data.hourlyRate : data.basicSalary;
            await PayrollServiceServer.generateInitialPayslip(clientId, targetRef.id, baseValue);
        }

        return { success: true, id: targetRef.id };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function generateEmployeePayslipAction({ clientId, employeeId, basicSalary, hours }: any) {
    try {
        const { PayrollServiceServer } = await import('@/services/PayrollServiceServer');
        return await PayrollServiceServer.generateInitialPayslip(clientId, employeeId, basicSalary, hours);
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function updateDraftPayslipHoursAction({ clientId, employeeId, hours }: any) {
    const adminDb = getAdminDb();
    const snap = await adminDb.collection('aiPayrollClients').doc(clientId).collection('payslips')
        .where('employeeId', '==', employeeId)
        .where('status', '==', 'draft')
        .limit(1)
        .get();
    
    if (snap.empty) throw new Error("No draft payslip found");

    const ps = snap.docs[0].data() as Payslip;
    const empSnap = await adminDb.collection('aiPayrollClients').doc(clientId).collection('employees').doc(employeeId).get();
    const employee = empSnap.data() as Employee;
    
    const { PayrollService } = await import('@/services/PayrollService');
    const freq = PayrollService.getFrequencyMultiplier(ps.frequency);
    const baseValue = employee.payType === 'Hourly' ? employee.hourlyRate : employee.basicSalary;

    const earnings = PayrollService.calculateEarningsList(employee, baseValue, ps.period, freq, hours);
    const gross = earnings.reduce((s, i) => s + i.amount, 0);
    const deductions = PayrollService.getInitialDeductions(
        gross, 
        ps.period, 
        freq, 
        employee.joinDate,
        employee.idNumber,
        employee.medicalAidMembers || 0,
        employee.medicalAidDependents || 0
    );
    const totalDeductions = deductions.reduce((s, i) => s + i.amount, 0);

    await snap.docs[0].ref.update({
        earnings,
        deductions,
        grossPay: gross,
        totalDeductions,
        netPay: gross - totalDeductions,
        hoursWorked: hours.normal
    });

    return { success: true };
}

export async function syncEmployeeSalaryToActivePayslipAction({ clientId, employeeId, newSalary, isNetSalary }: any) {
    const adminDb = getAdminDb();
    const snap = await adminDb.collection('aiPayrollClients').doc(clientId).collection('payslips')
        .where('employeeId', '==', employeeId)
        .where('status', '==', 'draft')
        .limit(1)
        .get();
    
    if (snap.empty) return { success: false };

    const ps = snap.docs[0].data() as Payslip;
    const { PayrollService } = await import('@/services/PayrollService');
    const freq = PayrollService.getFrequencyMultiplier(ps.frequency);

    const empSnap = await adminDb.collection('aiPayrollClients').doc(clientId).collection('employees').doc(employeeId).get();
    const employee = empSnap.data() as Employee;

    const earnings = PayrollService.calculateEarningsList(employee, newSalary, ps.period, freq);
    const gross = earnings.reduce((s, i) => s + i.amount, 0);
    const deductions = PayrollService.getInitialDeductions(
        gross, 
        ps.period, 
        freq, 
        employee.joinDate,
        employee.idNumber,
        employee.medicalAidMembers || 0,
        employee.medicalAidDependents || 0
    );
    
    await snap.docs[0].ref.update({
        earnings,
        deductions,
        grossPay: gross,
        netPay: gross - deductions.reduce((s, i) => s + i.amount, 0)
    });

    return { success: true };
}

export async function updatePayslipAction({ clientId, payslipId, data, employeeId, recurringItems }: { clientId: string, payslipId: string, data: any, employeeId?: string, recurringItems?: any[] }) {
    try {
        const adminDb = getAdminDb();
        const batch = adminDb.batch();
        const psRef = adminDb.collection('aiPayrollClients').doc(clientId).collection('payslips').doc(payslipId);
        batch.update(psRef, { ...data, status: 'finalized', updatedAt: new Date() });

        if (employeeId && recurringItems) {
            const empRef = adminDb.collection('aiPayrollClients').doc(clientId).collection('employees').doc(employeeId);
            batch.update(empRef, { recurringItems });
        }

        await batch.commit();
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function rollForwardPayrollAction({ clientId }: { clientId: string }) {
    const adminDb = getAdminDb();
    const clientRef = adminDb.collection('aiPayrollClients').doc(clientId);
    const clientSnap = await clientRef.get();
    const client = clientSnap.data() as User;

    const currentPeriod = client.firstProcessingMonth!;
    const isFortnightly = client.payrollFrequency === 'Fortnightly';
    let nextPeriod: string;
    if (isFortnightly) {
        try {
            const parsed = parseDate(currentPeriod, 'dd/MM/yyyy', new Date());
            nextPeriod = format(addDays(parsed, 14), 'dd/MM/yyyy');
        } catch (e) {
            nextPeriod = format(addDays(new Date(), 14), 'dd/MM/yyyy');
        }
    } else {
        nextPeriod = format(addMonths(parseDate(currentPeriod, 'MMMM yyyy', new Date()), 1), 'MMMM yyyy');
    }

    const empsSnap = await adminDb.collection('aiPayrollClients').doc(clientId).collection('employees')
        .where('status', '==', 'Active')
        .get();
    
    const batch = adminDb.batch();
    let created = 0;

    for (const d of empsSnap.docs) {
        const emp = d.data() as Employee;
        const newPsRef = adminDb.collection('aiPayrollClients').doc(clientId).collection('payslips').doc();
        
        let initialEarnings = [] as any[];
        let initialDeductions = [] as any[];
        
        let newRecurringItems = [] as any[];
        if (emp.recurringItems && emp.recurringItems.length > 0) {
            emp.recurringItems.forEach(item => {
                const payslipItem = {
                    label: item.label,
                    amount: item.amount,
                    isStatutory: item.isStatutory || false,
                    taxCategory: item.taxCategory || 'non-taxable',
                    durationMonths: item.remainingMonths || 'indefinite'
                };
                if (item.type === 'earning') initialEarnings.push(payslipItem);
                if (item.type === 'deduction') initialDeductions.push(payslipItem);
                
                if (item.remainingMonths === 'indefinite') {
                    newRecurringItems.push(item);
                } else if (typeof item.remainingMonths === 'number' && item.remainingMonths > 1) {
                    newRecurringItems.push({ ...item, remainingMonths: item.remainingMonths - 1 });
                }
            });
            batch.update(d.ref, { recurringItems: newRecurringItems });
        }
        
        batch.set(newPsRef, {
            employeeId: d.id,
            employeeName: `${emp.name} ${emp.surname}`,
            period: nextPeriod,
            status: 'draft',
            createdAt: FieldValue.serverTimestamp(),
            earnings: initialEarnings,
            deductions: initialDeductions,
            contributions: [],
            fringeBenefits: [],
            grossPay: 0,
            totalDeductions: 0,
            netPay: 0,
            frequency: client.payrollFrequency || 'Monthly'
        });
        created++;
    }

    batch.update(clientRef, { firstProcessingMonth: nextPeriod });
    await batch.commit();

    return { success: true, nextPeriod, created };
}

export async function rollBackPayrollAction({ clientId }: { clientId: string }) {
    const adminDb = getAdminDb();
    const clientRef = adminDb.collection('aiPayrollClients').doc(clientId);
    const clientSnap = await clientRef.get();
    const client = clientSnap.data() as User;

    const currentPeriod = client.firstProcessingMonth!;
    const isFortnightly = client.payrollFrequency === 'Fortnightly';
    let prevPeriod: string;
    if (isFortnightly) {
        try {
            const parsed = parseDate(currentPeriod, 'dd/MM/yyyy', new Date());
            prevPeriod = format(addDays(parsed, -14), 'dd/MM/yyyy');
        } catch (e) {
            prevPeriod = format(addDays(new Date(), -14), 'dd/MM/yyyy');
        }
    } else {
        prevPeriod = format(addMonths(parseDate(currentPeriod, 'MMMM yyyy', new Date()), -1), 'MMMM yyyy');
    }

    const psSnap = await adminDb.collection('aiPayrollClients').doc(clientId).collection('payslips')
        .where('period', '==', currentPeriod)
        .get();
    
    const batch = adminDb.batch();
    psSnap.forEach(d => batch.delete(d.ref));
    batch.update(clientRef, { firstProcessingMonth: prevPeriod });
    
    await batch.commit();

    return { success: true, prevPeriod, deletedCount: psSnap.size };
}

export async function reactivatePracticeSubscription({ userId }: { userId: string }) {
    const adminDb = getAdminDb();
    const userRef = adminDb.collection('users').doc(userId);
    await userRef.update({
        'subscription.subscriptionStatus': 'active',
        'subscription.subscriptionEndDate': addMonths(new Date(), 1)
    });
    return { success: true };
}

function parse(str: string, fmt: string, base: Date) {
    const parts = str.split(' ');
    const m = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].indexOf(parts[0]);
    return new Date(parseInt(parts[1]), m, 1);
}

export async function sendOrderConfirmationEmailAction({
  orderData,
  resellerData,
  isNewUser,
  generatedPassword,
  showPaymentButton,
  bcc,
}: {
  orderData: Order;
  resellerData?: User;
  isNewUser?: boolean;
  generatedPassword?: string | null;
  showPaymentButton?: boolean;
  bcc?: string | string[];
}) {
  const emailHtml = render(
    React.createElement(OrderConfirmationEmail, {
      order: orderData,
      reseller: resellerData,
      isNewUser,
      generatedPassword,
      showPaymentButton,
    })
  );

  const defaultBcc = ['kev@thinkestry.co.za', 'winifred@myacc.co.za'];
  const finalBcc = bcc
    ? (Array.isArray(bcc) ? [...bcc, ...defaultBcc] : [bcc, ...defaultBcc])
    : defaultBcc;

  await sendEmail({
    to: orderData.customerEmail,
    bcc: finalBcc,
    subject: `Order Confirmation #${orderData.id}`,
    html: emailHtml,
    resellerId: orderData.resellerId || undefined,
  });
}

export async function sendDocumentRequestEmailAction({
  orderId,
  recipientEmail,
}: {
  orderId: string;
  recipientEmail: string;
}) {
  const adminDb = getAdminDb();
  const orderRef = adminDb.collection('orders').doc(orderId);
  const orderSnap = await orderRef.get();
  
  if (!orderSnap.exists) {
    throw new Error('Order not found');
  }
  
  const orderData = { ...orderSnap.data(), id: orderSnap.id } as Order;
  
  // Fetch reseller details if it's a white-label order
  let resellerData: User | undefined;
  if (orderData.resellerId) {
    const resellerSnap = await adminDb.collection('users').doc(orderData.resellerId).get();
    if (resellerSnap.exists) {
      resellerData = { ...resellerSnap.data(), id: resellerSnap.id } as User;
    }
  }

  const itemsWithServices = orderData.items.map(item => {
    const service = allServices.find(s => s.id === item.id);
    return { ...item, service };
  }).filter(item => item.service) as any[];

  const emailHtml = render(
    React.createElement(DocumentRequestEmail, {
      order: orderData,
      items: itemsWithServices,
      reseller: resellerData,
      replyTo: resellerData?.email || "info@myacc.co.za",
    })
  );

  const attachments = itemsWithServices
    .filter(item => item.service.attachmentUrl)
    .map(item => ({
      filename: `${item.service.title.replace(/\s/g, '_')}.pdf`,
      path: item.service.attachmentUrl!,
    }));

  await sendEmail({
    to: recipientEmail,
    subject: `Action Required for Your Order #${orderId}`,
    html: emailHtml,
    attachments: attachments,
    resellerId: orderData.resellerId || undefined,
  });

  const emailNote = {
    text: `Sent "Request Documents" email to ${recipientEmail} (Payment Successful).`,
    date: new Date(),
    authorId: 'system',
    type: 'email',
    subject: `Action Required for Your Order #${orderId}`,
    attachments: null,
  };

  await orderRef.update({
    notes: FieldValue.arrayUnion(emailNote)
  });
}

export async function adminCreateUserAction({
  email,
  password,
  name,
  role = 'client',
  source,
  contactNumber,
  department,
}: {
  email: string;
  password?: string;
  name: string;
  role?: string;
  source?: string;
  contactNumber?: string;
  department?: string;
}) {
  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    const cleanEmail = email.toLowerCase().trim();
    let uid: string;
    let isNewUser = false;

    try {
      const userRecord = await adminAuth.getUserByEmail(cleanEmail);
      uid = userRecord.uid;

      // Check if user document already exists in Firestore 'users' collection
      const userDocRef = adminDb.collection('users').doc(uid);
      const userDocSnap = await userDocRef.get();
      if (userDocSnap.exists) {
        return {
          success: false,
          error: 'auth/email-already-in-use',
          message: 'A user account already exists with this email address.',
        };
      }
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        const userRecord = await adminAuth.createUser({
          email: cleanEmail,
          password: password || undefined,
          displayName: name,
        });
        uid = userRecord.uid;
        isNewUser = true;
      } else {
        throw e;
      }
    }

    // Write/update Firestore 'users' document
    const userDocRef = adminDb.collection('users').doc(uid);
    const userDocSnap = await userDocRef.get();

    const profileData: Record<string, any> = {
      id: uid,
      uid: uid,
      name,
      email: cleanEmail,
      role,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (!userDocSnap.exists) {
      profileData.createdAt = FieldValue.serverTimestamp();
    }
    if (source) {
      profileData.source = source;
    }
    if (contactNumber) {
      profileData.contactNumber = contactNumber;
    }
    if (department) {
      profileData.department = department;
    }

    await userDocRef.set(profileData, { merge: true });

    return {
      success: true,
      uid,
      isNewUser,
    };
  } catch (error: any) {
    console.error("Error in adminCreateUserAction:", error);
    return {
      success: false,
      error: error.code || 'error',
      message: error.message || 'Failed to create user account.',
    };
  }
}

export async function matchTransactionsToHistory({ clientId, bankAccountId }: { clientId: string, bankAccountId: string }) {
    const adminDb = getAdminDb();
    
    const activeSnap = await adminDb.collection('aiAccountantClients').doc(clientId).collection('transactions')
        .where('bankAccountId', '==', bankAccountId)
        .where('status', '==', 'ai_review')
        .get();
        
    if (activeSnap.empty) return { count: 0 };
    
    const historySnap = await adminDb.collection('aiAccountantClients').doc(clientId).collection('transactions')
        .where('status', 'in', ['allocated', 'reviewed'])
        .get();
        
    if (historySnap.empty) return { count: 0 };
    
    const historyCounts = new Map<string, Map<string, number>>();
    historySnap.docs.forEach(doc => {
        const tx = doc.data() as ImportedTransaction;
        if (!tx.allocatedTo || !tx.allocatedTo.value) return;
        const key = tx.merchantKey || BankCleaner.process(tx.description).merchantKey;
        if (!key) return;

        if (!historyCounts.has(key)) {
            historyCounts.set(key, new Map());
        }
        const allocations = historyCounts.get(key)!;
        const allocKey = `${tx.allocatedTo.type || 'account'}:${tx.allocatedTo.value}|${tx.vatType || 'no_vat'}`;
        allocations.set(allocKey, (allocations.get(allocKey) || 0) + 1);
    });

    const bestHistoryMap = new Map<string, { allocatedTo: { value: string, type: 'account' | 'supplier' | 'customer' }, vatType: string }>();
    historyCounts.forEach((allocations, merchantKey) => {
        let bestKey = '';
        let maxCount = -1;
        allocations.forEach((count, key) => {
            if (count > maxCount) {
                maxCount = count;
                bestKey = key;
            }
        });
        if (bestKey) {
            const [typeVal, vatType] = bestKey.split('|');
            const [type, value] = typeVal.split(':');
            bestHistoryMap.set(merchantKey, {
                allocatedTo: { value, type: type as any },
                vatType
            });
        }
    });

    const batch = adminDb.batch();
    let count = 0;
    
    activeSnap.docs.forEach(doc => {
        const tx = doc.data() as ImportedTransaction;
        if (tx.allocationSource === 'rule') return;
        
        const key = tx.merchantKey || BankCleaner.process(tx.description).merchantKey;
        const match = bestHistoryMap.get(key);
        if (match) {
            batch.update(doc.ref, {
                smartAllocationResult: {
                    accountId: match.allocatedTo.value,
                    accountType: match.allocatedTo.type || 'account',
                    vatType: match.vatType || 'no_vat',
                    confidence: 95,
                    summary: `Matched with past transaction allocation history.`
                },
                allocationSource: 'history'
            });
            count++;
        }
    });
    
    if (count > 0) {
        await batch.commit();
    }
    
    return { count };
}

export async function adminDeleteUserAction({ uid }: { uid: string }) {
  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    // 1. Delete from Firebase Authentication
    try {
      await adminAuth.deleteUser(uid);
    } catch (e: any) {
      if (e.code !== 'auth/user-not-found') {
        throw e;
      }
      console.warn(`User ${uid} not found in Firebase Auth during deletion.`);
    }

    // 2. Delete from Firestore users collection
    await adminDb.collection('users').doc(uid).delete();

    return { success: true };
  } catch (error: any) {
    console.error("Error in adminDeleteUserAction:", error);
    return { success: false, error: error.message || 'Failed to delete user' };
  }
}

export async function adminUpdateUserPasswordAction({ uid, password }: { uid: string; password?: string }) {
  try {
    if (!password || password.length < 6) {
      return { success: false, error: 'invalid-password', message: 'Password must be at least 6 characters.' };
    }
    const adminAuth = getAdminAuth();
    await adminAuth.updateUser(uid, { password });
    return { success: true };
  } catch (error: any) {
    console.error("Error in adminUpdateUserPasswordAction:", error);
    return { success: false, error: error.code || 'error', message: error.message || 'Failed to update user password.' };
  }
}

export async function checkExistingUserByEmail(email: string) {
  try {
    const adminDb = getAdminDb();
    const collectionsToTry = ['users', 'aiAccountantClients', 'adminClients', 'partnerClients'];
    const cleanEmail = email.trim();
    
    for (const colName of collectionsToTry) {
      const snap = await adminDb.collection(colName)
        .where('email', 'in', [cleanEmail, cleanEmail.toLowerCase()])
        .limit(1)
        .get();
        
      if (!snap.empty) {
        const userData = snap.docs[0].data();
        const fullName = userData.name || userData.companyName || 'Existing Client';
        return {
          exists: true,
          id: snap.docs[0].id,
          name: fullName,
          phone: userData.contactNumber || userData.cellNumber || userData.phone || ''
        };
      }
    }
    return { exists: false };
  } catch (error: any) {
    console.error("Error in checkExistingUserByEmail:", error);
    return { exists: false, error: error.message || 'Failed to check existing user' };
  }
}

export async function createCheckoutOrderAction({
  firstName,
  lastName,
  email,
  phone,
  items,
  total,
  paymentMethod,
  partnerId,
  userId,
}: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  items: Array<{ id: string; title: string; price: number; quantity: number }>;
  total: number;
  paymentMethod?: 'EFT' | 'PayFast';
  partnerId?: string;
  userId?: string | null;
}) {
  try {
    const adminDb = getAdminDb();
    const adminAuth = getAdminAuth();
    const cleanEmail = email.toLowerCase().trim();

    let finalUserId = userId || null;
    let isNewUser = false;
    let generatedPassword = null;

    // Check if user needs to be created
    if (!finalUserId) {
      // Find if email already exists
      const existing = await checkExistingUserByEmail(cleanEmail);
      if (existing.exists && existing.id) {
        return {
          success: false,
          error: 'auth/email-already-in-use',
          message: 'An account already exists with this email address. Please log in to continue.',
        };
      }

      // Create new user
      isNewUser = true;
      const { customAlphabet } = await import('nanoid');
      const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10);
      generatedPassword = nanoid();

      const userRecord = await adminAuth.createUser({
        email: cleanEmail,
        password: generatedPassword,
        displayName: `${firstName} ${lastName}`,
      });
      finalUserId = userRecord.uid;

      // Write user document
      await adminDb.collection('users').doc(finalUserId).set({
        id: finalUserId,
        uid: finalUserId,
        name: `${firstName} ${lastName}`,
        email: cleanEmail,
        contactNumber: phone,
        role: 'client',
        source: partnerId ? 'Partner Landing Page' : 'Website',
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    // Load reseller data if partnerId is provided
    let resellerData: any = undefined;
    if (partnerId) {
      const partnerSnap = await adminDb.collection('users').doc(partnerId).get();
      if (partnerSnap.exists) {
        resellerData = { ...partnerSnap.data(), id: partnerSnap.id };
      }
    }

    // Determine payment method if not specified
    const finalPaymentMethod = paymentMethod || (resellerData?.bankingDetails?.bankName ? 'EFT' : 'PayFast');

    // Generate next sequential order ID
    const { getNextOrderId } = await import('@/lib/sequence');
    const orderId = await getNextOrderId();

    // Prepare order document
    const orderData = {
      id: orderId,
      userId: finalUserId,
      customerName: `${firstName} ${lastName}`,
      customerEmail: cleanEmail,
      customerPhone: phone,
      items,
      total,
      discountCode: null,
      discountAmount: null,
      paymentMethod: finalPaymentMethod,
      status: 'Pending Payment',
      date: new Date(), // Automatically stored as Timestamp in Firestore by Admin SDK
      source: partnerId ? 'Partner Landing Page' : 'Client',
      originalOrderId: null,
      ...(partnerId ? { resellerId: partnerId } : {}),
    };

    // Save order document
    await adminDb.collection('orders').doc(orderId).set(orderData);

    // Send confirmation email
    try {
      const serializableOrder = JSON.parse(JSON.stringify(orderData));
      const serializableReseller = resellerData ? JSON.parse(JSON.stringify(resellerData)) : undefined;

      await sendOrderConfirmationEmailAction({
        orderData: serializableOrder,
        resellerData: serializableReseller,
        isNewUser,
        generatedPassword: generatedPassword || undefined,
        showPaymentButton: !resellerData?.bankingDetails?.bankName,
      });
    } catch (emailError) {
      console.error("Non-blocking order email send error in action:", emailError);
    }

    return {
      success: true,
      orderId,
      userId: finalUserId,
      isNewUser,
      generatedPassword,
    };
  } catch (error: any) {
    console.error("Error in createCheckoutOrderAction:", error);
    return {
      success: false,
      error: error.code || 'error',
      message: error.message || 'There was a problem saving your order.',
    };
  }
}

export async function sendInvoiceEmailAction({
    invoice,
    client,
    customer,
    recipientEmail
}: {
    invoice: Invoice;
    client: User;
    customer: ClientCustomer;
    recipientEmail: string;
}) {
    try {
        const element = React.createElement(InvoicePdfDocument, { invoice, client, customer });
        const buffer = await renderToBuffer(element as any);
        
        const formatPrice = (price: number) => new Intl.NumberFormat('en-GB', { style: 'decimal', minimumFractionDigits: 2 }).format(price);
        const emailHtml = `
            <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
                <p>Dear ${customer.name},</p>
                <p>Please find attached your invoice <strong>${invoice.id}</strong> from ${client.companyName || client.name}.</p>
                <p>The total amount due is <strong>R${formatPrice(invoice.total)}</strong>, due on <strong>${new Date(invoice.dueDate).toLocaleDateString('en-GB')}</strong>.</p>
                <p>Thank you for your business!</p>
                <br/>
                <p>Best regards,<br/>${client.companyName || client.name}</p>
            </div>
        `;

        await sendEmail({
            to: recipientEmail,
            subject: `Invoice ${invoice.id} from ${client.companyName || client.name}`,
            html: emailHtml,
            attachments: [
                {
                    filename: `Invoice-${invoice.id}.pdf`,
                    content: buffer,
                }
            ],
        });
        
        return { success: true };
    } catch (error: any) {
        console.error('Failed to send invoice email:', error);
        return { success: false, error: error.message };
    }
}


