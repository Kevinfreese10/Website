import * as React from 'react';
import { Html, Head, Body, Container, Section, Text, Button, Preview, Heading } from '@react-email/components';

export default function DailyDigestEmail({ 
  staffName, pendingCount, overdueCount
}: any) {
  return (
    <Html>
      <Head />
      <Preview>Your Daily Task Digest</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f6f9fc', padding: '20px' }}>
        <Container style={{ backgroundColor: '#ffffff', border: '1px solid #e6ebf1', borderRadius: '5px', padding: '40px' }}>
          <Heading style={{ color: '#333', fontSize: '24px', fontWeight: 'bold' }}>Daily Task Digest</Heading>
          <Text style={{ color: '#555', fontSize: '16px', lineHeight: '24px' }}>
            Hi {staffName}, you have {pendingCount} tasks pending and {overdueCount} overdue tasks today.
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
