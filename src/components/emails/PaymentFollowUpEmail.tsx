
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
import { Order, User } from '@/lib/types';

interface PaymentFollowUpEmailProps {
  order: Order;
  reseller?: User;
}

export const PaymentFollowUpEmail = ({ order, reseller }: PaymentFollowUpEmailProps) => {
  const previewText = `Payment Reminder for Order #${order.id}`;

  const companyName = reseller?.companyName || 'My Accountant';
  const companyEmail = reseller?.email || 'info@myacc.co.za';
  const primaryColor = reseller?.landingPage?.primaryColor || '#1e3a8a';
  const companyAddress = reseller?.address ? `${reseller.address.street}, ${reseller.address.city}` : 'Ground Floor, Waterstone Building, Stonemill Office Park, 300 Acacia Road, Darrenwood, Johannesburg, 2195';

  const bankingDetails = reseller?.bankingDetails || {
    bankName: 'FNB',
    accountHolder: 'My Accountant (Pty) Ltd',
    accountNumber: '63084378223',
    branchCode: '250655',
  };

  const firstName = (order.customerName || 'Client').split(' ')[0];

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
                    <Text style={headerBrandTitle}>{companyName}</Text>
                    <Text style={headerBrandSubtitle}>Payment Reminder</Text>
                  </td>
                  <td align="right">
                    <span style={orderBadgeStyle}>Order #{order.id}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* Main Card Content */}
          <Section style={cardContentStyle}>
            <Heading style={headingStyle}>Payment Reminder for Your Order</Heading>
            
            <Text style={paragraphStyle}>
              Hi {firstName},
            </Text>
            
            <Text style={paragraphStyle}>
              This is a friendly reminder that order <strong style={{ color: primaryColor }}>#{order.id}</strong> is currently awaiting payment confirmation.
            </Text>

            {/* EFT Banking Details Box */}
            <div style={eftCardStyle}>
              <Text style={eftTitleStyle}>💳 Bank Transfer / EFT Details</Text>
              <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
                <tbody>
                  <tr>
                    <td style={eftLabelCell}>Bank:</td>
                    <td style={eftValueCell}>{bankingDetails.bankName}</td>
                  </tr>
                  <tr>
                    <td style={eftLabelCell}>Account Holder:</td>
                    <td style={eftValueCell}>{bankingDetails.accountHolder}</td>
                  </tr>
                  <tr>
                    <td style={eftLabelCell}>Account Number:</td>
                    <td style={eftValueCell}>{bankingDetails.accountNumber}</td>
                  </tr>
                  <tr>
                    <td style={eftLabelCell}>Branch Code:</td>
                    <td style={eftValueCell}>{bankingDetails.branchCode}</td>
                  </tr>
                  <tr>
                    <td style={eftLabelCell}>Reference:</td>
                    <td style={{ ...eftValueCell, color: '#dc2626', fontWeight: '800' }}>{order.id}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <Text style={{ ...paragraphStyle, marginTop: '20px' }}>
              If you have already transferred the funds, please disregard this reminder as clearance can take up to 24 hours depending on your banking institution.
            </Text>

            {/* CTA Button */}
            <Section style={{ textAlign: 'center', marginTop: '24px', marginBottom: '28px' }}>
              <Button 
                style={{ ...buttonStyle, backgroundColor: primaryColor }} 
                href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://www.myacc.co.za'}/order-confirmation/${order.id}`}
              >
                View Order &amp; Pay Online
              </Button>
            </Section>

            <Hr style={dividerStyle} />

            <Text style={paragraphStyle}>
              Regards,
              <br />
              <strong>{companyName} Team</strong>
            </Text>

            {/* Footer */}
            <Section style={footerSectionStyle}>
              <Text style={footerTextStyle}>
                {companyName} | {companyEmail} | {companyAddress}
              </Text>
              <Text style={footerTextStyle}>
                © {new Date().getFullYear()} {companyName}. All rights reserved.
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default PaymentFollowUpEmail;

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

const eftCardStyle: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '16px 18px',
  margin: '18px 0',
};

const eftTitleStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: '800',
  color: '#0f172a',
  margin: '0 0 12px 0',
};

const eftLabelCell: React.CSSProperties = {
  fontSize: '13px',
  color: '#64748b',
  padding: '4px 0',
  width: '130px',
};

const eftValueCell: React.CSSProperties = {
  fontSize: '13px',
  color: '#1e293b',
  fontWeight: '700',
  padding: '4px 0',
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

