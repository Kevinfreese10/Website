
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
import { Order, Service, User } from '@/lib/types';

interface DocumentRequestEmailProps {
  order: Order;
  items: { service: Service }[];
  reseller?: User;
  replyTo: string;
}

export const DocumentRequestEmail = ({ order, items, reseller, replyTo }: DocumentRequestEmailProps) => {
  const companyName = reseller?.companyName || 'My Accountant';
  const companyEmail = reseller?.email || 'info@myacc.co.za';
  const primaryColor = reseller?.landingPage?.primaryColor || '#1e3a8a';
  
  let companyAddress = 'Ground Floor, Waterstone Building, Stonemill Office Park, 300 Acacia Road, Darrenwood, Johannesburg, 2195';
  if (reseller?.address) {
    const addr = reseller.address;
    companyAddress = [addr.street, addr.suburb, addr.city, addr.province, addr.zip].filter(Boolean).join(', ');
  }

  const previewText = `Action Required: Upload Documents for Order #${order.id}`;
  const firstName = ((order.endCustomerName || order.customerName) || 'Client').split(' ')[0];

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
                    <Text style={headerBrandSubtitle}>Next Steps</Text>
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
            <Heading style={headingStyle}>Finalize Your Order Details</Heading>
            
            <Text style={paragraphStyle}>
              Hi {firstName},
            </Text>
            
            <Text style={paragraphStyle}>
              We have received payment confirmation for your order <strong style={{ color: primaryColor }}>#{order.id}</strong>.
            </Text>

            {/* Service Summary Card */}
            {items && items.length > 0 && (
              <div style={servicesBoxStyle}>
                <Text style={servicesBoxTitle}>Services in this order:</Text>
                {items.map((item, idx) => (
                  <div key={idx} style={{ padding: '6px 0' }}>
                    <Text style={serviceItemTextStyle}>
                      • <strong>{item.service?.title || 'Accounting Service'}</strong>
                    </Text>
                  </div>
                ))}
              </div>
            )}

            <Text style={paragraphStyle}>
              To begin processing your request, please click the button below to log into your dashboard and securely upload the required documents.
            </Text>

            {/* CTA Button */}
            <Section style={{ textAlign: 'center', marginTop: '28px', marginBottom: '28px' }}>
              <Button 
                style={{ ...buttonStyle, backgroundColor: primaryColor }} 
                href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://www.myacc.co.za'}/dashboard/orders/${order.id}`}
              >
                Go to Dashboard &amp; Upload
              </Button>
            </Section>

            <Hr style={dividerStyle} />

            <Text style={paragraphStyle}>
              If you have any questions, feel free to reply directly to this email or reach us at <a href={`mailto:${replyTo}`} style={{ color: primaryColor, fontWeight: '700' }}>{replyTo}</a>.
            </Text>

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

export default DocumentRequestEmail;

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

const servicesBoxStyle: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '16px 18px',
  margin: '18px 0',
};

const servicesBoxTitle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: '800',
  color: '#64748b',
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
  margin: '0 0 8px 0',
};

const serviceItemTextStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#1e293b',
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

