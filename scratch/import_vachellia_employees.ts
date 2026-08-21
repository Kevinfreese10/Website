import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import * as XLSX from 'xlsx-js-style';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAdminDb, cleanFirestoreData } from '../src/lib/firebase-admin';
import { generateEmployeePayslipAction } from '../src/app/actions/payroll-core';

async function importEmployees() {
  const filePath = "C:\\Users\\kev\\OneDrive\\Documents\\Employee_import_template (21.08.2026).xlsx";
  const clientId = '82do75In0UiRwwJDmvnq'; // VACHELLIA INVESTMENTS (PTY) LTD

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet);

  console.log(`Read ${rows.length} rows from sheet ${sheetName}`);
  const db = getAdminDb();

  for (const row of rows) {
    const code = String(row['Code'] || '').trim();
    if (!code) continue;

    console.log(`\nProcessing employee: ${code} - ${row['First Name']} ${row['Surname']}`);

    // Parse Join Date from Excel date serial or string
    let joinDate: Date = new Date();
    const rawJoinDate = row['Join Date (YYYY-MM-DD)'];
    if (typeof rawJoinDate === 'number') {
      // Excel serial date to JS Date
      joinDate = new Date(Math.round((rawJoinDate - 25569) * 86400 * 1000));
    } else if (rawJoinDate) {
      const parsed = new Date(rawJoinDate);
      if (!isNaN(parsed.getTime())) joinDate = parsed;
    }

    const employeeData: any = {
      employeeCode: code,
      initials: String(row['Initials'] || ''),
      name: String(row['First Name'] || ''),
      surname: String(row['Surname'] || ''),
      idNumber: String(row['ID Number'] || ''),
      email: String(row['Email'] || ''),
      cellNumber: String(row['Phone'] || ''),
      jobTitle: String(row['Job Title'] || ''),
      department: String(row['Department'] || ''),
      joinDate: joinDate,
      taxNumber: String(row['Tax Number'] || ''),
      payType: String(row['Pay Type (Salary/Hourly)']).toLowerCase() === 'hourly' ? 'Hourly' : 'Salary',
      basicSalary: parseFloat(String(row['Basic Salary'] || '0').replace(/[^\d.]/g, '')) || 0,
      hourlyRate: parseFloat(String(row['Hourly Rate'] || '0').replace(/[^\d.]/g, '')) || 0,
      paymentFrequency: String(row['Frequency (Monthly/Fortnightly/Weekly)'] || 'Monthly'),
      bankingDetails: {
        bankName: String(row['Bank'] || ''),
        accountHolder: String(row['Acc Holder'] || `${row['First Name'] || ''} ${row['Surname'] || ''}`).trim(),
        accountNumber: String(row['Acc Number'] || ''),
        accountType: String(row['Acc Type'] || 'Savings'),
        branchCode: String(row['Branch'] || ''),
      },
      address: {
        unit: String(row['Unit'] || ''),
        complex: String(row['Complex'] || ''),
        street: String(row['Street'] || ''),
        suburb: String(row['Suburb'] || ''),
        city: String(row['City'] || ''),
        zip: String(row['Zip'] || ''),
      },
      medicalAidMembers: 0,
      medicalAidDependents: 0,
      status: 'Active',
      updatedAt: new Date(),
    };

    const hours = {
      normal: parseFloat(String(row['Normal Hours'] || 0)) || 0,
      publicHoliday: parseFloat(String(row['Public Holiday Hours'] || 0)) || 0,
      overtime15: parseFloat(String(row['Overtime 1.5x Hours'] || 0)) || 0,
      overtime20: parseFloat(String(row['Overtime 2x Hours'] || 0)) || 0,
      standbyAllowance: parseFloat(String(row['Standby Allowance'] || 0)) || 0,
    };

    // Check if employee already exists by code or ID number
    const existingSnap = await db.collection('aiPayrollClients').doc(clientId).collection('employees')
      .where('employeeCode', '==', code).get();

    let empDocId = '';
    if (!existingSnap.empty) {
      empDocId = existingSnap.docs[0].id;
      await db.collection('aiPayrollClients').doc(clientId).collection('employees').doc(empDocId).update(cleanFirestoreData(employeeData));
      console.log(`Updated existing employee doc: ${empDocId}`);
    } else {
      employeeData.createdAt = new Date();
      const newRef = await db.collection('aiPayrollClients').doc(clientId).collection('employees').add(cleanFirestoreData(employeeData));
      empDocId = newRef.id;
      console.log(`Created new employee doc: ${empDocId}`);
    }

    // Generate draft payslip
    const baseValue = employeeData.payType === 'Hourly' ? employeeData.hourlyRate : employeeData.basicSalary;
    const psRes = await generateEmployeePayslipAction({
      clientId,
      employeeId: empDocId,
      basicSalary: baseValue,
      hours,
    });
    console.log(`Generated payslip result:`, psRes);
  }

  console.log('\nBulk import completed successfully for Vachellia Investments!');
}

importEmployees().catch(console.error);
