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
  Link,
} from '@react-email/components';
import * as React from 'react';

interface PartnerStaffInviteEmailProps {
  inviteeName?: string;
  partnerCompanyName: string;
  partnerContactName: string;
  inviteRole: string; // 'Partner Admin' or 'Staff Member'
  acceptUrl: string;
  expiryHours: number; // 72
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const box = {
  padding: '0 48px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const paragraph = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
};

const anchor = {
  color: '#214392',
};

const button = {
  backgroundColor: '#214392',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '12px',
  boxSizing: 'border-box' as const,
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
};

const heading = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  marginBottom: '20px',
  color: '#333',
};

export const PartnerStaffInviteEmail = ({
  inviteeName,
  partnerCompanyName,
  partnerContactName,
  inviteRole,
  acceptUrl,
  expiryHours = 72,
}: PartnerStaffInviteEmailProps) => {
  const greeting = inviteeName ? `Hi ${inviteeName},` : 'Hi there,';
  return (
    <Html>
      <Head />
      <Preview>Invitation to join {partnerCompanyName} on My Accountant</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Heading style={heading}>Join {partnerCompanyName}</Heading>
            <Text style={paragraph}>{greeting}</Text>
            <Text style={paragraph}>
              {partnerContactName} has invited you to join their practice, <strong>{partnerCompanyName}</strong>, on My Accountant.
            </Text>
            <Text style={paragraph}>
              You have been invited with the role of <strong>{inviteRole}</strong>.
            </Text>
            <Text style={paragraph}>
              Click the button below to accept the invitation and set up your account:
            </Text>
            
            <Button style={button} href={acceptUrl}>
              Accept Invitation
            </Button>
            
            <Text style={paragraph}>
              Please note: This invitation is secure and will expire in {expiryHours} hours.
            </Text>
            
            <Hr style={hr} />
            
            <Text style={paragraph}>
              If you did not expect this invitation, you can safely ignore this email.
            </Text>
            
            <Text style={paragraph}>
              Regards,
              <br />
              The My Accountant Team
            </Text>
            
            <Text style={footer}>
              My Accountant | <Link href="mailto:info@myacc.co.za" style={anchor}>info@myacc.co.za</Link> | Clearwater Office Park Building 3, Millenium Road & Christiaan de Wet Road, Roodepoort
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default PartnerStaffInviteEmail;
