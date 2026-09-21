'use server';

import * as leads from './actions/leads';
import * as authChecks from './actions/auth-checks';
import * as notifications from './actions/notifications';
import * as tasks from './actions/tasks';
import * as aiRecon from './actions/ai-recon';
import * as payrollCore from './actions/payroll-core';
import * as adminUsers from './actions/admin-users';
import * as checkoutCore from './actions/checkout-core';
import * as orderAdminActions from './actions/order-admin-actions';

// --- LEADS ---
export async function saveDemoLead(data: any) {
  return leads.saveDemoLead(data);
}

// --- AUTH CHECKS ---
export async function checkSlugAvailability(slug: string) {
  return authChecks.checkSlugAvailability(slug);
}

export async function checkIfEmailExists(email: string) {
  return authChecks.checkIfEmailExists(email);
}

export async function checkExistingUserByEmail(email: string) {
  return authChecks.checkExistingUserByEmail(email);
}

// --- NOTIFICATIONS ---
export async function notifyStaffOfDocumentUpload(params: any) {
  return notifications.notifyStaffOfDocumentUpload(params);
}

export async function sendDocumentReviewFeedback(params: any) {
  return notifications.sendDocumentReviewFeedback(params);
}

export async function notifyOfNewNote(params: any) {
  return notifications.notifyOfNewNote(params);
}

export async function notifyStaffOfClientNote(params: any) {
  return notifications.notifyStaffOfClientNote(params);
}

export async function notifyAllocatedUserOfInternalNote(params: any) {
  return notifications.notifyAllocatedUserOfInternalNote(params);
}

export async function sendOutstandingDocumentsReminder(params: any) {
  return notifications.sendOutstandingDocumentsReminder(params);
}

export async function sendOrderConfirmationEmailAction(params: any) {
  return notifications.sendOrderConfirmationEmailAction(params);
}

export async function sendDocumentRequestEmailAction(params: any) {
  return notifications.sendDocumentRequestEmailAction(params);
}

export async function sendInvoiceEmailAction(params: any) {
  return notifications.sendInvoiceEmailAction(params);
}

// --- TASKS ---
export async function generateNextTaskOccurrence(taskId: string) {
  return tasks.generateNextTaskOccurrence(taskId);
}

// --- AI RECON ---
export async function extractStatementChunk(params: any) {
  return aiRecon.extractStatementChunk(params);
}

export async function prepareAiAccountantAnalysis(params: any) {
  return aiRecon.prepareAiAccountantAnalysis(params);
}

export async function runAiAccountantAnalysis(params: any) {
  return aiRecon.runAiAccountantAnalysis(params);
}

export async function moveTransactionToNew(params: any) {
  return aiRecon.moveTransactionToNew(params);
}

export async function bulkMoveTransactionsToNew(params: any) {
  return aiRecon.bulkMoveTransactionsToNew(params);
}

export async function researchMerchantWithAi(params: any) {
  return aiRecon.researchMerchantWithAi(params);
}

export async function updateGlobalMerchantDb(data: any) {
  return aiRecon.updateGlobalMerchantDb(data);
}

export async function resetAiAccountantAnalysis(params: any) {
  return aiRecon.resetAiAccountantAnalysis(params);
}

export async function reanalyzeAndRegroupTransactions(params: any) {
  return aiRecon.reanalyzeAndRegroupTransactions(params);
}

export async function proposeRegroups(params: any) {
  return aiRecon.proposeRegroups(params);
}

export async function applyRegroups(params: any) {
  return aiRecon.applyRegroups(params);
}

export async function autoConsolidateSmartMatchQueue(params: any) {
  return aiRecon.autoConsolidateSmartMatchQueue(params);
}

export async function proposeAiRegroups(params: any) {
  return aiRecon.proposeAiRegroups(params);
}

export async function analyzeClientCommentAndSuggest(params: any) {
  return aiRecon.analyzeClientCommentAndSuggest(params);
}

export async function matchTransactionsToSuppliers(params: any) {
  return aiRecon.matchTransactionsToSuppliers(params);
}

export async function finalizeChatAllocation(params: any) {
  return aiRecon.finalizeChatAllocation(params);
}

export async function analyzeSpreadsheetAllocationsAction(params: any) {
  return aiRecon.analyzeSpreadsheetAllocationsAction(params);
}

export async function applySpreadsheetAllocationsAction(params: any) {
  return aiRecon.applySpreadsheetAllocationsAction(params);
}

export async function matchTransactionsToHistory(params: any) {
  return aiRecon.matchTransactionsToHistory(params);
}

// --- PAYROLL CORE ---
export async function saveEmployeeAction(params: any) {
  return payrollCore.saveEmployeeAction(params);
}

export async function generateEmployeePayslipAction(params: any) {
  return payrollCore.generateEmployeePayslipAction(params);
}

export async function updateDraftPayslipHoursAction(params: any) {
  return payrollCore.updateDraftPayslipHoursAction(params);
}

export async function syncEmployeeSalaryToActivePayslipAction(params: any) {
  return payrollCore.syncEmployeeSalaryToActivePayslipAction(params);
}

export async function bulkSyncDraftPayslipsAction(params: any) {
  return payrollCore.bulkSyncDraftPayslipsAction(params);
}

export async function bulkFinalizeDraftPayslipsAction(params: any) {
  return payrollCore.bulkFinalizeDraftPayslipsAction(params);
}

export async function updatePayslipAction(params: any) {
  return payrollCore.updatePayslipAction(params);
}

export async function rollForwardPayrollAction(params: any) {
  return payrollCore.rollForwardPayrollAction(params);
}

export async function rollBackPayrollAction(params: any) {
  return payrollCore.rollBackPayrollAction(params);
}

// --- ADMIN USERS ---
export async function reactivatePracticeSubscription(params: any) {
  return adminUsers.reactivatePracticeSubscription(params);
}

export async function adminCreateUserAction(params: any) {
  return adminUsers.adminCreateUserAction(params);
}

export async function adminDeleteUserAction(params: any) {
  return adminUsers.adminDeleteUserAction(params);
}

export async function adminUpdateUserPasswordAction(params: any) {
  return adminUsers.adminUpdateUserPasswordAction(params);
}

export async function adminToggleUserActiveAction(params: any) {
  return adminUsers.adminToggleUserActiveAction(params);
}


// --- CHECKOUT ---
export async function createCheckoutOrderAction(params: any) {
  return checkoutCore.createCheckoutOrderAction(params);
}

export async function validateDiscountCodeAction(params: any) {
  return checkoutCore.validateDiscountCodeAction(params);
}

// --- AI WEB SEARCH FLOW ---
export async function suggestTransactionAllocationWeb(input: any) {
  const { suggestTransactionAllocationWeb: flow } = await import('@/ai/flows/suggest-transaction-allocation-web');
  return flow(input);
}

// --- ADMIN ORDERS ---
export async function createAdminCustomOrderAction(params: any) {
  return orderAdminActions.createAdminCustomOrderAction(params);
}

export async function lookupClientByEmailAction(email: string, idToken?: string) {
  return orderAdminActions.lookupClientByEmailAction(email, idToken);
}

