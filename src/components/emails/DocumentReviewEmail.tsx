import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Button,
} from '@react-email/components';
import * as React from 'react';
import { DocumentUpload } from '@/lib/types';

interface DocumentReviewEmailProps {
  clientName: string;
  orderId: string;
  documentUploads: DocumentUpload[];
  orderUrl: string;
  resellerName?: string;
  primaryColor?: string;
}

export const DocumentReviewEmail = ({
  clientName,
  orderId,
  documentUploads = [],
  orderUrl,
  resellerName,
  primaryColor = '#1e3a8a',
}: DocumentReviewEmailProps) => {
  const brandName = resellerName || 'My Accountant';
  const approvedCount = documentUploads.filter(doc => doc.status === 'approved').length;
  const rejectedCount = documentUploads.filter(doc => doc.status === 'rejected').length;
  const pendingCount = documentUploads.length - approvedCount - rejectedCount;
  const hasRejections = rejectedCount > 0;
  const allApproved = approvedCount === documentUploads.length && documentUploads.length > 0;

  const previewText = hasRejections
    ? `Action Required: Documents for Order #${orderId}`
    : `Document Review Complete for Order #${orderId}`;

  const firstName = (clientName || 'Client').split(' ')[0];

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          
          {/* Header Banner */}
          <Section style={{ ...headerBannerStyle, backgroundColor: primaryColor }}>
            <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
              <tbody>
                <tr>
                  <td>
                    <Text style={headerBrandTitle}>{brandName}</Text>
                    <Text style={headerBrandSubtitle}>Accounting &amp; Compliance Portal</Text>
                  </td>
                  <td align="right">
                    <span style={orderBadgeStyle}>Order #{orderId}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* Main Card Content */}
          <Section style={cardContentStyle}>
            <Heading style={headingStyle}>Document Review Complete</Heading>
            
            <Text style={paragraphStyle}>
              Hi {firstName},
            </Text>
            <Text style={paragraphStyle}>
              We have completed the verification of the documents you submitted for order <strong style={{ color: primaryColor }}>#{orderId}</strong>.
            </Text>

            {/* Summary Status Box */}
            {allApproved ? (
              <div style={allApprovedBoxStyle}>
                <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
                  <tbody>
                    <tr>
                      <td width="28" style={{ verticalAlign: 'middle' }}>
                        <span style={{ fontSize: '18px' }}>✓</span>
                      </td>
                      <td style={{ verticalAlign: 'middle' }}>
                        <Text style={allApprovedTextStyle}>
                          <strong>All {documentUploads.length} requirements approved!</strong> Your order has moved to processing.
                        </Text>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : hasRejections ? (
              <div style={actionRequiredBoxStyle}>
                <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
                  <tbody>
                    <tr>
                      <td width="28" style={{ verticalAlign: 'top', paddingTop: '2px' }}>
                        <span style={{ fontSize: '18px', color: '#b91c1c' }}>⚠</span>
                      </td>
                      <td style={{ verticalAlign: 'middle' }}>
                        <Text style={actionRequiredTextStyle}>
                          <strong>Action Required:</strong> {rejectedCount} {rejectedCount === 1 ? 'item requires' : 'items require'} your attention before we can finalize processing.
                        </Text>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : null}

            {/* Document Verification Table */}
            <div style={tableWrapperStyle}>
              <table width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={tableHeaderRowStyle}>
                    <th align="left" style={tableHeaderCellStyle}>REQUIREMENT</th>
                    <th align="right" style={{ ...tableHeaderCellStyle, width: '130px', textAlign: 'right' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {documentUploads.map((doc, index) => {
                    const isApproved = doc.status === 'approved';
                    const isRejected = doc.status === 'rejected';
                    const isEven = index % 2 === 0;

                    return (
                      <React.Fragment key={index}>
                        <tr style={{ backgroundColor: isEven ? '#ffffff' : '#f8fafc', borderBottom: isRejected ? 'none' : '1px solid #e2e8f0' }}>
                          <td style={tableCellStyle}>
                            <Text style={docLabelStyle}>{doc.requirementLabel}</Text>
                            {doc.fileName && (
                              <Text style={docFileStyle}>
                                📄 {doc.fileName}
                              </Text>
                            )}
                            {doc.textValue && !doc.fileName && (
                              <Text style={docFileStyle}>
                                ✍️ "{doc.textValue}"
                              </Text>
                            )}
                          </td>
                          <td align="right" style={{ ...tableCellStyle, width: '130px', verticalAlign: 'top', textAlign: 'right' }}>
                            {isApproved && (
                              <span style={approvedBadgeStyle}>✓ Approved</span>
                            )}
                            {isRejected && (
                              <span style={rejectedBadgeStyle}>✕ Action Needed</span>
                            )}
                            {!isApproved && !isRejected && (
                              <span style={pendingBadgeStyle}>⏳ Pending</span>
                            )}
                          </td>
                        </tr>
                        {isRejected && (
                          <tr style={{ backgroundColor: isEven ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <td colSpan={2} style={{ padding: '0 16px 14px 16px' }}>
                              <div style={rejectionReasonBoxStyle}>
                                <Text style={rejectionReasonTextStyle}>
                                  <strong>Reason for rejection:</strong> {doc.rejectionReason || 'Please upload a clearer or updated copy.'}
                                </Text>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {hasRejections && (
              <Text style={{ ...paragraphStyle, marginTop: '20px', color: '#334155' }}>
                Please click the button below to log in to your secure client portal and upload the updated document(s).
              </Text>
            )}

            {/* CTA Button */}
            <Section style={{ textAlign: 'center', marginTop: '28px', marginBottom: '28px' }}>
              <Button style={{ ...buttonStyle, backgroundColor: primaryColor }} href={orderUrl}>
                {hasRejections ? 'Upload Corrected Documents' : 'View Order in Dashboard'}
              </Button>
            </Section>

            {/* Friendly Dashboard Response Reminder */}
            <div style={unattendedNoticeBoxStyle}>
              <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
                <tbody>
                  <tr>
                    <td width="28" style={{ verticalAlign: 'top', paddingTop: '2px' }}>
                      <span style={{ fontSize: '16px' }}>💬</span>
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <Text style={unattendedNoticeTextStyle}>
                        <strong>Need to reply or send us a message?</strong>
                        <br />
                        Please log into your <a href={orderUrl} style={{ color: primaryColor, fontWeight: '700', textDecoration: 'underline' }}>Client Dashboard</a> to reply, upload documents, or communicate with our team. Please note that <em>no_reply@myacc.co.za</em> is an automated notification address and is not monitored for replies.
                      </Text>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <Hr style={dividerStyle} />

            {/* Signoff */}
            <Text style={paragraphStyle}>
              Regards,
              <br />
              <strong>{brandName} Team</strong>
            </Text>

            {/* Footer Details */}
            <Section style={footerSectionStyle}>
              <Text style={footerTextStyle}>
                This is an automated notification from {brandName}. Please log in to your secure dashboard to manage your order or communicate with your consultant.
              </Text>
              <Text style={footerTextStyle}>
                © {new Date().getFullYear()} {brandName}. All rights reserved.
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default DocumentReviewEmail;

// --- Styles ---

const mainStyle: React.CSSProperties = {
  backgroundColor: '#f1f5f9',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  margin: 0,
  padding: '32px 0',
};

const containerStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  maxWidth: '600px',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
  border: '1px solid #e2e8f0',
};

const headerBannerStyle: React.CSSProperties = {
  padding: '24px 32px',
  color: '#ffffff',
};

const headerBrandTitle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: '800',
  color: '#ffffff',
  margin: 0,
  letterSpacing: '-0.5px',
};

const headerBrandSubtitle: React.CSSProperties = {
  fontSize: '12px',
  color: 'rgba(255, 255, 255, 0.8)',
  margin: '2px 0 0 0',
};

const orderBadgeStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: '700',
  padding: '6px 12px',
  borderRadius: '20px',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  display: 'inline-block',
};

const cardContentStyle: React.CSSProperties = {
  padding: '32px 32px 24px',
};

const headingStyle: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: '800',
  color: '#0f172a',
  margin: '0 0 16px 0',
  letterSpacing: '-0.5px',
};

const paragraphStyle: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#334155',
  margin: '0 0 14px 0',
};

const allApprovedBoxStyle: React.CSSProperties = {
  backgroundColor: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: '8px',
  padding: '14px 16px',
  margin: '18px 0',
};

const allApprovedTextStyle: React.CSSProperties = {
  color: '#15803d',
  fontSize: '14px',
  lineHeight: '20px',
  margin: 0,
};

const actionRequiredBoxStyle: React.CSSProperties = {
  backgroundColor: '#fff1f2',
  border: '1px solid #fecdd3',
  borderRadius: '8px',
  padding: '14px 16px',
  margin: '18px 0',
};

const actionRequiredTextStyle: React.CSSProperties = {
  color: '#9f1239',
  fontSize: '14px',
  lineHeight: '20px',
  margin: 0,
};

const tableWrapperStyle: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  overflow: 'hidden',
  margin: '20px 0',
};

const tableHeaderRowStyle: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  borderBottom: '2px solid #e2e8f0',
};

const tableHeaderCellStyle: React.CSSProperties = {
  padding: '10px 16px',
  fontSize: '11px',
  fontWeight: '800',
  color: '#64748b',
  letterSpacing: '0.5px',
};

const tableCellStyle: React.CSSProperties = {
  padding: '12px 16px',
  verticalAlign: 'middle',
};

const docLabelStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: '700',
  color: '#1e293b',
  margin: 0,
  lineHeight: '20px',
};

const docFileStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#64748b',
  margin: '4px 0 0 0',
};

const approvedBadgeStyle: React.CSSProperties = {
  backgroundColor: '#dcfce7',
  color: '#15803d',
  border: '1px solid #86efac',
  borderRadius: '16px',
  padding: '4px 10px',
  fontSize: '11px',
  fontWeight: '700',
  display: 'inline-block',
  whiteSpace: 'nowrap',
};

const rejectedBadgeStyle: React.CSSProperties = {
  backgroundColor: '#ffe4e6',
  color: '#b91c1c',
  border: '1px solid #fca5a5',
  borderRadius: '16px',
  padding: '4px 10px',
  fontSize: '11px',
  fontWeight: '700',
  display: 'inline-block',
  whiteSpace: 'nowrap',
};

const pendingBadgeStyle: React.CSSProperties = {
  backgroundColor: '#fef3c7',
  color: '#b45309',
  border: '1px solid #fde68a',
  borderRadius: '16px',
  padding: '4px 10px',
  fontSize: '11px',
  fontWeight: '700',
  display: 'inline-block',
  whiteSpace: 'nowrap',
};

const rejectionReasonBoxStyle: React.CSSProperties = {
  backgroundColor: '#fff1f2',
  borderLeft: '3px solid #e11d48',
  borderRadius: '4px',
  padding: '8px 12px',
  margin: '2px 0 0 0',
};

const rejectionReasonTextStyle: React.CSSProperties = {
  fontSize: '13px',
  lineHeight: '18px',
  color: '#9f1239',
  margin: 0,
};

const buttonStyle: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '700',
  textDecoration: 'none',
  textAlign: 'center',
  display: 'inline-block',
  padding: '14px 32px',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
};

const dividerStyle: React.CSSProperties = {
  borderColor: '#e2e8f0',
  margin: '24px 0',
};

const unattendedNoticeBoxStyle: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '14px 16px',
  margin: '24px 0 8px 0',
};

const unattendedNoticeTextStyle: React.CSSProperties = {
  fontSize: '13px',
  lineHeight: '20px',
  color: '#475569',
  margin: 0,
};

const footerSectionStyle: React.CSSProperties = {
  marginTop: '24px',
  paddingTop: '16px',
  borderTop: '1px solid #f1f5f9',
};

const footerTextStyle: React.CSSProperties = {
  fontSize: '12px',
  lineHeight: '18px',
  color: '#94a3b8',
  margin: '0 0 8px 0',
};


