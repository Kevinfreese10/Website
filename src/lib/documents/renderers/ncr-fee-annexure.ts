/**
 * NCR Annexure — Confirmation of Fees (AcroForm fill of the official fillable PDF).
 * Signature: client (representative signs by hand). Fee amounts are supplied, never assumed.
 */
import { z } from 'zod';
import { PDFDocument } from 'pdf-lib';
import { checkBox, drawDraftWatermark, embedFonts, formatDateShort, loadTemplateBytes, safeFileName, setTextField } from '../helpers';
import { answer } from '../context';
import { MissingFieldsError, type OrderDocumentContext, type TemplateDefinition } from '../types';

const SOURCE = 'NCR_Annexure_Confirmation_of_Fees_Fillable.pdf';

const schema = z.object({
  applicantName: z.string().min(1),
  registrationNumber: z.string().min(1),
  /** Total amount paid, e.g. "R 1,800.00". */
  feeAmount: z.string().min(1),
  /** Date of payment (dd/mm/yyyy or free text as it should appear on the form). */
  paymentDate: z.string().min(1),
  paymentReference: z.string().min(1),
  paymentMethod: z.enum(['direct_deposit', 'electronic_transfer', 'cheque_attached', 'cheque_registered_mail']).optional(),
  applicationNumber: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  /** Fee breakdown as it should appear in the fee table; left blank when not supplied. */
  feeBreakdown: z.object({
    applicationFee: z.string().optional(),
    principalDebtDate: z.string().optional(),
    principalDebtAmount: z.string().optional(),
    initialRegistrationFee: z.string().optional(),
    branchesCount: z.string().optional(),
    branchesFee: z.string().optional(),
  }).optional(),
  signatoryName: z.string().min(1),
  signatoryCapacity: z.string().min(1),
  orderId: z.string().optional(),
});
export type NcrFeeAnnexureFields = z.infer<typeof schema>;

export const ncrFeeAnnexure: TemplateDefinition<NcrFeeAnnexureFields> = {
  id: 'ncr_fee_annexure',
  title: 'NCR Annexure - Confirmation of Fees',
  description: 'Fills the official NCR confirmation-of-fees annexure with the application fee actually paid. Representative signs by hand.',
  category: 'statutory_form',
  signature: 'client',
  schema,
  sourceFile: SOURCE,
  fieldLabels: {
    applicantName: 'Credit provider / applicant name', registrationNumber: 'Registration number', feeAmount: 'Total fee amount paid', paymentDate: 'Payment date',
    paymentReference: 'Payment reference', paymentMethod: 'Payment method', applicationNumber: 'NCR application number', contactName: 'Contact person',
    contactPhone: 'Contact telephone', feeBreakdown: 'Fee breakdown (application / initial registration / branches)', signatoryName: 'Signatory full name',
    signatoryCapacity: 'Signatory designation', orderId: 'Order number',
  },
  async render(fields, options) {
    const parsed = schema.safeParse(fields);
    if (!parsed.success) throw new MissingFieldsError('ncr_fee_annexure', parsed.error.issues.map(i => i.path.join('.')));
    const f = parsed.data;
    const warnings: string[] = [];

    const pdf = await PDFDocument.load(loadTemplateBytes(SOURCE), { ignoreEncryption: true });
    const form = pdf.getForm();
    const set = (name: string, value: string | undefined | null) => { if (!setTextField(form, name, value)) warnings.push(`AcroForm field ${name} not found in ${SOURCE}`); };

    set('credit_provider_name', `${f.applicantName} (Reg No: ${f.registrationNumber})`);
    if (f.applicationNumber) set('application_number', f.applicationNumber); else warnings.push('NCR application number not supplied - left blank');
    set('application_date', formatDateShort(options.date));
    if (f.contactName) set('contact_person_name', f.contactName); else warnings.push('Contact person not supplied - left blank');
    if (f.contactPhone) set('contact_telephone_number', f.contactPhone); else warnings.push('Contact telephone not supplied - left blank');
    set('amount_paid_rands', f.feeAmount);
    if (f.paymentMethod) { if (!checkBox(form, `pay_method_${f.paymentMethod}`)) warnings.push(`AcroForm checkbox pay_method_${f.paymentMethod} not found`); }
    else warnings.push('Payment method not supplied - no payment-method box ticked');
    // The form's only free-text reference cell is the cheque/tracking field; the payment reference is recorded there.
    set('cheque_tracking_number', `Ref: ${f.paymentReference} (paid ${f.paymentDate})`);

    const b = f.feeBreakdown;
    if (b) {
      set('fee_application_amount', b.applicationFee); set('fee_principal_debt_date', b.principalDebtDate); set('fee_principal_debt_amount', b.principalDebtAmount);
      set('fee_initial_reg_amount', b.initialRegistrationFee); set('fee_branches_count', b.branchesCount); set('fee_branches_amount', b.branchesFee);
    } else warnings.push('Fee breakdown not supplied - fee table rows left blank (total only)');
    set('fee_total_amount', f.feeAmount);

    set('declaration_date', formatDateShort(options.date));
    set('representative_name', f.signatoryName);
    set('representative_designation', f.signatoryCapacity);
    // representative_signature stays blank: the client signs by hand.

    if (typeof (form as any).updateFieldAppearances === 'function') form.updateFieldAppearances();
    const fonts = await embedFonts(pdf);
    if (!options.signed) drawDraftWatermark(pdf, fonts);
    const buffer = Buffer.from(await pdf.save());
    return { buffer, fileName: `NCR_Fee_Annexure_${safeFileName(f.applicantName)}${f.orderId ? `_${f.orderId}` : ''}.pdf`, warnings, pageCount: pdf.getPageCount() };
  },
  suggestFields(ctx: OrderDocumentContext): Partial<NcrFeeAnnexureFields> {
    const out: Partial<NcrFeeAnnexureFields> = {};
    const e = ctx.entity;
    if (e.entityName) out.applicantName = e.entityName;
    if (e.registrationNumber) out.registrationNumber = e.registrationNumber;
    const contact = e.orderingContactName || e.directorName;
    if (contact) out.contactName = contact;
    const phone = answer(ctx, 'telephone') || e.phone;
    if (phone) out.contactPhone = phone;
    if (e.directorName) out.signatoryName = e.directorName;
    if (ctx.orderNumber) out.orderId = ctx.orderNumber;
    return out;
  },
};
