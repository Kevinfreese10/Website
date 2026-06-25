'use server';
/**
 * @fileOverview An AI agent for answering questions based on website content and general knowledge.
 * 
 * - websiteQAndA - A function that answers questions using website data as a knowledge base.
 * - WebsiteQAndAInput - The input type for the websiteQAndA function.
 * - WebsiteQAndAOutput - The return type for the websiteQAndA function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { fetchKnowledgeBase } from '@/lib/knowledge-base';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { Service, BlogPost } from '@/lib/types';
import { render } from '@react-email/components';
import OrderConfirmationEmail from '@/components/emails/OrderConfirmationEmail';
import { sendEmail } from '@/lib/email';
import React from 'react';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10);

const WebsiteQAndAInputSchema = z.object({
  question: z.string().describe('The user\'s question.'),
  history: z.array(z.object({
    role: z.enum(['user', 'bot']),
    content: z.string(),
  })).optional().describe('The conversation history.'),
  conversationId: z.string().optional().describe('The unique conversation/session ID.'),
});
export type WebsiteQAndAInput = z.infer<typeof WebsiteQAndAInputSchema>;

const WebsiteQAndAOutputSchema = z.object({
  answer: z.string().describe('A concise and helpful answer to the user\'s question. Prioritize information from the provided context, but use general knowledge if the answer is not available there. If you cannot answer, state that.'),
  confidence: z.number().min(0).max(100).describe('A confidence score (0-100) of how certain you are about the answer. If the answer is directly stated in the context, confidence should be high (90-100). If it is inferred from the context, it should be medium (60-80). If using general knowledge, confidence should be lower (40-60). If you cannot answer, it should be very low (0-10).'),
  serviceUrl: z.string().optional().describe("If the user's question is about a specific service, provide the URL for that service page. The URL should be in the format '/products/service-slug'."),
  orderTrigger: z.object({
    email: z.string().describe('The email address provided by the user.'),
    firstName: z.string().describe('The first name / given name provided by the user.'),
    lastName: z.string().describe('The surname / last name provided by the user.'),
    phone: z.string().describe('The cell number / contact number provided by the user.'),
    serviceId: z.string().describe('The ID of the service from the context they want to order.'),
    serviceTitle: z.string().describe('The title of the service from the context they want to order.'),
    price: z.number().describe('The price of the service as a number.'),
  }).optional().describe("Include this ONLY when the user has provided all their Name, Surname, Email, and Cell Number, and has explicitly confirmed that they agree to the prerequisites and the refund policy, and wants to place the order now. Never guess or populate this if the user hasn't explicitly agreed and confirmed all details in the chat."),
  orderId: z.string().optional().describe('Leave blank. This will be populated by the backend after order generation.'),
});
export type WebsiteQAndAOutput = z.infer<typeof WebsiteQAndAOutputSchema>;

export async function websiteQAndA(
  input: WebsiteQAndAInput
): Promise<WebsiteQAndAOutput> {
  const adminDb = getAdminDb();
  const authAdmin = getAdminAuth();

  // If the conversation is in agent takeover mode, bypass AI and save user message
  if (input.conversationId) {
    const chatRef = adminDb.collection('chatbotConversations').doc(input.conversationId);
    const docSnap = await chatRef.get();
    if (docSnap.exists) {
      const chatData = docSnap.data();
      if (chatData?.mode === 'agent') {
        const userMsg = {
          role: 'user',
          content: input.question,
          timestamp: new Date().toISOString()
        };
        const messages = chatData.messages || [];
        const updatedMessages = [...messages, userMsg];

        const fullHistoryAndCurrent = [
          ...messages.map((m: any) => m.content),
          input.question
        ].join('\n');
        
        const nameMatch = fullHistoryAndCurrent.match(/Name:\s*([^\n]+)/i);
        const emailMatch = fullHistoryAndCurrent.match(/Email:\s*([^\n]+)/i);
        
        const updateData: any = {
          updatedAt: FieldValue.serverTimestamp(),
          messages: updatedMessages
        };
        
        if (nameMatch && (!chatData.userName || chatData.userName === 'Guest')) {
          updateData.userName = nameMatch[1].trim();
        }
        if (emailMatch && (!chatData.userEmail || chatData.userEmail === 'Anonymous')) {
          updateData.userEmail = emailMatch[1].trim().toLowerCase();
        }

        await chatRef.set(updateData, { merge: true });

        return {
          answer: '', // Empty answer since human agent is handling it
          confidence: 100
        };
      }
    }
  }

  // Order status verification context logic
  let orderVerificationContext = "";

  // Scan user messages from latest to oldest to find the most recent order ID and email address.
  // This prevents picking up example order IDs or phone numbers from system/bot messages,
  // and allows users to correct typos in their inputs during subsequent conversation turns.
  const userMessages = [
    ...(input.history || []).filter(h => h.role === 'user').map(h => h.content),
    input.question
  ];

  let extractedOrderId: string | null = null;
  let extractedEmail: string | null = null;

  // Extract email address (scan backwards)
  const emailRegex = /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/;
  for (let i = userMessages.length - 1; i >= 0; i--) {
    const match = userMessages[i].match(emailRegex);
    if (match) {
      extractedEmail = match[1].toLowerCase().trim();
      break;
    }
  }

  // Extract order ID (scan backwards, matching 4-digit numbers starting with 9, or any 5-digit number)
  const orderIdRegex = /\b(9\d{3}|\d{5})\b/;
  for (let i = userMessages.length - 1; i >= 0; i--) {
    const match = userMessages[i].match(orderIdRegex);
    if (match) {
      extractedOrderId = match[1];
      break;
    }
  }

  if (extractedOrderId && extractedEmail) {
    try {
      const orderRef = adminDb.collection('orders').doc(extractedOrderId);
      const orderSnap = await orderRef.get();
      
      if (orderSnap.exists) {
        const orderData = orderSnap.data();
        const customerEmail = (orderData?.customerEmail || "").toLowerCase().trim();
        const endCustomerEmail = (orderData?.endCustomerEmail || "").toLowerCase().trim();
        
        if (customerEmail === extractedEmail || endCustomerEmail === extractedEmail) {
          const status = orderData?.status || "Pending Payment";
          const notes = orderData?.notes || [];
          const lastNote = notes.length > 0 ? notes[notes.length - 1] : null;
          
          let lastUpdateText = "Order created and registered.";
          let updatedBy = "System";
          let lastUpdateTime = "";
          
          if (lastNote) {
            lastUpdateText = lastNote.text || "";
            const authorId = lastNote.authorId;
            if (authorId === 'system') {
              updatedBy = "My Accountant (System)";
            } else {
              const authorSnap = await adminDb.collection('users').doc(authorId).get();
              if (authorSnap.exists) {
                updatedBy = authorSnap.data()?.name || "Staff Advisor";
              } else {
                updatedBy = "Staff Advisor";
              }
            }
            if (lastNote.date) {
              try {
                const dateObj = lastNote.date.toDate ? lastNote.date.toDate() : new Date(lastNote.date);
                lastUpdateTime = dateObj.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
              } catch (e) {
                lastUpdateTime = "Recently";
              }
            }
          }

          orderVerificationContext = `
            ORDER STATUS VERIFICATION:
            - Order Number: #${extractedOrderId}
            - Email Verified: SUCCESS (${extractedEmail})
            - Current Status: ${status}
            - Last Update: "${lastUpdateText}"
            - Updated By: ${updatedBy}
            - Date of Last Update: ${lastUpdateTime}
          `;
        } else {
          orderVerificationContext = `
            ORDER STATUS VERIFICATION:
            - Order Number: #${extractedOrderId}
            - Email Verified: FAILED (Provided: ${extractedEmail}. The email does not match the customer email on file for this order ID.)
          `;
        }
      } else {
        orderVerificationContext = `
          ORDER STATUS VERIFICATION:
          - Order Number: #${extractedOrderId}
          - Status: NOT FOUND (Order ID does not exist in our database)
        `;
      }
    } catch (err) {
      console.error("Error verifying order in AI flow:", err);
    }
  } else if (extractedOrderId && !extractedEmail) {
    orderVerificationContext = `
      ORDER STATUS VERIFICATION:
      - Order Number: #${extractedOrderId}
      - Email Verified: PENDING (Client provided the order number but has not provided their email address. Do not disclose status details until email is provided and verified.)
    `;
  } else if (!extractedOrderId && extractedEmail) {
    orderVerificationContext = `
      ORDER STATUS VERIFICATION:
      - Email: ${extractedEmail}
      - Order Number: PENDING (Client provided email but has not provided their order number. Do not disclose status details until order number is provided.)
    `;
  }

  // Fetch live data from Firestore using Admin SDK
  const servicesSnapshot = await adminDb.collection('services').orderBy('title').get();
  const services = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));

  const blogPostsSnapshot = await adminDb.collection('blogPosts').orderBy('date', 'desc').get();
  const blogPosts = blogPostsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
  
  const knowledgeBaseItems = await fetchKnowledgeBase();

  // Static content from the website
  const aiAccountantPageContent = `
    AI Accountant Features:
    - Client Receipts & Payments: Automatically allocate client receipts to the correct invoices and accounts.
    - Supplier Invoices: Process supplier invoices and match them against payments.
    - Bank Reconciliation: Upload PDF bank statements, and the AI will extract, allocate, and reconcile transactions. It detects duplicates and missing periods.
    - Statements & Reports: Instantly prepare customer and supplier statements and track aged analysis.
    - Tax & Compliance: Automatically prepare VAT201 returns, calculate Provisional and Annual Tax, and flag non-deductible expenses.
    - AI Insights: Identify anomalies, suggest journal corrections, and generate performance summaries.
    AI Accountant Pricing:
    - Free Plan: R0/month for 1 company, 1 user, manual processing, and basic reports.
    - AI Accountant Add-on: R450/month per company. Includes all Free Plan features plus automated AI transaction allocation, PDF bank statement reading, and advanced real-time reports.
    - Additional Users: R50 per user, per month on any plan.
  `;
  
  const becomeAPartnerPageContent = `
    Bookkeeper Empowerment Initiative (BEI): Empowers small and growing bookkeepers in South Africa. Joining is free.
    BEI Benefits:
    - 25% Discount: Partners get 25% off My Accountant's standard service fees (excluding 3rd party costs like CIPC).
    - White-Labeling: Seamless outsourcing while maintaining your brand.
    - Client CRM: Advanced dashboard that automatically creates tasks based on client requirements (VAT, PAYE, etc.).
    - Staff Management: Manage your team, assign tasks, and track internal project workflows.
    - Pricing Control: Partners can set their own client selling prices while My Accountant's base cost remains fixed.
    How it works: Apply online, pay R4,950 once-off setup and activation fee, and get lifetime access to your dashboard. There are zero monthly subscription or hosting fees. Upon successful payment of the setup fee, your practice wallet is instantly credited with R2,475 in practice credits to spend on outsourcing.
    Who can join: Freelance Bookkeepers, Startup Accounting Firms, Tax Practitioners, Business Consultants, Payroll Administrators. No need to be a registered accountant to offer services, but to receive outsourced work from My Accountant, you must belong to a recognized professional body (SAICA, SAIT, CIBA, or SAIPA).
  `;
  
  const aboutPageContent = `
    About My Accountant: Your dynamic partner in conquering the financial world. With a heritage rooted in over 35 years of combined expertise in Audit, Accounting, and Tax Advisory, our black-owned, cloud-powered firm is dedicated to streamlining tax compliance for both SMEs and individuals. Our team, rich in diversity and expertise, demystifies financial complexities, enabling you to channel your energies into growing your enterprise.
    Our Vision: To redefine excellence in financial services, grounded in integrity, transparency, and professionalism. We aim not just to meet expectations but to surpass them, forging lasting relationships based on trust and mutual respect.
    Our Mission: To set a new standard in financial and professional services. We’re committed to supporting both immediate and future financial goals with our forward-thinking approach.
    Bookkeeper Empowerment Initiative: Our pioneering initiative has made us the premier destination for accounting professionals across South Africa looking to outsource. It enhances efficiency, reduces overhead costs, and provides access to a team of experts.
  `;

  const compliancePageContent = `
    Free Compliance Check: We offer a free, no-obligation compliance assessment for CIPC and SARS.
    SARS Compliance Services: Tax Clearance Pins, Income Tax Registration, VAT Registration, PAYE/UIF/SDL Registration, Tax Returns (Income Tax, VAT, PAYE, Provisional), Compliance Reviews, and negotiation for remission of fines and penalties.
    CIPC Compliance Services: New Company Registration, Amendments (director details, name, address), Beneficial Ownership Declaration, Annual Returns, Reinstatements, and Securities Register.
  `;

  const refundPolicyContent = `
    Refund Policy: All services are non-refundable once work has begun. Refunds may be considered if the service has not started, with a 10% processing fee deducted. Refund requests must be made within 48 hours of purchase.
  `;

  const popiaPolicyContent = `
    POPIA Compliance: My Accountant is committed to safeguarding personal information in line with POPIA. We process information lawfully and for legitimate business purposes. We do not sell personal information. Our Information Officer is Kevin William Freese, reachable at info@myacc.co.za.
  `;
  
  const footerContent = `
    CONTACT INFORMATION:
    - Address: Ground Floor, Waterstone Building, Stonemill Office Park, 300 Acacia Road, Darrenwood, Johannesburg, 2195
    - Email: info@myacc.co.za
    - Phone: 010 109 1625
  `;

  // Serialize the website content to pass to the prompt
  const websiteContent = `
    SERVICES:
    ${services.map(s => `Title: ${s.title}, URL: /products/${s.slug}, Description: ${s.longDescription}, Price: R${s.price}, Turnaround Time: ${s.turnaroundTime}, Prerequisites: ${s.clientRequirements.join(', ')}`).join('\n\n')}

    BLOG POSTS:
    ${blogPosts.map(p => `Title: ${p.title}, Excerpt: ${p.excerpt}`).join('\n\n')}

    KNOWLEDGE BASE:
    ${knowledgeBaseItems.map(item => {
      const type = item.sourceType || 'qa';
      if (type === 'link') {
        return `Resource Link: ${item.linkUrl} (Topic: ${item.question})\nDescription/Info: ${item.answer || item.textValue || ''}`;
      } else if (type === 'text') {
        return `Topic: ${item.question}\nReference Information: ${item.answer || item.textValue || ''}`;
      } else {
        return `Question: ${item.question}\nAnswer: ${item.answer}`;
      }
    }).join('\n\n')}
    
    AI ACCOUNTANT:
    ${aiAccountantPageContent}

    BECOME A PARTNER / RESELLER PROGRAM:
    ${becomeAPartnerPageContent}

    ABOUT US:
    ${aboutPageContent}

    COMPLIANCE SERVICES:
    ${compliancePageContent}

    REFUND POLICY:
    ${refundPolicyContent}

    PRIVACY (POPIA) POLICY:
    ${popiaPolicyContent}

    CONTACT AND FOOTER:
    ${footerContent}

    ORDER TRACKING CONTEXT:
    ${orderVerificationContext || "No order status query in progress. If the user wants to track an order, ask them for their Order Number and Email address."}
  `;

  const prompt = ai.definePrompt({
    name: 'websiteQAndAPrompt',
    model: 'googleai/gemini-2.5-flash',
    input: {schema: WebsiteQAndAInputSchema},
    output: {schema: WebsiteQAndAOutputSchema},
    prompt: `You are the Support Specialist for My Accountant (Pty) Ltd. Your name is 'Khai'.
    
    Your primary objective is to:
    - Convert website visitors into paying clients.
    - Qualify leads efficiently.
    - Recommend the most appropriate services.
    - Answer questions accurately.
    - Build trust and credibility.
    - Collect contact information.
    - Encourage visitors to place an order, request a quote, schedule a consultation, or speak with a human advisor.
    
    You communicate like an experienced South African accounting professional.
    Never sound robotic.
    Never give one-line answers unless appropriate.
    Always guide the conversation forward.
    Always seek to understand the client's needs before recommending services.
    Use plain English and avoid excessive technical jargon.
    
    CRITICAL SERVICE RULE:
    If the user's question or statement is about a specific service or product in our database (e.g., "I'm looking for a tax clearance", "How much is VAT registration?", "What is company registration?"):
    1. Your response MUST be brief and to the point.
    2. Only state the cost, the completion/turnaround time, and provide the link to the product.
    3. Do NOT provide lists of requirements, descriptions, or lengthy explanations in your initial response (clients are lazy to read).
    4. Instead, offer to give them the list of requirements if they would like them.
    5. You may provide additional information, descriptions, or requirements in subsequent turns ONLY if they explicitly ask for it.
    6. When presenting requirements, prerequisites, or documents needed, you MUST format them as a clean, vertical list of markdown bullet points (e.g. using "- "). Do not format them as comma-separated text or inline. Keep the list neat and readable.
    
    For example:
    "We can certainly assist with your Tax Clearance Pin. The cost for this service is R350, and we typically have it sorted for you within 1-2 working days. Would you like me to provide the list of requirements needed to get started?"
    
    VIEW ALL SERVICES RULE:
    If the user asks "How can I view all your services?" (or any query about seeing all our services):
    1. You must direct them to the online store page at '/products'.
    2. You must ask which service they are interested in (e.g., Company Registration, Accounting, VAT, Tax Compliance, Payroll, etc.) so you can assist them right here in the chat.
    3. Keep the response friendly, welcoming, and concise.
    
    UNIQUE SELLING POINTS:
    Highlight these when relevant to build trust and credibility:
    - 200+ Five-Star Google Reviews
    - Online service across South Africa
    - Professional accounting and tax specialists
    - Fast turnaround times
    - Fixed-fee pricing
    - Experienced SARS dispute specialists
    - Dedicated support team
    - Trusted by businesses across South Africa
    - Professional designations within SAICA, CIBA and SAIT
    
    SALES METHODOLOGY:
    Follow this framework in your conversation:
    1. Understand: Ask questions before selling. E.g. Is this for a business or individual? How long has the business been operating? Are you currently registered with SARS? What challenge are you trying to solve? Do you already have an accountant?
    2. Diagnose: Identify urgency, pain points, compliance risks, and growth opportunities.
    3. Recommend: Provide the service cost, timeline, link, and offer to provide the requirements/documents required. Do not list requirements or long descriptions upfront.
    4. Convert: Always end with a clear next step (e.g. quote, consultant contact, checklist, name/email/phone capture).
    
    ORDER GENERATION FLOW:
    If the user indicates they want to place an order, purchase a service, or proceed with buying:
    1. Verify you know which specific service/product from the context they want to order.
    2. Ask the user to provide the following details:
       - First Name
       - Surname
       - Email Address
       - Cell Number
    3. You MUST explicitly ask them to confirm, presenting links to the policies and requirements (replace [service_url] with the actual product URL from context, e.g., /products/vat-registration):
        "Please confirm:
        1. You have all the prerequisites for this service (you can review them on the [Service Page]([service_url])).
        2. You agree to the [Refund Policy](/refund-policy)."
    4. Once (and ONLY once) the user has provided all 4 details (First Name, Surname, Email, Cell Number) and has explicitly confirmed both conditions, populate the 'orderTrigger' object in your JSON output with the exact details (look up ID, Title, and Price in the context).
    5. In your text answer, state that you are creating the order.
    6. Never populate 'orderTrigger' until all these conditions are fully satisfied in the chat history.
    
    LEAD QUALIFICATION:
    Always try to capture:
    - Name
    - Company Name
    - Phone Number
    - Email Address
    - Service Required
    - Monthly Turnover
    - Number of Employees
    - Urgency Level
    
    Once you have collected the contact details (specifically Name, Email, and Phone) and service requirements, summarize the lead clearly in your response using this exact format:
    Lead Summary:
    Name: [Name]
    Company: [Company Name]
    Email: [Email Address]
    Phone: [Phone Number]
    Service: [Service Required]
    Turnover: [Monthly Turnover]
    Employees: [Number of Employees]
    Urgency: [Urgency Level]
    Notes: [Notes]
    
    HANDLING OBJECTIONS:
    - "Your price is too expensive": Emphasize expertise, compliance protection, time savings, reduced SARS risk, and professional support.
    - "I'm comparing providers": Highlight reviews, experience, responsiveness, and comprehensive service offering.
    - "I need to think about it": Offer a consultation, additional information, a quote, or a follow-up call.
    
    KNOWLEDGE BOUNDARIES:
    Do NOT:
    - Provide legal advice.
    - Guarantee SARS outcomes.
    - Promise application approvals.
    - Guess pricing.
    - Invent company policies.
    - Guess or invent services we do not offer.
    
    ORDER TRACKING & FOLLOW-UP RULES:
    1. If a client requests a follow-up or status check on an existing order:
       a. Check the 'ORDER TRACKING CONTEXT' in the context.
       b. If no Order Number or Email address has been provided by the user yet:
          - Ask the user to provide both their Order Number (e.g. 9954) and the Email address used to place the order.
       c. If the user has provided one detail (either Order Number or Email) but not both (meaning verification is PENDING):
          - Ask the user to provide the missing detail (e.g. if they provided the Order Number but not the email, ask for their email address).
       d. If the verification is SUCCESS:
          - State the current order status clearly (e.g., "Processing", "Completed", "Pending Payment").
          - Share the details of the last update ("Last Update"), who made the update ("Updated By"), and when ("Date of Last Update").
          - Keep the tone supportive and reassuring.
       e. If the verification is FAILED (email mismatch) or the order is NOT FOUND:
          - Politely inform the user that the details could not be verified or the order was not found.
          - Explicitly instruct them that if they cannot verify their email and order number, they must contact us via email at info@myacc.co.za or call us at 010 109 1625 to follow up.
          - Do NOT ask them to try entering details again; direct them to contact us.
       f. Never disclose any order status, tracking, or update details unless the verification status is explicitly SUCCESS.
    
    UNOFFERED SERVICES & UNAVAILABLE INFO FALLBACK:
    If a user asks for a service that we do not offer (not found in our services database, such as liquor licenses) or if the requested information is not available:
    - Inform them politely that we do not currently offer this service or that the details are not immediately available.
    - Explicitly tell them to call us on 010 109 1625 during office hours (Mon-Fri 09:00 - 17:00) or to email us at info@myacc.co.za, and we will get back to them to assist.
    - Example: "I'm afraid we don't currently offer that specific service. Please feel free to call us on 010 109 1625 during office hours or email us at info@myacc.co.za, and we will get back to you right away to assist."
    - You may still offer to capture their details (Name, Email, Phone) so a consultant can call them back if they prefer.
    
    SEO & CONVERSION FOCUS:
    Intelligently address visitors searching for keywords like "Accountant near me", "Accounting services South Africa", "VAT registration", "Company registration", "SARS compromise", etc., guiding them towards My Accountant's online services.
    
    TONE EXAMPLES:
    - Instead of "We offer VAT registration", say: "We can assist with your VAT registration from start to finish, including reviewing the requirements, preparing the application, and liaising with SARS where necessary."
    - Instead of "Contact us", say: "I can help arrange a quotation or have one of our consultants contact you. May I get your name and contact details?"
    
    BUSINESS DETAILS:
    - Name: My Accountant (Pty) Ltd
    - Website: https://www.myacc.co.za
    - Office: Ground Floor, Waterstone Building, Stonemill Office Park, 300 Acacia Road, Darrenwood, Johannesburg, 2195
    - Phone: 010 109 1625
    - Email: info@myacc.co.za
    - Hours: Mon-Fri 09:00 - 17:00
    - Coverage: All of South Africa
    
    CONTEXT & SERVICES KNOWLEDGE BASE:
    Always prioritize using the information provided in the 'CONTEXT' section below to answer questions about the company's services, pricing, and policies. The Knowledge Base section is the highest source of truth.
    If the user's question is about a specific service, you MUST provide the 'serviceUrl' for that service in your response. The service URL must exactly match the URL provided in the context for that service.
    
    Use the conversation history to understand the context of the question.
    
    CONTEXT:
    ---
    ${websiteContent}
    ---
    
    CONVERSATION HISTORY:
    {{#each history}}
      {{role}}: {{{content}}}
    {{/each}}
    
    User Question: {{{question}}}
    `,
  });

  const {output} = await prompt(input);

  // Process AI Order Generation Trigger
  if (output && output.orderTrigger) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const cleanEmail = output.orderTrigger.email.trim();
      const isEmailValid = emailRegex.test(cleanEmail);

      const cleanPhone = output.orderTrigger.phone.replace(/[\s\-\(\)]/g, '');
      const phoneRegex = /^\+?[0-9]{9,12}$/;
      const isPhoneValid = phoneRegex.test(cleanPhone);

      if (!isEmailValid || !isPhoneValid) {
          console.warn(`ITN Abort: Invalid contact details generated by AI. Email: "${output.orderTrigger.email}", Phone: "${output.orderTrigger.phone}"`);
          
          let errorMsg = "I would be happy to create that order for you, but I detected an issue with the contact details provided:\n";
          if (!isEmailValid) {
              errorMsg += `- **Email Address:** "${output.orderTrigger.email}" does not appear to be a valid email format.\n`;
          }
          if (!isPhoneValid) {
              errorMsg += `- **Cell Number:** "${output.orderTrigger.phone}" is invalid. Please provide a valid South African cell number (e.g. 082 123 4567 or +27 72 123 4567).\n`;
          }
          errorMsg += "\nCould you please provide your correct contact details so I can finalize the order for you?";
          
          output.answer = errorMsg;
          output.orderTrigger = undefined;
      } else {
          output.orderTrigger.email = cleanEmail;
          output.orderTrigger.phone = cleanPhone;
          
          try {
              const { email, firstName, lastName, phone, serviceId, serviceTitle, price } = output.orderTrigger;

              let finalUserId = '';
              let isNewUser = false;
              let generatedPassword = '';

              const emailClean = email.toLowerCase().trim();
          
          // Query user document by email from Firestore using Admin SDK
          const usersSnap = await adminDb.collection('users').where('email', '==', emailClean).get();
          
          if (!usersSnap.empty) {
              finalUserId = usersSnap.docs[0].id;
          } else {
              try {
                  // Check if user already exists in Firebase Auth
                  try {
                      const userRecord = await authAdmin.getUserByEmail(emailClean);
                      finalUserId = userRecord.uid;
                  } catch (authError: any) {
                      if (authError.code === 'auth/user-not-found') {
                          // Create new User in Firebase Auth with a secure random temporary password
                          const password = nanoid();
                          generatedPassword = password;
                          const userRecord = await authAdmin.createUser({
                              email: emailClean,
                              password: password,
                              displayName: `${firstName} ${lastName}`,
                          });
                          finalUserId = userRecord.uid;
                          isNewUser = true;

                          // Create user document in Firestore users collection
                          await adminDb.collection('users').doc(finalUserId).set({
                              id: finalUserId,
                              uid: finalUserId,
                              name: `${firstName} ${lastName}`,
                              email: emailClean,
                              contactNumber: phone,
                              role: 'client',
                              source: 'AI Sales Chatbot',
                              createdAt: FieldValue.serverTimestamp(),
                          });
                      } else {
                          throw authError;
                      }
                  }
              } catch (authError: any) {
                  throw authError;
              }
          }

          // Generate next sequential order ID using Admin transaction
          const counterRef = adminDb.collection('sequences').doc('orders');
          const orderId = await adminDb.runTransaction(async (transaction) => {
              const counterDoc = await transaction.get(counterRef);
              if (!counterDoc.exists) {
                  transaction.set(counterRef, { current: 9400 });
                  return '9400';
              }
              const newCurrentValue = counterDoc.data()!.current + 1;
              transaction.update(counterRef, { current: newCurrentValue });
              return newCurrentValue.toString();
          });

          // Create the Order document in Firestore using Admin SDK
          const orderData = {
              id: orderId,
              userId: finalUserId,
              customerName: `${firstName} ${lastName}`,
              customerEmail: emailClean,
              customerPhone: phone,
              items: [{ id: serviceId, title: serviceTitle, price: price, quantity: 1 }],
              total: price,
              discountCode: null,
              discountAmount: null,
              paymentMethod: 'PayFast',
              status: 'Pending Payment',
              date: FieldValue.serverTimestamp(),
              department: null,
              source: 'AI Sales Chatbot',
              originalOrderId: null,
          };

          await adminDb.collection('orders').doc(orderId).set(orderData);

          // Render and dispatch the Order Confirmation Email
          const emailHtml = await render(
              React.createElement(OrderConfirmationEmail, {
                  order: {
                      ...orderData,
                      date: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any
                  } as any,
                  reseller: undefined,
                  isNewUser: isNewUser,
                  generatedPassword: generatedPassword,
                  showPaymentButton: true,
              })
          );

          await sendEmail({
              to: emailClean,
              bcc: ['kev@thinkestry.co.za', 'winifred@myacc.co.za'],
              subject: `Order Confirmation #${orderId}`,
              html: emailHtml,
          });

          // Set orderId in output schema to let widget render redirect buttons
          output.orderId = orderId;
          output.answer = `${output.answer}\n\n🎉 **Order Generated Successfully!**\n\nI have successfully generated **Order #${orderId}** for you. A confirmation email has been sent to **${emailClean}**.\n\nPlease click the button below to complete your secure payment.`;

      } catch (error: any) {
          console.error("Error generating order in flow:", error);
          output.answer = `${output.answer}\n\n❌ *Sorry, I ran into an error trying to generate your order: ${error.message || 'database error'}. Please try checking out directly on the service page.*`;
      }
    }
  }
      
  if (output && output.confidence < 15) {
      try {
          await adminDb.collection('unansweredQuestions').add({
              question: input.question,
              timestamp: Timestamp.now(),
          });
      } catch (error) {
          console.error("Error logging unanswered question:", error);
      }
  }

  // Automated Lead Logging: Capture lead summary blocks and save them to a Firestore collection
  if (output && output.answer.includes('Lead Summary:')) {
      try {
          const lines = output.answer.split('\n');
          const getField = (prefix: string) => {
              const line = lines.find(l => l.toLowerCase().startsWith(prefix.toLowerCase()));
              return line ? line.substring(prefix.length).trim() : '';
          };

          await adminDb.collection('leads').add({
              name: getField('Name:'),
              companyName: getField('Company:'),
              email: getField('Email:'),
              phone: getField('Phone:'),
              service: getField('Service:'),
              turnover: getField('Turnover:'),
              employees: getField('Employees:'),
              urgency: getField('Urgency:'),
              notes: getField('Notes:'),
              fullAnswer: output.answer,
              history: input.history || [],
              timestamp: Timestamp.now(),
          });
          console.log("Successfully saved qualified lead to Firestore 'leads' collection.");
      } catch (error) {
          console.error("Error logging lead details to Firestore:", error);
      }
  }
  
  // Log Conversation to Firestore
  if (input.conversationId && output) {
      try {
          const chatRef = adminDb.collection('chatbotConversations').doc(input.conversationId);
          
          const userMsg = {
              role: 'user',
              content: input.question,
              timestamp: new Date().toISOString()
          };
          
          const botMsg = {
              role: 'bot',
              content: output.answer,
              timestamp: new Date().toISOString(),
              serviceUrl: output.serviceUrl || null,
              orderId: output.orderId || null
          };

          let userName = 'Guest';
          let userEmail = 'Anonymous';

          if (output.orderTrigger) {
              userName = `${output.orderTrigger.firstName} ${output.orderTrigger.lastName}`.trim();
              userEmail = output.orderTrigger.email.toLowerCase().trim();
          } else {
              const fullHistoryAndCurrent = [
                  ...(input.history || []).map(h => h.content),
                  input.question,
                  output.answer
              ].join('\n');
              
              const nameMatch = fullHistoryAndCurrent.match(/Name:\s*([^\n]+)/i);
              const emailMatch = fullHistoryAndCurrent.match(/Email:\s*([^\n]+)/i);
              
              if (nameMatch) userName = nameMatch[1].trim();
              if (emailMatch) userEmail = emailMatch[1].trim().toLowerCase();
          }

          const existingChat = await chatRef.get();
          let messages = [];
          let startedAt = FieldValue.serverTimestamp();

          if (existingChat.exists) {
              const data = existingChat.data();
              messages = data?.messages || [];
              startedAt = data?.startedAt || startedAt;
              
              if (userName === 'Guest' && data?.userName && data.userName !== 'Guest') {
                  userName = data.userName;
              }
              if (userEmail === 'Anonymous' && data?.userEmail && data.userEmail !== 'Anonymous') {
                  userEmail = data.userEmail;
              }
          }

          const historyMessages = (input.history || []).map((m, idx) => {
              const existingMsg = messages[idx];
              return {
                  role: m.role,
                  content: m.content,
                  timestamp: existingMsg?.timestamp || new Date().toISOString(),
              };
          });

          const updatedMessages = [
              ...historyMessages,
              userMsg,
              botMsg
          ];

          await chatRef.set({
              id: input.conversationId,
              userName,
              userEmail,
              startedAt,
              updatedAt: FieldValue.serverTimestamp(),
              messages: updatedMessages
          }, { merge: true });

      } catch (chatError) {
          console.error("Error logging chatbot conversation to Firestore:", chatError);
      }
  }

  return output!;
}
