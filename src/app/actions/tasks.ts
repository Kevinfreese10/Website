'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { Task } from '@/lib/types';
import { addDays, addMonths, addYears, format } from 'date-fns';

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
