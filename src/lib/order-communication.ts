import { Order, OrderNote, User } from '@/lib/types';

export interface AwaitingResponseOrder {
  order: Order;
  lastClientNote: OrderNote;
  waitingSince: Date;
  clientName: string;
  assignedStaffName: string;
  assignedStaffEmail?: string;
  isOverdue: boolean; // Over 24 hours waiting
  serviceSummary: string;
}

export function parseNoteDate(dateVal: any): Date {
  if (!dateVal) return new Date();
  if (typeof dateVal === 'object' && 'toDate' in dateVal && typeof dateVal.toDate === 'function') {
    return dateVal.toDate();
  }
  if (typeof dateVal === 'object' && '_seconds' in dateVal) {
    return new Date(dateVal._seconds * 1000);
  }
  if (dateVal instanceof Date) {
    return dateVal;
  }
  const parsed = new Date(dateVal);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

/**
 * Determines if an order has a client message in Communication History
 * that has not been replied to by a staff member.
 */
export function getAwaitingResponseDetails(
  order: Order,
  allStaff: User[]
): AwaitingResponseOrder | null {
  if (!order || !Array.isArray(order.notes) || order.notes.length === 0) {
    return null;
  }

  // Only check active / actionable orders
  const inactiveStatuses = ['Completed', 'Cancelled', 'Draft'];
  if (order.status && inactiveStatuses.includes(order.status)) {
    return null;
  }

  const staffIdSet = new Set<string>();
  allStaff.forEach(s => {
    if (s.id) staffIdSet.add(s.id);
    if (s.uid) staffIdSet.add(s.uid);
  });

  // Sort notes chronologically
  const sortedNotes = [...order.notes].sort((a, b) => {
    const timeA = parseNoteDate(a.date).getTime();
    const timeB = parseNoteDate(b.date).getTime();
    return timeA - timeB;
  });

  // Filter for human notes (ignore internal notes and system automated notes)
  const humanNotes = sortedNotes.filter(n => {
    if (n.isInternal) return false;
    if (n.authorId === 'system' || !n.authorId) return false;
    return true;
  });

  if (humanNotes.length === 0) {
    return null;
  }

  const lastHumanNote = humanNotes[humanNotes.length - 1];

  // Check if the author of the last human note is a staff member
  const isAuthorStaff = staffIdSet.has(lastHumanNote.authorId);

  // If the last human note was sent by staff/admin, we have already responded
  if (isAuthorStaff) {
    return null;
  }

  // The last human note was from the client!
  const waitingSince = parseNoteDate(lastHumanNote.date);
  const now = new Date();
  const diffHours = (now.getTime() - waitingSince.getTime()) / (1000 * 60 * 60);
  const isOverdue = diffHours >= 24;

  const clientName = order.endCustomerName || order.customerName || 'Client';

  // Find assigned staff name
  let assignedStaffName = 'Unassigned';
  let assignedStaffEmail: string | undefined = undefined;

  if (Array.isArray(order.assignedTo) && order.assignedTo.length > 0) {
    const assignedId = order.assignedTo[0];
    const staffMatch = allStaff.find(s => s.id === assignedId || s.uid === assignedId);
    if (staffMatch) {
      assignedStaffName = staffMatch.name || staffMatch.email || 'Staff';
      assignedStaffEmail = staffMatch.email;
    }
  }

  const serviceSummary = (order.serviceSnapshots && order.serviceSnapshots.length > 0)
    ? order.serviceSnapshots.map(s => s.title).join(', ')
    : (order.items && order.items.length > 0)
      ? order.items.map(i => i.title).join(', ')
      : 'Service Order';

  return {
    order,
    lastClientNote: lastHumanNote,
    waitingSince,
    clientName,
    assignedStaffName,
    assignedStaffEmail,
    isOverdue,
    serviceSummary
  };
}

/**
 * Filters a list of orders to find all orders awaiting response,
 * sorted by oldest waiting time first (longest waiting at the top).
 */
export function getOrdersAwaitingClientResponse(
  orders: Order[],
  allStaff: User[]
): AwaitingResponseOrder[] {
  const awaiting: AwaitingResponseOrder[] = [];

  for (const order of orders) {
    const details = getAwaitingResponseDetails(order, allStaff);
    if (details) {
      awaiting.push(details);
    }
  }

  // Sort by oldest waiting time first (ascending timestamp)
  return awaiting.sort((a, b) => a.waitingSince.getTime() - b.waitingSince.getTime());
}
