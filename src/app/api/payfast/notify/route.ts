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

        // 1. Signature Validation using the RAW body (moved up so it validates all requests)
        let isValid = verifyPayFastSignature(rawBody, data.signature, process.env.PAYFAST_PASSPHRASE);
        
        if (!isValid) {
            console.warn(`ITN Warning: Local signature mismatch for order/partner ${orderId}. Attempting server confirmation fallback.`);
            try {
                const isSandbox = data.merchant_id === '10042278' || 
                                  data.merchant_id === '10049800' || 
                                  data.merchant_id.startsWith('100') ||
                                  process.env.NEXT_PUBLIC_PAYFAST_PROCESS_URL?.includes('sandbox');
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
        const querySnapshot = await adminDb.collection('orders').where('id', '==', orderId).get();

        if (querySnapshot.empty) {
            console.error(`Order ${orderId} not found.`);
            return new NextResponse('OK', { status: 200 });
        }
        
        const orderDoc = querySnapshot.docs[0];
        const orderRef = orderDoc.ref;
        const currentOrderData = orderDoc.data() as Order;

        // Idempotency: Ignore if already processed
        if (currentOrderData.status !== 'Pending Payment') {
            console.log(`ITN Info: Order ${orderId} already processed (Status: ${currentOrderData.status}).`);
            return new NextResponse('OK', { status: 200 });
        }
        
        // 3. Amount Validation
        const orderTotal = parseFloat((currentOrderData.clientTotal || currentOrderData.total).toFixed(2));
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
          await orderRef.update({ status: 'Processing' });

          if (currentOrderData.userId && currentOrderData.items && currentOrderData.items.some(item => item.id === 'partner_dfy_setup')) {
              await adminDb.collection('users').doc(currentOrderData.userId).update({ setupAddon: true });
              console.log(`Paid Done-For-You Setup Add-on. Marked partner ${currentOrderData.userId} setupAddon as true.`);
          }
          
          if (currentOrderData.originalOrderId) {
              const originalOrderRef = adminDb.collection('orders').doc(currentOrderData.originalOrderId);
              await originalOrderRef.update({
                  isOutsourced: true,
                  status: 'Processing',
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
          
          // Staff Workload Querying & Load-Balanced Allocation
          try {
              let department: 'Accounting and Tax' | 'Administration' | 'CAP' = 'Administration';
              
              if (currentOrderData.department) {
                  department = currentOrderData.department as any;
              } else {
                  const itemIds = currentOrderData.items.map(i => i.id);
                  for (const itemId of itemIds) {
                      const service = allServices.find(s => s.id === itemId);
                      if (service && service.department) {
                          department = service.department as any;
                          break;
                      }
                  }
              }
              
              console.log(`Allocating staff for order ${orderId} in department ${department}`);
              
              const staffSnapshot = await adminDb.collection('users')
                  .where('role', '==', 'staff')
                  .get();
              
              const matchingStaff = staffSnapshot.docs
                  .map(doc => ({ id: doc.id, ...doc.data() } as User))
                  .filter(staff => {
                      if (staff.status === 'Inactive' || staff.status === 'Archived') return false;
                      if (staff.department === department) return true;
                      if (Array.isArray(staff.departments) && staff.departments.includes(department)) return true;
                      return false;
                  });
              
              let assignedStaffId: string | null = null;
              
              if (matchingStaff.length > 0) {
                  const processingOrdersSnapshot = await adminDb.collection('orders')
                      .where('status', '==', 'Processing')
                      .get();
                  
                  const workloadMap: { [userId: string]: number } = {};
                  matchingStaff.forEach(staff => {
                      workloadMap[staff.id] = 0;
                  });
                  
                  processingOrdersSnapshot.docs.forEach(doc => {
                      const orderData = doc.data();
                      const assigned = orderData.assignedTo;
                      if (Array.isArray(assigned)) {
                          assigned.forEach((staffId: string) => {
                              if (workloadMap[staffId] !== undefined) {
                                  workloadMap[staffId]++;
                              }
                          });
                      } else if (typeof assigned === 'string') {
                          if (workloadMap[assigned] !== undefined) {
                              workloadMap[assigned]++;
                          }
                      }
                  });
                  
                  let minWorkload = Infinity;
                  matchingStaff.forEach(staff => {
                      const workload = workloadMap[staff.id] || 0;
                      if (workload < minWorkload) {
                          minWorkload = workload;
                          assignedStaffId = staff.id;
                      }
                  });
              } else {
                  console.warn(`No staff found for department ${department}. Checking general active staff.`);
                  const generalStaff = staffSnapshot.docs
                      .map(doc => ({ id: doc.id, ...doc.data() } as User))
                      .filter(staff => staff.status !== 'Inactive' && staff.status !== 'Archived');
                  
                  if (generalStaff.length > 0) {
                      const processingOrdersSnapshot = await adminDb.collection('orders')
                          .where('status', '==', 'Processing')
                          .get();
                      
                      const workloadMap: { [userId: string]: number } = {};
                      generalStaff.forEach(staff => {
                          workloadMap[staff.id] = 0;
                      });
                      
                      processingOrdersSnapshot.docs.forEach(doc => {
                          const orderData = doc.data();
                          const assigned = orderData.assignedTo;
                          if (Array.isArray(assigned)) {
                              assigned.forEach((staffId: string) => {
                                  if (workloadMap[staffId] !== undefined) {
                                      workloadMap[staffId]++;
                                  }
                              });
                          } else if (typeof assigned === 'string') {
                              if (workloadMap[assigned] !== undefined) {
                                  workloadMap[assigned]++;
                              }
                          }
                      });
                      
                      let minWorkload = Infinity;
                      generalStaff.forEach(staff => {
                          const workload = workloadMap[staff.id] || 0;
                          if (workload < minWorkload) {
                              minWorkload = workload;
                              assignedStaffId = staff.id;
                          }
                      });
                  }
              }
              
              if (assignedStaffId) {
                  const staffUser = staffSnapshot.docs.find(d => d.id === assignedStaffId)?.data() as User;
                  const staffName = staffUser ? staffUser.name : 'Unknown Staff';
                  
                  console.log(`Assigning order ${orderId} to staff member ${staffName} (${assignedStaffId})`);
                  
                  await orderRef.update({
                      assignedTo: [assignedStaffId],
                      department: department,
                      notes: FieldValue.arrayUnion({
                          text: `Order automatically assigned to ${staffName} (Department: ${department}) based on least active workload.`,
                          date: new Date(),
                          authorId: 'system',
                          type: 'note',
                          subject: null,
                          attachments: null,
                      })
                  });
                  
                  const taskRef = adminDb.collection('tasks').doc();
                  await taskRef.set({
                      id: taskRef.id,
                      title: `Order #${orderId} - Fulfill Services`,
                      description: `Please fulfill the following services for ${currentOrderData.customerName}:\n` + 
                          currentOrderData.items.map(item => `- ${item.title} (Qty: ${item.quantity})`).join('\n'),
                      assignedTo: [assignedStaffId],
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
                  
                  console.log(`Task ${taskRef.id} successfully created and assigned to ${staffName}`);
              } else {
                  console.warn(`No staff available at all. Order ${orderId} remains unassigned.`);
                  await orderRef.update({
                      department: department,
                      notes: FieldValue.arrayUnion({
                          text: `Order set to department: ${department}. Could not assign staff (no active staff members found).`,
                          date: new Date(),
                          authorId: 'system',
                          type: 'note',
                          subject: null,
                          attachments: null,
                      })
                  });
              }
          } catch (allocationError) {
              console.error(`Error during staff allocation/task creation for order ${orderId}:`, allocationError);
          }
          
          // Handle Partner Credit Top-ups & Setup Fees
          const isSetup = currentOrderData.items.some(i => i.id === 'partner_setup_fee');
          const isTopup = currentOrderData.items.some(i => i.id === 'partner_credit_topup');
          
          if (isSetup || isTopup) {
              const partnerId = currentOrderData.resellerId || currentOrderData.userId;
              if (partnerId) {
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
                                  cc: ['kev@thinkestry.co.za'],
                                  subject: "Your My Accountant Practice is Activated! 🚀",
                                  html: onboardingHtml,
                              });

                              await orderRef.update({
                                  notes: FieldValue.arrayUnion({
                                      text: `Sent "Practice Onboarding" email to ${partnerEmail} and CC'd kev@thinkestry.co.za (Automated via PayFast ITN).`,
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
