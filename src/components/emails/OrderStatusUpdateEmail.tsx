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

interface OrderStatusUpdateEmailProps {
  order: Order;
  reseller?: User;
  message?: string;
}

export const OrderStatusUpdateEmail = ({ order, reseller, message }: OrderStatusUpdateEmailProps) => {
  const isCompleted = order.status?.toLowerCase() === 'completed';
  const previewText = isCompleted
    ? `🎉 Order #${order.id} is Completed!`
    : `Status Update on Order #${order.id}: ${order.status}`;

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
          <Section style={{ ...headerBannerStyle, backgroundColor: isCompleted ? '#15803d' : primaryColor }}>
            <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
              <tbody>
                <tr>
                  <td>
                    <Text style={headerBrandTitle}>{companyName}</Text>
                    <Text style={headerBrandSubtitle}>
                      {isCompleted ? 'Service Completed' : 'Order Update'}
                    </Text>
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
            <Heading style={headingStyle}>
              {isCompleted ? '🎉 Order Completed Successfully!' : 'Order Status Update'}
            </Heading>
            
            <Text style={paragraphStyle}>
              Hi {firstName},
            </Text>
            
            <Text style={paragraphStyle}>
              The status of your order <strong style={{ color: primaryColor }}>#{order.id}</strong> has been updated.
            </Text>

            {/* Status Highlight Card */}
            <div style={statusHighlightBoxStyle}>
              <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
                <tbody>
                  <tr>
                    <td>
                      <Text style={statusHighlightLabel}>Current Status</Text>
                      <Text style={{ ...statusHighlightValue, color: isCompleted ? '#166534' : '#1e3a8a' }}>
                        {isCompleted ? '✓ Completed' : order.status}
                      </Text>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {message && (
              <div style={messageBoxStyle}>
                <Text style={{ ...paragraphStyle, margin: 0, color: '#1e293b' }}>
                  <strong>Update Note:</strong> {message}
                </Text>
              </div>
            )}

            {/* Review Card for Completed Orders */}
            {isCompleted && (
              <div style={reviewBoxStyle}>
                <Heading style={{ fontSize: '18px', fontWeight: '800', color: '#166534', margin: '0 0 8px 0' }}>
                  ⭐ How did we do?
                </Heading>
                <Text style={{ color: '#15803d', fontSize: '14px', lineHeight: '22px', margin: '0 0 16px 0' }}>
                  Your order has been completed! If you're happy with our turnaround time and service, we'd love a quick 5-star review.
                </Text>
                <Button
                  style={{
                    backgroundColor: '#15803d',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '700',
                    textDecoration: 'none',
                    textAlign: 'center',
                    display: 'inline-block',
                    padding: '12px 24px',
                  }}
                  href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://www.myacc.co.za'}/reviews`}
                >
                  ⭐ Leave a Quick Review
                </Button>
              </div>
            )}

            <Text style={paragraphStyle}>
              You can access your completed documents and full invoice history in your client dashboard.
            </Text>

            {/* CTA Button */}
            <Section style={{ textAlign: 'center', marginTop: '28px', marginBottom: '28px' }}>
              <Button 
                style={{ ...buttonStyle, backgroundColor: primaryColor }} 
                href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://www.myacc.co.za'}/dashboard/orders/${order.id}`}
              >
                View Order in Dashboard
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

export default OrderStatusUpdateEmail;

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

const statusHighlightBoxStyle: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '18px 0',
};

const statusHighlightLabel: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: '800',
  color: '#64748b',
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
  margin: '0 0 4px 0',
};

const statusHighlightValue: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: '800',
  margin: 0,
  letterSpacing: '-0.5px',
};

const messageBoxStyle: React.CSSProperties = {
  backgroundColor: '#f1f5f9',
  borderLeft: '4px solid #64748b',
  borderRadius: '4px',
  padding: '12px 16px',
  margin: '14px 0',
};

const reviewBoxStyle: React.CSSProperties = {
  backgroundColor: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: '10px',
  padding: '20px',
  marginTop: '20px',
  marginBottom: '24px',
  textAlign: 'center',
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

