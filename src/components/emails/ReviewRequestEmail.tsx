
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

interface ReviewRequestEmailProps {
  order: Order;
  reseller?: User;
}

export const ReviewRequestEmail = ({ order, reseller }: ReviewRequestEmailProps) => {
  const previewText = `We'd love your feedback on order #${order.id}`;

  const companyName = reseller?.companyName || 'My Accountant';
  const companyEmail = reseller?.email || 'info@myacc.co.za';
  const primaryColor = reseller?.landingPage?.primaryColor || '#1e3a8a';
  const companyAddress = reseller?.address ? `${reseller.address.street}, ${reseller.address.city}` : 'Ground Floor, Waterstone Building, Stonemill Office Park, 300 Acacia Road, Darrenwood, Johannesburg, 2195';

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
                    <Text style={headerBrandSubtitle}>Feedback &amp; Reviews</Text>
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
            <Heading style={headingStyle}>Thank You for Your Business!</Heading>
            
            <Text style={paragraphStyle}>
              Hi {firstName},
            </Text>
            
            <Text style={paragraphStyle}>
              Your order <strong style={{ color: primaryColor }}>#{order.id}</strong> has been finalized. We hope you enjoyed our services and communication throughout the process!
            </Text>

            {/* 5-Star Review Box */}
            <div style={starBoxStyle}>
              <Text style={{ fontSize: '28px', margin: '0 0 10px 0', letterSpacing: '4px' }}>
                ⭐️⭐️⭐️⭐️⭐️
              </Text>
              <Heading style={{ fontSize: '18px', fontWeight: '800', color: '#166534', margin: '0 0 8px 0' }}>
                How was your experience?
              </Heading>
              <Text style={{ color: '#15803d', fontSize: '14px', lineHeight: '22px', margin: '0 0 18px 0' }}>
                Taking 30 seconds to rate us on Google helps other small businesses find reliable accounting and compliance support.
              </Text>
              <Button
                style={{
                  backgroundColor: '#15803d',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: '700',
                  textDecoration: 'none',
                  textAlign: 'center',
                  display: 'inline-block',
                  padding: '14px 28px',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                }}
                href="https://g.page/r/CVIOzn2bYoiaEAI/review"
              >
                ⭐ Leave Google Review
              </Button>
            </div>

            <Text style={paragraphStyle}>
              Thank you again for choosing {companyName}. We look forward to assisting you and your company with all future tax, accounting, and payroll requirements!
            </Text>

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

export default ReviewRequestEmail;

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

const starBoxStyle: React.CSSProperties = {
  backgroundColor: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: '10px',
  padding: '24px 20px',
  margin: '20px 0',
  textAlign: 'center',
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

