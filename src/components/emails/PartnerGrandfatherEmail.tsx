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

interface PartnerGrandfatherEmailProps {
  partnerName: string;
  companyName: string;
  freeUntilDate: string; // e.g. "15 September 2026"
  dashboardUrl: string;
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

export const PartnerGrandfatherEmail = ({
  partnerName,
  companyName,
  freeUntilDate,
  dashboardUrl,
}: PartnerGrandfatherEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Important update regarding your My Accountant Practice account</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Heading style={heading}>Important Update for {companyName || 'your Practice'}</Heading>
            <Text style={paragraph}>
              Hi {partnerName.split(' ')[0]},
            </Text>
            <Text style={paragraph}>
              Thank you for being one of our early Bookkeeper Empowerment Initiative (BEI) partners. We are writing to share some exciting updates about how we are expanding the platform to better support your practice.
            </Text>
            <Text style={paragraph}>
              We have upgraded the BEI to a modern subscription model. Along with this upgrade, we have introduced a suite of new features including a full **Staff Management System** with granular permissions, an integrated **Task Manager**, and enhanced **AI Accounting and Payroll tools**.
            </Text>
            <Text style={paragraph}>
              <strong>What this means for you:</strong>
            </Text>
            <Text style={paragraph}>
              As a thank you for your early support, we have upgraded your account to our new **Growth Tier free of charge until {freeUntilDate}**. No action is required on your part — you already have full access.
            </Text>
            <Text style={paragraph}>
              After {freeUntilDate}, the subscription will continue at the partner-only rate of R950/month.
            </Text>
            <Text style={paragraph}>
              If you decide not to proceed with the subscription, you can request a full refund of any unused credits in your practice wallet by replying to this email.
            </Text>

            <Button style={button} href={dashboardUrl}>
              Go to Your Upgraded Dashboard
            </Button>

            <Hr style={hr} />

            <Text style={paragraph}>
              If you have any questions or need support getting started with the new staff or task managers, please feel free to reach out to us.
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

export default PartnerGrandfatherEmail;
