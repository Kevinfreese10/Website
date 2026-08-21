const fs = require('fs');
const path = require('path');
const React = require('react');
const { renderToFile, Page, Text, View, Document, StyleSheet } = require(path.resolve('c:/myacc/node_modules/@react-pdf/renderer'));

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 40,
    backgroundColor: '#ffffff',
    color: '#1a1a1a',
    lineHeight: 1.4,
  },
  headerBox: {
    borderBottomWidth: 2,
    borderBottomColor: '#0f172a',
    paddingBottom: 10,
    marginBottom: 16,
    textAlign: 'center',
  },
  titleMain: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titleSub: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0369a1',
    marginTop: 4,
  },
  titleAct: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
    fontStyle: 'italic',
  },
  sectionBox: {
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    overflow: 'hidden',
  },
  sectionHeader: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    minHeight: 20,
    alignItems: 'center',
  },
  tableRowEven: {
    backgroundColor: '#f8fafc',
  },
  colLabel: {
    width: '38%',
    paddingVertical: 3,
    paddingHorizontal: 8,
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#334155',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  colValue: {
    width: '62%',
    paddingVertical: 3,
    paddingHorizontal: 8,
    fontSize: 8.5,
    color: '#0f172a',
  },
  checklistRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
  },
  checkMark: {
    width: 20,
    fontWeight: 'bold',
    color: '#0284c7',
    fontSize: 9,
  },
  checkText: {
    flex: 1,
    fontSize: 8.5,
    color: '#334155',
  },
  checkStatus: {
    width: 70,
    fontSize: 8,
    fontWeight: 'bold',
    color: '#16a34a',
    textAlign: 'right',
  },
  declarationBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    fontSize: 8.5,
    lineHeight: 1.45,
    color: '#1e293b',
  },
  signatureSection: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureLine: {
    width: '45%',
    borderTopWidth: 1,
    borderTopColor: '#0f172a',
    paddingTop: 4,
    textAlign: 'center',
    fontSize: 8.5,
    color: '#334155',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7.5,
    color: '#94a3b8',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 4,
  },
});

function Form2Document() {
  return React.createElement(
    Document,
    null,
    // ================= PAGE 1 =================
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      // Header
      React.createElement(
        View,
        { style: styles.headerBox },
        React.createElement(Text, { style: styles.titleMain }, 'National Credit Regulator (NCR)'),
        React.createElement(Text, { style: styles.titleSub }, 'Form NCR 2 — Application for Registration as a Credit Provider'),
        React.createElement(Text, { style: styles.titleAct }, 'In terms of Section 40 of the National Credit Act, 2005 (Act No. 34 of 2005)')
      ),

      // PART A
      React.createElement(
        View,
        { style: styles.sectionBox },
        React.createElement(Text, { style: styles.sectionHeader }, 'Part A: Applicant (Legal Entity) Details'),
        React.createElement(
          View,
          { style: [styles.tableRow, styles.tableRowEven] },
          React.createElement(Text, { style: styles.colLabel }, '1. Registered Entity Name'),
          React.createElement(Text, { style: styles.colValue }, 'SLATON LOANS (PTY) LTD')
        ),
        React.createElement(
          View,
          { style: styles.tableRow },
          React.createElement(Text, { style: styles.colLabel }, '2. Trading Name'),
          React.createElement(Text, { style: styles.colValue }, 'Slaton Loans')
        ),
        React.createElement(
          View,
          { style: [styles.tableRow, styles.tableRowEven] },
          React.createElement(Text, { style: styles.colLabel }, '3. Entity Legal Type'),
          React.createElement(Text, { style: styles.colValue }, 'Private Company — (Pty) Ltd')
        ),
        React.createElement(
          View,
          { style: styles.tableRow },
          React.createElement(Text, { style: styles.colLabel }, '4. CIPC Registration Number'),
          React.createElement(Text, { style: styles.colValue }, 'As per attached COR14.3 Registration Certificate')
        ),
        React.createElement(
          View,
          { style: [styles.tableRow, styles.tableRowEven] },
          React.createElement(Text, { style: styles.colLabel }, '5. Income Tax Reference Number'),
          React.createElement(Text, { style: styles.colValue }, 'As per attached Tax Clearance Certificate')
        ),
        React.createElement(
          View,
          { style: styles.tableRow },
          React.createElement(Text, { style: styles.colLabel }, '6. Business Telephone Number'),
          React.createElement(Text, { style: styles.colValue }, '060 256 8221')
        ),
        React.createElement(
          View,
          { style: [styles.tableRow, styles.tableRowEven] },
          React.createElement(Text, { style: styles.colLabel }, '7. Business Email Address'),
          React.createElement(Text, { style: styles.colValue }, 'slatonloans@outlook.com')
        ),
        React.createElement(
          View,
          { style: styles.tableRow },
          React.createElement(Text, { style: styles.colLabel }, '8. Main Area of Operation (Province)'),
          React.createElement(Text, { style: styles.colValue }, 'Gauteng, South Africa')
        ),
        React.createElement(
          View,
          { style: [styles.tableRow, styles.tableRowEven] },
          React.createElement(Text, { style: styles.colLabel }, '9. Official Languages'),
          React.createElement(Text, { style: styles.colValue }, 'First Language: English | Second Language: Afrikaans')
        ),
        React.createElement(
          View,
          { style: styles.tableRow },
          React.createElement(Text, { style: styles.colLabel }, '10. Registered Physical Address'),
          React.createElement(Text, { style: styles.colValue }, 'As per attached CIPC COR14.3 / Proof of Address')
        )
      ),

      // PART B
      React.createElement(
        View,
        { style: styles.sectionBox },
        React.createElement(Text, { style: styles.sectionHeader }, 'Part B: Primary Contact Person & Premises'),
        React.createElement(
          View,
          { style: [styles.tableRow, styles.tableRowEven] },
          React.createElement(Text, { style: styles.colLabel }, '1. Full Name of Contact Person'),
          React.createElement(Text, { style: styles.colValue }, 'Nastasia Benton')
        ),
        React.createElement(
          View,
          { style: styles.tableRow },
          React.createElement(Text, { style: styles.colLabel }, '2. Capacity / Designation'),
          React.createElement(Text, { style: styles.colValue }, 'Director / 100% Shareholder')
        ),
        React.createElement(
          View,
          { style: [styles.tableRow, styles.tableRowEven] },
          React.createElement(Text, { style: styles.colLabel }, '3. Contact Cellphone Number'),
          React.createElement(Text, { style: styles.colValue }, '060 256 8221')
        ),
        React.createElement(
          View,
          { style: styles.tableRow },
          React.createElement(Text, { style: styles.colLabel }, '4. Contact Email Address'),
          React.createElement(Text, { style: styles.colValue }, 'tasiabenton2804@gmail.com / slatonloans@outlook.com')
        ),
        React.createElement(
          View,
          { style: [styles.tableRow, styles.tableRowEven] },
          React.createElement(Text, { style: styles.colLabel }, '5. Contact Person for Premises'),
          React.createElement(Text, { style: styles.colValue }, 'Nastasia Benton (Director)')
        )
      ),

      // PART C
      React.createElement(
        View,
        { style: styles.sectionBox },
        React.createElement(Text, { style: styles.sectionHeader }, 'Part C: Directors / Shareholders Details'),
        React.createElement(
          View,
          { style: [styles.tableRow, styles.tableRowEven] },
          React.createElement(Text, { style: styles.colLabel }, '1. Full Legal Name'),
          React.createElement(Text, { style: styles.colValue }, 'Nastasia Benton')
        ),
        React.createElement(
          View,
          { style: styles.tableRow },
          React.createElement(Text, { style: styles.colLabel }, '2. Identity / Passport Number'),
          React.createElement(Text, { style: styles.colValue }, 'As per attached Certified ID Copy (Nastasia ID.pdf)')
        ),
        React.createElement(
          View,
          { style: [styles.tableRow, styles.tableRowEven] },
          React.createElement(Text, { style: styles.colLabel }, '3. Shareholding Percentage'),
          React.createElement(Text, { style: styles.colValue }, '100% (Sole Shareholder & Director)')
        ),
        React.createElement(
          View,
          { style: styles.tableRow },
          React.createElement(Text, { style: styles.colLabel }, '4. Criminal Record in past 10 Years?'),
          React.createElement(Text, { style: styles.colValue }, 'NO — Verified via attached SAPS Criminal Clearance')
        ),
        React.createElement(
          View,
          { style: [styles.tableRow, styles.tableRowEven] },
          React.createElement(Text, { style: styles.colLabel }, '5. Disqualified under NCA / Companies Act?'),
          React.createElement(Text, { style: styles.colValue }, 'NO')
        )
      ),

      // Footer
      React.createElement(
        View,
        { style: styles.footer },
        React.createElement(Text, null, 'NCR Form 2 — Slaton Loans (Pty) Ltd | Order #10036'),
        React.createElement(Text, null, 'Page 1 of 2')
      )
    ),

    // ================= PAGE 2 =================
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      // PART D & E
      React.createElement(
        View,
        { style: styles.sectionBox },
        React.createElement(Text, { style: styles.sectionHeader }, 'Part D & E: Credit Business Profile & Statutory Fees'),
        React.createElement(
          View,
          { style: [styles.tableRow, styles.tableRowEven] },
          React.createElement(Text, { style: styles.colLabel }, '1. Category of Credit Agreements'),
          React.createElement(Text, { style: styles.colValue }, 'Short-Term / Unsecured Credit Transactions (Section 39 / 40 NCA)')
        ),
        React.createElement(
          View,
          { style: styles.tableRow },
          React.createElement(Text, { style: styles.colLabel }, '2. Number of Business Branches'),
          React.createElement(Text, { style: styles.colValue }, '1 Operational Location (Head Office Premises)')
        ),
        React.createElement(
          View,
          { style: [styles.tableRow, styles.tableRowEven] },
          React.createElement(Text, { style: styles.colLabel }, '3. Application Fee Remitted to NCR'),
          React.createElement(Text, { style: styles.colValue }, 'R 1,800.00 (PAID — Ref: NoticeOfPayment NCR.pdf)')
        ),
        React.createElement(
          View,
          { style: styles.tableRow },
          React.createElement(Text, { style: styles.colLabel }, '4. Operational Bank Account'),
          React.createElement(Text, { style: styles.colValue }, 'Slaton Loans (Pty) Ltd (As per attached Bank Confirmation Letter)')
        )
      ),

      // PART F: Checklist
      React.createElement(
        View,
        { style: styles.sectionBox },
        React.createElement(Text, { style: styles.sectionHeader }, 'Part F: Statutory Attachments & Compliance Checklist'),
        [
          { label: 'Annexure 1: Certified Copy of Director ID (Nastasia ID.pdf)', status: 'ATTACHED' },
          { label: 'Annexure 2: CIPC Company Registration Certificate (COR14.3)', status: 'ATTACHED' },
          { label: 'Annexure 3: Official Bank Confirmation Letter (Slaton Loans)', status: 'ATTACHED' },
          { label: 'Annexure 4: SARS Tax Clearance Status PIN / Certificate', status: 'ATTACHED' },
          { label: 'Annexure 5: Proof of Payment of R1,800 Application Fee to NCR', status: 'ATTACHED' },
          { label: 'Annexure 6: SAPS Criminal Clearance Certificate (Dated 14/08/2026)', status: 'ATTACHED' },
          { label: 'Annexure 7: Signed Share Certificate (100 Shares to Nastasia Benton)', status: 'ATTACHED' },
          { label: 'Annexure 8: Signed Board Resolution Authorizing Registration', status: 'ATTACHED' },
          { label: 'Annexure 9: Signed Power of Attorney Appointing My Accountant', status: 'ATTACHED' },
          { label: 'Annexure 10: Signed Fee Confirmation Annexure', status: 'ATTACHED' },
        ].map((item, idx) =>
          React.createElement(
            View,
            { key: idx, style: [styles.checklistRow, idx % 2 === 1 ? styles.tableRowEven : {}] },
            React.createElement(Text, { style: styles.checkMark }, '[X]'),
            React.createElement(Text, { style: styles.checkText }, item.label),
            React.createElement(Text, { style: styles.checkStatus }, item.status)
          )
        )
      ),

      // PART G: Declaration
      React.createElement(
        View,
        { style: styles.declarationBox },
        React.createElement(
          Text,
          { style: { fontWeight: 'bold', marginBottom: 4, color: '#0f172a' } },
          'Part G: Statutory Declaration by Applicant / Authorized Representative'
        ),
        React.createElement(
          Text,
          null,
          'I, the undersigned, NASTASIA BENTON, in my capacity as Director and authorized representative of SLATON LOANS (PTY) LTD, hereby solemnly declare that: (1) All information submitted in this application (Form NCR 2) and in the supporting annexures is true, accurate, and complete in all respects; (2) The applicant entity and its director are not disqualified from registration in terms of Section 46 or Section 47 of the National Credit Act, 2005; (3) The applicant undertakes to comply fully with the National Credit Act, 2005 (Act No. 34 of 2005), its Regulations, and all conditions of registration imposed by the National Credit Regulator.'
        )
      ),

      // Signatures
      React.createElement(
        View,
        { style: styles.signatureSection },
        React.createElement(
          View,
          { style: styles.signatureLine },
          React.createElement(Text, { style: { marginBottom: 16 } }, ''),
          React.createElement(Text, { style: { fontWeight: 'bold' } }, 'NASTASIA BENTON (Director)'),
          React.createElement(Text, null, 'For and on behalf of Slaton Loans (Pty) Ltd')
        ),
        React.createElement(
          View,
          { style: styles.signatureLine },
          React.createElement(Text, { style: { marginBottom: 16 } }, ''),
          React.createElement(Text, { style: { fontWeight: 'bold' } }, 'DATE & PLACE'),
          React.createElement(Text, null, 'Signed at Gauteng, South Africa')
        )
      ),

      // Footer
      React.createElement(
        View,
        { style: styles.footer },
        React.createElement(Text, null, 'NCR Form 2 — Slaton Loans (Pty) Ltd | Order #10036'),
        React.createElement(Text, null, 'Page 2 of 2')
      )
    )
  );
}

async function generate() {
  const outputPath = 'c:/myacc/scratch/Slaton_Loans_NCR_Form_2_Draft.pdf';
  const publicPath = 'c:/myacc/public/Slaton_Loans_NCR_Form_2_Draft.pdf';

  console.log('Rendering Form 2 PDF with React-PDF...');
  await renderToFile(React.createElement(Form2Document), outputPath);
  console.log(`Saved locally to: ${outputPath}`);

  // Also copy to public directory for direct browser viewing if local dev server runs
  try {
    fs.copyFileSync(outputPath, publicPath);
    console.log(`Copied to public web path: ${publicPath}`);
  } catch (e) {}

  console.log('PDF generation complete!');
}

generate().catch(console.error);
