'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { generatePayslipPdfPage } from '@/lib/payslipPdf';
import { Payslip, Employee, User, PayslipPdfOptions } from '@/lib/types';
import { getVerifiedAuthContext, verifyAiPayrollClientAccess } from '@/lib/server-auth';

export async function emailBatchPayslips(clientId: string, selectedMonth: string, payslipIds: string[], options?: PayslipPdfOptions, idToken?: string) {
    if (!clientId || !payslipIds || payslipIds.length === 0) {
        return { success: false, error: 'Invalid parameters provided.' };
    }

    try {
        // Reads the full employee roster and mails payslip PDFs. Unauthenticated, anyone who could
        // guess a clientId could trigger mass distribution of another employer's payroll data.
        const authCtx = await getVerifiedAuthContext(idToken);
        if (!authCtx) {
            return { success: false, error: 'Unauthorized: A valid authentication token is required.' };
        }
        if (!(await verifyAiPayrollClientAccess(authCtx, clientId))) {
            return { success: false, error: 'Forbidden: You do not have access to this payroll client.' };
        }

        const adminDb = getAdminDb();
        
        // Fetch Client
        const clientSnap = await adminDb.collection('aiPayrollClients').doc(clientId).get();
        if (!clientSnap.exists) {
            return { success: false, error: 'Client not found.' };
        }
        const clientData = clientSnap.data() as User;
        const client = { ...clientData, id: clientSnap.id } as User;

        // Fetch Employees
        const employeesSnap = await adminDb.collection('aiPayrollClients').doc(clientId).collection('employees').get();
        const employees = employeesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));

        let sentCount = 0;
        let skippedCount = 0;
        let skippedDetails: string[] = [];
        let errorCount = 0;
        let errorDetails: string[] = [];

        for (const payslipId of payslipIds) {
            const psSnap = await adminDb.collection('aiPayrollClients').doc(clientId).collection('payslips').doc(payslipId).get();
            if (!psSnap.exists) continue;
            
            const ps = { id: psSnap.id, ...psSnap.data() } as Payslip;
            const emp = employees.find(e => e.id === ps.employeeId);

            if (!emp) {
                skippedCount++;
                skippedDetails.push(`Employee not found for payslip ${ps.id}`);
                continue;
            }

            if (!emp.email || emp.email.trim() === '') {
                skippedCount++;
                skippedDetails.push(`${emp.name} ${emp.surname}: No email address on file.`);
                continue;
            }

            // Determine Password (ID Number fallback to DOB format YYYYMMDD)
            let pdfPassword = emp.idNumber?.trim();
            
            if (!pdfPassword || pdfPassword === '') {
                if (emp.dateOfBirth) {
                    let dobDate: Date;
                    if ((emp.dateOfBirth as any).toDate) {
                        dobDate = (emp.dateOfBirth as any).toDate();
                    } else {
                        dobDate = new Date(emp.dateOfBirth);
                    }
                    if (!isNaN(dobDate.getTime())) {
                        pdfPassword = format(dobDate, 'yyyyMMdd');
                    }
                }
            }

            if (!pdfPassword) {
                skippedCount++;
                skippedDetails.push(`${emp.name} ${emp.surname}: Missing ID Number and valid Date of Birth for password.`);
                continue;
            }

            try {
                // 1. Generate PDF with native encryption
                const doc = new jsPDF({
                    encryption: {
                        userPassword: pdfPassword,
                        ownerPassword: pdfPassword,
                        userPermissions: ['print']
                    }
                } as any);
                
                generatePayslipPdfPage(doc, ps, emp, client, undefined, undefined, options);
                const pdfArrayBuffer = doc.output('arraybuffer');
                const pdfBuffer = Buffer.from(pdfArrayBuffer);

                // 3. Send Email
                const monthDisplay = selectedMonth || ps.period || 'Current';
                const subject = `Your Payslip - ${monthDisplay} - ${client.companyName || client.name}`;
                const html = `
                    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2563eb;">Your Payslip is Ready</h2>
                        <p>Dear ${emp.name},</p>
                        <p>Please find attached your payslip for <strong>${monthDisplay}</strong> from ${client.companyName || client.name}.</p>
                        <p style="padding: 15px; background-color: #f8fafc; border-left: 4px solid #2563eb; border-radius: 4px;">
                            <strong>🔒 Security Notice:</strong><br/>
                            This document is password protected for your privacy. <br/>
                            <strong>Password:</strong> Your ID Number (or Date of Birth in YYYYMMDD format if no ID number is on file).
                        </p>
                        <p>If you have any queries regarding your payslip, please contact your employer or HR department.</p>
                        <p>Best regards,<br/>The ${client.companyName || client.name} Payroll Team</p>
                    </div>
                `;

                await sendEmail({
                    to: emp.email,
                    subject: subject,
                    html: html,
                    attachments: [
                        {
                            filename: `Payslip-${emp.surname}-${monthDisplay.replace(/\s/g, '-')}.pdf`,
                            content: pdfBuffer,
                            contentType: 'application/pdf'
                        }
                    ]
                });

                sentCount++;
            } catch (err: any) {
                console.error(`Error processing payslip for ${emp.name} ${emp.surname}:`, err);
                errorCount++;
                errorDetails.push(`${emp.name} ${emp.surname}: ${err.message || 'Unknown error'}`);
            }
        }

        return {
            success: true,
            sentCount,
            skippedCount,
            skippedDetails,
            errorCount,
            errorDetails
        };

    } catch (error: any) {
        console.error('Error in emailBatchPayslips:', error);
        return { success: false, error: error.message || 'An unexpected error occurred.' };
    }
}
