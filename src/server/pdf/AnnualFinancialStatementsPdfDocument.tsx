import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { AnnualFinancialStatementsData } from '@/lib/afs-types';

const formatRand = (amount?: number, blankIfZero = false) => {
  if (amount === undefined || amount === 0 || isNaN(amount)) {
    if (blankIfZero) return '';
    return '-';
  }
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-ZA', { maximumFractionDigits: 0, minimumFractionDigits: 0 });
  return isNegative ? `(${formatted})` : formatted;
};

const formatRandExact = (amount: number) => {
  if (amount === 0) return '0';
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-ZA', { maximumFractionDigits: 0, minimumFractionDigits: 0 });
  return isNegative ? `(${formatted})` : formatted;
};

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    paddingTop: 45,
    paddingBottom: 45,
    paddingHorizontal: 45,
    backgroundColor: '#FFFFFF',
    color: '#000000',
    lineHeight: 1.3,
  },
  coverPage: {
    fontFamily: 'Helvetica',
    padding: 45,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  coverCompanyName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  coverRegNumber: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 6,
  },
  coverTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica',
    textAlign: 'center',
    marginBottom: 2,
  },
  coverPeriod: {
    fontSize: 10,
    textAlign: 'center',
  },
  pageHeader: {
    marginBottom: 16,
  },
  headerCompanyName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 1,
  },
  headerRegNumber: {
    fontSize: 8,
    color: '#333',
    marginBottom: 1,
  },
  headerPeriod: {
    fontSize: 8,
    color: '#333',
    marginBottom: 8,
  },
  pageTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    paddingBottom: 4,
    borderBottomWidth: 1.5,
    borderBottomColor: '#000000',
    marginBottom: 16,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 25,
    left: 45,
    right: 45,
    textAlign: 'center',
    fontSize: 8,
    color: '#000000',
  },
  footerDisclaimer: {
    position: 'absolute',
    bottom: 25,
    left: 45,
    right: 45,
    textAlign: 'center',
    fontSize: 7.5,
    color: '#555',
  },
  generalInfoRow: {
    flexDirection: 'row',
    marginBottom: 9,
  },
  generalInfoLabel: {
    width: '42%',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  generalInfoValue: {
    width: '58%',
    fontSize: 9,
    lineHeight: 1.35,
  },
  indexRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    fontSize: 9,
  },
  indexSectionHeader: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    marginTop: 14,
    marginBottom: 6,
  },
  statementTable: {
    width: '100%',
    marginTop: 6,
  },
  statementHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 3,
    marginBottom: 4,
  },
  statementColDesc: {
    width: '68%',
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
  },
  statementColNote: {
    width: '12%',
    textAlign: 'center',
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
  },
  statementColYear: {
    width: '20%',
    textAlign: 'right',
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
  },
  sectionTitleRow: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginTop: 6,
    marginBottom: 2,
  },
  lineRow: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  lineDesc: {
    width: '68%',
    fontSize: 8.5,
    paddingLeft: 4,
  },
  lineNote: {
    width: '12%',
    textAlign: 'center',
    fontSize: 8.5,
  },
  lineAmount: {
    width: '20%',
    textAlign: 'right',
    fontSize: 8.5,
  },
  subtotalRow: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: '#000',
    paddingTop: 2,
    paddingBottom: 2,
    marginTop: 2,
  },
  totalRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1.5,
    borderColor: '#000',
    paddingTop: 2,
    paddingBottom: 2,
    marginTop: 3,
    marginBottom: 4,
  },
  totalDesc: {
    width: '80%',
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
  },
  totalAmount: {
    width: '20%',
    textAlign: 'right',
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
  },
  paragraph: {
    fontSize: 8.5,
    lineHeight: 1.4,
    marginBottom: 10,
    textAlign: 'justify',
  },
  bulletPoint: {
    fontSize: 8.5,
    lineHeight: 1.35,
    marginBottom: 6,
    paddingLeft: 12,
  },
  noteHeader: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginTop: 10,
    marginBottom: 4,
  },
  noteText: {
    fontSize: 8.5,
    lineHeight: 1.35,
    marginBottom: 6,
    color: '#222',
  },
  signatureLine: {
    marginTop: 35,
    width: 200,
    borderTopWidth: 1,
    borderTopColor: '#000',
    paddingTop: 4,
  },
});

interface AfsPdfProps {
  data: AnnualFinancialStatementsData;
}

export const AnnualFinancialStatementsPdfDocument: React.FC<AfsPdfProps> = ({ data }) => {
  const {
    generalInfo,
    directorsResponsibilities,
    accountingOfficerReport,
    directorsReport,
    accountingPolicies,
    sectionToggles,
    statementOfFinancialPosition,
    statementOfComprehensiveIncome,
    statementOfChangesInEquity,
    statementOfCashFlows,
    notes,
    detailedIncomeStatement,
  } = data;

  const currentYear = new Date(generalInfo.financialYearEndedDateIso || generalInfo.financialYearEndedDate || '2026-03-31').getFullYear() || 2026;
  const priorYear = currentYear - 1;
  const isProfitable = (statementOfComprehensiveIncome.profitOrLossForTheYear?.currentAmount || 0) >= 0;

  return (
    <Document title={`Financial Statements - ${generalInfo.companyName} - ${generalInfo.financialYearEndedDate}`}>
      {/* PAGE 1: COVER PAGE */}
      <Page size="A4" style={styles.page}>
        <View style={styles.coverPage}>
          <Text style={styles.coverCompanyName}>{generalInfo.companyName}</Text>
          <Text style={styles.coverRegNumber}>(Registration number {generalInfo.registrationNumber})</Text>
          <Text style={styles.coverTitle}>Financial Statements</Text>
          <Text style={styles.coverPeriod}>for the year ended {generalInfo.financialYearEndedDate}</Text>
        </View>
      </Page>

      {/* PAGE 2: GENERAL INFORMATION */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader}>
          <Text style={styles.headerCompanyName}>{generalInfo.companyName}</Text>
          <Text style={styles.headerRegNumber}>(Registration number: {generalInfo.registrationNumber})</Text>
          <Text style={styles.headerPeriod}>Financial Statements for the year ended {generalInfo.financialYearEndedDate}</Text>
          <Text style={styles.pageTitle}>General Information</Text>
        </View>

        <View style={{ marginTop: 10 }}>
          <View style={styles.generalInfoRow}>
            <Text style={styles.generalInfoLabel}>Country of incorporation and domicile</Text>
            <Text style={styles.generalInfoValue}>{generalInfo.countryOfIncorporation}</Text>
          </View>

          <View style={styles.generalInfoRow}>
            <Text style={styles.generalInfoLabel}>Nature of business and principal activities</Text>
            <Text style={styles.generalInfoValue}>{generalInfo.natureOfBusiness}</Text>
          </View>

          <View style={styles.generalInfoRow}>
            <Text style={styles.generalInfoLabel}>Directors</Text>
            <View style={styles.generalInfoValue}>
              {generalInfo.directors.map((d, i) => (
                <Text key={i} style={{ marginBottom: 2 }}>{d.name}</Text>
              ))}
            </View>
          </View>

          <View style={styles.generalInfoRow}>
            <Text style={styles.generalInfoLabel}>Registered office</Text>
            <Text style={styles.generalInfoValue}>{generalInfo.registeredOffice}</Text>
          </View>

          <View style={styles.generalInfoRow}>
            <Text style={styles.generalInfoLabel}>Business address</Text>
            <Text style={styles.generalInfoValue}>{generalInfo.businessAddress}</Text>
          </View>

          {generalInfo.holdingCompany && (
            <View style={styles.generalInfoRow}>
              <Text style={styles.generalInfoLabel}>Holding company</Text>
              <Text style={styles.generalInfoValue}>{generalInfo.holdingCompany}</Text>
            </View>
          )}

          <View style={styles.generalInfoRow}>
            <Text style={styles.generalInfoLabel}>{generalInfo.assuranceLevel === 'audited' ? 'Auditors' : 'Accounting Officer / Compiler'}</Text>
            <View style={styles.generalInfoValue}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>{generalInfo.auditorOrPractitionerFirm}</Text>
              <Text style={{ color: '#444' }}>{generalInfo.auditorOrPractitionerTitle}</Text>
            </View>
          </View>

          <View style={styles.generalInfoRow}>
            <Text style={styles.generalInfoLabel}>Company registration number</Text>
            <Text style={styles.generalInfoValue}>{generalInfo.registrationNumber}</Text>
          </View>

          <View style={styles.generalInfoRow}>
            <Text style={styles.generalInfoLabel}>Level of assurance</Text>
            <Text style={styles.generalInfoValue}>
              {generalInfo.assuranceLevel === 'audited'
                ? 'These financial statements have been audited in compliance with the applicable requirements of the Companies Act of South Africa.'
                : 'These financial statements have been compiled in accordance with the International Standard on Related Services (ISRS 4410) and the Companies Act of South Africa.'}
            </Text>
          </View>

          <View style={styles.generalInfoRow}>
            <Text style={styles.generalInfoLabel}>Preparer</Text>
            <View style={styles.generalInfoValue}>
              <Text>The financial statements were internally compiled by:</Text>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>{generalInfo.preparerName}</Text>
              <Text style={{ color: '#444' }}>{generalInfo.preparerDesignation}</Text>
            </View>
          </View>

          <View style={styles.generalInfoRow}>
            <Text style={styles.generalInfoLabel}>Issued</Text>
            <Text style={styles.generalInfoValue}>{generalInfo.issuedDate}</Text>
          </View>
        </View>

        <Text style={styles.pageNumber}>1</Text>
      </Page>

      {/* PAGE 3: INDEX */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader}>
          <Text style={styles.headerCompanyName}>{generalInfo.companyName}</Text>
          <Text style={styles.headerRegNumber}>(Registration number: {generalInfo.registrationNumber})</Text>
          <Text style={styles.headerPeriod}>Financial Statements for the year ended {generalInfo.financialYearEndedDate}</Text>
          <Text style={styles.pageTitle}>Index</Text>
        </View>

        <Text style={{ fontSize: 9, marginBottom: 12 }}>
          The reports and statements set out below comprise the financial statements presented to the shareholder:
        </Text>

        <View style={{ marginTop: 8 }}>
          <View style={styles.indexRow}>
            <Text>Directors' Responsibilities and Approval</Text>
            <Text>3</Text>
          </View>
          <View style={styles.indexRow}>
            <Text>{generalInfo.assuranceLevel === 'audited' ? "Independent Auditor's Report" : "Report of the Accounting Officer"}</Text>
            <Text>4 - 6</Text>
          </View>
          <View style={styles.indexRow}>
            <Text>Directors' Report</Text>
            <Text>7 - 8</Text>
          </View>
          <View style={styles.indexRow}>
            <Text>Statement of Financial Position</Text>
            <Text>9</Text>
          </View>
          <View style={styles.indexRow}>
            <Text>Statement of Profit or Loss and Other Comprehensive Income</Text>
            <Text>10</Text>
          </View>
          <View style={styles.indexRow}>
            <Text>Statement of Changes in Equity</Text>
            <Text>11</Text>
          </View>
          <View style={styles.indexRow}>
            <Text>Statement of Cash Flows</Text>
            <Text>12</Text>
          </View>
          <View style={styles.indexRow}>
            <Text>Accounting Policies</Text>
            <Text>13</Text>
          </View>
          <View style={styles.indexRow}>
            <Text>Notes to the Financial Statements</Text>
            <Text>14 - 15</Text>
          </View>

          <Text style={styles.indexSectionHeader}>
            The following supplementary information does not form part of the financial statements and is unaudited:
          </Text>
          <View style={styles.indexRow}>
            <Text>Detailed Income Statement</Text>
            <Text>16</Text>
          </View>
        </View>

        <Text style={styles.pageNumber}>2</Text>
      </Page>

      {/* PAGE 4: DIRECTORS' RESPONSIBILITIES AND APPROVAL */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader}>
          <Text style={styles.headerCompanyName}>{generalInfo.companyName}</Text>
          <Text style={styles.headerRegNumber}>(Registration number: {generalInfo.registrationNumber})</Text>
          <Text style={styles.headerPeriod}>Financial Statements for the year ended {generalInfo.financialYearEndedDate}</Text>
          <Text style={styles.pageTitle}>Directors' Responsibilities and Approval</Text>
        </View>

        <Text style={styles.paragraph}>
          The directors are required by the Companies Act of South Africa, to maintain adequate accounting records and are responsible for the content and integrity of the financial statements and related financial information included in this report. It is their responsibility to ensure that the financial statements fairly present the state of affairs of the company as at the end of the financial year and the results of its operations and cash flows for the period then ended, in conformity with the IFRS for SMEs® Accounting Standard as issued by the International Accounting Standards Board (IASB).
        </Text>

        <Text style={styles.paragraph}>
          The financial statements are prepared in accordance with the requirements of IFRS for SMEs Accounting Standards and the requirements of the Companies Act of South Africa and are based upon appropriate accounting policies consistently applied and supported by reasonable and prudent judgements and estimates.
        </Text>

        <Text style={styles.paragraph}>
          The directors acknowledge that they are ultimately responsible for the system of internal financial control established by the company and place considerable importance on maintaining a strong control environment. To enable the directors to meet these responsibilities, the directors set standards for internal control aimed at reducing the risk of error or loss in a cost effective manner.
        </Text>

        <Text style={styles.paragraph}>
          The directors are of the opinion, based on the information and explanations given by management, that the system of internal control provides reasonable assurance that the financial records may be relied on for the preparation of the financial statements.
        </Text>

        <Text style={styles.paragraph}>
          The directors have reviewed the company’s cash flow forecast for the year to {generalInfo.financialYearEndedDate} and, in the light of this review and the current financial position, they are satisfied that the company has or has access to adequate resources to continue in operational existence for the foreseeable future.
        </Text>

        <Text style={styles.paragraph}>
          The financial statements set out on pages 9 to 16, which have been prepared on the going concern basis, were approved by the directors on {generalInfo.issuedDate} and were signed on their behalf by:
        </Text>

        <View style={{ marginTop: 25 }}>
          <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', marginBottom: 20 }}>Approval of financial statements</Text>
          <View style={styles.signatureLine}>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>{generalInfo.directors[0]?.name || generalInfo.preparerName}</Text>
            <Text style={{ fontSize: 8, color: '#555' }}>Director</Text>
          </View>
        </View>

        <Text style={styles.pageNumber}>3</Text>
      </Page>

      {/* PAGE 5: INDEPENDENT AUDITOR'S / ACCOUNTING OFFICER'S REPORT */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader}>
          <Text style={styles.headerCompanyName}>{generalInfo.auditorOrPractitionerFirm}</Text>
          <Text style={styles.headerPeriod}>{generalInfo.auditorOrPractitionerAddress}</Text>
          <Text style={styles.pageTitle}>{generalInfo.assuranceLevel === 'audited' ? "Independent Auditor's Report" : "Report of the Accounting Officer"}</Text>
        </View>

        <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 8 }}>
          To the Shareholder of {generalInfo.companyName}
        </Text>

        <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 3 }}>Opinion / Conclusion</Text>
        <Text style={styles.paragraph}>
          We have audited the financial statements of {generalInfo.companyName} set out on pages 9 to 15, which comprise the statement of financial position as at {generalInfo.financialYearEndedDate}, and the statement of profit or loss and other comprehensive income, the statement of changes in equity and the statement of cash flows for the year then ended, and notes to the financial statements, including a summary of material accounting policies.
        </Text>
        <Text style={styles.paragraph}>
          In our opinion, the financial statements present fairly, in all material respects, the financial position of {generalInfo.companyName} as at {generalInfo.financialYearEndedDate}, and its financial performance and cash flows for the year then ended in accordance with The IFRS for SMEs® Accounting Standard and the requirements of the Companies Act of South Africa.
        </Text>

        <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 3 }}>Basis for Opinion</Text>
        <Text style={styles.paragraph}>
          We conducted our audit in accordance with International Standards on Auditing (ISAs). Our responsibilities under those standards are further described in the Auditor's Responsibilities section of our report. We are independent of the company in accordance with the Independent Regulatory Board for Auditors’ Code of Professional Conduct for Registered Auditors (IRBA Code). We believe that the audit evidence we have obtained is sufficient and appropriate to provide a basis for our opinion.
        </Text>

        <Text style={styles.pageNumber}>4</Text>
      </Page>

      {/* PAGE 6: REPORT CONTINUED */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>{generalInfo.assuranceLevel === 'audited' ? "Independent Auditor's Report (Continued)" : "Report of the Accounting Officer"}</Text>
        </View>

        <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 3 }}>Responsibilities of the Directors for the Financial Statements</Text>
        <Text style={styles.paragraph}>
          The directors are responsible for the preparation and fair presentation of the financial statements in accordance with IFRS for SMEs Accounting Standard and the requirements of the Companies Act of South Africa, and for such internal control as the directors determine is necessary to enable the preparation of financial statements that are free from material misstatement, whether due to fraud or error.
        </Text>
        <Text style={styles.paragraph}>
          In preparing the financial statements, the directors are responsible for assessing the company’s ability to continue as a going concern, disclosing, as applicable, matters related to going concern and using the going concern basis of accounting.
        </Text>

        <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 3 }}>Auditor’s Responsibilities for the Audit of the Financial Statements</Text>
        <Text style={styles.paragraph}>
          Our objectives are to obtain reasonable assurance about whether the financial statements as a whole are free from material misstatement, whether due to fraud or error, and to issue an auditor’s report that includes our opinion.
        </Text>
        <Text style={styles.bulletPoint}>• Identify and assess the risks of material misstatement of the financial statements, whether due to fraud or error.</Text>
        <Text style={styles.bulletPoint}>• Obtain an understanding of internal control relevant to the audit in order to design audit procedures that are appropriate in the circumstances.</Text>
        <Text style={styles.bulletPoint}>• Evaluate the appropriateness of accounting policies used and the reasonableness of accounting estimates made by the directors.</Text>
        <Text style={styles.bulletPoint}>• Conclude on the appropriateness of the directors' use of the going concern basis of accounting.</Text>

        <Text style={styles.pageNumber}>5</Text>
      </Page>

      {/* PAGE 7: REPORT SIGN-OFF */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>{generalInfo.assuranceLevel === 'audited' ? "Independent Auditor's Report (Sign-off)" : "Report of the Accounting Officer"}</Text>
        </View>

        <Text style={styles.paragraph}>
          We communicate with the directors regarding, among other matters, the planned scope and timing of the audit and significant audit findings, including any significant deficiencies in internal control that we identify during our audit.
        </Text>

        <View style={{ marginTop: 35 }}>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>{generalInfo.auditorOrPractitionerFirm}</Text>
          <Text style={{ fontSize: 8.5, color: '#444' }}>{generalInfo.auditorOrPractitionerTitle}</Text>
          <Text style={{ fontSize: 8.5, marginTop: 10 }}>Per: {generalInfo.leadPartnerName || 'Director'}</Text>
          <Text style={{ fontSize: 8.5, color: '#555' }}>{generalInfo.leadPartnerTitle || 'Registered Auditor'}</Text>
          <Text style={{ fontSize: 8.5, marginTop: 12 }}>{generalInfo.auditorOrPractitionerAddress}</Text>
          <Text style={{ fontSize: 8.5, marginTop: 6, fontFamily: 'Helvetica-Bold' }}>{generalInfo.issuedDate}</Text>
        </View>

        <Text style={styles.pageNumber}>6</Text>
      </Page>

      {/* PAGE 8: DIRECTORS' REPORT */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader}>
          <Text style={styles.headerCompanyName}>{generalInfo.companyName}</Text>
          <Text style={styles.headerRegNumber}>(Registration number: {generalInfo.registrationNumber})</Text>
          <Text style={styles.headerPeriod}>Financial Statements for the year ended {generalInfo.financialYearEndedDate}</Text>
          <Text style={styles.pageTitle}>Directors' Report</Text>
        </View>

        <Text style={styles.paragraph}>
          The directors have pleasure in submitting their report on the financial statements of {generalInfo.companyName} for the year ended {generalInfo.financialYearEndedDate}.
        </Text>

        <Text style={styles.noteHeader}>1. Nature of business</Text>
        <Text style={styles.paragraph}>
          {generalInfo.companyName} was incorporated in South Africa with interests in the {generalInfo.natureOfBusiness} industry. The company operates in South Africa.
        </Text>

        <Text style={styles.noteHeader}>2. Review of financial results and activities</Text>
        <Text style={styles.paragraph}>{directorsReport.reviewOfActivities}</Text>

        <Text style={styles.noteHeader}>3. Share capital</Text>
        <View style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
            <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold' }}>Authorised</Text>
            <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold' }}>Number of shares</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontSize: 8.5 }}>{notes.note3ShareCapital.authorisedShares}</Text>
            <Text style={{ fontSize: 8.5 }}>1 000</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 0.5, paddingTop: 3 }}>
            <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold' }}>Issued</Text>
            <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold' }}>R {formatRand(notes.note3ShareCapital.issuedAmount.current)}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ fontSize: 8.5 }}>{notes.note3ShareCapital.issuedShares}</Text>
            <Text style={{ fontSize: 8.5 }}>100</Text>
          </View>
        </View>

        <Text style={styles.noteHeader}>4. Directors</Text>
        <Text style={{ fontSize: 8.5, marginBottom: 4 }}>The directors in office at the date of this report are as follows:</Text>
        <View style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', borderBottomWidth: 0.5, paddingBottom: 2, marginBottom: 3 }}>
            <Text style={{ width: '40%', fontSize: 8.5, fontFamily: 'Helvetica-Bold' }}>Directors</Text>
            <Text style={{ width: '30%', fontSize: 8.5, fontFamily: 'Helvetica-Bold' }}>Designation</Text>
            <Text style={{ width: '30%', fontSize: 8.5, fontFamily: 'Helvetica-Bold' }}>Changes</Text>
          </View>
          {generalInfo.directors.map((d, i) => (
            <View key={i} style={{ flexDirection: 'row', paddingVertical: 2 }}>
              <Text style={{ width: '40%', fontSize: 8.5 }}>{d.name}</Text>
              <Text style={{ width: '30%', fontSize: 8.5 }}>{d.designation}</Text>
              <Text style={{ width: '30%', fontSize: 8.5 }}>{d.changes || 'In office'}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.noteHeader}>5. Events after the reporting period</Text>
        <Text style={styles.paragraph}>{directorsReport.eventsAfterReportingPeriod}</Text>

        <Text style={styles.pageNumber}>7</Text>
      </Page>

      {/* PAGE 9: DIRECTORS' REPORT (CONTINUED) */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader}>
          <Text style={styles.headerCompanyName}>{generalInfo.companyName}</Text>
          <Text style={styles.headerRegNumber}>(Registration number: {generalInfo.registrationNumber})</Text>
          <Text style={styles.headerPeriod}>Financial Statements for the year ended {generalInfo.financialYearEndedDate}</Text>
          <Text style={styles.pageTitle}>Directors' Report (Continued)</Text>
        </View>

        <Text style={styles.noteHeader}>6. Going concern</Text>
        <Text style={styles.paragraph}>
          The financial statements have been prepared on the basis of accounting policies applicable to a going concern. This basis presumes that funds will be available to finance future operations and that the realisation of assets and settlement of liabilities, contingent obligations and commitments will occur in the ordinary course of business.
        </Text>
        <Text style={styles.paragraph}>{directorsReport.goingConcernText}</Text>

        <Text style={styles.noteHeader}>7. Auditors / Accounting Officer</Text>
        <Text style={styles.paragraph}>{directorsReport.auditorOrPractitionerContinuance}</Text>

        <Text style={styles.pageNumber}>8</Text>
      </Page>

      {/* PAGE 10: STATEMENT OF FINANCIAL POSITION */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader}>
          <Text style={styles.headerCompanyName}>{generalInfo.companyName}</Text>
          <Text style={styles.headerRegNumber}>(Registration number: {generalInfo.registrationNumber})</Text>
          <Text style={styles.headerPeriod}>Financial Statements for the year ended {generalInfo.financialYearEndedDate}</Text>
          <Text style={styles.pageTitle}>Statement of Financial Position as at {generalInfo.financialYearEndedDate}</Text>
        </View>

        <View style={styles.statementTable}>
          <View style={styles.statementHeaderRow}>
            <Text style={styles.statementColDesc}>Figures in Rand</Text>
            <Text style={styles.statementColNote}>Notes</Text>
            <Text style={styles.statementColYear}>{currentYear}</Text>
          </View>

          {/* ASSETS */}
          <Text style={styles.sectionTitleRow}>Assets</Text>
          <Text style={[styles.sectionTitleRow, { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#444' }]}>Current Assets</Text>
          {statementOfFinancialPosition.currentAssets.items.map((item, i) => (
            <View key={i} style={styles.lineRow}>
              <Text style={styles.lineDesc}>{item.name}</Text>
              <Text style={styles.lineNote}>{item.noteNumber || ''}</Text>
              <Text style={styles.lineAmount}>{formatRand(item.currentAmount)}</Text>
            </View>
          ))}
          <View style={styles.subtotalRow}>
            <Text style={styles.totalDesc}>Total Assets</Text>
            <Text style={styles.totalAmount}>{formatRand(statementOfFinancialPosition.totalAssets.current)}</Text>
          </View>

          {/* EQUITY AND LIABILITIES */}
          <Text style={[styles.sectionTitleRow, { marginTop: 14 }]}>Equity and Liabilities</Text>
          <Text style={[styles.sectionTitleRow, { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#444' }]}>Equity</Text>
          {statementOfFinancialPosition.equity.items.map((item, i) => (
            <View key={i} style={styles.lineRow}>
              <Text style={styles.lineDesc}>{item.name}</Text>
              <Text style={styles.lineNote}>{item.noteNumber || ''}</Text>
              <Text style={styles.lineAmount}>{formatRand(item.currentAmount)}</Text>
            </View>
          ))}
          <View style={styles.subtotalRow}>
            <Text style={styles.lineDesc}></Text>
            <Text style={styles.lineNote}></Text>
            <Text style={[styles.lineAmount, { fontFamily: 'Helvetica-Bold' }]}>{formatRand(statementOfFinancialPosition.equity.total.current)}</Text>
          </View>

          {/* LIABILITIES */}
          <Text style={[styles.sectionTitleRow, { marginTop: 10 }]}>Liabilities</Text>
          <Text style={[styles.sectionTitleRow, { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#444' }]}>Current Liabilities</Text>
          {statementOfFinancialPosition.currentLiabilities.items.map((item, i) => (
            <View key={i} style={styles.lineRow}>
              <Text style={styles.lineDesc}>{item.name}</Text>
              <Text style={styles.lineNote}>{item.noteNumber || ''}</Text>
              <Text style={styles.lineAmount}>{formatRand(item.currentAmount)}</Text>
            </View>
          ))}
          <View style={styles.subtotalRow}>
            <Text style={styles.totalDesc}>Total Liabilities</Text>
            <Text style={styles.totalAmount}>{formatRand(statementOfFinancialPosition.totalLiabilities.current)}</Text>
          </View>

          <View style={[styles.totalRow, { marginTop: 6 }]}>
            <Text style={styles.totalDesc}>Total Equity and Liabilities</Text>
            <Text style={styles.totalAmount}>{formatRand(statementOfFinancialPosition.totalEquityAndLiabilities.current)}</Text>
          </View>
        </View>

        <Text style={styles.pageNumber}>9</Text>
      </Page>

      {/* PAGE 11: STATEMENT OF COMPREHENSIVE INCOME */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader}>
          <Text style={styles.headerCompanyName}>{generalInfo.companyName}</Text>
          <Text style={styles.headerRegNumber}>(Registration number: {generalInfo.registrationNumber})</Text>
          <Text style={styles.headerPeriod}>Financial Statements for the year ended {generalInfo.financialYearEndedDate}</Text>
          <Text style={styles.pageTitle}>Statement of Profit or Loss and Other Comprehensive Income</Text>
        </View>

        <View style={styles.statementTable}>
          <View style={styles.statementHeaderRow}>
            <Text style={styles.statementColDesc}>Figures in Rand</Text>
            <Text style={styles.statementColNote}>Note(s)</Text>
            <Text style={styles.statementColYear}>{currentYear}</Text>
          </View>

          <View style={styles.lineRow}>
            <Text style={styles.lineDesc}>Other income</Text>
            <Text style={styles.lineNote}></Text>
            <Text style={styles.lineAmount}>{formatRand(statementOfComprehensiveIncome.otherIncome.currentAmount)}</Text>
          </View>

          <View style={styles.lineRow}>
            <Text style={styles.lineDesc}>Operating expenses</Text>
            <Text style={styles.lineNote}>5</Text>
            <Text style={styles.lineAmount}>{formatRand(statementOfComprehensiveIncome.operatingExpenses.currentAmount)}</Text>
          </View>

          <View style={styles.subtotalRow}>
            <Text style={styles.totalDesc}>Operating loss</Text>
            <Text style={styles.totalAmount}>{formatRand(statementOfComprehensiveIncome.operatingProfitOrLoss.currentAmount)}</Text>
          </View>

          <View style={styles.subtotalRow}>
            <Text style={styles.totalDesc}>Loss before income tax</Text>
            <Text style={styles.totalAmount}>{formatRand(statementOfComprehensiveIncome.profitOrLossBeforeTax.currentAmount)}</Text>
          </View>

          <View style={styles.lineRow}>
            <Text style={styles.lineDesc}>Income tax</Text>
            <Text style={styles.lineNote}>7</Text>
            <Text style={styles.lineAmount}>-</Text>
          </View>

          <View style={styles.subtotalRow}>
            <Text style={styles.totalDesc}>Loss for the year</Text>
            <Text style={styles.totalAmount}>{formatRand(statementOfComprehensiveIncome.profitOrLossForTheYear.currentAmount)}</Text>
          </View>

          <View style={styles.lineRow}>
            <Text style={styles.lineDesc}>Other comprehensive loss</Text>
            <Text style={styles.lineNote}></Text>
            <Text style={styles.lineAmount}>-</Text>
          </View>

          <View style={[styles.totalRow, { marginTop: 6 }]}>
            <Text style={styles.totalDesc}>Total comprehensive loss for the year</Text>
            <Text style={styles.totalAmount}>{formatRand(statementOfComprehensiveIncome.totalComprehensiveLossOrIncome.currentAmount)}</Text>
          </View>
        </View>

        <Text style={styles.pageNumber}>10</Text>
      </Page>

      {/* PAGE 12: STATEMENT OF CHANGES IN EQUITY */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader}>
          <Text style={styles.headerCompanyName}>{generalInfo.companyName}</Text>
          <Text style={styles.headerRegNumber}>(Registration number: {generalInfo.registrationNumber})</Text>
          <Text style={styles.headerPeriod}>Financial Statements for the year ended {generalInfo.financialYearEndedDate}</Text>
          <Text style={styles.pageTitle}>Statement of Changes in Equity</Text>
        </View>

        <View style={styles.statementTable}>
          <View style={styles.statementHeaderRow}>
            <Text style={{ width: '45%', fontSize: 8.5, fontFamily: 'Helvetica-Bold' }}>Figures in Rand</Text>
            <Text style={{ width: '18%', textAlign: 'right', fontSize: 8.5, fontFamily: 'Helvetica-Bold' }}>Share capital</Text>
            <Text style={{ width: '18%', textAlign: 'right', fontSize: 8.5, fontFamily: 'Helvetica-Bold' }}>Accumulated loss</Text>
            <Text style={{ width: '19%', textAlign: 'right', fontSize: 8.5, fontFamily: 'Helvetica-Bold' }}>Total equity</Text>
          </View>

          <View style={styles.lineRow}>
            <Text style={{ width: '45%', fontSize: 8.5 }}>Loss for the year</Text>
            <Text style={{ width: '18%', textAlign: 'right', fontSize: 8.5 }}>-</Text>
            <Text style={{ width: '18%', textAlign: 'right', fontSize: 8.5 }}>{formatRand(statementOfChangesInEquity.accumulatedLoss.lossForTheYear)}</Text>
            <Text style={{ width: '19%', textAlign: 'right', fontSize: 8.5 }}>{formatRand(statementOfChangesInEquity.accumulatedLoss.lossForTheYear)}</Text>
          </View>

          <View style={styles.lineRow}>
            <Text style={{ width: '45%', fontSize: 8.5 }}>Other comprehensive income</Text>
            <Text style={{ width: '18%', textAlign: 'right', fontSize: 8.5 }}>-</Text>
            <Text style={{ width: '18%', textAlign: 'right', fontSize: 8.5 }}>-</Text>
            <Text style={{ width: '19%', textAlign: 'right', fontSize: 8.5 }}>-</Text>
          </View>

          <View style={styles.subtotalRow}>
            <Text style={{ width: '45%', fontSize: 8.5, fontFamily: 'Helvetica-Bold' }}>Total comprehensive loss for the year</Text>
            <Text style={{ width: '18%', textAlign: 'right', fontSize: 8.5, fontFamily: 'Helvetica-Bold' }}>-</Text>
            <Text style={{ width: '18%', textAlign: 'right', fontSize: 8.5, fontFamily: 'Helvetica-Bold' }}>{formatRand(statementOfChangesInEquity.accumulatedLoss.lossForTheYear)}</Text>
            <Text style={{ width: '19%', textAlign: 'right', fontSize: 8.5, fontFamily: 'Helvetica-Bold' }}>{formatRand(statementOfChangesInEquity.accumulatedLoss.lossForTheYear)}</Text>
          </View>

          <View style={styles.lineRow}>
            <Text style={{ width: '45%', fontSize: 8.5 }}>Issue of Shares</Text>
            <Text style={{ width: '18%', textAlign: 'right', fontSize: 8.5 }}>{formatRand(statementOfChangesInEquity.shareCapital.change)}</Text>
            <Text style={{ width: '18%', textAlign: 'right', fontSize: 8.5 }}>-</Text>
            <Text style={{ width: '19%', textAlign: 'right', fontSize: 8.5 }}>{formatRand(statementOfChangesInEquity.shareCapital.change)}</Text>
          </View>

          <View style={styles.subtotalRow}>
            <Text style={{ width: '45%', fontSize: 8.5, fontFamily: 'Helvetica-Bold' }}>Total changes</Text>
            <Text style={{ width: '18%', textAlign: 'right', fontSize: 8.5, fontFamily: 'Helvetica-Bold' }}>{formatRand(statementOfChangesInEquity.shareCapital.change)}</Text>
            <Text style={{ width: '18%', textAlign: 'right', fontSize: 8.5, fontFamily: 'Helvetica-Bold' }}>-</Text>
            <Text style={{ width: '19%', textAlign: 'right', fontSize: 8.5, fontFamily: 'Helvetica-Bold' }}>{formatRand(statementOfChangesInEquity.shareCapital.change)}</Text>
          </View>

          <View style={[styles.totalRow, { marginTop: 6 }]}>
            <Text style={{ width: '45%', fontSize: 8.5, fontFamily: 'Helvetica-Bold' }}>Balance at {generalInfo.financialYearEndedDate}</Text>
            <Text style={{ width: '18%', textAlign: 'right', fontSize: 8.5, fontFamily: 'Helvetica-Bold' }}>{formatRand(statementOfChangesInEquity.shareCapital.current)}</Text>
            <Text style={{ width: '18%', textAlign: 'right', fontSize: 8.5, fontFamily: 'Helvetica-Bold' }}>{formatRand(statementOfChangesInEquity.accumulatedLoss.current)}</Text>
            <Text style={{ width: '19%', textAlign: 'right', fontSize: 8.5, fontFamily: 'Helvetica-Bold' }}>{formatRand(statementOfChangesInEquity.totalEquity.current)}</Text>
          </View>
          <Text style={{ fontSize: 8, color: '#555', marginTop: 2 }}>Note 3</Text>
        </View>

        <Text style={styles.pageNumber}>11</Text>
      </Page>

      {/* PAGE 13: STATEMENT OF CASH FLOWS */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader}>
          <Text style={styles.headerCompanyName}>{generalInfo.companyName}</Text>
          <Text style={styles.headerRegNumber}>(Registration number: {generalInfo.registrationNumber})</Text>
          <Text style={styles.headerPeriod}>Financial Statements for the year ended {generalInfo.financialYearEndedDate}</Text>
          <Text style={styles.pageTitle}>Statement of Cash Flows</Text>
        </View>

        <View style={styles.statementTable}>
          <View style={styles.statementHeaderRow}>
            <Text style={styles.statementColDesc}>Figures in Rand</Text>
            <Text style={styles.statementColNote}>Notes</Text>
            <Text style={styles.statementColYear}>{currentYear}</Text>
          </View>

          <Text style={styles.sectionTitleRow}>Cash flows from operating activities</Text>
          <View style={styles.lineRow}>
            <Text style={styles.lineDesc}>Cash used in operations</Text>
            <Text style={styles.lineNote}>6</Text>
            <Text style={styles.lineAmount}>{formatRand(statementOfCashFlows.cashUsedInOperations.current)}</Text>
          </View>

          <Text style={[styles.sectionTitleRow, { marginTop: 12 }]}>Cash flows from financing activities</Text>
          <View style={styles.lineRow}>
            <Text style={styles.lineDesc}>Proceeds on share issue</Text>
            <Text style={styles.lineNote}>3</Text>
            <Text style={styles.lineAmount}>{formatRand(statementOfCashFlows.proceedsOnShareIssue.current)}</Text>
          </View>
          <View style={styles.lineRow}>
            <Text style={styles.lineDesc}>Cash advances received on loans from shareholders</Text>
            <Text style={styles.lineNote}></Text>
            <Text style={styles.lineAmount}>{formatRand(statementOfCashFlows.cashAdvancesReceivedOnLoansFromShareholders.current)}</Text>
          </View>

          <View style={styles.subtotalRow}>
            <Text style={styles.totalDesc}>Net cash from financing activities</Text>
            <Text style={styles.totalAmount}>{formatRand(statementOfCashFlows.netCashFromFinancingActivities.current)}</Text>
          </View>

          <View style={[styles.totalRow, { marginTop: 12 }]}>
            <Text style={styles.totalDesc}>Total cash movement for the year</Text>
            <Text style={styles.totalAmount}>{formatRand(statementOfCashFlows.totalCashMovementForTheYear.current)}</Text>
          </View>

          <View style={styles.lineRow}>
            <Text style={styles.lineDesc}>Total cash at end of the year</Text>
            <Text style={styles.lineNote}>2</Text>
            <Text style={[styles.lineAmount, { fontFamily: 'Helvetica-Bold' }]}>{formatRand(statementOfCashFlows.totalCashAtEndOfTheYear.current)}</Text>
          </View>
        </View>

        <Text style={styles.pageNumber}>12</Text>
      </Page>

      {/* PAGE 14: ACCOUNTING POLICIES */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader}>
          <Text style={styles.headerCompanyName}>{generalInfo.companyName}</Text>
          <Text style={styles.headerRegNumber}>(Registration number: {generalInfo.registrationNumber})</Text>
          <Text style={styles.headerPeriod}>Financial Statements for the year ended {generalInfo.financialYearEndedDate}</Text>
          <Text style={styles.pageTitle}>Accounting Policies</Text>
        </View>

        <Text style={styles.noteHeader}>1. Basis of preparation and summary of material accounting policies</Text>
        <Text style={styles.paragraph}>
          The financial statements have been prepared on a going concern basis in accordance with the IFRS for SMEs® Accounting Standard as issued by the International Accounting Standards Board (IASB) and the requirements of the Companies Act of South Africa. The financial statements have been prepared on the historical cost basis, and incorporate the principal accounting policies set out below. They are presented in South African Rands.
        </Text>

        <Text style={styles.noteHeader}>1.1 Significant judgements and sources of estimation uncertainty</Text>
        <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', marginBottom: 2 }}>Critical judgements in applying accounting policies</Text>
        <Text style={styles.paragraph}>
          Management did not make critical judgements in the application of accounting policies, apart from those involving estimations, which would significantly affect the financial statements.
        </Text>

        <Text style={styles.noteHeader}>1.2 Financial instruments</Text>
        <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', marginBottom: 2 }}>Initial measurement</Text>
        <Text style={styles.paragraph}>
          Financial instruments including loans, are initially measured at the transaction price (including transaction costs except in the initial measurement of financial assets and liabilities that are measured at fair value through profit or loss) unless the arrangement constitutes, in effect, a financing transaction in which case it is measured at the present value of future payments discounted at a market rate of interest.
        </Text>

        <Text style={styles.noteHeader}>1.3 Income Tax</Text>
        <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', marginBottom: 2 }}>Current tax assets and liabilities</Text>
        <Text style={styles.paragraph}>
          Current tax for current period is, to the extent unpaid, recognised as a liability. If the amount already paid in respect of current period exceeds the amount due for that period, the excess is recognised as an asset.
        </Text>

        <Text style={styles.noteHeader}>1.4 Share capital and equity</Text>
        <Text style={styles.paragraph}>
          Equity instruments issued by the company are recognised at the proceeds received, net of direct issue costs.
        </Text>

        <Text style={styles.pageNumber}>13</Text>
      </Page>

      {/* PAGE 15: NOTES TO THE FINANCIAL STATEMENTS (PART 1) */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader}>
          <Text style={styles.headerCompanyName}>{generalInfo.companyName}</Text>
          <Text style={styles.headerRegNumber}>(Registration number: {generalInfo.registrationNumber})</Text>
          <Text style={styles.headerPeriod}>Financial Statements for the year ended {generalInfo.financialYearEndedDate}</Text>
          <Text style={styles.pageTitle}>Notes to the Financial Statements</Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 0.5, paddingBottom: 2, marginBottom: 6 }}>
          <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold' }}>Figures in Rand</Text>
          <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold' }}>2025</Text>
        </View>

        {/* Note 2 */}
        <Text style={styles.noteHeader}>2. Cash and cash equivalents</Text>
        <Text style={styles.noteText}>Cash and cash equivalents consist of:</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
          <Text style={{ fontSize: 8.5 }}>Bank balances</Text>
          <Text style={{ fontSize: 8.5 }}>{formatRand(notes.note2CashAndCashEquivalents.total.current)}</Text>
        </View>
        <View style={[styles.subtotalRow, { marginBottom: 8 }]}>
          <Text style={{ width: '80%', fontSize: 8.5 }}></Text>
          <Text style={{ width: '20%', textAlign: 'right', fontSize: 8.5, fontFamily: 'Helvetica-Bold' }}>{formatRand(notes.note2CashAndCashEquivalents.total.current)}</Text>
        </View>

        {/* Note 3 */}
        <Text style={styles.noteHeader}>3. Share capital</Text>
        <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', marginBottom: 2 }}>Authorised</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={{ fontSize: 8.5 }}>{notes.note3ShareCapital.authorisedShares}</Text>
          <Text style={{ fontSize: 8.5 }}>1 000</Text>
        </View>
        <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', marginBottom: 2 }}>Issued</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
          <Text style={{ fontSize: 8.5 }}>{notes.note3ShareCapital.issuedShares}</Text>
          <Text style={{ fontSize: 8.5 }}>{formatRand(notes.note3ShareCapital.issuedAmount.current)}</Text>
        </View>
        <View style={[styles.subtotalRow, { marginBottom: 8 }]}>
          <Text style={{ width: '80%', fontSize: 8.5 }}></Text>
          <Text style={{ width: '20%', textAlign: 'right', fontSize: 8.5, fontFamily: 'Helvetica-Bold' }}>{formatRand(notes.note3ShareCapital.issuedAmount.current)}</Text>
        </View>

        {/* Note 4 */}
        <Text style={styles.noteHeader}>4. Loans from shareholders</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
          <Text style={{ fontSize: 8.5 }}>{notes.note4LoansFromShareholders.loans[0]?.name || generalInfo.holdingCompany}</Text>
          <Text style={{ fontSize: 8.5 }}>{formatRand(notes.note4LoansFromShareholders.total.current)}</Text>
        </View>
        <Text style={[styles.noteText, { marginTop: 4 }]}>
          {notes.note4LoansFromShareholders.loans[0]?.terms ||
            'The loan is unsecured and bears no interest. There are no fixed repayment terms of the loan. The loan has been subordinated in favour of other creditors, until the assets of the company, fairly valued, exceeds its liabilities.'}
        </Text>

        {/* Note 5 */}
        <Text style={[styles.noteHeader, { marginTop: 8 }]}>5. Operating expenses</Text>
        <Text style={styles.noteText}>Operating expenses include the following expenses:</Text>
        <Text style={{ fontSize: 8, fontStyle: 'italic', marginBottom: 3 }}>Remuneration, other than to employees, for:</Text>
        {notes.note5OperatingExpenses.remunerationOtherThanEmployees.map((item, i) => (
          <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 1.5 }}>
            <Text style={{ fontSize: 8.5 }}>{item.name}</Text>
            <Text style={{ fontSize: 8.5 }}>{formatRand(item.current)}</Text>
          </View>
        ))}
        <View style={[styles.subtotalRow, { marginBottom: 8 }]}>
          <Text style={{ width: '80%', fontSize: 8.5 }}></Text>
          <Text style={{ width: '20%', textAlign: 'right', fontSize: 8.5, fontFamily: 'Helvetica-Bold' }}>{formatRand(notes.note5OperatingExpenses.totalOperatingExpensesNote.current)}</Text>
        </View>

        {/* Note 6 */}
        <Text style={styles.noteHeader}>6. Cash used in operations</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
          <Text style={{ fontSize: 8.5 }}>Net loss before income tax</Text>
          <Text style={{ fontSize: 8.5 }}>{formatRand(notes.note6CashUsedInOperations.netLossBeforeTax.current)}</Text>
        </View>
        <View style={[styles.subtotalRow, { marginBottom: 8 }]}>
          <Text style={{ width: '80%', fontSize: 8.5 }}></Text>
          <Text style={{ width: '20%', textAlign: 'right', fontSize: 8.5, fontFamily: 'Helvetica-Bold' }}>{formatRand(notes.note6CashUsedInOperations.total.current)}</Text>
        </View>

        {/* Note 7 */}
        <Text style={styles.noteHeader}>7. Taxation</Text>
        <Text style={styles.noteText}>Reconciliation of the tax expense</Text>
        <Text style={{ fontSize: 8, fontStyle: 'italic', marginBottom: 2 }}>Reconciliation between accounting profit and tax expense</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 1.5 }}>
          <Text style={{ fontSize: 8.5 }}>Accounting loss</Text>
          <Text style={{ fontSize: 8.5 }}>{formatRand(notes.note7Taxation.accountingLoss.current)}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 1.5 }}>
          <Text style={{ fontSize: 8.5 }}>Tax at the applicable tax rate of 27%</Text>
          <Text style={{ fontSize: 8.5 }}>{formatRand(notes.note7Taxation.taxAtApplicableRate27.current)}</Text>
        </View>
        <Text style={{ fontSize: 8, fontStyle: 'italic', marginTop: 2, marginBottom: 2 }}>Tax effect of adjustments on taxable income</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 1.5 }}>
          <Text style={{ fontSize: 8.5 }}>Loss carried forward</Text>
          <Text style={{ fontSize: 8.5 }}>{formatRand(notes.note7Taxation.lossCarriedForward.current)}</Text>
        </View>
        <View style={[styles.subtotalRow, { marginBottom: 4 }]}>
          <Text style={{ width: '80%', fontSize: 8.5 }}></Text>
          <Text style={{ width: '20%', textAlign: 'right', fontSize: 8.5, fontFamily: 'Helvetica-Bold' }}>-</Text>
        </View>
        <Text style={styles.noteText}>{notes.note7Taxation.taxNoteText}</Text>

        <Text style={styles.pageNumber}>14</Text>
      </Page>

      {/* PAGE 16: NOTES CONTINUED (PART 2) */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader}>
          <Text style={styles.headerCompanyName}>{generalInfo.companyName}</Text>
          <Text style={styles.headerRegNumber}>(Registration number: {generalInfo.registrationNumber})</Text>
          <Text style={styles.headerPeriod}>Financial Statements for the year ended {generalInfo.financialYearEndedDate}</Text>
          <Text style={styles.pageTitle}>Notes to the Financial Statements (Continued)</Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 0.5, paddingBottom: 2, marginBottom: 6 }}>
          <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold' }}>Figures in Rand</Text>
          <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold' }}>2025</Text>
        </View>

        {/* Note 8 */}
        <Text style={styles.noteHeader}>8. Related parties</Text>
        <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', marginBottom: 2 }}>Relationships</Text>
        <View style={{ flexDirection: 'row', marginBottom: 2 }}>
          <Text style={{ width: '40%', fontSize: 8.5 }}>Holding company</Text>
          <Text style={{ width: '60%', fontSize: 8.5 }}>{generalInfo.holdingCompany}</Text>
        </View>
        <View style={{ flexDirection: 'row', marginBottom: 6 }}>
          <Text style={{ width: '40%', fontSize: 8.5 }}>Directors</Text>
          <View style={{ width: '60%', fontSize: 8.5 }}>
            {generalInfo.directors.map((d, i) => (
              <Text key={i}>{d.name}</Text>
            ))}
          </View>
        </View>

        <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', marginTop: 4, marginBottom: 2 }}>Related party balances</Text>
        <Text style={{ fontSize: 8, fontStyle: 'italic', marginBottom: 2 }}>Loan accounts - Owing (to) by related parties</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontSize: 8.5 }}>{generalInfo.holdingCompany}</Text>
          <Text style={{ fontSize: 8.5 }}>{formatRand(notes.note4LoansFromShareholders.total.current)}</Text>
        </View>

        {/* Note 9 */}
        <Text style={styles.noteHeader}>9. Going concern</Text>
        <Text style={styles.paragraph}>{notes.note9GoingConcern.subordinationNoteText}</Text>

        {/* Note 10 */}
        <Text style={styles.noteHeader}>10. Events after the reporting period</Text>
        <Text style={styles.paragraph}>{notes.note10EventsAfterReportingPeriod.statementText}</Text>

        <Text style={styles.pageNumber}>15</Text>
      </Page>

      {/* PAGE 17: DETAILED INCOME STATEMENT (UNAUDITED SUPPLEMENTARY) */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader}>
          <Text style={styles.headerCompanyName}>{generalInfo.companyName}</Text>
          <Text style={styles.headerRegNumber}>(Registration number: {generalInfo.registrationNumber})</Text>
          <Text style={styles.headerPeriod}>Financial Statements for the year ended {generalInfo.financialYearEndedDate}</Text>
          <Text style={styles.pageTitle}>Detailed Income Statement</Text>
        </View>

        <View style={styles.statementTable}>
          <View style={styles.statementHeaderRow}>
            <Text style={styles.statementColDesc}>Figures in Rand</Text>
            <Text style={styles.statementColNote}>Notes</Text>
            <Text style={styles.statementColYear}>{currentYear}</Text>
          </View>

          <Text style={styles.sectionTitleRow}>Other income</Text>
          {detailedIncomeStatement.otherIncomeItems.map((item, i) => (
            <View key={i} style={styles.lineRow}>
              <Text style={styles.lineDesc}>{item.name}</Text>
              <Text style={styles.lineNote}></Text>
              <Text style={styles.lineAmount}>{formatRand(item.current)}</Text>
            </View>
          ))}
          <View style={styles.subtotalRow}>
            <Text style={styles.lineDesc}></Text>
            <Text style={styles.lineNote}></Text>
            <Text style={[styles.lineAmount, { fontFamily: 'Helvetica-Bold' }]}>{formatRand(detailedIncomeStatement.totalOtherIncome.current)}</Text>
          </View>

          <Text style={[styles.sectionTitleRow, { marginTop: 10 }]}>Operating expenses</Text>
          {detailedIncomeStatement.operatingExpenseItems.map((item, i) => (
            <View key={i} style={styles.lineRow}>
              <Text style={styles.lineDesc}>{item.name}</Text>
              <Text style={styles.lineNote}></Text>
              <Text style={styles.lineAmount}>({formatRand(item.current)})</Text>
            </View>
          ))}
          <View style={styles.subtotalRow}>
            <Text style={styles.lineDesc}></Text>
            <Text style={styles.lineNote}></Text>
            <Text style={[styles.lineAmount, { fontFamily: 'Helvetica-Bold' }]}>({formatRand(detailedIncomeStatement.totalOperatingExpenses.current)})</Text>
          </View>

          <View style={[styles.totalRow, { marginTop: 8 }]}>
            <Text style={styles.totalDesc}>Loss for the year</Text>
            <Text style={styles.totalAmount}>{formatRand(detailedIncomeStatement.lossOrProfitForTheYear.current)}</Text>
          </View>
        </View>

        <Text style={styles.pageNumber}>16</Text>
        <Text style={styles.footerDisclaimer}>
          The supplementary information presented does not form part of the financial statements and is unaudited
        </Text>
      </Page>
    </Document>
  );
};
