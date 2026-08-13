import * as React from 'react';
import { Html, Head, Body, Container, Section, Text, Button, Preview, Heading } from '@react-email/components';

export default function SubscriptionFailedEmail({ 
  clientName, planName
}: any) {
  return (
    <Html>
      <Head />
      <Preview>Action Required: Payment Failed</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f6f9fc', padding: '20px' }}>
        <Container style={{ backgroundColor: '#ffffff', border: '1px solid #e6ebf1', borderRadius: '5px', padding: '40px' }}>
          <Heading style={{ color: '#333', fontSize: '24px', fontWeight: 'bold' }}>Subscription Payment Failed</Heading>
          <Text style={{ color: '#555', fontSize: '16px', lineHeight: '24px' }}>
            Hi {clientName}, we were unable to process the payment for your {planName} subscription. Please update your payment details.
          </Text>
          <Section style={{ textAlign: 'center', marginTop: '30px' }}>
            <Button href="https://www.myacc.co.za" style={{ backgroundColor: '#0070f3', color: '#fff', padding: '12px 20px', borderRadius: '5px', textDecoration: 'none', fontWeight: 'bold' }}>
              Log in to your Dashboard
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
