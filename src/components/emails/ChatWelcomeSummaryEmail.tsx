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

interface ChatWelcomeSummaryEmailProps {
  recipientName: string;
  summaryText: string;
  actionUrl: string;
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

const button = {
  backgroundColor: '#4f46e5', // Indigo color
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '12px',
  marginTop: '25px',
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
  color: '#1e1b4b',
};

export const ChatWelcomeSummaryEmail = ({ recipientName, summaryText, actionUrl }: ChatWelcomeSummaryEmailProps) => {
  const previewText = `Welcome to My Accountant! Here is a summary of our chat...`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Heading style={heading}>Welcome to My Accountant!</Heading>
            <Text style={paragraph}>
              Hi {recipientName.split(' ')[0]},
            </Text>
            <Text style={paragraph}>
              Thank you for chatting with us today. It was great connecting with you. As promised, here is a quick summary of what we discussed:
            </Text>
            <Section style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#f8fafc', marginTop: '16px', borderLeft: '4px solid #4f46e5' }}>
              <Text style={{ ...paragraph, margin: 0, fontSize: '15px', color: '#1e293b', whiteSpace: 'pre-wrap' }}>
                {summaryText}
              </Text>
            </Section>
            <Text style={paragraph}>
              If you have any further questions or if you'd like to pick up where we left off, simply click the button below to resume your chat.
            </Text>

            <Button style={button} href={actionUrl}>
              Resume Chat
            </Button>
            
            <Hr style={hr} />
            
            <Text style={footer}>
              My Accountant Team
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default ChatWelcomeSummaryEmail;
