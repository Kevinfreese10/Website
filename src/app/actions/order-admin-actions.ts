'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { AuditEntry } from '@/lib/types';
import { sendOrderStatusUpdateEmailAction } from './order-actions';

/**
 * Updates order status atomically across both primary and original/linked partner orders.
 * Logs an AuditEntry to both documents.
 */
export async function updateOrderStatusAtomic(
  orderId: string,
  newStatus: 'Pending Payment' | 'Processing' | 'Completed' | 'Cancelled',
  performer: { id: string; name: string },
  details?: string
) {
  try {
    const db = getAdminDb();
    const batch = db.batch();

    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) {
      throw new Error(`Order ${orderId} not found`);
    }

    const orderData = orderDoc.data() || {};
    const previousStatus = orderData.status;

    const auditEntry: AuditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      action: 'STATUS_CHANGE',
      performedBy: performer.id,
      performedByName: performer.name,
      timestamp: new Date().toISOString(),
      previousValue: previousStatus,
      newValue: newStatus,
      details: details || `Status changed from ${previousStatus} to ${newStatus}`,
    };

    const auditLog = [...(orderData.auditLog || []), auditEntry];

    batch.update(orderRef, {
      status: newStatus,
      auditLog,
      updatedAt: new Date().toISOString(),
    });

    // If this order is linked to an original partner order, update that atomically as well
    if (orderData.originalOrderId && orderData.originalOrderId !== orderId) {
      const originalRef = db.collection('orders').doc(orderData.originalOrderId);
      const originalDoc = await originalRef.get();
      if (originalDoc.exists) {
        const originalData = originalDoc.data() || {};
        const originalAuditLog = [...(originalData.auditLog || []), auditEntry];
        batch.update(originalRef, {
          status: newStatus,
          auditLog: originalAuditLog,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    await batch.commit();

    // Trigger order status update email (includes review request when Completed)
    try {
      await sendOrderStatusUpdateEmailAction(orderId, newStatus);
    } catch (emailErr) {
      console.error('[updateOrderStatusAtomic] Email notification failed:', emailErr);
    }

    return { success: true, message: `Status updated to ${newStatus}` };
  } catch (error: any) {
    console.error('Error updating order status atomically:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Reassigns staff members to an order atomically, updates original partner order if present, and logs audit trail.
 */
export async function reassignOrderStaffAtomic(
  orderId: string,
  staffIds: string[],
  department: 'Accounting and Tax' | 'Administration' | 'CAP' | null,
  performer: { id: string; name: string }
) {
  try {
    const db = getAdminDb();
    const batch = db.batch();

    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) {
      throw new Error(`Order ${orderId} not found`);
    }

    const orderData = orderDoc.data() || {};
    const previousAssigned = orderData.assignedTo?.join(', ') || 'Unassigned';
    const newAssigned = staffIds.join(', ') || 'Unassigned';

    const auditEntry: AuditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      action: 'REASSIGN_STAFF',
      performedBy: performer.id,
      performedByName: performer.name,
      timestamp: new Date().toISOString(),
      previousValue: previousAssigned,
      newValue: newAssigned,
      details: `Reassigned staff to: ${newAssigned}`,
    };

    const auditLog = [...(orderData.auditLog || []), auditEntry];

    batch.update(orderRef, {
      assignedTo: staffIds,
      department: department || null,
      auditLog,
      updatedAt: new Date().toISOString(),
    });

    if (orderData.originalOrderId && orderData.originalOrderId !== orderId) {
      const originalRef = db.collection('orders').doc(orderData.originalOrderId);
      const originalDoc = await originalRef.get();
      if (originalDoc.exists) {
        const originalData = originalDoc.data() || {};
        const originalAuditLog = [...(originalData.auditLog || []), auditEntry];
        batch.update(originalRef, {
          assignedTo: staffIds,
          department: department || null,
          auditLog: originalAuditLog,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    await batch.commit();
    return { success: true, message: `Staff reassigned successfully` };
  } catch (error: any) {
    console.error('Error reassigning order staff atomically:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Persisted round-robin staff assignment via Firestore counter doc (`meta/staffAssignment`)
 */
export async function getNextStaffMemberPersisted(
  dept: string,
  staffMembers: { id: string; name: string; department?: string }[]
): Promise<{ id: string; name: string } | null> {
  if (!staffMembers || staffMembers.length === 0) return null;

  try {
    const db = getAdminDb();
    const metaRef = db.collection('meta').doc('staffAssignment');

    const result = await db.runTransaction(async (transaction) => {
      const metaDoc = await transaction.get(metaRef);
      let counters: Record<string, number> = {};

      if (metaDoc.exists) {
        counters = metaDoc.data()?.counters || {};
      }

      const currentIndex = counters[dept] ?? 0;
      const nextIndex = (currentIndex + 1) % staffMembers.length;
      const selectedStaff = staffMembers[currentIndex % staffMembers.length];

      counters[dept] = nextIndex;

      transaction.set(metaRef, { counters }, { merge: true });

      return selectedStaff;
    });

    return result;
  } catch (error) {
    console.error('Error in persisted round-robin assignment:', error);
    return staffMembers[0] || null;
  }
}

/**
 * Links a prerequisite order dependency atomically.
 * (orderId depends on prerequisiteOrderId being finished first)
 */
export async function linkOrderDependencyAtomic(
  orderId: string,
  prerequisiteOrderId: string,
  performer: { id: string; name: string }
) {
  try {
    if (orderId === prerequisiteOrderId) {
      return { success: false, error: 'An order cannot depend on itself.' };
    }

    const db = getAdminDb();
    const batch = db.batch();

    const orderRef = db.collection('orders').doc(orderId);
    const prereqRef = db.collection('orders').doc(prerequisiteOrderId);

    const [orderDoc, prereqDoc] = await Promise.all([
      orderRef.get(),
      prereqRef.get(),
    ]);

    if (!orderDoc.exists) {
      return { success: false, error: `Order #${orderId} not found.` };
    }
    if (!prereqDoc.exists) {
      return { success: false, error: `Prerequisite Order #${prerequisiteOrderId} not found.` };
    }

    const orderData = orderDoc.data() || {};
    const prereqData = prereqDoc.data() || {};

    const existingDependsOn: string[] = orderData.dependsOnOrderIds || [];
    if (existingDependsOn.includes(prerequisiteOrderId)) {
      return { success: false, error: `Order #${orderId} is already linked to prerequisite #${prerequisiteOrderId}.` };
    }

    // Circular dependency check: does prereqData already depend on orderId?
    const prereqDependsOn: string[] = prereqData.dependsOnOrderIds || [];
    if (prereqDependsOn.includes(orderId)) {
      return {
        success: false,
        error: `Circular dependency detected: Order #${prerequisiteOrderId} already depends on Order #${orderId}.`,
      };
    }

    const updatedDependsOn = [...existingDependsOn, prerequisiteOrderId];
    const existingBlocked: string[] = prereqData.blockedOrderIds || [];
    const updatedBlocked = Array.from(new Set([...existingBlocked, orderId]));

    const auditEntryOrder: AuditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      action: 'LINK_DEPENDENCY',
      performedBy: performer.id,
      performedByName: performer.name,
      timestamp: new Date().toISOString(),
      details: `Linked prerequisite Order #${prerequisiteOrderId} (Must finish before this order)`,
    };

    const auditEntryPrereq: AuditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      action: 'LINK_DEPENDENCY',
      performedBy: performer.id,
      performedByName: performer.name,
      timestamp: new Date().toISOString(),
      details: `Linked dependent Order #${orderId} (Waiting on this order to finish)`,
    };

    batch.update(orderRef, {
      dependsOnOrderIds: updatedDependsOn,
      auditLog: [...(orderData.auditLog || []), auditEntryOrder],
      updatedAt: new Date().toISOString(),
    });

    batch.update(prereqRef, {
      blockedOrderIds: updatedBlocked,
      auditLog: [...(prereqData.auditLog || []), auditEntryPrereq],
      updatedAt: new Date().toISOString(),
    });

    await batch.commit();

    return { success: true, message: `Successfully linked Order #${prerequisiteOrderId} as prerequisite for Order #${orderId}.` };
  } catch (error: any) {
    console.error('Error linking order dependency atomically:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Removes a prerequisite order dependency link atomically.
 */
export async function unlinkOrderDependencyAtomic(
  orderId: string,
  prerequisiteOrderId: string,
  performer: { id: string; name: string }
) {
  try {
    const db = getAdminDb();
    const batch = db.batch();

    const orderRef = db.collection('orders').doc(orderId);
    const prereqRef = db.collection('orders').doc(prerequisiteOrderId);

    const [orderDoc, prereqDoc] = await Promise.all([
      orderRef.get(),
      prereqRef.get(),
    ]);

    if (!orderDoc.exists) {
      return { success: false, error: `Order #${orderId} not found.` };
    }

    const orderData = orderDoc.data() || {};
    const existingDependsOn: string[] = orderData.dependsOnOrderIds || [];
    const updatedDependsOn = existingDependsOn.filter((id) => id !== prerequisiteOrderId);

    const auditEntryOrder: AuditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      action: 'UNLINK_DEPENDENCY',
      performedBy: performer.id,
      performedByName: performer.name,
      timestamp: new Date().toISOString(),
      details: `Removed prerequisite link to Order #${prerequisiteOrderId}`,
    };

    batch.update(orderRef, {
      dependsOnOrderIds: updatedDependsOn,
      auditLog: [...(orderData.auditLog || []), auditEntryOrder],
      updatedAt: new Date().toISOString(),
    });

    if (prereqDoc.exists) {
      const prereqData = prereqDoc.data() || {};
      const existingBlocked: string[] = prereqData.blockedOrderIds || [];
      const updatedBlocked = existingBlocked.filter((id) => id !== orderId);

      const auditEntryPrereq: AuditEntry = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        action: 'UNLINK_DEPENDENCY',
        performedBy: performer.id,
        performedByName: performer.name,
        timestamp: new Date().toISOString(),
        details: `Removed dependent link from Order #${orderId}`,
      };

      batch.update(prereqRef, {
        blockedOrderIds: updatedBlocked,
        auditLog: [...(prereqData.auditLog || []), auditEntryPrereq],
        updatedAt: new Date().toISOString(),
      });
    }

    await batch.commit();

    return { success: true, message: `Successfully unlinked prerequisite Order #${prerequisiteOrderId}.` };
  } catch (error: any) {
    console.error('Error unlinking order dependency atomically:', error);
    return { success: false, error: error.message };
  }
}
