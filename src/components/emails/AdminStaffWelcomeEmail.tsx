import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface AdminStaffWelcomeEmailProps {
  staffName: string;
  email: string;
  tempPassword?: string;
  loginUrl: string;
}

export const AdminStaffWelcomeEmail = ({
  staffName,
  email,
  tempPassword,
  loginUrl,
}: AdminStaffWelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to the Team!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to the Team, {staffName}!</Heading>
          <Text style={text}>
            Your staff account has been created on the My Accountant Admin Dashboard.
          </Text>
          <Section style={detailsSection}>
            <Text style={detailsText}>
              <strong>Email:</strong> {email}
            </Text>
            {tempPassword && (
              <Text style={detailsText}>
                <strong>Temporary Password:</strong> {tempPassword}
              </Text>
            )}
          </Section>
          <Text style={text}>
            You can log in to your dashboard using the button below. Please change your password after logging in for the first time.
          </Text>
          <Section style={btnContainer}>
            <Button style={button} href={loginUrl}>
              Go to Dashboard
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default AdminStaffWelcomeEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  padding: '17px 40px',
  margin: '0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 40px',
};

const detailsSection = {
  padding: '20px 40px',
  backgroundColor: '#f1f5f9',
  borderRadius: '8px',
  margin: '20px 40px',
};

const detailsText = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0',
};

const btnContainer = {
  textAlign: 'center' as const,
  padding: '20px 40px',
};

const button = {
  backgroundColor: '#0ea5e9',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px',
  fontWeight: 'bold',
};
