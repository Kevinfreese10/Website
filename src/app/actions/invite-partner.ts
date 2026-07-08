'use server';

import { sendEmail } from '@/lib/email';
import { render } from '@react-email/components';
import PartnerInviteEmail from '@/components/emails/PartnerInviteEmail';
import { SITE_URL } from '@/lib/constants';

export async function invitePartnerAction(email: string, name: string) {
    if (!email || !name) {
        return { success: false, error: 'Email and name are required' };
    }

    try {
        const queryParams = new URLSearchParams({
            email,
            name
        });
        
        const signupUrl = `${SITE_URL}/partner-signup?${queryParams.toString()}`;

        const emailHtml = render(PartnerInviteEmail({
            partnerName: name,
            email,
            signupUrl
        }));

        await sendEmail({
            to: email,
            subject: 'You have been invited to the My Accountant Partner Program!',
            html: emailHtml,
        });

        return { success: true };
    } catch (error: any) {
        console.error("Failed to send partner invite:", error);
        return { success: false, error: error.message || 'Failed to send invite email' };
    }
}
