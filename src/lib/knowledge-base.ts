import { KnowledgeBaseItem } from './types';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export let knowledgeBaseItems: KnowledgeBaseItem[] = [
    {
        id: 'kb-1',
        question: 'What are your office hours?',
        answer: 'Our office hours are from 8:00 AM to 5:00 PM, Monday to Friday.'
    },
    {
        id: 'kb-2',
        question: 'What is the physical address of the company?',
        answer: 'Our physical address is Ground Floor, Waterstone Building, Stonemill Office Park, 300 Acacia Road, Darrenwood, Johannesburg, 2195.'
    },
    {
        id: 'kb-3',
        question: 'What is your refund policy?',
        answer: 'All services are non-refundable once work has begun. Refunds may be considered only if the service has not yet started, and a processing fee of 10% will be deducted from any approved refund. Refund requests must be submitted within 48 hours of purchase.'
    },
    {
        id: 'kb-vat-1',
        question: 'What are the new South African VAT registration thresholds (effective 1 April 2026)?',
        answer: 'With effect from 1 April 2026, South Africa’s VAT registration thresholds increased: Compulsory VAT registration increased from R1,000,000 to R2,300,000 (taxable supplies/turnover in any consecutive 12-month period), and Voluntary VAT registration increased from R50,000 to R120,000. SARS is actively administering all new registrations under these updated thresholds.'
    },
    {
        id: 'kb-vat-2',
        question: 'When is VAT registration compulsory in South Africa?',
        answer: 'A business must register for VAT where its taxable supplies/turnover exceed R2.3 million (R2,300,000) in any consecutive 12-month period, or where it has entered into a written contractual obligation that will result in taxable supplies exceeding R2.3 million in a 12-month period. Note that this threshold is based on total taxable turnover, not profit.'
    },
    {
        id: 'kb-vat-3',
        question: 'What is the voluntary VAT registration threshold?',
        answer: 'If taxable supplies are below R2.3 million, a business can apply for voluntary VAT registration once its taxable supplies exceed R120,000 in a 12-month period, subject to standard SARS compliance requirements, banking confirmation, and commercial trading proofs.'
    },
    {
        id: 'kb-vat-4',
        question: 'What happens to existing VAT vendors whose turnover is below R2.3 million?',
        answer: 'Existing VAT registrations are NOT automatically cancelled. If your business is already VAT registered and generates turnover below R2.3 million (e.g. R1.5 million), you may choose to remain VAT registered to continue claiming input tax and invoicing corporate clients, or you may choose to apply to SARS for voluntary deregistration.'
    },
    {
        id: 'kb-vat-5',
        question: 'What is Exit VAT upon VAT deregistration?',
        answer: 'When a business deregisters from VAT, it must pay exit VAT (output tax) on the lesser of the cost or open market value of all assets and trading stock held immediately before deregistration on which input VAT was previously claimed.'
    },
    {
        id: 'kb-khai-1',
        question: 'Who is Khai / What does the Support Consultant do?',
        answer: 'Khai is the Support Consultant at My Accountant. Khai assists clients and website visitors 24/7 with understanding our 100+ accounting, tax, CIPC corporate secretarial, payroll, and business licensing services, clarifying prerequisites and transparent pricing, placing online orders, and providing live order tracking updates.'
    },
    {
        id: 'kb-services-100',
        question: 'How many services does My Accountant offer?',
        answer: 'My Accountant offers 100+ transparent, fixed-price statutory accounting, tax, payroll, CIPC corporate secretarial, and business licensing services. You can view all services, fixed pricing, and completion times in our online store at https://www.myacc.co.za/products.'
    },
    {
        id: 'kb-licences-1',
        question: 'What business licences and statutory permits do you assist with?',
        answer: 'We assist with a comprehensive range of South African business licences and regulatory permits, including: Transport Operating Licences (Form 1B), Cross-Border Road Transport Permits (C-BRTA), Liquor Licence Application Packs, Electrical Contractor Registration (DoEL Wireman’s Licence), Solar SSEG Grid-Tie Registrations, Food Business Certificates of Acceptability (CoA under R638), Tourism Star Grading (TGCSA), Tourist Guide Registration (CATHSSETA), Property Practitioners (PPRA) Firm Registration, Firearm Application Packs (SAPS 517/271), Traffic Register Numbers (TRN), POPIA Compliance & Governance Packs, and Bankable Business Plans for funding (SEFA, NYDA, Banks).'
    },
    {
        id: 'kb-transport-1',
        question: 'What are the prerequisites for a Transport Operating Licence (Form 1B)?',
        answer: 'To apply for a Transport Operating Licence (Form 1B) through the Provincial Regulatory Entity (PRE), the prerequisites include: Private Company Registration (COR14.3), SARS Tax Clearance Certificate (TCS PIN), COIDA Registration, vehicle roadworthy certificates and RC1 registration documents for all fleet vehicles, valid passenger liability insurance, valid professional driving permits (PrDP) and licences for drivers, and an association/route support letter or customer transport service contract.'
    }
];

// Function to fetch and update the knowledge base from Firestore
export async function fetchKnowledgeBase() {
    try {
        const q = query(collection(db, "knowledgeBase"), orderBy("question"));
        const querySnapshot = await getDocs(q);
        const fetchedItems = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KnowledgeBaseItem));
        knowledgeBaseItems = fetchedItems;
        return fetchedItems;
    } catch (error) {
        console.error("Error fetching knowledge base from Firestore:", error);
        // Return static data as a fallback
        return knowledgeBaseItems;
    }
}
