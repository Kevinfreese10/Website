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

interface StaffAssignmentEmailProps {
  order: Order;
  staffName: string;
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

export const StaffAssignmentEmail = ({ order, staffName }: StaffAssignmentEmailProps) => {
    const previewText = `New Order Assigned: #${order.originalOrderId || order.id}`;

    return (
        <Html>
        <Head />
        <Preview>{previewText}</Preview>
        <Body style={main}>
            <Container style={container}>
            <Section style={box}>
                <Heading style={heading}>New Order Assigned</Heading>
                <Text style={paragraph}>
                    Hi {staffName},
                </Text>
                <Text style={paragraph}>
                    You have been assigned to process order <strong style={{color: '#214392'}}>{order.originalOrderId || order.id}</strong>.
                </Text>
                <Text style={paragraph}>
                    <strong>Customer:</strong> {order.endCustomerName || order.customerName}<br/>
                    <strong>Status:</strong> {order.status}
                </Text>
                <Text style={paragraph}>
                    Please log into the portal to review the order details and begin fulfilling the requested services.
                </Text>
                
                 <Button style={button} href={`${process.env.NEXT_PUBLIC_APP_URL}/admin/orders/${order.id}`}>
                    View Order Details
                </Button>

                <Hr style={hr} />
                
                <Text style={paragraph}>
                    Regards,
                    <br />
                    The System Admin
                </Text>
                
            </Section>
            </Container>
        </Body>
        </Html>
    );
}

export default StaffAssignmentEmail;
