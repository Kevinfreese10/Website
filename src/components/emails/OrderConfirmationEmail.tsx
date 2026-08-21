
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
  Link,
  Button,
} from '@react-email/components';
import * as React from 'react';
import { Order, User } from '@/lib/types';

interface OrderConfirmationEmailProps {
  order: Order;
  reseller?: User;
  isNewUser?: boolean;
  generatedPassword?: string | null;
  showPaymentButton?: boolean;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: price % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(price);
};

export const OrderConfirmationEmail = ({ 
  order, 
  reseller, 
  isNewUser, 
  generatedPassword, 
  showPaymentButton = false 
}: OrderConfirmationEmailProps) => {
  const previewText = `Order Confirmation #${order.id}`;
  
  const customerDisplayName = reseller ? (order.endCustomerName || order.customerName) : order.customerName;
  const customerFirstName = customerDisplayName?.split(' ')[0] || 'Client';

  const companyName = reseller?.companyName || 'My Accountant';
  const companyEmail = reseller?.email || 'info@myacc.co.za';
  const primaryColor = reseller?.landingPage?.primaryColor || '#1e3a8a';

  let companyAddress = 'Ground Floor, Waterstone Building, Stonemill Office Park, 300 Acacia Road, Darrenwood, Johannesburg, 2195';
  if (reseller?.address) {
    const addr = reseller.address;
    companyAddress = [addr.street, addr.suburb, addr.city, addr.province, addr.zip].filter(Boolean).join(', ');
  }
  
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.myacc.co.za';
  const refundPolicyUrl = reseller?.landingPage?.slug 
    ? `${siteUrl}/p/${reseller.landingPage.slug}/refund-policy`
    : `${siteUrl}/refund-policy`;

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
                    <Text style={headerBrandSubtitle}>Order Confirmation</Text>
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
            <Heading style={headingStyle}>Thank You For Your Order!</Heading>
            
            <Text style={paragraphStyle}>
              Hi {customerFirstName},
            </Text>

            {/* New User Account Access Card */}
            {isNewUser && generatedPassword && (
              <div style={credentialsCardStyle}>
                <Text style={{ ...credentialsTitleStyle, color: primaryColor }}>🔐 Your Client Portal Access</Text>
                <Text style={{ ...paragraphStyle, fontSize: '14px', margin: '0 0 12px 0' }}>
                  An account has been created for you to track your order progress and upload required documents.
                </Text>
                <table width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ backgroundColor: '#ffffff', borderRadius: '6px', padding: '10px 12px', border: '1px solid #dbeafe' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '4px 0', fontSize: '13px', color: '#64748b', width: '130px' }}><strong>Login Email:</strong></td>
                      <td style={{ padding: '4px 0', fontSize: '13px', color: '#0f172a', fontWeight: 'bold' }}>{order.customerEmail}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 0', fontSize: '13px', color: '#64748b' }}><strong>Temporary Password:</strong></td>
                      <td style={{ padding: '4px 0', fontSize: '13px', color: '#0f172a', fontWeight: 'bold' }}>{generatedPassword}</td>
                    </tr>
                  </tbody>
                </table>
                <Text style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', margin: '8px 0 0 0' }}>
                  We recommend changing your password after logging in for the first time.
                </Text>
              </div>
            )}

            <Text style={paragraphStyle}>
              Your order <strong style={{ color: primaryColor }}>#{order.id}</strong> has been successfully registered with {companyName}.
            </Text>
            
            {(!reseller || !reseller.bankingDetails?.bankName) ? (
              <>
                <Text style={paragraphStyle}>
                  {showPaymentButton 
                    ? "Please click the button below to complete your payment securely online." 
                    : "Your order is currently awaiting payment confirmation."}
                </Text>

                <Section style={{ textAlign: 'center', marginTop: '20px', marginBottom: '24px' }}>
                  <Button style={{ ...buttonStyle, backgroundColor: primaryColor }} href={`${siteUrl}/order-confirmation/${order.id}`}>
                    {showPaymentButton ? 'Complete Payment Now' : 'View Order Details'}
                  </Button>
                </Section>
              </>
            ) : (
              <div style={eftCardStyle}>
                <Text style={eftTitleStyle}>💳 Bank Transfer / EFT Payment Instructions</Text>
                <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
                  <tbody>
                    <tr>
                      <td style={eftLabelCell}>Bank:</td>
                      <td style={eftValueCell}>{reseller.bankingDetails.bankName}</td>
                    </tr>
                    <tr>
                      <td style={eftLabelCell}>Account Holder:</td>
                      <td style={eftValueCell}>{reseller.bankingDetails.accountHolder}</td>
                    </tr>
                    <tr>
                      <td style={eftLabelCell}>Account Number:</td>
                      <td style={eftValueCell}>{reseller.bankingDetails.accountNumber}</td>
                    </tr>
                    <tr>
                      <td style={eftLabelCell}>Branch Code:</td>
                      <td style={eftValueCell}>{reseller.bankingDetails.branchCode}</td>
                    </tr>
                    <tr>
                      <td style={eftLabelCell}>Reference:</td>
                      <td style={{ ...eftValueCell, color: '#dc2626', fontWeight: '800' }}>{order.id}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Order Items Table */}
            <div style={tableWrapperStyle}>
              <table width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={tableHeaderRowStyle}>
                    <th align="left" style={tableHeaderCellStyle}>ITEM / SERVICE</th>
                    <th align="right" style={tableHeaderCellStyle}>AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item: any, idx: number) => {
                    const isEven = idx % 2 === 0;
                    return (
                      <tr key={item.id || idx} style={{ backgroundColor: isEven ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <td style={tableCellStyle}>
                          <Text style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                            {item.title} <span style={{ color: '#64748b', fontWeight: 'normal' }}>× {item.quantity}</span>
                          </Text>
                        </td>
                        <td align="right" style={{ ...tableCellStyle, textAlign: 'right' }}>
                          <Text style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                            {formatPrice(item.clientPrice || item.price)}
                          </Text>
                        </td>
                      </tr>
                    );
                  })}
                  <tr style={{ backgroundColor: '#f1f5f9' }}>
                    <td style={{ ...tableCellStyle, paddingTop: '14px', paddingBottom: '14px' }}>
                      <Text style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Total Due</Text>
                    </td>
                    <td align="right" style={{ ...tableCellStyle, textAlign: 'right', paddingTop: '14px', paddingBottom: '14px' }}>
                      <Text style={{ fontSize: '17px', fontWeight: '800', color: primaryColor, margin: 0 }}>
                        {formatPrice(order.clientTotal || order.total)}
                      </Text>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <Text style={{ ...paragraphStyle, marginTop: '20px' }}>
              Once your payment is confirmed, please log in to your dashboard to complete any required documents.
            </Text>

            <Section style={{ textAlign: 'center', marginTop: '20px', marginBottom: '24px' }}>
              <Button style={{ ...buttonStyle, backgroundColor: '#334155' }} href={`${siteUrl}/dashboard/orders/${order.id}`}>
                Go to My Dashboard
              </Button>
            </Section>

            <Text style={{ ...paragraphStyle, fontSize: '13px', color: '#64748b' }}>
              By making payment, you accept our <Link href={refundPolicyUrl} style={{ color: primaryColor, textDecoration: 'underline' }}>Refund Policy</Link>.
            </Text>
            
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
                        Please log into your <a href={`${siteUrl}/dashboard/orders/${order.id}`} style={{ color: primaryColor, fontWeight: '700', textDecoration: 'underline' }}>Client Dashboard</a> to track your order, upload documents, or communicate with our team. Please note that this is an automated notification mailbox and is not monitored for incoming replies.
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

export default OrderConfirmationEmail;

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

const credentialsCardStyle: React.CSSProperties = {
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: '8px',
  padding: '16px 18px',
  margin: '18px 0',
};

const credentialsTitleStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: '800',
  margin: '0 0 8px 0',
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


