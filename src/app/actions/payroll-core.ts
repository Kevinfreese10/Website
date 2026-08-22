'use server';

import { getAdminDb, cleanFirestoreData } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { User, Employee, Payslip } from '@/lib/types';
import { format, addDays, addMonths, addYears, parse as parseDate } from 'date-fns';
import { getVerifiedAuthContext, verifyAiPayrollClientAccess } from '@/lib/server-auth';

/**
 * Every export in this file mutates a specific payroll client's employees or payslips using the
 * Admin SDK, which bypasses Firestore rules. They are `'use server'` exports — directly-callable
 * HTTP endpoints — and previously performed NO caller verification at all, taking `clientId` as a
 * plain string. Anyone who could read a clientId out of a URL could rewrite salaries, create ghost
 * employees, finalise a payroll run, or delete a whole period's payslips.
 *
 * Every action now requires a verified ID token whose holder is authorised for that client.
 */
async function requirePayrollAccess(idToken: string | undefined, clientId: string) {
  if (!clientId) return { success: false, error: 'A client is required.' };
  const authCtx = await getVerifiedAuthContext(idToken);
  if (!authCtx) return { success: false, error: 'Unauthorized: A valid authentication token is required.' };
  const allowed = await verifyAiPayrollClientAccess(authCtx, clientId);
  if (!allowed) return { success: false, error: 'Forbidden: You do not have access to this payroll client.' };
  return null;
}

export async function saveEmployeeAction({ idToken, clientId, employeeId, data }: { idToken?: string, clientId: string, employeeId?: string, data: any }) {
  const authError = await requirePayrollAccess(idToken, clientId);
  if (authError) return authError;

    try {
        const adminDb = getAdminDb();
        const employeesCol = adminDb.collection('aiPayrollClients').doc(clientId).collection('employees');

        if (!employeeId) {
            const existingSnap = await employeesCol.where('employeeCode', '==', data.employeeCode).limit(1).get();
            if (!existingSnap.empty) {
                return { success: false, error: `Employee code "${data.employeeCode}" is already in use. Each employee must have a unique code.` };
            }
        } else {
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

export async function generateEmployeePayslipAction({ idToken, clientId, employeeId, basicSalary, hours }: any) {
  const authError = await requirePayrollAccess(idToken, clientId);
  if (authError) return authError;

    try {
        const { PayrollServiceServer } = await import('@/services/PayrollServiceServer');
        return await PayrollServiceServer.generateInitialPayslip(clientId, employeeId, basicSalary, hours);
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function updateDraftPayslipHoursAction({ idToken, clientId, employeeId, hours }: any) {
  const authError = await requirePayrollAccess(idToken, clientId);
  if (authError) return authError;

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
        employee.medicalAidDependents || 0,
        { earnings, fringeBenefits: ps.fringeBenefits || [] }
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

export async function syncEmployeeSalaryToActivePayslipAction({ idToken, clientId, employeeId, newSalary, isNetSalary }: any) {
  const authError = await requirePayrollAccess(idToken, clientId);
  if (authError) return authError;

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
        employee.medicalAidDependents || 0,
        { earnings, fringeBenefits: ps.fringeBenefits || [] }
    );
    
    await snap.docs[0].ref.update({
        earnings,
        deductions,
        grossPay: gross,
        netPay: gross - deductions.reduce((s, i) => s + i.amount, 0)
    });

    return { success: true };
}

export async function bulkSyncDraftPayslipsAction({ idToken, clientId }: any) {
  const authError = await requirePayrollAccess(idToken, clientId);
  if (authError) return authError;

    try {
        const adminDb = getAdminDb();
        const clientRef = adminDb.collection('aiPayrollClients').doc(clientId);
        const payslipsSnap = await clientRef.collection('payslips').where('status', '==', 'draft').get();
        if (payslipsSnap.empty) return { success: true, count: 0 };

        const { PayrollService } = await import('@/services/PayrollService');
        const clientSnap = await clientRef.get();
        const clientData = clientSnap.data() as User;

        let count = 0;

        for (const psDoc of payslipsSnap.docs) {
            const ps = psDoc.data() as Payslip;
            const empSnap = await clientRef.collection('employees').doc(ps.employeeId).get();
            if (!empSnap.exists) continue;
            
            const employee = empSnap.data() as Employee;
            const freq = PayrollService.getFrequencyMultiplier(ps.frequency);
            const baseValue = employee.payType === 'Hourly' ? employee.hourlyRate : employee.basicSalary;

            const earnings = PayrollService.calculateEarningsList(employee, baseValue || 0, ps.period, freq);
            const gross = earnings.reduce((s, i) => s + i.amount, 0);
            const deductions = PayrollService.getInitialDeductions(
                gross, 
                ps.period, 
                freq, 
                employee.joinDate,
                employee.idNumber,
                employee.medicalAidMembers || 0,
                employee.medicalAidDependents || 0,
                { earnings, fringeBenefits: ps.fringeBenefits || [] }
            );
            const contributions = PayrollService.getInitialContributions(gross, ps.period, freq, !!clientData.excludeSdl);
            const totalDeductions = deductions.reduce((s, i) => s + i.amount, 0);

            await psDoc.ref.update({
                earnings,
                deductions,
                contributions,
                grossPay: gross,
                totalDeductions,
                netPay: gross - totalDeductions
            });
            count++;
        }
        return { success: true, count };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function bulkFinalizeDraftPayslipsAction({ idToken, clientId }: any) {
  const authError = await requirePayrollAccess(idToken, clientId);
  if (authError) return authError;

    try {
        const adminDb = getAdminDb();
        const payslipsSnap = await adminDb.collection('aiPayrollClients').doc(clientId).collection('payslips').where('status', '==', 'draft').get();
        if (payslipsSnap.empty) return { success: true, count: 0 };

        const { PayrollService } = await import('@/services/PayrollService');
        const clientSnap = await adminDb.collection('aiPayrollClients').doc(clientId).get();
        const clientData = clientSnap.data() as User;

        const batch = adminDb.batch();
        for (const doc of payslipsSnap.docs) {
            const ps = doc.data() as Payslip;
            const empSnap = await adminDb.collection('aiPayrollClients').doc(clientId).collection('employees').doc(ps.employeeId).get();
            if (!empSnap.exists) continue;
            
            const employee = empSnap.data() as Employee;
            const freq = PayrollService.getFrequencyMultiplier(ps.frequency);
            const baseValue = employee.payType === 'Hourly' ? employee.hourlyRate : employee.basicSalary;
            
            const earnings = ps.earnings && ps.earnings.length > 0 ? ps.earnings : PayrollService.calculateEarningsList(employee, baseValue || 0, ps.period, freq);
            const grossPay = earnings.reduce((s: number, i: any) => s + i.amount, 0);
            const deductions = ps.deductions && ps.deductions.length > 0 ? ps.deductions : PayrollService.getInitialDeductions(grossPay, ps.period, freq, employee.joinDate, employee.idNumber, employee.medicalAidMembers || 0, employee.medicalAidDependents || 0);
            const contributions = ps.contributions && ps.contributions.length > 0 ? ps.contributions : PayrollService.getInitialContributions(grossPay, ps.period, freq, !!clientData.excludeSdl);
            const totalDeductions = deductions.reduce((s: number, i: any) => s + i.amount, 0);
            const netPay = grossPay - totalDeductions;

            batch.update(doc.ref, { 
                status: 'finalized',
                date: new Date().toISOString(),
                updatedAt: new Date(),
                earnings,
                deductions,
                contributions,
                grossPay,
                totalDeductions,
                netPay
            });
        }
        await batch.commit();

        return { success: true, count: payslipsSnap.docs.length };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function updatePayslipAction({ idToken, clientId, payslipId, data, employeeId, recurringItems, allowFinalizedEdit }: { idToken?: string, clientId: string, payslipId: string, data: any, employeeId?: string, recurringItems?: any[], allowFinalizedEdit?: boolean }) {
  const authError = await requirePayrollAccess(idToken, clientId);
  if (authError) return authError;

    try {
        const adminDb = getAdminDb();
        const batch = adminDb.batch();
        const isNew = !payslipId || payslipId === 'new';
        const psRef = isNew
          ? adminDb.collection('aiPayrollClients').doc(clientId).collection('payslips').doc()
          : adminDb.collection('aiPayrollClients').doc(clientId).collection('payslips').doc(payslipId);

        // A finalised payslip has been declared on an EMP201 and issued to the employee. The
        // EMP201 report recomputes live from this collection, so silently merge-writing a
        // finalised payslip retroactively changes an already-filed statutory return, with no
        // record of what was originally declared. Block it, and keep an immutable snapshot of the
        // prior version when a correction is explicitly authorised.
        if (!isNew) {
            const existingSnap = await psRef.get();
            const existing = existingSnap.exists ? (existingSnap.data() as any) : null;
            if (existing?.status === 'finalized') {
                if (!allowFinalizedEdit) {
                    return {
                        success: false,
                        error: 'This payslip is finalised and forms part of your statutory records. ' +
                               'Reopen it explicitly to record a correction — the current version will be archived first.',
                        requiresFinalizedOverride: true,
                    };
                }
                // Archive the pre-edit state so the originally-declared figures remain reproducible.
                const revisionRef = psRef.collection('revisions').doc();
                batch.set(revisionRef, {
                    ...existing,
                    archivedAt: new Date(),
                    archivedReason: 'Superseded by a post-finalisation correction.',
                });
            }
        }

        const cleanedData = cleanFirestoreData(data || {});

        batch.set(psRef, { ...cleanedData, status: 'finalized', updatedAt: new Date() }, { merge: true });

        if (employeeId && recurringItems) {
            const empRef = adminDb.collection('aiPayrollClients').doc(clientId).collection('employees').doc(employeeId);
            batch.set(empRef, { recurringItems: cleanFirestoreData(recurringItems) }, { merge: true });
        }

        await batch.commit();
        return { success: true, id: psRef.id };
    } catch (e: any) {
        console.error('updatePayslipAction error:', e);
        return { success: false, error: e.message || 'Failed to update payslip' };
    }
}

export async function rollForwardPayrollAction({ idToken, clientId }: { idToken?: string, clientId: string }) {
  const authError = await requirePayrollAccess(idToken, clientId);
  if (authError) return authError;

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
    
    const { PayrollService } = await import('@/services/PayrollService');
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
        
        const freq = PayrollService.getFrequencyMultiplier(client.payrollFrequency || 'Monthly');
        const baseValue = emp.payType === 'Hourly' ? (emp.hourlyRate || 0) : (emp.basicSalary || 0);
        
        const calcEarnings = PayrollService.calculateEarningsList(emp, baseValue, nextPeriod, freq);
        calcEarnings.forEach(ce => {
            if (!initialEarnings.find(ie => ie.label === ce.label)) {
                initialEarnings.push(ce);
            }
        });
        
        const grossPay = initialEarnings.reduce((s, i) => s + i.amount, 0);
        
        const statutoryDeductions = PayrollService.getInitialDeductions(grossPay, nextPeriod, freq, emp.joinDate, emp.idNumber, emp.medicalAidMembers || 0, emp.medicalAidDependents || 0, { earnings: initialEarnings, fringeBenefits: [] });
        statutoryDeductions.forEach(sd => {
            if (!initialDeductions.find(id => id.label === sd.label)) {
                initialDeductions.push(sd);
            }
        });
        
        const contributions = PayrollService.getInitialContributions(grossPay, nextPeriod, freq, !!client.excludeSdl);
        const totalDeductions = initialDeductions.reduce((s, i) => s + i.amount, 0);
        const netPay = grossPay - totalDeductions;
        
        batch.set(newPsRef, {
            employeeId: d.id,
            employeeName: `${emp.name} ${emp.surname}`,
            period: nextPeriod,
            status: 'draft',
            createdAt: FieldValue.serverTimestamp(),
            date: new Date().toISOString(),
            earnings: initialEarnings,
            deductions: initialDeductions,
            contributions,
            fringeBenefits: [],
            grossPay,
            totalDeductions,
            netPay,
            frequency: client.payrollFrequency || 'Monthly'
        });
        created++;
    }

    batch.update(clientRef, { firstProcessingMonth: nextPeriod });
    await batch.commit();

    return { success: true, nextPeriod, created };
}

export async function rollBackPayrollAction({ idToken, clientId }: { idToken?: string, clientId: string }) {
  const authError = await requirePayrollAccess(idToken, clientId);
  if (authError) return authError;

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

    // This query previously filtered on period ALONE and hard-deleted everything it returned —
    // including payslips already finalised, declared on an EMP201 and emailed to employees, while
    // the UI reported "Deleted N draft records". SARS requires those records be retained for five
    // years and there is no archive to recover them from, so refuse rather than destroy them.
    const finalized = psSnap.docs.filter(d => (d.data() as any)?.status === 'finalized');
    if (finalized.length > 0) {
        return {
            success: false,
            error: `Cannot roll back ${currentPeriod}: ${finalized.length} payslip(s) in this period are already finalised. ` +
                   `Finalised payslips form part of your statutory records and must be corrected with an adjustment, not deleted.`,
        };
    }

    const draftDocs = psSnap.docs.filter(d => (d.data() as any)?.status !== 'finalized');

    const batch = adminDb.batch();
    draftDocs.forEach(d => batch.delete(d.ref));
    batch.update(clientRef, { firstProcessingMonth: prevPeriod });

    await batch.commit();

    return { success: true, prevPeriod, deletedCount: draftDocs.length };
}
