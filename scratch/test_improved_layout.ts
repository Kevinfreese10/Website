import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { getAdminDb } from '../src/lib/firebase-admin';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function generateTestPdf(employee: any, client: any, payslip: any) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  doc.setFontSize(8);
  doc.setTextColor(40);

  let currentY = 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(client.name || 'Company Name', 15, currentY);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  currentY += 5;

  const dividerY = 48;
  currentY = dividerY;
  doc.setDrawColor(200);
  doc.line(15, currentY, 195, currentY);
  currentY += 6;

  // --- 4. Employee Info Grid (3 Independent Columns) ---
  const startGridY = currentY;
  const col1X = 15;
  const col2X = 82;
  const col3X = 142;

  // Column 1: Employee, Job title, Address
  let col1Y = startGridY;
  
  // 1. Employee Name
  doc.setFont('helvetica', 'bold');
  doc.text('Employee', col1X, col1Y);
  doc.setFont('helvetica', 'normal');
  const empNameLines = doc.splitTextToSize(`${employee.name} ${employee.surname}`, 45);
  doc.text(empNameLines, col1X + 20, col1Y);
  col1Y += Math.max(empNameLines.length * 4.2, 5.2);

  // 2. Job Title
  if (employee.jobTitle && employee.jobTitle !== 'N/A') {
    doc.setFont('helvetica', 'bold');
    doc.text('Job title', col1X, col1Y);
    doc.setFont('helvetica', 'normal');
    const jobTitleLines = doc.splitTextToSize(employee.jobTitle, 45);
    doc.text(jobTitleLines, col1X + 20, col1Y);
    col1Y += Math.max(jobTitleLines.length * 4.2, 5.2);
  }

  // 3. Address
  const cleanAddressField = (val: any) => {
      if (!val) return '';
      const s = String(val).trim();
      if (s.toLowerCase() === 'n/a' || s === '') return '';
      return s;
  };

  const addrUnit = cleanAddressField(employee.address?.unit);
  const addrComplex = cleanAddressField(employee.address?.complex);
  const addrStreet = cleanAddressField(employee.address?.street);
  const addrSuburb = cleanAddressField(employee.address?.suburb);
  const addrCity = cleanAddressField(employee.address?.city);
  const addrZip = cleanAddressField(employee.address?.zip);

  const unitComplex = [addrUnit, addrComplex].filter(Boolean).join(', ');
  const addressLines = [unitComplex, addrStreet, addrSuburb, addrCity, addrZip].filter(Boolean);

  if (addressLines.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Address', col1X, col1Y);
      doc.setFont('helvetica', 'normal');
      addressLines.forEach(line => {
          const wrapped = doc.splitTextToSize(String(line), 45);
          doc.text(wrapped, col1X + 20, col1Y);
          col1Y += wrapped.length * 4.0;
      });
  }

  // Column 2: Employee Code, Identity Number, Employed from, Rate per hour
  let col2Y = startGridY;
  const drawCol2Item = (label: string, value: string | undefined | null) => {
    if (!value || value === 'N/A') return;
    doc.setFont('helvetica', 'bold');
    doc.text(label, col2X, col2Y);
    doc.setFont('helvetica', 'normal');
    const valLines = doc.splitTextToSize(String(value), 32);
    doc.text(valLines, col2X + 27, col2Y);
    col2Y += Math.max(valLines.length * 4.2, 5.2);
  };

  drawCol2Item('Employee Code', employee.employeeCode);
  drawCol2Item('Identity Number', employee.idNumber);
  const joinDateStr = employee.joinDate?.toDate ? format(employee.joinDate.toDate(), 'yyyy/MM/dd') : (employee.joinDate ? format(new Date(employee.joinDate), 'yyyy/MM/dd') : '');
  drawCol2Item('Employed from', joinDateStr);
  const hourlyRate = (payslip.grossPay || 0) / 160;
  drawCol2Item('Rate per hour', `R ${hourlyRate.toFixed(2)}`);

  // Column 3: Pay Method, Bank Name, Branch Code, Account Number, Account Holder
  let col3Y = startGridY;
  const drawCol3Item = (label: string, value: string | undefined | null) => {
    if (!value || value === 'N/A') return;
    doc.setFont('helvetica', 'bold');
    doc.text(label, col3X, col3Y);
    doc.setFont('helvetica', 'normal');
    const valLines = doc.splitTextToSize(String(value), 28);
    doc.text(valLines, col3X + 25, col3Y);
    col3Y += Math.max(valLines.length * 4.2, 5.2);
  };

  drawCol3Item('Pay Method', 'EFT');
  drawCol3Item('Bank Name', employee.bankingDetails?.bankName);
  drawCol3Item('Branch Code', employee.bankingDetails?.branchCode);
  drawCol3Item('Account Number', employee.bankingDetails?.accountNumber);
  drawCol3Item('Account Holder', employee.bankingDetails?.accountHolder);

  currentY = Math.max(col1Y, col2Y, col3Y, startGridY + 24);
  doc.setDrawColor(200);
  doc.line(15, currentY, 195, currentY);

  return doc;
}

async function runTest() {
  const db = getAdminDb();
  const clientId = '82do75In0UiRwwJDmvnq';

  const clientSnap = await db.collection('aiPayrollClients').doc(clientId).get();
  const client = { id: clientSnap.id, ...clientSnap.data() };

  const empsSnap = await db.collection('aiPayrollClients').doc(clientId).collection('employees').get();
  const payslipsSnap = await db.collection('aiPayrollClients').doc(clientId).collection('payslips').get();

  for (const empDoc of empsSnap.docs) {
    const emp = { id: empDoc.id, ...empDoc.data() } as any;
    const psDoc = payslipsSnap.docs.find(d => d.data().employeeId === emp.id);
    if (!psDoc) continue;
    const payslip = { id: psDoc.id, ...psDoc.data() };

    const doc = generateTestPdf(emp, client, payslip);
    const outPath = `scratch/payslip_preview/Test_${emp.employeeCode}_${emp.surname}.pdf`;
    fs.writeFileSync(outPath, Buffer.from(doc.output('arraybuffer')));
    console.log(`Generated: ${outPath}`);
  }
}

runTest().catch(console.error);
