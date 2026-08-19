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

interface NewNoteNotificationEmailProps {
  recipientName: string;
  senderName: string;
  orderId: string;
  notePreview: string;
  actionUrl: string;
  isToClient: boolean;
  isInternalNote?: boolean;
  resellerName?: string;
  primaryColor?: string;
}

export const NewNoteNotificationEmail = ({ 
  recipientName, 
  senderName, 
  orderId, 
  notePreview, 
  actionUrl, 
  isToClient, 
  isInternalNote = false,
  resellerName,
  primaryColor = '#1e3a8a',
}: NewNoteNotificationEmailProps) => {
  const brandName = resellerName || 'My Accountant';
  const previewText = isInternalNote 
    ? `🔒 Internal Note: Order #${orderId}` 
    : `New note from ${senderName || 'Staff'} on Order #${orderId}`;
  
  const headingText = isInternalNote 
    ? "🔒 Internal Team Note" 
    : (isToClient ? "New Message Regarding Your Order" : "New Client Message");

  const firstName = (recipientName || 'Team').split(' ')[0];
  const headerBgColor = isInternalNote ? '#334155' : primaryColor;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          
          {/* Header Banner */}
          <Section style={{ ...headerBannerStyle, backgroundColor: headerBgColor }}>
            <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
              <tbody>
                <tr>
                  <td>
                    <Text style={headerBrandTitle}>{brandName}</Text>
                    <Text style={headerBrandSubtitle}>
                      {isInternalNote ? 'Internal Staff Communication' : 'Accounting & Compliance Portal'}
                    </Text>
                  </td>
                  <td align="right">
                    <span style={orderBadgeStyle}>Order #{orderId}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* Main Content */}
          <Section style={cardContentStyle}>
            <Heading style={headingStyle}>{headingText}</Heading>
            
            <Text style={paragraphStyle}>
              Hi {firstName},
            </Text>
            
            <Text style={paragraphStyle}>
              {isInternalNote ? (
                <><strong>{senderName || 'Staff Member'}</strong> posted an internal note on Order <strong style={{ color: headerBgColor }}>#{orderId}</strong>:</>
              ) : (
                <><strong>{senderName || 'A consultant'}</strong> left a new message on Order <strong style={{ color: primaryColor }}>#{orderId}</strong>:</>
              )}
            </Text>

            {/* Note Speech Bubble Card */}
            <div style={isInternalNote ? internalNoteCardStyle : noteCardStyle}>
              <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
                <tbody>
                  <tr>
                    <td style={{ paddingBottom: '10px' }}>
                      <span style={isInternalNote ? internalAuthorBadgeStyle : authorBadgeStyle}>
                        💬 {senderName || 'Team Member'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <Text style={noteTextStyle}>
                        "{notePreview}"
                      </Text>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <Text style={{ ...paragraphStyle, marginTop: '20px' }}>
              {isInternalNote ? (
                "Please log in to the admin portal to view the full order history and respond."
              ) : (
                "Please log in to your dashboard to view the full details and reply if required."
              )}
            </Text>

            {/* CTA Button */}
            <Section style={{ textAlign: 'center', marginTop: '28px', marginBottom: '28px' }}>
              <Button style={{ ...buttonStyle, backgroundColor: headerBgColor }} href={actionUrl}>
                {isInternalNote ? 'View Internal Order' : 'View Order Details & Reply'}
              </Button>
            </Section>

            <Hr style={dividerStyle} />

            <Text style={paragraphStyle}>
              Regards,
              <br />
              <strong>{isInternalNote ? 'My Accountant Internal Team' : `${brandName} Team`}</strong>
            </Text>

            {/* Footer */}
            <Section style={footerSectionStyle}>
              <Text style={footerTextStyle}>
                {isInternalNote
                  ? "This is an internal staff notification. Do not forward outside the organization."
                  : `This is an automated message regarding your order #${orderId} on ${brandName}.`}
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

export default NewNoteNotificationEmail;

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

const noteCardStyle: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  borderLeft: '4px solid #3b82f6',
  borderTop: '1px solid #e2e8f0',
  borderRight: '1px solid #e2e8f0',
  borderBottom: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '18px 20px',
  margin: '18px 0',
};

const internalNoteCardStyle: React.CSSProperties = {
  backgroundColor: '#fffbeb',
  borderLeft: '4px solid #f59e0b',
  borderTop: '1px solid #fef3c7',
  borderRight: '1px solid #fef3c7',
  borderBottom: '1px solid #fef3c7',
  borderRadius: '8px',
  padding: '18px 20px',
  margin: '18px 0',
};

const authorBadgeStyle: React.CSSProperties = {
  backgroundColor: '#e0f2fe',
  color: '#0369a1',
  fontSize: '12px',
  fontWeight: '700',
  padding: '4px 10px',
  borderRadius: '12px',
  display: 'inline-block',
};

const internalAuthorBadgeStyle: React.CSSProperties = {
  backgroundColor: '#fef3c7',
  color: '#92400e',
  fontSize: '12px',
  fontWeight: '700',
  padding: '4px 10px',
  borderRadius: '12px',
  display: 'inline-block',
};

const noteTextStyle: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#1e293b',
  fontStyle: 'normal',
  margin: 0,
  whiteSpace: 'pre-wrap',
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

