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

interface OutstandingDocumentsEmailProps {
  clientName: string;
  orderId: string;
  orderUrl: string;
  resellerName?: string;
  primaryColor?: string;
}

export const OutstandingDocumentsEmail = ({ 
  clientName, 
  orderId, 
  orderUrl, 
  resellerName,
  primaryColor = '#1e3a8a',
}: OutstandingDocumentsEmailProps) => {
  const brandName = resellerName || 'My Accountant';
  const previewText = `Action Required: Outstanding Documents for Order #${orderId}`;
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
                    <Text style={headerBrandSubtitle}>Action Required</Text>
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
            <Heading style={headingStyle}>Outstanding Documents Required</Heading>
            
            <Text style={paragraphStyle}>
              Hi {firstName},
            </Text>
            
            <Text style={paragraphStyle}>
              We are ready to begin processing your order <strong style={{ color: primaryColor }}>#{orderId}</strong>, but there are still mandatory documents outstanding on your profile.
            </Text>

            {/* Warning Callout Box */}
            <div style={warningBoxStyle}>
              <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
                <tbody>
                  <tr>
                    <td width="28" style={{ verticalAlign: 'top', paddingTop: '2px' }}>
                      <span style={{ fontSize: '18px', color: '#b45309' }}>⏳</span>
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <Text style={warningTextStyle}>
                        <strong>Processing on hold:</strong> To ensure compliance and avoid processing delays, please upload your required documents as soon as possible.
                      </Text>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <Text style={paragraphStyle}>
              You can view the exact list of outstanding requirements and securely upload your files directly from your dashboard.
            </Text>

            {/* CTA Button */}
            <Section style={{ textAlign: 'center', marginTop: '28px', marginBottom: '28px' }}>
              <Button style={{ ...buttonStyle, backgroundColor: primaryColor }} href={orderUrl}>
                Upload Documents Now
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
                        <strong>Have questions or need assistance?</strong>
                        <br />
                        Please log into your <a href={orderUrl} style={{ color: primaryColor, fontWeight: '700', textDecoration: 'underline' }}>Client Dashboard</a> to message our team or upload your files. Please note that <em>no_reply@myacc.co.za</em> is an automated notification mailbox and is not monitored for incoming replies.
                      </Text>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <Hr style={dividerStyle} />

            <Text style={paragraphStyle}>
              Regards,
              <br />
              <strong>{brandName} Team</strong>
            </Text>

            {/* Footer */}
            <Section style={footerSectionStyle}>
              <Text style={footerTextStyle}>
                This is an automated reminder regarding order #{orderId}. Please log in to your secure client dashboard to upload documents or message your consultant.
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

export default OutstandingDocumentsEmail;

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

const warningBoxStyle: React.CSSProperties = {
  backgroundColor: '#fffbeb',
  border: '1px solid #fde68a',
  borderRadius: '8px',
  padding: '14px 16px',
  margin: '18px 0',
};

const warningTextStyle: React.CSSProperties = {
  color: '#92400e',
  fontSize: '14px',
  lineHeight: '20px',
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
  margin: '20px 0 8px 0',
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


