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
import { collection, addDoc, Timestamp, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Service, BlogPost } from '@/lib/types';

const WebsiteQAndAInputSchema = z.object({
  question: z.string().describe('The user\'s question.'),
  history: z.array(z.object({
    role: z.enum(['user', 'bot']),
    content: z.string(),
  })).optional().describe('The conversation history.'),
});
export type WebsiteQAndAInput = z.infer<typeof WebsiteQAndAInputSchema>;

const WebsiteQAndAOutputSchema = z.object({
  answer: z.string().describe('A concise and helpful answer to the user\'s question. Prioritize information from the provided context, but use general knowledge if the answer is not available there. If you cannot answer, state that.'),
  confidence: z.number().min(0).max(100).describe('A confidence score (0-100) of how certain you are about the answer. If the answer is directly stated in the context, confidence should be high (90-100). If it is inferred from the context, it should be medium (60-80). If using general knowledge, confidence should be lower (40-60). If you cannot answer, it should be very low (0-10).'),
  serviceUrl: z.string().optional().describe("If the user's question is about a specific service, provide the URL for that service page. The URL should be in the format '/products/service-slug'."),
});
export type WebsiteQAndAOutput = z.infer<typeof WebsiteQAndAOutputSchema>;

export async function websiteQAndA(
  input: WebsiteQAndAInput
): Promise<WebsiteQAndAOutput> {
  // Fetch live data from Firestore
  const servicesSnapshot = await getDocs(query(collection(db, 'services'), orderBy('title')));
  const services = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));

  const blogPostsSnapshot = await getDocs(query(collection(db, 'blogPosts'), orderBy('date', 'desc')));
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
    How it works: Apply online, pay R5000 setup (loaded as practice credits), and get access to your dashboard. R499/month hosting fee deducted from credits.
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
    ${knowledgeBaseItems.map(item => `Question: ${item.question}, Answer: ${item.answer}`).join('\n\n')}
    
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
  `;

  const prompt = ai.definePrompt({
    name: 'websiteQAndAPrompt',
    model: 'googleai/gemini-2.5-flash',
    input: {schema: WebsiteQAndAInputSchema},
    output: {schema: WebsiteQAndAOutputSchema},
    prompt: `You are the AI Sales Consultant for My Accountant (Pty) Ltd. Your name is 'Khai'.
    
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
    
    For example:
    "We can certainly assist with your Tax Clearance Pin. The cost for this service is R350, and we typically have it sorted for you within 1-2 working days. Would you like me to provide the list of requirements needed to get started?"
    
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
    If uncertain: "I'd like one of our specialists to confirm that information for you. May I arrange for someone to contact you?"
    
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
      
  if (output && output.confidence < 15) {
      try {
          await addDoc(collection(db, 'unansweredQuestions'), {
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
          // Extract matching fields dynamically from text if possible, or save full lead payload
          const lines = output.answer.split('\n');
          const getField = (prefix: string) => {
              const line = lines.find(l => l.toLowerCase().startsWith(prefix.toLowerCase()));
              return line ? line.substring(prefix.length).trim() : '';
          };

          await addDoc(collection(db, 'leads'), {
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
  
  return output!;
}
