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

interface PartnerAssignmentEmailProps {
  order: Order;
  partnerName: string;
  isDirectAssignment: boolean;
  payoutAmount: number;
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

const heading = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  marginBottom: '20px',
  color: '#333'
}

export const PartnerAssignmentEmail = ({ order, partnerName, isDirectAssignment, payoutAmount }: PartnerAssignmentEmailProps) => {
    const previewText = isDirectAssignment 
        ? `New Job Assigned: Payout R${payoutAmount}` 
        : `New Job Available on Overflow Board: Payout R${payoutAmount}`;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-ZA', {
            style: 'currency',
            currency: 'ZAR',
            minimumFractionDigits: 2,
        }).format(price);
    };

    return (
        <Html>
        <Head />
        <Preview>{previewText}</Preview>
        <Body style={main}>
            <Container style={container}>
            <Section style={box}>
                <Heading style={heading}>{isDirectAssignment ? 'New Job Assigned' : 'New Job on Overflow Board'}</Heading>
                <Text style={paragraph}>
                    Hi {partnerName},
                </Text>
                {isDirectAssignment ? (
                    <Text style={paragraph}>
                        You have been directly assigned a new job from My Accountant.
                    </Text>
                ) : (
                    <Text style={paragraph}>
                        A new job has been posted to the Overflow Board that matches your capabilities.
                    </Text>
                )}
                
                <Text style={paragraph}>
                    <strong>Order ID:</strong> {order.originalOrderId || order.id}<br/>
                    <strong>Services:</strong> {order.items.map(item => item.title).join(', ')}<br/>
                    <strong>Payout:</strong> {formatPrice(payoutAmount)}
                </Text>
                
                <Text style={paragraph}>
                    {isDirectAssignment 
                        ? 'Please log into the partner portal to review the order details and begin processing.' 
                        : 'Log into the partner portal to claim this job before it is taken.'}
                </Text>
                
                 <Button style={button} href={`${process.env.NEXT_PUBLIC_APP_URL}/partner/orders`}>
                    View in Partner Portal
                </Button>

                <Hr style={hr} />
                
                <Text style={paragraph}>
                    Regards,
                    <br />
                    The My Accountant Team
                </Text>
                
            </Section>
            </Container>
        </Body>
        </Html>
    );
}

export default PartnerAssignmentEmail;
