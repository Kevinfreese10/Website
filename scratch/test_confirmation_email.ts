import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { sendOrderConfirmationEmailAction } from '../src/app/actions';

async function testConfirmation() {
    console.log("Calling sendOrderConfirmationEmailAction...");
    try {
        const orderData = {
            id: "TEST-ORDER-12345",
            customerName: "Test Client",
            customerEmail: "winifred@myacc.co.za",
            customerPhone: "0821234567",
            items: [{ id: "test_service", title: "Test Bookkeeping Service", price: 150, quantity: 1 }],
            total: 150,
            discountCode: null,
            discountAmount: null,
            paymentMethod: "PayFast",
            status: "Pending Payment",
            date: new Date().toISOString(),
            source: "Client",
        } as any;

        await sendOrderConfirmationEmailAction({
            orderData,
            isNewUser: true,
            generatedPassword: "temporaryPassword123",
            showPaymentButton: true,
        });
        console.log("Order confirmation email call completed successfully!");
    } catch (err: any) {
        console.error("Failed to send order confirmation email:", err);
    }
}

testConfirmation();
