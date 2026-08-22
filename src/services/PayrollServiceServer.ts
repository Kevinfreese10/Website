import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { User, Employee } from '@/lib/types';
import { format } from 'date-fns';
import { PayrollService } from './PayrollService';

export class PayrollServiceServer {
  /**
   * Generates and saves a payslip for an employee.
   */
  static async generateInitialPayslip(clientId: string, employeeId: string, baseValue: number, hours?: any) {
    try {
      const adminDb = getAdminDb();

      const clientRef = adminDb.collection('aiPayrollClients').doc(clientId);
      const clientSnap = await clientRef.get();
      if (!clientSnap.exists) throw new Error("Client not found");
      const clientData = clientSnap.data() as User;
      
      const frequency = clientData.payrollFrequency === 'Fortnightly' ? 26 : 12;
      
      let periodLabel = clientData.firstProcessingMonth;
      if (!periodLabel) {
        if (frequency === 26) {
          const startDate = clientData.firstRunStartDate ? (clientData.firstRunStartDate.toDate ? clientData.firstRunStartDate.toDate() : new Date(clientData.firstRunStartDate)) : new Date();
          periodLabel = format(startDate, 'dd/MM/yyyy');
        } else {
          periodLabel = format(new Date(), 'MMMM yyyy');
        }
      }

      const payslipsRef = adminDb.collection('aiPayrollClients').doc(clientId).collection('payslips');
      const existingSnap = await payslipsRef
          .where('employeeId', '==', employeeId)
          .where('period', '==', periodLabel)
          .limit(1)
          .get();

      if (!existingSnap.empty) {
          return { success: true, id: existingSnap.docs[0].id };
      }

      const employeeRef = adminDb.collection('aiPayrollClients').doc(clientId).collection('employees').doc(employeeId);
      const employeeSnap = await employeeRef.get();
      if (!employeeSnap.exists) throw new Error("Employee not found");
      const employee = employeeSnap.data() as Employee;

      const earnings = PayrollService.calculateEarningsList(employee, baseValue, periodLabel, frequency, hours);
      const gross = earnings.reduce((sum, i) => sum + i.amount, 0);

      const deductions = PayrollService.getInitialDeductions(
          gross, 
          periodLabel, 
          frequency, 
          employee.joinDate, 
          employee.idNumber, 
          employee.medicalAidMembers || 0, 
          employee.medicalAidDependents || 0,
          { earnings, fringeBenefits: [] }
      );
      const contributions = PayrollService.getInitialContributions(gross, periodLabel, frequency, !!clientData.excludeSdl);

      const totalDeductions = deductions.reduce((sum, item) => sum + item.amount, 0);

      const payslipData: any = {
        employeeId,
        employeeName: `${employee.name} ${employee.surname}`,
        period: periodLabel,
        date: Timestamp.now(),
        earnings,
        deductions,
        contributions,
        fringeBenefits: [],
        grossPay: gross,
        totalDeductions,
        netPay: parseFloat((gross - totalDeductions).toFixed(2)),
        frequency: clientData.payrollFrequency || 'Monthly',
        status: 'draft',
        createdAt: FieldValue.serverTimestamp()
      };

      if (hours?.normal !== undefined) {
          payslipData.hoursWorked = hours.normal;
      }

      const docRef = await payslipsRef.add(payslipData);

      return { success: true, id: docRef.id };
    } catch (error) {
      console.error("Payslip generation failed:", error);
      throw error;
    }
  }
}
