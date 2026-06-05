'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { Order, Service, User, OrderNote, Task, DocumentUpload, DemoLead, ImportedTransaction, SmartAllocationResult, AllocationRule, ClientCustomer, Employee, Payslip } from '@/lib/types';
import { sendEmail } from '@/lib/email';
import { render } from '@react-email/components';
import React from 'react';
import { ClientDocumentUploadEmail } from '@/components/emails/ClientDocumentUploadEmail';
import { DocumentReviewEmail } from '@/components/emails/DocumentReviewEmail';
import { NewNoteNotificationEmail } from '@/components/emails/NewNoteNotificationEmail';
import { OutstandingDocumentsEmail } from '@/components/emails/OutstandingDocumentsEmail';
import { OrderConfirmationEmail } from '@/components/emails/OrderConfirmationEmail';
import { format, addDays, addMonths, addYears } from 'date-fns';
import { BankCleaner } from '@/lib/bank-cleaner';

/**
 * Checks if a territory slug is available for a new franchisee.
 */
export async function checkTerritoryAvailability(slug: string) {
    try {
        const adminDb = getAdminDb();
        const snap = await adminDb.collection('users')
            .where('franchise.areaSlug', '==', slug.toLowerCase().trim())
            .get();
        return { available: snap.empty };
    } catch (e) {
        console.error("Territory check failed:", e);
        return { available: false, error: "System error" };
    }
}

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
    let resellerName = 'My Accountant';
    const adminDb = getAdminDb();
    if (resellerId && isToClient) {
        const resellerSnap = await adminDb.collection('users').doc(resellerId).get();
        if (resellerSnap.exists) {
            const resellerData = resellerSnap.data() as User;
            resellerName = resellerData.companyName || resellerData.name;
        }
    }

    const emailHtml = render(
        React.createElement(NewNoteNotificationEmail, {
            recipientName,
            senderName,
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

    const batch = adminDb.batch();
    snap.docs.forEach(d => batch.update(d.ref, { status: 'ai_processing' }));
    await batch.commit();

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

    const batch = adminDb.batch();
    for (const d of snap.docs) {
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
            batch.update(d.ref, {
                ...result,
                status: 'ai_review',
                allocationSource: 'none'
            });
        }
    }

    await batch.commit();
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
    const batch = adminDb.batch();
    transactionIds.forEach(id => {
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
    return { count: transactionIds.length };
}

export async function researchMerchantWithAi({ clientId, description, chartOfAccounts, isVatRegistered, isExpense }: any) {
    const { suggestTransactionAllocation } = await import('@/ai/flows/suggest-transaction-allocation');
    const res = await suggestTransactionAllocation({
        description,
        chartOfAccounts,
        isVatRegistered
    });
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

    const batch = adminDb.batch();
    snap.docs.forEach(d => batch.update(d.ref, { status: 'new', smartAllocationResult: FieldValue.delete() }));
    await batch.commit();

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
        m.fromTxIds.forEach((id: string) => {
            const ref = adminDb.collection('aiAccountantClients').doc(clientId).collection('transactions').doc(id);
            batch.update(ref, { merchantKey: m.toKey });
        });
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
    return res.proposals.map(p => ({
        ...p,
        fromTxIds: merchantMap[p.fromKey],
        fromImpact: merchantMap[p.fromKey]?.length || 0,
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
            const { PayrollService } = await import('@/services/PayrollService');
            const baseValue = data.payType === 'Hourly' ? data.hourlyRate : data.basicSalary;
            await PayrollService.generateInitialPayslip(clientId, targetRef.id, baseValue);
        }

        return { success: true, id: targetRef.id };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function generateEmployeePayslipAction({ clientId, employeeId, basicSalary, hours }: any) {
    try {
        const { PayrollService } = await import('@/services/PayrollService');
        return await PayrollService.generateInitialPayslip(clientId, employeeId, basicSalary, hours);
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
    const deductions = PayrollService.getInitialDeductions(gross, ps.period, freq, employee.joinDate);
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
    const deductions = PayrollService.getInitialDeductions(gross, ps.period, freq, employee.joinDate);
    
    await snap.docs[0].ref.update({
        earnings,
        deductions,
        grossPay: gross,
        netPay: gross - deductions.reduce((s, i) => s + i.amount, 0)
    });

    return { success: true };
}

export async function updatePayslipAction({ clientId, payslipId, data }: { clientId: string, payslipId: string, data: any }) {
    try {
        const adminDb = getAdminDb();
        const psRef = adminDb.collection('aiPayrollClients').doc(clientId).collection('payslips').doc(payslipId);
        await psRef.update({ ...data, status: 'finalized', updatedAt: FieldValue.serverTimestamp() });
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
    const nextPeriod = format(addMonths(parse(currentPeriod, 'MMMM yyyy', new Date()), 1), 'MMMM yyyy');

    const empsSnap = await adminDb.collection('aiPayrollClients').doc(clientId).collection('employees')
        .where('status', '==', 'Active')
        .get();
    
    const batch = adminDb.batch();
    let created = 0;

    for (const d of empsSnap.docs) {
        const emp = d.data() as Employee;
        const newPsRef = adminDb.collection('aiPayrollClients').doc(clientId).collection('payslips').doc();
        batch.set(newPsRef, {
            employeeId: d.id,
            employeeName: `${emp.name} ${emp.surname}`,
            period: nextPeriod,
            status: 'draft',
            createdAt: FieldValue.serverTimestamp(),
            earnings: [],
            deductions: [],
            contributions: [],
            fringeBenefits: [],
            grossPay: 0,
            totalDeductions: 0,
            netPay: 0,
            frequency: 'Monthly'
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
    const prevPeriod = format(addMonths(parse(currentPeriod, 'MMMM yyyy', new Date()), -1), 'MMMM yyyy');

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
}: {
  orderData: Order;
  resellerData?: User;
  isNewUser?: boolean;
  generatedPassword?: string | null;
  showPaymentButton?: boolean;
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

  await sendEmail({
    to: orderData.customerEmail,
    subject: `Order Confirmation #${orderData.id}`,
    html: emailHtml,
    resellerId: orderData.resellerId || undefined,
  });
}
