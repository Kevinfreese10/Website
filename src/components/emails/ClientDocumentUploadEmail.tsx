
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

interface ClientDocumentUploadEmailProps {
  assigneeName: string;
  clientName: string;
  orderId: string;
  orderUrl: string;
}

export const ClientDocumentUploadEmail = ({ assigneeName, clientName, orderId, orderUrl }: ClientDocumentUploadEmailProps) => {
  const previewText = `Documents Uploaded for Order #${orderId}`;
  const firstName = (assigneeName || 'Team').split(' ')[0];

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          
          {/* Header Banner */}
          <Section style={headerBannerStyle}>
            <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
              <tbody>
                <tr>
                  <td>
                    <Text style={headerBrandTitle}>My Accountant</Text>
                    <Text style={headerBrandSubtitle}>Admin Notification</Text>
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
            <Heading style={headingStyle}>New Documents Uploaded</Heading>
            
            <Text style={paragraphStyle}>
              Hi {firstName},
            </Text>
            
            <Text style={paragraphStyle}>
              <strong>{clientName}</strong> has uploaded new documents/information for order <strong style={{ color: '#1e3a8a' }}>#{orderId}</strong>.
            </Text>

            {/* Document Alert Box */}
            <div style={infoBoxStyle}>
              <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
                <tbody>
                  <tr>
                    <td width="28" style={{ verticalAlign: 'middle' }}>
                      <span style={{ fontSize: '18px' }}>📁</span>
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <Text style={infoTextStyle}>
                        <strong>Action Needed:</strong> Please review and approve or reject the uploaded documents in the admin workspace.
                      </Text>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* CTA Button */}
            <Section style={{ textAlign: 'center', marginTop: '28px', marginBottom: '28px' }}>
              <Button style={buttonStyle} href={orderUrl}>
                Review Uploaded Documents
              </Button>
            </Section>

            <Hr style={dividerStyle} />

            {/* Footer */}
            <Section style={footerSectionStyle}>
              <Text style={footerTextStyle}>
                My Accountant Internal Notification | info@myacc.co.za
              </Text>
              <Text style={footerTextStyle}>
                © {new Date().getFullYear()} My Accountant. Internal use only.
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default ClientDocumentUploadEmail;

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
  backgroundColor: '#0f172a',
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

const infoBoxStyle: React.CSSProperties = {
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: '8px',
  padding: '14px 16px',
  margin: '18px 0',
};

const infoTextStyle: React.CSSProperties = {
  color: '#1e40af',
  fontSize: '14px',
  lineHeight: '20px',
  margin: 0,
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: '#1e3a8a',
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

