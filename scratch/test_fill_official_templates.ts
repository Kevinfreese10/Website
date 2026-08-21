import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument } from 'pdf-lib';

async function testFillTemplates() {
  const entity = {
    companyName: 'FIRST BLOOM FINANCE (PTY) LTD',
    regNumber: '2026/507901/07',
    directorName: 'Peturnia Tiyiselani Mavundlha',
    idNumber: '9901300233087',
    address: 'Stand No 51, Makhushane, Phalaborwa, Limpopo, 1390',
    phone: '0760422792',
    email: 'peturniamavundlha@gmail.com',
    date: '21 August 2026',
    orderId: '10135',
  };

  // 1. Fill NCR Form 2
  const form2Path = 'public/templates/NCR_Form_2_Fillable.pdf';
  const form2Bytes = fs.readFileSync(form2Path);
  const form2Doc = await PDFDocument.load(form2Bytes, { ignoreEncryption: true });
  const form2 = form2Doc.getForm();

  // Part 1: Applicant Details
  const setField = (name: string, val: string) => {
    try {
      const field = form2.getTextField(name);
      if (field) field.setText(val);
    } catch (e) {
      // field not text
    }
  };

  const checkField = (name: string) => {
    try {
      const field = form2.getCheckBox(name);
      if (field) field.check();
    } catch (e) {}
  };

  setField('p1_applicant_name', entity.companyName);
  setField('p1_trading_name', entity.companyName);
  setField('p1_reg_number', entity.regNumber);
  setField('p1_cipc_reg_date', '27 June 2026');
  setField('p1_physical_address_line1', 'Stand No 51, Makhushane');
  setField('p1_physical_address_line2', 'Phalaborwa');
  setField('p1_physical_address_line3_city', 'Limpopo');
  setField('p1_physical_postal_code', '1390');
  setField('p1_postal_address_line1', 'Stand No 51, Makhushane');
  setField('p1_postal_address_line2', 'Phalaborwa');
  setField('p1_postal_address_line3_city', 'Limpopo');
  setField('p1_postal_code', '1390');
  setField('p1_telephone_number', entity.phone);
  setField('p1_email_address', entity.email);

  // Part 2: Contact Person & Auditor Details
  setField('p2_contact_name', 'Peturnia Tiyiselani');
  setField('p2_contact_surname', 'Mavundlha');
  setField('p2_contact_cell_number', entity.phone);
  setField('p2_contact_email', entity.email);

  setField('p2_auditor_firm_name', 'My Accountant (Pty) Ltd');
  setField('p2_auditor_individual_name', 'Kevin Freese');
  setField('p2_auditor_physical_address_line1', 'Ground Floor, Waterstone Building, Stonemill Office Park');
  setField('p2_auditor_physical_address_line2', '300 Acacia Road, Darrenwood');
  setField('p2_auditor_physical_city', 'Johannesburg');
  setField('p2_auditor_physical_postal_code', '2195');
  setField('p2_auditor_tel_number', '010 109 1625');
  setField('p2_auditor_email', 'info@myacc.co.za');
  setField('p2_auditor_practice_number', 'CIBA CBAP SA #3561 / PR-0098553');
  setField('p2_auditor_professional_body', 'Chartered Institute of Business Accountants (CIBA / SAIBA)');

  checkField('p2_product_unsecured_credit');
  checkField('p2_product_developmental_credit');

  setField('p3_language_area1_desc', 'Limpopo');
  setField('p3_language_area1_lang1', 'English');
  setField('p3_language_area1_lang2', 'Sepedi');

  checkField('p4_control_credit_bureau_no');
  checkField('p4_control_debt_collection_no');
  checkField('p4_control_adr_agent_no');
  checkField('p4_control_credit_repair_no');

  setField('p4_premises_total_count', '1');
  setField('p4_premises_normal_credit_count', '1');
  setField('p4_premise1_trading_name', entity.companyName);
  setField('p4_premise1_address_line1', 'Stand No 51, Makhushane');
  setField('p4_premise1_city', 'Phalaborwa, Limpopo');
  setField('p4_premise1_postal_code', '1390');
  setField('p4_premise1_contact_person', entity.directorName);
  setField('p4_premise1_tel_number', entity.phone);
  setField('p4_premise1_email', entity.email);

  setField('p5_rep_name', entity.directorName);
  setField('p5_rep_capacity', 'Director');
  setField('p5_rep_date', entity.date);

  setField('p6_person_name', entity.directorName);
  setField('p6_person_id_number', entity.idNumber);
  setField('p6_person_date', entity.date);

  checkField('p6_q1_gambling_register_no');
  checkField('p6_q2_mentally_unfit_no');
  checkField('p6_q3_misconduct_removal_no');
  checkField('p6_q4_deregistered_entity_no');
  checkField('p6_q5_disrepute_entity_no');
  checkField('p6_q6_disregard_consumer_rights_no');
  checkField('p6_q7_fraud_conviction_no');
  checkField('p6_q8_violence_conviction_no');
  checkField('p7_q9_nca_offence_no');
  checkField('p7_q10_saps_permission_yes');
  setField('p7_cert_date', entity.date);

  const filledForm2Bytes = await form2Doc.save();
  const form2Out = 'scratch/order_10135_audit/NCR_Form_2_Filled_Official.pdf';
  fs.writeFileSync(form2Out, filledForm2Bytes);
  console.log(`✓ Saved filled Form 2 to ${form2Out} (${filledForm2Bytes.length} bytes)`);

  // 2. Fill NCR Annexure Confirmation of Fees
  const annexurePath = 'public/templates/NCR_Annexure_Confirmation_of_Fees_Fillable.pdf';
  const annexureBytes = fs.readFileSync(annexurePath);
  const annexureDoc = await PDFDocument.load(annexureBytes, { ignoreEncryption: true });
  const annexure = annexureDoc.getForm();

  const setAnnexField = (name: string, val: string) => {
    try {
      const field = annexure.getTextField(name);
      if (field) field.setText(val);
    } catch (e) {}
  };

  setAnnexField('credit_provider_name', entity.companyName);
  setAnnexField('application_date', entity.date);
  setAnnexField('contact_person_name', entity.directorName);
  setAnnexField('contact_telephone_number', entity.phone);
  setAnnexField('amount_paid_rands', 'R 1,800.00');

  try {
    annexure.getCheckBox('pay_method_electronic_transfer').check();
  } catch (e) {}

  setAnnexField('fee_application_amount', 'R 550.00');
  setAnnexField('fee_initial_reg_amount', 'R 1,250.00');
  setAnnexField('fee_branches_count', '1');
  setAnnexField('fee_branches_amount', 'R 0.00');
  setAnnexField('fee_total_amount', 'R 1,800.00');

  setAnnexField('declaration_date', entity.date);
  setAnnexField('representative_name', entity.directorName);
  setAnnexField('representative_designation', 'Director');

  const filledAnnexureBytes = await annexureDoc.save();
  const annexureOut = 'scratch/order_10135_audit/NCR_Annexure_Confirmation_of_Fees_Filled_Official.pdf';
  fs.writeFileSync(annexureOut, filledAnnexureBytes);
  console.log(`✓ Saved filled Annexure to ${annexureOut} (${filledAnnexureBytes.length} bytes)`);
}

testFillTemplates().catch(console.error);
