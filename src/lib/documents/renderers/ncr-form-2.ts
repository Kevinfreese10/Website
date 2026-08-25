/**
 * NCR Form 2 — Application for registration as a credit provider (AcroForm fill of the official
 * fillable PDF in public/templates). Multi-page (7) by nature.
 *
 * Every statutory value is an explicit field. Nothing is defaulted: legal status, commencement
 * date, financial year end, products, languages, disqualification answers etc. are either
 * supplied or left blank with a warning. Firm (accounting officer) details come from FIRM.
 */
import { z } from 'zod';
import { PDFDocument } from 'pdf-lib';
import { FIRM, ansi, checkBox, drawDraftWatermark, embedFonts, formatDateShort, loadTemplateBytes, safeFileName, setTextField, splitName, splitPhone } from '../helpers';
import { answer } from '../context';
import { MissingFieldsError, type OrderDocumentContext, type TemplateDefinition } from '../types';

const SOURCE = 'NCR_Form_2_Fillable.pdf';

const yesNo = z.boolean().optional();
const addressSchema = z.object({
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
});

const schema = z.object({
  // Part 1 — applicant
  applicantName: z.string().min(1),
  tradingName: z.string().optional(),
  legalStatus: z.enum(['individual', 'private_company', 'public_company', 'close_corporation', 'cooperative', 'trust', 'partnership', 'other']).optional(),
  legalStatusOther: z.string().optional(),
  registrationNumber: z.string().min(1),
  commencementDate: z.string().optional(),
  financialYearEnd: z.string().optional(),
  incomeTaxNumber: z.string().optional(),
  vatNumber: z.string().optional(),
  /** Other regulators the applicant is registered with. */
  regulatedBy: z.array(z.enum(['banking', 'insurance', 'debt_collectors', 'financial_advisory', 'other'])).optional(),
  regulatedOther: z.string().optional(),
  physicalAddress: addressSchema,
  /** Omit to leave blank (a warning is raised); never assumed equal to physical. */
  postalAddress: addressSchema.optional(),
  telephone: z.string().optional(),
  fax: z.string().optional(),
  email: z.string().optional(),

  // Part 2 — contact person, compliance officer, products
  contactTitle: z.string().optional(),
  contactName: z.string().min(1),
  contactPhone: z.string().min(1),
  contactCell: z.string().optional(),
  contactFax: z.string().optional(),
  contactEmail: z.string().min(1),
  complianceOfficer: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    fax: z.string().optional(),
    email: z.string().optional(),
    firmName: z.string().optional(),
    postalAddress: addressSchema.optional(),
    externalPhone: z.string().optional(),
  }).optional(),
  products: z.array(z.enum(['mortgage', 'credit_facilities', 'unsecured_credit', 'vehicle_finance', 'clothing_retail', 'furniture_retail', 'pawnbroking', 'developmental_credit', 'other'])).optional(),
  productsOther: z.array(z.string()).max(3).optional(),

  // Part 3 — ancillary services, languages, commitments, financials
  ancillaryServices: z.array(z.enum(['life_insurance', 'credit_life_insurance', 'funeral_cover', 'short_term_insurance', 'other'])).optional(),
  ancillaryOther: z.string().optional(),
  languages: z.array(z.object({ area: z.string().min(1), language1: z.string().min(1), language2: z.string().optional() })).max(3).optional(),
  bbbeeCommitments: z.array(z.string()).max(5).optional(),
  overIndebtednessCommitments: z.array(z.string()).max(5).optional(),
  financials: z.object({
    netLoanBookValue: z.string().optional(),
    totalAgreementsCount: z.string().optional(),
    totalPrincipalDebtValue: z.string().optional(),
    agreementsDuringYearCount: z.string().optional(),
  }).optional(),

  // Part 4 — control of other regulated entities, premises
  controls: z.object({
    creditBureau: yesNo,
    debtCollection: yesNo,
    adrAgent: yesNo,
    creditRepair: yesNo,
    details: z.array(z.string()).max(2).optional(),
  }).optional(),
  premisesTotalCount: z.string().optional(),
  premisesNormalCreditCount: z.string().optional(),
  premisesDevCreditCount: z.string().optional(),
  premises: z.array(z.object({
    tradingName: z.string().optional(),
    address: addressSchema.optional(),
    contactPerson: z.string().optional(),
    phone: z.string().optional(),
    fax: z.string().optional(),
    email: z.string().optional(),
  })).max(2).optional(),

  // Part 5 — developmental credit types, representative declaration
  developmentalCreditTypes: z.array(z.enum(['educational', 'small_business', 'low_income_housing', 'cooperative_loans', 'other'])).optional(),
  developmentalCreditOther: z.string().optional(),
  representativeName: z.string().min(1),
  representativeCapacity: z.string().optional(),

  // Part 6 & 7 — natural-person disqualification declarations (explicit; never defaulted)
  representativeIdNumber: z.string().min(1),
  declarations: z.object({
    gamblingRegister: yesNo,
    mentallyUnfit: yesNo,
    misconductRemoval: yesNo,
    deregisteredEntity: yesNo,
    disreputeEntity: yesNo,
    disregardConsumerRights: yesNo,
    fraudConviction: yesNo,
    fraudDetails: z.array(z.string()).max(4).optional(),
    violenceConviction: yesNo,
    violenceDetails: z.array(z.string()).max(4).optional(),
    ncaOffence: yesNo,
    ncaDetails: z.array(z.string()).max(4).optional(),
    sapsPermission: yesNo,
  }).optional(),
  orderId: z.string().optional(),
});
export type NcrForm2Fields = z.infer<typeof schema>;

const LEGAL_STATUS_BOX: Record<NonNullable<NcrForm2Fields['legalStatus']>, string> = {
  individual: 'p1_legal_status_individual', private_company: 'p1_legal_status_private_company', public_company: 'p1_legal_status_public_company',
  close_corporation: 'p1_legal_status_close_corporation', cooperative: 'p1_legal_status_cooperative', trust: 'p1_legal_status_trust',
  partnership: 'p1_legal_status_partnership', other: 'p1_legal_status_other',
};
const DECLARATIONS: Array<[keyof NonNullable<NcrForm2Fields['declarations']>, string, string]> = [
  ['gamblingRegister', 'p6_q1_gambling_register', 'Q1 gambling register'],
  ['mentallyUnfit', 'p6_q2_mentally_unfit', 'Q2 mentally unfit'],
  ['misconductRemoval', 'p6_q3_misconduct_removal', 'Q3 removal for misconduct'],
  ['deregisteredEntity', 'p6_q4_deregistered_entity', 'Q4 deregistered entity'],
  ['disreputeEntity', 'p6_q5_disrepute_entity', 'Q5 entity brought into disrepute'],
  ['disregardConsumerRights', 'p6_q6_disregard_consumer_rights', 'Q6 disregard of consumer rights'],
  ['fraudConviction', 'p6_q7_fraud_conviction', 'Q7 fraud/dishonesty conviction'],
  ['violenceConviction', 'p6_q8_violence_conviction', 'Q8 violence conviction'],
  ['ncaOffence', 'p7_q9_nca_offence', 'Q9 NCA offence'],
  ['sapsPermission', 'p7_q10_saps_permission', 'Q10 SAPS clearance permission'],
];

export const ncrForm2: TemplateDefinition<NcrForm2Fields> = {
  id: 'ncr_form_2',
  title: 'NCR Form 2 - Credit Provider Registration',
  description: 'Fills the official NCR Form 2 (application for registration as a credit provider). Accounting officer section is My Accountant; all other statutory values must be supplied.',
  category: 'statutory_form',
  signature: 'client',
  schema,
  sourceFile: SOURCE,
  fieldLabels: {
    applicantName: 'Applicant (registered) name', tradingName: 'Trading name', legalStatus: 'Legal status', legalStatusOther: 'Legal status (other, specify)',
    registrationNumber: 'CIPC registration number', commencementDate: 'Date of commencement of trading', financialYearEnd: 'Financial year end',
    incomeTaxNumber: 'Income tax number', vatNumber: 'VAT registration number', regulatedBy: 'Other regulators', regulatedOther: 'Other regulator (specify)',
    physicalAddress: 'Physical address', postalAddress: 'Postal address', telephone: 'Telephone', fax: 'Fax', email: 'Email address',
    contactTitle: 'Contact person title', contactName: 'Contact person full name', contactPhone: 'Contact person telephone', contactCell: 'Contact person cellphone',
    contactFax: 'Contact person fax', contactEmail: 'Contact person email', complianceOfficer: 'Compliance officer details',
    products: 'Credit products offered', productsOther: 'Other credit products (specify)', ancillaryServices: 'Ancillary services', ancillaryOther: 'Other ancillary service (specify)',
    languages: 'Official languages per area of operation', bbbeeCommitments: 'B-BBEE commitments', overIndebtednessCommitments: 'Over-indebtedness commitments',
    financials: 'Financial information (loan book, agreements)', controls: 'Control of credit bureau / debt collection / ADR / credit repair',
    premisesTotalCount: 'Total number of premises', premisesNormalCreditCount: 'Premises offering normal credit', premisesDevCreditCount: 'Premises offering developmental credit',
    premises: 'Premises details', developmentalCreditTypes: 'Developmental credit types', developmentalCreditOther: 'Developmental credit (other, specify)',
    representativeName: 'Representative full name', representativeCapacity: 'Representative capacity', representativeIdNumber: 'Representative ID number',
    declarations: 'Natural person disqualification declarations (Q1-Q10)', orderId: 'Order number',
  },
  async render(fields, options) {
    const parsed = schema.safeParse(fields);
    if (!parsed.success) throw new MissingFieldsError('ncr_form_2', parsed.error.issues.map(i => i.path.join('.')));
    const f = parsed.data;
    const warnings: string[] = [];
    const blank = (label: string) => warnings.push(`${label} not supplied - left blank`);

    const pdf = await PDFDocument.load(loadTemplateBytes(SOURCE), { ignoreEncryption: true });
    const form = pdf.getForm();
    const set = (name: string, value: string | undefined | null) => { if (!setTextField(form, name, value)) warnings.push(`AcroForm field ${name} not found in ${SOURCE}`); };
    const tick = (name: string) => { if (!checkBox(form, name)) warnings.push(`AcroForm checkbox ${name} not found in ${SOURCE}`); };
    const setAddress = (prefix: { l1: string; l2: string; city: string; code: string }, a?: z.infer<typeof addressSchema>) => {
      if (!a) return;
      set(prefix.l1, a.line1); set(prefix.l2, a.line2); set(prefix.city, a.city); set(prefix.code, a.postalCode);
    };
    const setPhone = (codeField: string, numberField: string, raw?: string) => {
      if (!raw) return;
      const p = splitPhone(raw); set(codeField, p.code); set(numberField, p.number);
    };
    const setLines = (prefix: string, lines: string[] | undefined, max: number) => {
      (lines || []).slice(0, max).forEach((ln, i) => set(`${prefix}${i + 1}`, ln));
    };

    // ---- Part 1
    set('p1_applicant_name', f.applicantName);
    if (f.tradingName) set('p1_trading_name', f.tradingName); else blank('p1 trading name');
    if (f.legalStatus) { tick(LEGAL_STATUS_BOX[f.legalStatus]); if (f.legalStatus === 'other') set('p1_legal_status_other_specify', f.legalStatusOther); } else blank('p1 legal status');
    set('p1_cipro_reg_number', f.registrationNumber);
    if (f.commencementDate) set('p1_date_commencement_trading', f.commencementDate); else blank('p1 date of commencement of trading');
    if (f.financialYearEnd) set('p1_financial_year_end', f.financialYearEnd); else blank('p1 financial year end');
    if (f.incomeTaxNumber) set('p1_income_tax_number', f.incomeTaxNumber); else blank('p1 income tax number');
    if (f.vatNumber) set('p1_vat_registration_number', f.vatNumber); else blank('p1 VAT number');
    for (const r of f.regulatedBy || []) tick(`p1_regulated_${r}`);
    if (f.regulatedBy?.includes('other')) set('p1_regulated_other_specify', f.regulatedOther);
    setAddress({ l1: 'p1_physical_address_line1', l2: 'p1_physical_address_line2', city: 'p1_physical_address_line3_city', code: 'p1_physical_postal_code' }, f.physicalAddress);
    if (f.postalAddress) setAddress({ l1: 'p1_postal_address_line1', l2: 'p1_postal_address_line2', city: 'p1_postal_address_line3_city', code: 'p1_postal_code' }, f.postalAddress);
    else blank('p1 postal address');
    if (f.telephone) setPhone('p1_tel_code', 'p1_telephone_number', f.telephone); else blank('p1 telephone');
    setPhone('p1_fax_code', 'p1_fax_number', f.fax);
    if (f.email) set('p1_email_address', f.email); else blank('p1 email');

    // ---- Part 2
    set('p2_contact_title', f.contactTitle);
    const cn = splitName(f.contactName);
    set('p2_contact_name', cn.first); set('p2_contact_surname', cn.last || cn.first);
    set('p2_contact_initials', cn.first.split(' ').map(s => s[0]).filter(Boolean).join('.').toUpperCase());
    setPhone('p2_contact_tel_code', 'p2_contact_tel_number', f.contactPhone);
    setPhone('p2_contact_cell_code', 'p2_contact_cell_number', f.contactCell);
    setPhone('p2_contact_fax_code', 'p2_contact_fax_number', f.contactFax);
    set('p2_contact_email', f.contactEmail);

    // Accounting officer / auditor = My Accountant (firm constants)
    set('p2_auditor_firm_name', FIRM.nameTitle);
    set('p2_auditor_individual_name', FIRM.signatory);
    set('p2_auditor_physical_address_line1', FIRM.addressLine1); set('p2_auditor_physical_address_line2', FIRM.addressLine2);
    set('p2_auditor_physical_city', FIRM.city); set('p2_auditor_physical_postal_code', FIRM.postalCode);
    set('p2_auditor_postal_address_line1', FIRM.addressLine1); set('p2_auditor_postal_address_line2', FIRM.addressLine2);
    set('p2_auditor_postal_city', FIRM.city); set('p2_auditor_postal_code', FIRM.postalCode);
    setPhone('p2_auditor_tel_code', 'p2_auditor_tel_number', FIRM.tel);
    set('p2_auditor_email', FIRM.email);
    set('p2_auditor_practice_number', FIRM.practiceNumber);
    set('p2_auditor_professional_body', FIRM.professionalBody);

    if (f.complianceOfficer) {
      const c = f.complianceOfficer;
      set('p2_compliance_officer_name', c.name); setPhone('p2_compliance_tel_code', 'p2_compliance_tel_number', c.phone);
      setPhone('p2_compliance_fax_code', 'p2_compliance_fax_number', c.fax); set('p2_compliance_email', c.email); set('p2_compliance_firm_name', c.firmName);
      setAddress({ l1: 'p2_compliance_postal_address_line1', l2: 'p2_compliance_postal_address_line2', city: 'p2_compliance_postal_city', code: 'p2_compliance_postal_code' }, c.postalAddress);
      setPhone('p2_compliance_external_tel_code', 'p2_compliance_external_tel_number', c.externalPhone);
    } else blank('p2 compliance officer');

    if (f.products?.length) { for (const p of f.products) tick(`p2_product_${p}`); } else blank('p2 credit products');
    (f.productsOther || []).forEach((p, i) => set(`p2_product_other_specify_${i + 1}`, p));

    // ---- Part 3
    for (const a of f.ancillaryServices || []) tick(`p3_ancillary_${a}`);
    if (f.ancillaryServices?.includes('other')) set('p3_ancillary_other_specify', f.ancillaryOther);
    if (f.languages?.length) {
      f.languages.forEach((l, i) => { set(`p3_language_area${i + 1}_desc`, l.area); set(`p3_language_area${i + 1}_lang1`, l.language1); set(`p3_language_area${i + 1}_lang2`, l.language2); });
    } else blank('p3 languages / areas of operation');
    setLines('p3_bbbee_commitments_line', f.bbbeeCommitments, 5);
    if (!f.bbbeeCommitments?.length) blank('p3 B-BBEE commitments');
    setLines('p3_overindebtedness_commitments_line', f.overIndebtednessCommitments, 5);
    if (!f.overIndebtednessCommitments?.length) blank('p3 over-indebtedness commitments');
    if (f.financials) {
      set('p3_fin_net_loan_book_value', f.financials.netLoanBookValue); set('p3_fin_total_agreements_count', f.financials.totalAgreementsCount);
      set('p3_fin_total_principal_debt_value', f.financials.totalPrincipalDebtValue); set('p3_fin_agreements_during_year_count', f.financials.agreementsDuringYearCount);
    } else blank('p3 financial information');

    // ---- Part 4
    const ctl = f.controls || {};
    const ctlMap: Array<[boolean | undefined, string, string]> = [
      [ctl.creditBureau, 'p4_control_credit_bureau', 'credit bureau'], [ctl.debtCollection, 'p4_control_debt_collection', 'debt collection'],
      [ctl.adrAgent, 'p4_control_adr_agent', 'ADR agent'], [ctl.creditRepair, 'p4_control_credit_repair', 'credit repair'],
    ];
    for (const [v, base, label] of ctlMap) { if (v === undefined) blank(`p4 control of ${label} (yes/no)`); else tick(`${base}_${v ? 'yes' : 'no'}`); }
    setLines('p4_control_details_line', ctl.details, 2);
    set('p4_premises_total_count', f.premisesTotalCount); set('p4_premises_normal_credit_count', f.premisesNormalCreditCount); set('p4_premises_dev_credit_count', f.premisesDevCreditCount);
    if (!f.premisesTotalCount) blank('p4 premises counts');
    if (f.premises?.length) {
      f.premises.forEach((p, i) => {
        const n = i + 1;
        set(`p4_premise${n}_trading_name`, p.tradingName);
        setAddress({ l1: `p4_premise${n}_address_line1`, l2: `p4_premise${n}_address_line2`, city: `p4_premise${n}_city`, code: `p4_premise${n}_postal_code` }, p.address);
        set(`p4_premise${n}_contact_person`, p.contactPerson); setPhone(`p4_premise${n}_tel_code`, `p4_premise${n}_tel_number`, p.phone);
        setPhone(`p4_premise${n}_fax_code`, `p4_premise${n}_fax_number`, p.fax); set(`p4_premise${n}_email`, p.email);
      });
    } else blank('p4 premises details');

    // ---- Part 5
    for (const d of f.developmentalCreditTypes || []) tick(`p5_dev_type_${d}`);
    if (f.developmentalCreditTypes?.includes('other')) set('p5_dev_type_other_specify', f.developmentalCreditOther);
    set('p5_rep_name', f.representativeName);
    if (f.representativeCapacity) set('p5_rep_capacity', f.representativeCapacity); else blank('p5 representative capacity');
    set('p5_rep_date', formatDateShort(options.date));

    // ---- Part 6 & 7 — natural person declarations
    set('p6_person_name', f.representativeName);
    set('p6_person_id_number', f.representativeIdNumber);
    set('p6_person_date', formatDateShort(options.date));
    const dec = f.declarations || {};
    for (const [key, base, label] of DECLARATIONS) {
      const v = dec[key];
      if (typeof v !== 'boolean') blank(`p6/p7 declaration ${label} (yes/no)`);
      else tick(`${base}_${v ? 'yes' : 'no'}`);
    }
    setLines('p6_q7_details_line', dec.fraudDetails, 4);
    setLines('p6_q8_details_line', dec.violenceDetails, 4);
    setLines('p7_q9_details_line', dec.ncaDetails, 4);
    set('p7_cert_date', formatDateShort(options.date));
    // p5_rep_signature / p7_cert_signature are always left blank (client signs by hand).

    if (typeof (form as any).updateFieldAppearances === 'function') form.updateFieldAppearances();
    const fonts = await embedFonts(pdf);
    if (!options.signed) drawDraftWatermark(pdf, fonts);
    const buffer = Buffer.from(await pdf.save());
    return { buffer, fileName: `NCR_Form_2_${safeFileName(f.applicantName)}${f.orderId ? `_${f.orderId}` : ''}.pdf`, warnings, pageCount: pdf.getPageCount() };
  },
  suggestFields(ctx: OrderDocumentContext): Partial<NcrForm2Fields> {
    const out: Partial<NcrForm2Fields> = {};
    const e = ctx.entity;
    if (e.entityName) { out.applicantName = e.entityName; }
    if (e.registrationNumber) out.registrationNumber = e.registrationNumber;
    if (e.taxNumber) out.incomeTaxNumber = e.taxNumber;
    if (e.address) out.physicalAddress = { line1: ansi(e.address) };
    const phone = answer(ctx, 'telephone') || e.phone;
    const email = answer(ctx, 'email') || e.email;
    if (phone) { out.telephone = phone; out.contactPhone = phone; }
    if (email) { out.email = email; out.contactEmail = email; }
    const contact = e.orderingContactName || e.directorName;
    if (contact) out.contactName = contact;
    if (e.directorName) out.representativeName = e.directorName;
    if (e.idNumber) out.representativeIdNumber = e.idNumber;
    const lang = answer(ctx, 'language');
    const area = answer(ctx, 'area of operation');
    if (lang && area) out.languages = [{ area, language1: lang }];
    if (ctx.orderNumber) out.orderId = ctx.orderNumber;
    return out;
  },
};
