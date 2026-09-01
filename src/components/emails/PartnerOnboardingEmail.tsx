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

interface PartnerOnboardingEmailProps {
  partnerName: string;
  email: string;
  creditAmount: number;
  loginUrl: string;
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
};

const walletBox = {
    padding: '24px',
    backgroundColor: '#ecfdf5',
    borderRadius: '8px',
    border: '1px solid #a7f3d0',
    margin: '24px 0',
};

export const PartnerOnboardingEmail = ({ partnerName, email, creditAmount, loginUrl }: PartnerOnboardingEmailProps) => {
    const previewText = `Your practice is activated! Next steps inside.`;
    const formattedCredit = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(creditAmount);

    return (
        <Html>
        <Head />
        <Preview>{previewText}</Preview>
        <Body style={main}>
            <Container style={container}>
            <Section style={box}>
                <Heading style={heading}>Congratulations, {partnerName.split(' ')[0]}!</Heading>
                <Text style={paragraph}>
                    Your My Accountant BEI Practice has been successfully activated! We are thrilled to welcome you to the platform and support you in scaling your firm.
                </Text>
                
                <Section style={walletBox}>
                    <Text style={{ ...paragraph, margin: '0 0 8px 0', color: '#065f46', fontWeight: 'bold' }}>
                        🎉 Practice Credits Loaded!
                    </Text>
                    <Text style={{ ...paragraph, margin: 0, color: '#047857' }}>
                        We have automatically credited your wallet with <strong>{formattedCredit}</strong> (50% of your onboarding fee). You can use this balance immediately to cover the wholesale cost of any complex tax or accounting tasks you choose to outsource to our backend team.
                    </Text>
                </Section>

                <Heading style={{ ...heading, fontSize: '18px', marginTop: '24px' }}>Your Next Steps to Launch:</Heading>
                
                <Text style={{ ...paragraph, margin: '0 0 12px 0' }}>
                    <strong>1. Customize Your Brand:</strong> Log in to configure your practice profile. Upload your logo and select your custom primary color to match your firm's branding.
                </Text>
                
                <Text style={{ ...paragraph, margin: '0 0 12px 0' }}>
                    <strong>2. Adjust Your Retail Prices:</strong> You have absolute control over what clients pay on your landing page. Choose your markup for the 65+ services while keeping our wholesale cost fixed.
                </Text>
                
                <Text style={{ ...paragraph, margin: '0 0 12px 0' }}>
                    <strong>3. Set Up Your Payout Banking Details:</strong> Add your practice's banking details under your settings to ensure secure, automatic payouts whenever a client buys a service from your landing page.
                </Text>
                
                <Text style={{ ...paragraph, margin: '0 0 12px 0' }}>
                    <strong>4. Download Re-branding Templates:</strong> Access your practitioner toolkit under "Tools" in the dashboard. Download pre-written engagement letters, professional contracts, and service scopes.
                </Text>

                <Text style={{ ...paragraph, margin: '0 0 24px 0' }}>
                    <strong>5. Book Your Personalized Onboarding:</strong> Simply reply to this email or contact support to schedule a walkthrough of the platform with one of our senior Chartered Accountants.
                </Text>

                <Button style={button} href={loginUrl}>
                    Launch Practice Dashboard
                </Button>

                <Hr style={hr} />
                
                <Text style={paragraph}>
                    If you have any questions or need immediate technical support, please don&apos;t hesitate to contact <strong>Kevin Freese</strong> directly at <Link href="mailto:info@myacc.co.za" style={anchor}>info@myacc.co.za</Link> or call us at 010 109 1625.
                </Text>

                <Text style={paragraph}>
                    To your success,
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
};

export default PartnerOnboardingEmail;
