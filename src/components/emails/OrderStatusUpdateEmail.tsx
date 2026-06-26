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

interface OrderStatusUpdateEmailProps {
  order: Order;
  reseller?: User;
  message?: string;
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

export const OrderStatusUpdateEmail = ({ order, reseller, message }: OrderStatusUpdateEmailProps) => {
    const previewText = `Update on Order #${order.id}: ${order.status}`;

    const companyName = reseller?.companyName || 'My Accountant';
    const companyEmail = reseller?.email || 'info@myacc.co.za';
    const companyAddress = reseller?.address ? `${reseller.address.street}, ${reseller.address.city}` : 'Ground Floor, Waterstone Building, Stonemill Office Park, 300 Acacia Road, Darrenwood, Johannesburg, 2195';

    return (
        <Html>
        <Head />
        <Preview>{previewText}</Preview>
        <Body style={main}>
            <Container style={container}>
            <Section style={box}>
                <Heading style={heading}>Order Status Update</Heading>
                <Text style={paragraph}>
                    Hi {order.customerName.split(' ')[0]},
                </Text>
                <Text style={paragraph}>
                    The status of your order <strong style={{color: '#214392'}}>{order.id}</strong> has been updated to <strong>{order.status}</strong>.
                </Text>
                
                {message && (
                    <Text style={paragraph}>
                        <strong>Note:</strong> {message}
                    </Text>
                )}

                <Text style={paragraph}>
                    You can view the full details of your order by logging into your dashboard.
                </Text>
                
                 <Button style={button} href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/orders/${order.id}`}>
                    View Order Details
                </Button>

                <Hr style={hr} />
                
                <Text style={paragraph}>
                    Regards,
                    <br />
                    The {companyName} Team
                </Text>
                
                <Text style={footer}>
                     {companyName} | <a href={`mailto:${companyEmail}`} style={anchor}>{companyEmail}</a> | {companyAddress}
                </Text>
            </Section>
            </Container>
        </Body>
        </Html>
    );
}

export default OrderStatusUpdateEmail;
