import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';
import { Order, User } from '@/lib/types';
import ipaddr from 'ipaddr.js';
import { render } from '@react-email/components';
import React from 'react';
import DocumentRequestEmail from '@/components/emails/DocumentRequestEmail';
import PartnerOnboardingEmail from '@/components/emails/PartnerOnboardingEmail';
import { sendEmail } from '@/lib/email';
import { services as allServices } from '@/lib/data';
import { isStaffActive, isEligibleOrderStaff } from '@/lib/utils';

// PayFast's valid IP ranges (combining legacy ranges, sandbox, and new AWS IP blocks)
const PAYFAST_IP_RANGES = [
    // Core/Legacy PayFast IP blocks
    '197.97.145.144/28',
    '41.74.179.192/27',
    '102.216.36.0/28',
    '102.216.36.128/28',
    
    // Legacy whitelist fallbacks
    '197.97.183.80/28',
    '196.25.7.240/28',
    '197.242.144.240/28',
    '41.74.178.192/28',

    // Sandbox ITN server
    '144.126.193.139/32',

    // New AWS-based IP addresses
    '3.163.236.237/32',
    '3.163.238.237/32',
    '3.163.251.237/32',
    '3.163.232.237/32',
    '3.163.241.237/32',
    '3.163.245.237/32',
    '3.163.248.237/32',
    '3.163.234.237/32',
    '3.163.237.237/32',
    '3.163.243.237/32',
    '3.163.247.237/32',
    '3.163.242.237/32',
    '3.163.244.237/32',
    '3.163.249.237/32',
    '3.163.252.237/32',
    '3.163.235.237/32',
    '3.163.239.237/32',
    '3.163.250.237/32',
    '3.163.233.237/32',
    '3.163.246.237/32',
    '3.163.240.237/32',
];

function isIpAllowed(req: NextRequest): boolean {
    // Priority check for x-forwarded-for in proxy environments
    let ipStr = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || (req as any).ip;
    
    if (!ipStr) {
        console.warn('ITN Warning: Could not determine request IP address.');
        return false;
    }

    try {
        const reqIp = ipaddr.parse(ipStr);
        return PAYFAST_IP_RANGES.some(range => {
            const cidr = ipaddr.parseCIDR(range);
            return reqIp.match(cidr);
        });
    } catch (e) {
        console.error('ITN IP parsing error:', e);
        return false;
    }
}

/**
 * Verifies the PayFast signature by processing the RAW body string.
 * This is the only way to guarantee parameter order and encoding match.
 */
function verifyPayFastSignature(rawBody: string, receivedSignature: string, passphrase?: string): boolean {
    const params = rawBody.split('&');
    let signatureString = '';

    for (const param of params) {
        const eqIndex = param.indexOf('=');
        if (eqIndex === -1) continue;
        const key = param.substring(0, eqIndex);
        const value = param.substring(eqIndex + 1);

        if (key !== 'signature' && value !== '') {
            signatureString += `${key}=${value}&`;
        }
    }

    // Remove trailing ampersand
    let finalString = signatureString.slice(0, -1);
    
    if (passphrase) {
        // Passphrase must be encoded exactly as PayFast expects (standard urlencode)
        const encodedPassphrase = encodeURIComponent(passphrase.trim()).replace(/%20/g, '+');
        finalString += `&passphrase=${encodedPassphrase}`;
    }

    const calculatedSignature = crypto.createHash('md5').update(finalString).digest('hex');
    return calculatedSignature === receivedSignature;
}

export async function POST(req: NextRequest) {
    console.log(`ITN Processing: ${new Date().toISOString()}`);
  
    // 1. IP Validation (Non-blocking warning to prevent cloud proxy headers/AWS range shifts from aborting payments)
    const isIpRecognized = isIpAllowed(req);
    if (!isIpRecognized) {
        let clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || (req as any).ip || 'unknown';
        console.warn(`ITN Warning: Unrecognized incoming IP address: ${clientIp}. Relying on secure signature verification.`);
    }

    try {
        const rawBody = await req.text();
        const searchParams = new URLSearchParams(rawBody);
        const data: { [key: string]: string } = {};
        searchParams.forEach((value, key) => {
            data[key] = value;
        });

        const orderId = data.m_payment_id;
        if (!orderId) {
            console.error('ITN Error: m_payment_id missing.');
            return new NextResponse('OK', { status: 200 });
        }

        // Initialize Admin Firestore
        const adminDb = getAdminDb();

        // 0. Merchant validation — reject notifications that aren't for OUR merchant account.
        //
        // Without this, an attacker could register their own PayFast SANDBOX merchant, create a
        // cheap sandbox transaction whose m_payment_id is a real order id and whose amount matches
        // that order's total, and replay the ITN here. Local signature verification would fail
        // (different passphrase), and the fallback below then chose its validation endpoint from
        // the REQUEST BODY — so `merchant_id: '100…'` steered it to the sandbox validator, which
        // returned VALID, and the order was marked paid for free.
        const expectedMerchantId = process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID;
        if (expectedMerchantId && data.merchant_id && data.merchant_id !== expectedMerchantId) {
            console.error(`ITN Rejected: merchant_id "${data.merchant_id}" does not match this deployment's merchant.`);
            return new NextResponse('OK', { status: 200 });
        }

        // 1. Signature Validation using the RAW body (moved up so it validates all requests)
        let isValid = verifyPayFastSignature(rawBody, data.signature, process.env.PAYFAST_PASSPHRASE);

        if (!isValid) {
            console.warn(`ITN Warning: Local signature mismatch for order/partner ${orderId}. Attempting server confirmation fallback.`);
            try {
                // Sandbox-vs-live is determined by OUR OWN server configuration only. It must never
                // be derived from the request body — that let the caller pick their own validator.
                const isSandbox = process.env.NEXT_PUBLIC_PAYFAST_PROCESS_URL?.includes('sandbox') ||
                                  expectedMerchantId === '10042278' ||
                                  expectedMerchantId === '10049800';
                const validationUrl = isSandbox
                    ? 'https://sandbox.payfast.co.za/eng/query/validate'
                    : 'https://www.payfast.co.za/eng/query/validate';
                
                const validationRes = await fetch(validationUrl, {
                    method: 'POST',
                    body: rawBody,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'User-Agent': 'MyAccountant-NextJS-ITN-Handler/1.0',
                    }
                });
                
                const validationText = (await validationRes.text()).trim();
                console.log(`ITN Validation response from PayFast for order/partner ${orderId}: "${validationText}"`);
                
                if (validationText === 'VALID') {
                    isValid = true;
                }
            } catch (fallbackError) {
                console.error(`ITN Error: Server confirmation fallback failed for order/partner ${orderId}:`, fallbackError);
            }
        }

        if (!isValid) {
            console.error('Signature mismatch for order/partner:', orderId);
            return new NextResponse('Signature mismatch', { status: 400 });
        }

        // 2. Handle Partner Subscription ITN Events
        if (data.custom_str1 === 'partner_subscription') {
            const partnerId = data.m_payment_id;
            const payfastToken = data.token;
            const paymentStatus = data.payment_status;
            
            console.log(`ITN Partner Subscription Event for partner ${partnerId}. Status: ${paymentStatus}`);
            
            const userRef = adminDb.collection('users').doc(partnerId);
            const userSnap = await userRef.get();
            if (!userSnap.exists) {
                console.error(`User (Partner) ${partnerId} not found for subscription update.`);
                return new NextResponse('OK', { status: 200 });
            }
            
            const now = new Date();
            const currentPeriodEnd = new Date();
            currentPeriodEnd.setDate(now.getDate() + 30); // 30 days period
            
            if (paymentStatus === 'COMPLETE') {
                await userRef.update({
                    partnerTier: 'growth',
                    partnerSubscription: {
                        status: 'active',
                        payfastToken: payfastToken || null,
                        currentPeriodStart: now,
                        currentPeriodEnd: currentPeriodEnd,
                        aiCompanyLimit: 5,
                        aiPayrollLimit: 5,
                        staffSeatLimit: 3,
                    }
                });
                console.log(`Successfully activated/renewed Growth subscription for partner ${partnerId}`);
            } else if (paymentStatus === 'FAILED') {
                await userRef.update({
                    'partnerSubscription.status': 'lapsed',
                });
                console.log(`Payment failed: Growth subscription set to lapsed for partner ${partnerId}`);
            } else if (paymentStatus === 'CANCELLED') {
                await userRef.update({
                    'partnerSubscription.status': 'cancelled',
                    'partnerSubscription.cancelledAt': now,
                });
                console.log(`Growth subscription cancelled for partner ${partnerId}`);
            }
            
            return new NextResponse('OK', { status: 200 });
        }

        // 3. Find the normal checkout order (if not a subscription)
        let isOutsourcePayment = false;
        let actualOrderId = orderId;
        if (orderId.startsWith('OUTSOURCE-')) {
            isOutsourcePayment = true;
            actualOrderId = orderId.replace('OUTSOURCE-', '');
        }

        const querySnapshot = await adminDb.collection('orders').where('id', '==', actualOrderId).get();

        if (querySnapshot.empty) {
            console.error(`Order ${actualOrderId} not found.`);
            return new NextResponse('OK', { status: 200 });
        }
        
        const orderDoc = querySnapshot.docs[0];
        const orderRef = orderDoc.ref;
        const currentOrderData = orderDoc.data() as Order;

        // Idempotency: Ignore if already processed
        if (isOutsourcePayment) {
            if (currentOrderData.isOutsourced) {
                console.log(`ITN Info: Order ${actualOrderId} already outsourced.`);
                return new NextResponse('OK', { status: 200 });
            }
        } else {
            if (currentOrderData.status !== 'Pending Payment') {
                console.log(`ITN Info: Order ${actualOrderId} already processed (Status: ${currentOrderData.status}).`);
                return new NextResponse('OK', { status: 200 });
            }
        }
        
        // 3. Amount Validation
        let orderTotal = parseFloat((currentOrderData.clientTotal || currentOrderData.total).toFixed(2));

        if (currentOrderData.resellerId && currentOrderData.isOutsourced && !isOutsourcePayment) {
            orderTotal = parseFloat(currentOrderData.total.toFixed(2));
        }

        if (isOutsourcePayment) {
            // Calculate outsourcing cost
            const partnerId = currentOrderData.resellerId;
            if (!partnerId) {
                return new NextResponse('Missing resellerId', { status: 400 });
            }
            const partnerSnap = await adminDb.collection('users').doc(partnerId).get();
            const partnerProfile = partnerSnap.data() as User;
            const isGrowthActive = partnerProfile?.partnerTier === 'growth' || 
                (partnerProfile?.partnerSubscription?.status === 'active');
                
            let cost = 0;
            for (const item of currentOrderData.items) {
                const service = allServices.find(s => s.id === item.id);
                const basePrice = service?.price || item.price || 0;
                const wholesalePrice = isGrowthActive 
                    ? (service?.resellerPrice || basePrice * 0.80)
                    : (basePrice * 0.80);
                cost += wholesalePrice * (item.quantity || 1);
            }
            orderTotal = parseFloat(cost.toFixed(2));
        }

        const receivedAmount = parseFloat(data.amount_gross);
        if (Math.abs(orderTotal - receivedAmount) > 0.01) {
             console.error(`Amount mismatch. Expected: ${orderTotal}, Received: ${receivedAmount}`);
             await orderRef.update({ 
                itnHistory: FieldValue.arrayUnion({ 
                    status: 'Failed', 
                    message: `Amount mismatch. Expected ${orderTotal}, got ${receivedAmount}`, 
                    receivedAt: new Date(),
                    payload: data
                }) 
            });
            return new NextResponse('Amount mismatch', { status: 400 });
        }

        if (data.payment_status === 'COMPLETE') {
          const isTopupOnly = currentOrderData.items && currentOrderData.items.length > 0 && currentOrderData.items.every(i => i.id === 'partner_credit_topup');
          if (isOutsourcePayment) {
              const note = {
                  text: `Order outsourced to My Accountant. Paid via PayFast. Document request sent to ${currentOrderData.documentContact === 'client' ? currentOrderData.endCustomerEmail : currentOrderData.customerEmail}.`,
                  date: new Date(),
                  authorId: 'system',
                  type: 'note',
                  subject: null,
                  attachments: null,
              };
              await orderRef.update({
                  isOutsourced: true,
                  status: 'Processing',
                  notes: FieldValue.arrayUnion(note)
              });
          } else if (isTopupOnly) {
              await orderRef.update({ 
                  status: 'Completed',
                  fulfillmentStatus: 'Completed'
              });
          } else {
              await orderRef.update({ status: 'Processing' });
          }

          if (currentOrderData.discountCode) {
              try {
                  const codeUpper = currentOrderData.discountCode.toUpperCase().trim();
                  await adminDb.collection('discounts').doc(codeUpper).update({
                      status: 'used',
                      usedAt: FieldValue.serverTimestamp(),
                      orderId: orderDoc.id,
                  });
                  console.log(`[PayFast ITN] Marked discount code ${codeUpper} as used for order ${orderDoc.id}`);
              } catch (dErr) {
                  console.error('[PayFast ITN] Error updating discount code status:', dErr);
              }
          }

          if (currentOrderData.userId && currentOrderData.items && currentOrderData.items.some(item => item.id === 'partner_dfy_setup')) {
              await adminDb.collection('users').doc(currentOrderData.userId).update({ setupAddon: true });
              console.log(`Paid Done-For-You Setup Add-on. Marked partner ${currentOrderData.userId} setupAddon as true.`);
          }

          if (currentOrderData.userId && currentOrderData.items && currentOrderData.items.some(item => item.id === 'partner_platform_fee')) {
              await adminDb.collection('users').doc(currentOrderData.userId).update({
                  platformFeePaid: true,
                  status: 'Active'
              });
              console.log(`[Partner Platform Fee] Set platformFeePaid=true for user ${currentOrderData.userId}`);

              // Send Storefront Unlocked Welcome Email
              try {
                  const partnerSnap = await adminDb.collection('users').doc(currentOrderData.userId).get();
                  if (partnerSnap.exists) {
                      const partnerUser = partnerSnap.data() as User;
                      const storefrontUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://myacc.co.za'}/p/${(partnerUser as any).practiceSlug || partnerUser.id}`;
                      const emailHtml = `
                          <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
                              <h2 style="color: #214392; margin-top: 0;">🎉 Practice Storefront Unlocked!</h2>
                              <p>Dear ${partnerUser.name || 'Partner'},</p>
                              <p>Thank you for completing your Platform Access payment. Your digital accounting practice storefront is now <strong>Active & Live</strong>!</p>
                              
                              <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; margin: 20px 0;">
                                  <p style="margin: 0 0 8px 0;"><strong>Your Practice Link:</strong></p>
                                  <a href="${storefrontUrl}" style="color: #214392; font-weight: bold; word-break: break-all;">${storefrontUrl}</a>
                              </div>

                              <h4 style="color: #0f172a; margin-bottom: 8px;">What you can do now:</h4>
                              <ul>
                                  <li>Set custom service retail prices & markups in your Partner Portal</li>
                                  <li>Share your white-labeled client storefront link with prospective clients</li>
                                  <li>Fulfill orders yourself or outsource directly to My Accountant at wholesale rates</li>
                              </ul>

                              <p style="margin-top: 24px;">Need help setting up custom domains or pricing? Log into your portal to get started.</p>
                              
                              <p style="margin-top: 30px; font-size: 13px; color: #64748b;">Warm regards,<br/><strong>The My Accountant Team</strong></p>
                          </div>
                      `;
                      await sendEmail({
                          to: partnerUser.email,
                          subject: '🎉 Your Practice Storefront is Now Active & Unlocked!',
                          html: emailHtml,
                      });
                  }
              } catch (e) {
                  console.error('[Partner Platform Fee] Failed to send storefront activation email:', e);
              }
          }
          
          if (currentOrderData.originalOrderId) {
              const originalOrderRef = adminDb.collection('orders').doc(currentOrderData.originalOrderId);
              await originalOrderRef.update({
                  isOutsourced: true,
                  status: 'Processing',
                  fulfillmentStatus: 'Awaiting Documents',
                  documentContact: currentOrderData.documentContact || 'partner',
              });
              
              const note = {
                  text: `Order outsourced to My Accountant. Paid via PayFast. Document request sent to ${currentOrderData.documentContact === 'client' ? currentOrderData.endCustomerEmail : currentOrderData.customerEmail}.`,
                  date: new Date(),
                  authorId: 'system',
                  type: 'note',
                  subject: null,
                  attachments: null,
              };
              await originalOrderRef.update({
                  notes: FieldValue.arrayUnion(note)
              });
          }
          
          // Staff Workload Querying & Load-Balanced Allocation (Skip for Practice Credit Top-ups)
          if (!isTopupOnly) {
            try {
              let department: 'Accounting and Tax' | 'Administration' | 'CAP' = 'Administration';
              
              if (currentOrderData.department) {
                  department = currentOrderData.department as any;
              } else {
                  const itemIds = currentOrderData.items.map(i => i.id || i.serviceId).filter(Boolean) as string[];
                  for (const itemId of itemIds) {
                      let service = allServices.find(s => s.id === itemId);
                      if (!service) {
                          try {
                              const serviceSnap = await adminDb.collection('services').doc(itemId).get();
                              if (serviceSnap.exists) {
                                  service = { id: serviceSnap.id, ...serviceSnap.data() } as any;
                              }
                          } catch (dbErr) {
                              console.error(`Failed to fetch service ${itemId} from Firestore in ITN:`, dbErr);
                          }
                      }
                      if (service && service.department) {
                          department = service.department as any;
                          break;
                      }
                  }
              }
              
              console.log(`Allocating staff for order ${orderId} in department ${department}`);
              
              const staffSnapshot = await adminDb.collection('users')
                  .where('role', 'in', ['staff', 'admin'])
                  .get();
              
              const allActiveStaff = staffSnapshot.docs
                  .map(doc => ({ id: doc.id, ...doc.data() } as User))
                  .filter(isEligibleOrderStaff);

              // All new orders are allocated to Kevin Freese (kev@thinkestry.co.za) by default
              let assignedStaffId: string | null = null;
              let staffUser: User | null = null;

              const kevinDoc = staffSnapshot.docs.find(d => {
                  const data = d.data() as User;
                  const email = (data.email || '').toLowerCase().trim();
                  return email === 'kev@thinkestry.co.za' || email === 'info@myacc.co.za';
              });

              if (kevinDoc) {
                  assignedStaffId = kevinDoc.id;
                  staffUser = { id: kevinDoc.id, ...kevinDoc.data() } as User;
              } else if (allActiveStaff.length > 0) {
                  const adminStaff = allActiveStaff.find(s => s.role === 'admin') || allActiveStaff[0];
                  assignedStaffId = adminStaff.id;
                  staffUser = adminStaff;
              }

              if (assignedStaffId && staffUser) {
                  const staffName = staffUser.name || 'Kevin Freese';
                  console.log(`Assigning order ${orderId} to ${staffName} (${assignedStaffId})`);
                  
                  await orderRef.update({
                      assignedTo: [assignedStaffId],
                      department: department,
                      notes: FieldValue.arrayUnion({
                          text: `Order automatically assigned to ${staffName} (${staffUser.email}) for review and reallocation.`,
                          date: new Date(),
                          authorId: 'system',
                          type: 'note',
                          subject: null,
                          attachments: null,
                      })
                  });
                  
                  if (staffUser.email) {
                      try {
                          await sendEmail({
                              to: staffUser.email,
                              subject: `New Order Assigned: #${orderId}`,
                              html: `
                                  <p>Hi ${staffName},</p>
                                  <p>A new order (<strong>#${orderId}</strong>) has been placed and assigned to you for review and reallocation.</p>
                                  <p><strong>Department:</strong> ${department}</p>
                                  <p><strong>Customer:</strong> ${currentOrderData.customerName}</p>
                                  <p>Please log in to the dashboard to review and reallocate or fulfill the services.</p>
                                  <br/>
                                  <p>Best regards,<br/>My Accountant System</p>
                              `
                          });
                          console.log(`Notification email sent to staff ${staffUser.email}`);
                      } catch (emailErr) {
                          console.error(`Failed to send assignment email to staff ${staffUser.email}:`, emailErr);
                      }
                  }
              } else {
                  console.warn(`Could not assign staff. Order ${orderId} remains unassigned.`);
                  await orderRef.update({
                      assignedTo: [],
                      department: department,
                      notes: FieldValue.arrayUnion({
                          text: `Order set to department: ${department}. Could not assign staff.`,
                          date: new Date(),
                          authorId: 'system',
                          type: 'note',
                          subject: null,
                          attachments: null,
                      })
                  });
              }

              const taskRef = adminDb.collection('tasks').doc();
              await taskRef.set({
                  id: taskRef.id,
                  title: `Order #${orderId} - Fulfill Services`,
                  description: `Please fulfill the following services for ${currentOrderData.customerName}:\n` + 
                      currentOrderData.items.map(item => `- ${item.title} (Qty: ${item.quantity})`).join('\n'),
                  assignedTo: assignedStaffId ? [assignedStaffId] : [],
                  createdBy: 'system',
                  createdAt: FieldValue.serverTimestamp(),
                  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                  priority: 'Medium',
                  status: 'To-Do',
                  orderId: orderId,
                  clientId: currentOrderData.userId || null,
                  clientSource: currentOrderData.source || 'Client',
                  department: department,
                  comments: []
              });
              
              console.log(`Task ${taskRef.id} successfully created${assignedStaffId ? ` and assigned` : ` (unassigned)`}`);
            } catch (allocationError) {
              console.error(`Error during staff allocation/task creation for order ${orderId}:`, allocationError);
            }
          }
          
          // Handle Partner Credit Top-ups & Setup Fees
          const isSetup = currentOrderData.items.some(i => i.id === 'partner_setup_fee');
          const isTopup = currentOrderData.items.some(i => i.id === 'partner_credit_topup');
          
          if (isSetup || isTopup) {
              const partnerId = currentOrderData.resellerId || currentOrderData.userId;
              const pfPaymentId = data.pf_payment_id || currentOrderData.id;
              
              if (partnerId && pfPaymentId) {
                  const paymentLockRef = adminDb.collection('processedPayments').doc(`topup_${pfPaymentId}`);
                  const lockSnap = await paymentLockRef.get();
                  
                  if (lockSnap.exists) {
                      console.log(`[PayFast ITN] Payment topup_${pfPaymentId} already processed. Skipping duplicate wallet credit.`);
                  } else {
                      await paymentLockRef.set({
                          processedAt: FieldValue.serverTimestamp(),
                          partnerId,
                          amount: isSetup ? 2475 : currentOrderData.total,
                          pfPaymentId
                      });

                      const partnerRef = adminDb.collection('users').doc(partnerId);
                      // Setup logic: R4950 setup adds R2475 (50%) to wallet
                      const creditAmount = isSetup ? 2475 : currentOrderData.total;
                      await partnerRef.update({
                          creditBalance: FieldValue.increment(creditAmount),
                          status: 'Active'
                      });

                      const walletLogRef = partnerRef.collection('walletLogs').doc();
                      await walletLogRef.set({
                          amount: creditAmount,
                          type: isSetup ? 'setup_bonus' : 'deposit',
                          description: isSetup ? 'Setup fee credit allocation (50%)' : 'Wallet top-up via PayFast',
                          date: new Date()
                      });

                      if (isTopup) {
                          await orderRef.update({
                              status: 'Completed',
                              fulfillmentStatus: 'Completed',
                              notes: FieldValue.arrayUnion({
                                  text: `Practice credit top-up of R${creditAmount.toFixed(2)} received and credited to partner wallet. Order completed automatically.`,
                                  date: new Date(),
                                  authorId: 'system',
                                  type: 'note',
                                  subject: null,
                                  attachments: null
                              })
                          });
                      }

                  if (isSetup) {
                      try {
                          const partnerSnap = await partnerRef.get();
                          if (partnerSnap.exists) {
                              const partnerData = partnerSnap.data();
                              const partnerName = partnerData?.contactPerson || partnerData?.name || 'Partner';
                              const partnerEmail = partnerData?.email || currentOrderData.customerEmail;

                              const onboardingHtml = await render(
                                  React.createElement(PartnerOnboardingEmail, {
                                      partnerName: partnerName,
                                      email: partnerEmail,
                                      creditAmount: creditAmount,
                                      loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.myacc.co.za'}/login`,
                                  })
                              );

                              await sendEmail({
                                  to: partnerEmail,
                                  cc: ['info@myacc.co.za'],
                                  subject: "Your My Accountant Practice is Activated! 🚀",
                                  html: onboardingHtml,
                              });

                              await orderRef.update({
                                  notes: FieldValue.arrayUnion({
                                      text: `Sent "Practice Onboarding" email to ${partnerEmail} and CC'd info@myacc.co.za (Automated via PayFast ITN).`,
                                      date: new Date(),
                                      authorId: 'system',
                                      type: 'email',
                                      subject: "Your My Accountant Practice is Activated! 🚀",
                                      attachments: null,
                                  })
                              });
                              console.log(`Onboarding email successfully sent to partner ${partnerEmail}.`);
                          }
                      } catch (emailErr) {
                          console.error("Error sending BEI partner onboarding email:", emailErr);
                      }
                      }
                  }
              }
          }

          // 5. Send Document Request Email (Automated)
          const isOutsourced = !!currentOrderData.resellerId;
          const recipientEmail = isOutsourced && currentOrderData.documentContact === 'client' 
              ? currentOrderData.endCustomerEmail 
              : currentOrderData.customerEmail;

          // Only send if not already notified
          const alreadyNotified = currentOrderData.notes?.some(n => n.subject === `Action Required for Your Order #${orderId}`);

          if (recipientEmail && !alreadyNotified) {
              const itemsWithServices = currentOrderData.items.map(item => {
                  const service = allServices.find(s => s.id === item.id);
                  return { ...item, service };
              }).filter(item => item.service) as any[];

              const emailHtml = render(React.createElement(DocumentRequestEmail, {
                  order: { ...currentOrderData, id: orderId! },
                  items: itemsWithServices,
                  replyTo: 'info@myacc.co.za'
              }));

              await sendEmail({
                  to: recipientEmail,
                  subject: `Action Required for Your Order #${orderId}`,
                  html: emailHtml,
                  resellerId: currentOrderData.resellerId || undefined,
              });

              await orderRef.update({ 
                  notes: FieldValue.arrayUnion({
                      text: `Sent "Request Documents" email to ${recipientEmail} (Automated via PayFast ITN).`,
                      date: new Date(),
                      authorId: 'system',
                      type: 'email',
                      subject: `Action Required for Your Order #${orderId}`,
                      attachments: null,
                  }) 
              });
          }

          await orderRef.update({ 
              itnHistory: FieldValue.arrayUnion({ 
                  status: 'Success', 
                  message: 'Payment verified and order set to Processing.', 
                  receivedAt: new Date(),
                  payload: data
              }) 
          });
        } else {
          await orderRef.update({ 
              itnHistory: FieldValue.arrayUnion({ 
                  status: 'Failed', 
                  message: `Payment status was ${data.payment_status}`, 
                  receivedAt: new Date(),
                  payload: data
              }) 
          });
        }

        return new NextResponse('OK', { status: 200 });
    } catch (error) {
        console.error('Critical ITN Error:', error);
        return new NextResponse('Error', { status: 500 });
    }
}
