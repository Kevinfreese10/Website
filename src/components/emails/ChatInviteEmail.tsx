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

interface ChatInviteEmailProps {
  recipientName: string;
  senderName: string;
  actionUrl: string;
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '24px 0 48px',
  marginBottom: '64px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
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
  backgroundColor: '#4f46e5',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '15px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '12px 0',
  marginTop: '25px',
  boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.1), 0 2px 4px -1px rgba(79, 70, 229, 0.06)',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
};

const heading = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  marginBottom: '10px',
  color: '#1e1b4b',
  textAlign: 'left' as const,
};

export const ChatInviteEmail = ({ recipientName, senderName, actionUrl }: ChatInviteEmailProps) => {
  const previewText = `${senderName} is ready to chat with you.`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Heading style={heading}>Live Chat Invitation</Heading>
            <Hr style={hr} />
            <Text style={paragraph}>
              Hi {recipientName.split(' ')[0]},
            </Text>
            <Text style={paragraph}>
              <strong>{senderName}</strong> is ready to chat with you regarding your inquiry on My Accountant.
            </Text>
            <Text style={paragraph}>
              Please click the link below to join the chat and speak directly with {senderName.split(' ')[0]}.
            </Text>

            <Button style={button} href={actionUrl}>
              Join the Chat
            </Button>
            
            <Hr style={hr} />
            
            <Text style={footer}>
              My Accountant Support Team
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default ChatInviteEmail;
