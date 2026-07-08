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

interface PartnerInviteEmailProps {
  partnerName: string;
  email: string;
  signupUrl: string;
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
  color: '#333'
}

export const PartnerInviteEmail = ({ partnerName, email, signupUrl }: PartnerInviteEmailProps) => {
    const previewText = `You've been invited to the My Accountant Partner Program`;

    return (
        <Html>
        <Head />
        <Preview>{previewText}</Preview>
        <Body style={main}>
            <Container style={container}>
            <Section style={box}>
                <Heading style={heading}>You're Invited, {partnerName}!</Heading>
                <Text style={paragraph}>
                    We're excited to invite you to join the My Accountant Partner Program. By becoming a partner, you'll gain access to our powerful suite of tools to help grow your practice.
                </Text>
                
                <Text style={paragraph}>
                    If you already have a My Accountant client account, you can simply log in through the link below to seamlessly upgrade your account. Otherwise, you can create a new account to get started.
                </Text>

                <Button style={button} href={signupUrl}>
                    Accept Invitation & Set Up Practice
                </Button>

                <Hr style={hr} />
                
                 <Text style={paragraph}>
                    If you have any questions, please don&apos;t hesitate to reach out to our support team at <Link href="mailto:info@myacc.co.za" style={anchor}>info@myacc.co.za</Link>.
                </Text>

                <Text style={paragraph}>
                    Regards,
                    <br />
                    The My Accountant Team
                </Text>
                
                <Text style={footer}>
                     My Accountant | <Link href="mailto:info@myacc.co.za" style={anchor}>info@myacc.co.za</Link> | Clearwater Office Park Building 3 Millenium Road & Christiaan de Wet Road Roodepoort
                </Text>
            </Section>
            </Container>
        </Body>
        </Html>
    );
}

export default PartnerInviteEmail;
