const fs = require('fs');
const path = require('path');
const { PDFDocument } = require(path.resolve('c:/myacc/node_modules/pdf-lib'));

async function fillAcroForm2() {
  const templatePath = 'C:\\Users\\kev\\Downloads\\NCR_Form_2_Fillable.pdf';
  const buf = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(buf);
  const form = pdfDoc.getForm();

  // Helper function to safely set text field
  const setText = (fieldName, value) => {
    try {
      const field = form.getTextField(fieldName);
      if (field) field.setText(value || '');
    } catch (e) {
      console.warn(`Could not set text field "${fieldName}": ${e.message}`);
    }
  };

  // Helper function to safely check checkbox
  const check = (fieldName) => {
    try {
      const field = form.getCheckBox(fieldName);
      if (field) field.check();
    } catch (e) {
      console.warn(`Could not check box "${fieldName}": ${e.message}`);
    }
  };

  // Helper function to safely uncheck checkbox
  const uncheck = (fieldName) => {
    try {
      const field = form.getCheckBox(fieldName);
      if (field) field.uncheck();
    } catch (e) {
      console.warn(`Could not uncheck box "${fieldName}": ${e.message}`);
    }
  };

  console.log('Populating AcroForm fields...');

  // ====================================================
  // PAGE 1 - PART 1: APPLICANT'S INFORMATION
  // ====================================================
  setText('p1_applicant_name', 'SLATON PROJECTS (PTY) LTD');
  setText('p1_trading_name', 'Slaton Loans');
  check('p1_legal_status_private_company');
  setText('p1_cipro_reg_number', '2026/215238/07');
  setText('p1_date_commencement_trading', '2026/03/23');
  setText('p1_financial_year_end', '28 February');
  setText('p1_income_tax_number', '9897388196');
  setText('p1_vat_registration_number', 'N/A (Non-VAT Registered)');

  // Physical Address
  setText('p1_physical_address_line1', '40 Bokkeveld Crescent');
  setText('p1_physical_address_line2', 'Eldorado Park');
  setText('p1_physical_address_line3_city', 'Johannesburg, Gauteng');
  setText('p1_physical_postal_code', '1811');

  // Postal Address
  setText('p1_postal_address_line1', '40 Bokkeveld Crescent');
  setText('p1_postal_address_line2', 'Eldorado Park');
  setText('p1_postal_address_line3_city', 'Johannesburg, Gauteng');
  setText('p1_postal_code', '1811');

  // Phone, Fax, Email
  setText('p1_tel_code', '060');
  setText('p1_telephone_number', '256 8221');
  setText('p1_fax_code', 'N/A');
  setText('p1_fax_number', 'N/A');
  setText('p1_email_address', 'slatonloans@outlook.com');


  // ====================================================
  // PAGE 2 - CONTACT PERSON, AUDITOR & PRODUCTS
  // ====================================================
  // 11. Contact Person
  setText('p2_contact_title', 'Ms.');
  setText('p2_contact_name', 'Nastasia');
  setText('p2_contact_initials', 'N');
  setText('p2_contact_surname', 'Benton');
  setText('p2_contact_tel_code', '060');
  setText('p2_contact_tel_number', '256 8221');
  setText('p2_contact_fax_code', 'N/A');
  setText('p2_contact_fax_number', 'N/A');
  setText('p2_contact_cell_code', '060');
  setText('p2_contact_cell_number', '256 8221');
  setText('p2_contact_email', 'slatonloans@outlook.com');

  // 12. Auditor / Accounting Officer
  setText('p2_auditor_firm_name', 'My Accountant (Pty) Ltd');
  setText('p2_auditor_physical_address_line1', '40 Bokkeveld Crescent');
  setText('p2_auditor_physical_address_line2', 'Eldorado Park');
  setText('p2_auditor_physical_city', 'Johannesburg, Gauteng');
  setText('p2_auditor_physical_postal_code', '1811');
  setText('p2_auditor_postal_address_line1', '40 Bokkeveld Crescent');
  setText('p2_auditor_postal_address_line2', 'Eldorado Park');
  setText('p2_auditor_postal_city', 'Johannesburg, Gauteng');
  setText('p2_auditor_postal_code', '1811');
  setText('p2_auditor_individual_name', 'Kevin Freese');
  setText('p2_auditor_tel_code', '010');
  setText('p2_auditor_tel_number', '109 1625');
  setText('p2_auditor_fax_code', 'N/A');
  setText('p2_auditor_fax_number', 'N/A');
  setText('p2_auditor_email', 'kev@thinkestry.co.za / info@myacc.co.za');
  setText('p2_auditor_practice_number', 'CIBA / SAIBA / SAIT');
  setText('p2_auditor_professional_body', 'CIBA / SAIT');

  // 13. Compliance Officer
  setText('p2_compliance_officer_name', 'N/A (SME Credit Provider)');

  // 14. Products: 14.3 Unsecured credit transactions
  check('p2_product_unsecured_credit');


  // ====================================================
  // PAGE 3 - LANGUAGES, COMMITMENTS & FINANCIAL INFO
  // ====================================================
  // 16. Languages
  setText('p3_language_area1_desc', 'Gauteng (Johannesburg / South)');
  setText('p3_language_area1_lang1', 'English');
  setText('p3_language_area1_lang2', 'Afrikaans');

  // 17. Commitments
  setText('p3_bbbee_commitments_line1', 'B-BBEE Level 4 Contributor (Exempted Micro Enterprise - Annual Turnover < R10 Million).');
  setText('p3_overindebtedness_commitments_line1', 'Full compliance with Section 81 of the National Credit Act (NCA).');
  setText('p3_overindebtedness_commitments_line2', 'Mandatory credit and affordability assessments, income/expense verifications, and bureau checks.');

  // Part 2: Financial Information (Startup R0)
  setText('p3_fin_net_loan_book_value', '0.00');
  setText('p3_fin_total_agreements_count', '0');
  setText('p3_fin_total_principal_debt_value', '0.00');
  setText('p3_fin_agreements_during_year_count', '0');


  // ====================================================
  // PAGE 4 - CONTROLLING INTERESTS & BUSINESS PREMISES
  // ====================================================
  // Part 3: Controlling Interests (All NO)
  check('p4_control_credit_bureau_no');
  check('p4_control_debt_collection_no');
  check('p4_control_adr_agent_no');
  check('p4_control_credit_repair_no');

  // Part 4: Business Premises
  setText('p4_premises_total_count', '1');
  setText('p4_premises_normal_credit_count', '1');
  setText('p4_premises_dev_credit_count', '0');

  // Branch 1 details
  setText('p4_premise1_trading_name', 'Slaton Loans');
  setText('p4_premise1_address_line1', '40 Bokkeveld Crescent');
  setText('p4_premise1_address_line2', 'Eldorado Park');
  setText('p4_premise1_city', 'Johannesburg, Gauteng');
  setText('p4_premise1_postal_code', '1811');
  setText('p4_premise1_contact_person', 'Nastasia Benton');
  setText('p4_premise1_tel_code', '060');
  setText('p4_premise1_tel_number', '256 8221');
  setText('p4_premise1_email', 'slatonloans@outlook.com');


  // ====================================================
  // PAGE 5 - SUPPLEMENTARY REG & DECLARATION
  // ====================================================
  setText('p5_rep_name', 'Nastasia Benton');
  setText('p5_rep_capacity', 'Director');
  setText('p5_rep_date', '2026/08/19');


  // ====================================================
  // PAGE 6 - DISQUALIFICATION (Q1 TO Q8)
  // ====================================================
  setText('p6_person_name', 'Nastasia Benton');
  setText('p6_person_id_number', 'As per attached Certified ID');
  setText('p6_person_date', '2026/08/19');

  check('p6_q1_gambling_register_no');
  check('p6_q2_mentally_unfit_no');
  check('p6_q3_misconduct_removal_no');
  check('p6_q4_deregistered_entity_no');
  check('p6_q5_disrepute_entity_no');
  check('p6_q6_disregard_consumer_rights_no');
  check('p6_q7_fraud_conviction_no');
  check('p6_q8_violence_conviction_no');


  // ====================================================
  // PAGE 7 - DISQUALIFICATION (Q9) & SAPS CONSENT
  // ====================================================
  check('p7_q9_nca_offence_no');
  check('p7_q10_saps_permission_yes');
  setText('p7_cert_date', '2026/08/19');


  const pdfBytes = await pdfDoc.save();

  const destDownloads = 'C:\\Users\\kev\\Downloads\\Slaton_Loans_NCR_Form_2_Fillable_Completed.pdf';
  const destDownloadsStandard = 'C:\\Users\\kev\\Downloads\\Slaton_Loans_Form_2_Completed.pdf';
  const destScratch = 'c:/myacc/scratch/Slaton_Loans_NCR_Form_2_Fillable_Completed.pdf';
  const destPublic = 'c:/myacc/public/Slaton_Loans_NCR_Form_2_Fillable_Completed.pdf';

  fs.writeFileSync(destDownloads, pdfBytes);
  fs.writeFileSync(destDownloadsStandard, pdfBytes);
  fs.writeFileSync(destScratch, pdfBytes);
  fs.writeFileSync(destPublic, pdfBytes);

  console.log('✅ AcroForm Form 2 Successfully Completed and Saved to:');
  console.log('   - ' + destDownloads);
  console.log('   - ' + destDownloadsStandard);
  console.log('   - ' + destScratch);
  console.log('   - ' + destPublic);
}

fillAcroForm2().catch(console.error);
