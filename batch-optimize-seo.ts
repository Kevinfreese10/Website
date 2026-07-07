import { generateBlogPostSeo } from './src/ai/flows/generate-blog-post-seo';
import { getAdminDb } from './src/lib/firebase-admin';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const db = getAdminDb();

const staticPagesConfig = [
    { id: 'home', path: '/', title: 'My Accountant | Professional Accounting & Tax Services', description: 'Professional Accounting & Tax Services for South Africa. We handle SARS, CIPC, and all your compliance needs so you can focus on your business.' },
    { id: 'about', path: '/about', title: 'About Us | My Accountant', description: 'Learn about My Accountant, our vision, mission, and the expertise that drives us to provide top-tier financial services in South Africa.' },
    { id: 'products', path: '/products', title: 'Our Products | My Accountant', description: 'Comprehensive solutions to meet all your financial needs. We offer a range of services for individuals and businesses.' },
    { id: 'blog', path: '/blog', title: 'Tax Tip Blog | My Accountant', description: 'Stay informed with our latest articles, tips, and updates on tax-related topics relevant to South African individuals and businesses.' },
    { id: 'compliance', path: '/compliance', title: 'Free SARS & CIPC Compliance Check', description: 'Ensure your South African business is compliant. Get a free, no-obligation compliance assessment for CIPC and SARS.' },
    { id: 'sars-compromise', path: '/sars-compromise', title: 'SARS Compromise of Debt | My Accountant', description: 'Explore your options for a SARS Compromise of Debt. We help you negotiate a settlement with SARS to resolve outstanding tax debt.' },
    { id: 'sars-disputes', path: '/sars-disputes', title: 'SARS Disputes & Objections | My Accountant', description: 'Professional assistance with SARS disputes, objections (Section 104), and appeals.' },
    { id: 'remission-of-fines', path: '/remission-of-fines', title: 'Remission of Fines & Penalties | My Accountant', description: 'Apply for a SARS Request for Remission (RFR) to remove or reduce administrative and understatement penalties.' },
    { id: 'liquidations', path: '/liquidations', title: 'Company Liquidations | My Accountant', description: 'Professional assistance with voluntary company liquidations in South Africa. Close your business legally and responsibly.' },
    { id: 'contact', path: '/contact', title: 'Contact Us | My Accountant', description: 'Get in touch with the My Accountant team. Fill out our contact form with your questions or inquiries.' },
    { id: 'BEI', path: '/BEI', title: 'Bookkeeper Empowerment Initiative | Partner Program', description: 'Empowering small and growing bookkeepers in South Africa. Joining is free. Partners get 25% off My Accountant standard service fees.' },
    { id: 'become-a-partner', path: '/become-a-partner', title: 'Become a Partner | My Accountant', description: 'Partner with My Accountant to grow your practice. Access the mentorship and technology you need.' },
    { id: 'ai-accountant-signup', path: '/ai-accountant-signup', title: 'AI Accountant Signup | Start Automating', description: 'Create your AI Accountant profile and start automating your bookkeeping today.' },
    { id: 'partner-signup', path: '/partner-signup', title: 'Partner Signup | Join the BEI', description: 'Join our partner network and get access to starting credits and white-label tools.' },
    { id: 'franchise', path: '/franchise', title: 'Own a My Accountant Franchise', description: 'Explore exclusive territory opportunities with the My Accountant Franchise model.' },
    { id: 'franchise-signup', path: '/franchise-signup', title: 'Franchise Signup | My Accountant', description: 'Apply to own your exclusive My Accountant territory and scale with our proven systems.' },
    { id: 'popia', path: '/popia', title: 'POPIA Compliance Policy', description: 'Read the My Accountant (Pty) Ltd policy on the Protection of Personal Information Act (POPIA).' },
    { id: 'refund-policy', path: '/refund-policy', title: 'Refund Policy | My Accountant', description: 'Understand the terms and conditions for refunds on services purchased from My Accountant.' },
    { id: 'terms', path: '/terms', title: 'Terms & Conditions', description: 'Review the official Terms and Conditions for My Accountant services and partner programs.' },
    { id: 'login', path: '/login', title: 'Portal Login | My Accountant', description: 'Access your secure client or partner dashboard to manage your orders and services.' },
    { id: 'signup', path: '/signup', title: 'Create an Account | My Accountant', description: 'Sign up for a My Accountant account to manage your tax and accounting services online.' },
    { id: 'accounting-services-south-africa', path: '/accounting-services-south-africa', title: 'Accounting Services South Africa | Top Accountants | My Accountant', description: 'Professional accounting services in South Africa for small to medium businesses. Monthly accounting, management accounts, and bookkeeping on Xero & Sage.' },
    { id: 'annual-financial-statements', path: '/annual-financial-statements', title: 'Annual Financial Statements (AFS) | My Accountant', description: 'Professional preparation of IFRS-compliant Annual Financial Statements for South African companies and trusts.' },
    { id: 'bookkeeping-services-johannesburg', path: '/bookkeeping-services-johannesburg', title: 'Bookkeeping Services Johannesburg | Local Accountants | My Accountant', description: 'Reliable monthly bookkeeping services for small and medium businesses in Johannesburg. Certified accountants handling bank reconciliations, VAT, and SARS compliance.' },
    { id: 'bookkeeping-services', path: '/bookkeeping-services', title: 'Professional Bookkeeping Services | My Accountant', description: 'Outsource your bookkeeping to certified professionals in South Africa. Comprehensive monthly record-keeping, bank reconciliations, ledgers, and cloud accounting.' },
    { id: 'cipc-company-registration-online', path: '/cipc-company-registration-online', title: 'CIPC Company Registration Online | My Accountant', description: 'Register your private company (Pty) Ltd online with CIPC. Fast 24-hour turnaround, tax registration, and official share certificates included.' },
    { id: 'fractional-cfo-services-south-africa', path: '/fractional-cfo-services-south-africa', title: 'Fractional CFO Services South Africa | Outsourced CFO | My Accountant', description: 'Access executive financial leadership at a fraction of the cost. Our outsourced CFO services in South Africa cover strategy, cash flow management, and board reports.' },
    { id: 'management-accounts', path: '/management-accounts', title: 'Management Accounts & Financial Reporting | My Accountant', description: 'Professional monthly and quarterly management accounts for South African businesses. Data-driven insights to grow your practice.' },
    { id: 'monthly-accounting', path: '/monthly-accounting', title: 'Monthly Accounting & CFO Services | My Accountant', description: 'Professional monthly accounting, financial management, and outsourced CFO services for South African SMEs. Scalable solutions for startups and growing businesses.' },
    { id: 'monthly-payroll', path: '/monthly-payroll', title: 'Monthly Payroll Services | My Accountant', description: 'Professional monthly payroll management for South African businesses. Digital payslips, EMP201 submissions, and UIF declarations.' },
    { id: 'movie-film-production-accountant-randburg', path: '/movie-film-production-accountant-randburg', title: 'Movie & Film Production Accountant Randburg | My Accountant', description: 'Professional film and TV production accountants in Randburg. Supporting production companies near MultiChoice, Ferndale, and Johannesburg. SARS compliance, cost reporting, and payroll.' },
    { id: 'movie-film-production-accounting-south-africa', path: '/movie-film-production-accounting-south-africa', title: 'Movie & Film Production Accounting South Africa | My Accountant', description: 'Specialised movie and film production accounting services in South Africa. Manage production budgets, SARS Section 12O tax incentives, cast & crew payroll, and VAT audits.' },
    { id: 'outsourced-payroll-fees-sa', path: '/outsourced-payroll-fees-sa', title: 'Outsourced Payroll Fees South Africa | Cost & Packages | My Accountant', description: 'Compare outsourced payroll fees in South Africa. Transparent per-employee pricing covering payslips, SARS EMP201 submissions, COIDA, and UIF filing.' },
    { id: 'pastel-accountant-south-africa', path: '/pastel-accountant-south-africa', title: 'Pastel Accountant South Africa | Partner & Evolution | My Accountant', description: 'Professional Sage Pastel accounting, database cleanup, and support. We assist with legacy Pastel Partner to Sage Cloud migrations.' },
    { id: 'paye-compliance', path: '/paye-compliance', title: 'PAYE Compliance & EMP201 Returns | My Accountant', description: 'Professional management of PAYE compliance and monthly EMP201 submissions for South African employers.' },
    { id: 'payroll-administration', path: '/payroll-administration', title: 'Payroll Administration Services | My Accountant', description: 'Professional payroll administration for South African businesses. Digital payslips, leave tracking, and employer tax management.' },
    { id: 'register-company-south-africa-price', path: '/register-company-south-africa-price', title: 'Company Registration Price South Africa | CIPC Cost | My Accountant', description: 'How much does it cost to register a company in South Africa? View our transparent CIPC registration fees and package pricing with no hidden costs.' },
    { id: 'sage-accountant-south-africa', path: '/sage-accountant-south-africa', title: 'Sage Accountant South Africa | Pastel Support | My Accountant', description: 'Expert Sage accounting and Pastel support for South African businesses. Transition to the cloud, automate payroll, and stay compliant with SARS.' },
    { id: 'sars-tax-refund', path: '/sars-tax-refund', title: 'Free SARS Tax Refund Check | Are You Due a Refund? | My Accountant', description: 'Find out if SARS owes you money. Get a free compliance assessment — we check your eFiling profile for unclaimed refunds from medical credits, retirement deductions, work-from-home claims and more. Results in 24 hours.' },
    { id: 'small-business-accounting-south-africa', path: '/small-business-accounting-south-africa', title: 'Small Business Accounting South Africa | SME Financial Services', description: 'Affordable accounting and bookkeeping packages tailored specifically for startups and small businesses in South Africa. Get Xero integration and SARS compliance.' },
    { id: 'tax-consultant', path: '/tax-consultant', title: 'Professional Tax Consultant SA | SARS Compliance | My Accountant', description: 'Get expert tax consulting and SARS dispute assistance in South Africa. We handle audits, objections, compromises, penalty remissions, and structured tax planning.' },
    { id: 'tax-services-south-africa', path: '/tax-services-south-africa', title: 'Tax Services South Africa | SARS Compliance & Advisory', description: 'Expert tax services in South Africa. We handle ITR12, Provisional Tax, Corporate Tax, VAT, and SARS disputes. Get compliant today.' },
    { id: 'uif-compliance', path: '/uif-compliance', title: 'UIF & SDL Compliance Services | My Accountant', description: 'Ensure your business meets its UIF and SDL obligations. We handle uFiling registrations and monthly declarations.' },
    { id: 'xero-accountant-south-africa', path: '/xero-accountant-south-africa', title: 'Certified Xero Accountant South Africa | My Accountant', description: 'Scale your business with our certified Xero accounting services. Automated bank feeds, real-time reports, and professional monthly bookkeeping.' },
    { id: 'zoho-accountant-south-africa', path: '/zoho-accountant-south-africa', title: 'Zoho Books Accountant South Africa | My Accountant', description: 'Automate your bookkeeping with certified Zoho Books accountants in South Africa. Complete integration with Zoho CRM, inventory, and expense tracking.' },
];

async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function executeWithRetry(title: string, content: string, retries = 3, waitTime = 15000): Promise<any> {
    try {
        const res = await generateBlogPostSeo({ title, content });
        if (res.success) {
            return res.data;
        }
        
        console.warn(`[API WARNING] generateBlogPostSeo returned failure for "${title}":`, res.error.message);
        if (retries > 0) {
            const delayTime = res.error.isRateLimit ? 65000 : waitTime;
            console.log(`[RETRY] Waiting ${delayTime / 1000}s before retrying "${title}"... (${retries} left)`);
            await delay(delayTime);
            return executeWithRetry(title, content, retries - 1, waitTime * 2);
        }
        throw new Error(res.error.message);
    } catch (err: any) {
        console.error(`[EXCEPTION] Error optimizing "${title}":`, err);
        if (retries > 0) {
            console.log(`[RETRY] Unexpected exception. Waiting ${waitTime / 1000}s before retrying...`);
            await delay(waitTime);
            return executeWithRetry(title, content, retries - 1, waitTime * 2);
        }
        throw err;
    }
}

async function startSeoBatchOptimization() {
    console.log("==============================================");
    console.log("   My Accountant - Automated SEO Batch Optimizer");
    console.log("==============================================");
    console.log("API Key configured:", process.env.GEMINI_API_KEY ? "Yes" : "No");
    
    try {
        // 1. Fetch Dynamic Service Pages
        console.log("\n[1/3] Fetching Service Pages (Products) from Firestore...");
        const serviceSnap = await db.collection("services").get();
        const services = serviceSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as any));
        console.log(`Successfully loaded ${services.length} Service Pages.`);

        // 2. Fetch Blog Posts
        console.log("\n[2/3] Fetching Blog Posts from Firestore...");
        const blogSnap = await db.collection("blogPosts").get();
        const blogPosts = blogSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as any));
        console.log(`Successfully loaded ${blogPosts.length} Blog Posts.`);

        // 3. Compile Optimization List
        const totalItems: { type: 'static' | 'service' | 'blog'; id: string; path: string; currentTitle: string; content: string }[] = [];
        
        // Static Pages config
        staticPagesConfig.forEach(p => {
            totalItems.push({
                type: 'static',
                id: p.id,
                path: p.path,
                currentTitle: p.title.split('|')[0].trim(),
                content: p.description
            });
        });

        // Service Pages (Products)
        services.forEach(s => {
            totalItems.push({
                type: 'service',
                id: s.id,
                path: `/products/${s.slug}`,
                currentTitle: s.title,
                content: s.longDescription || s.description || ''
            });
        });

        // Blog Posts
        blogPosts.forEach(b => {
            totalItems.push({
                type: 'blog',
                id: b.id,
                path: `/blog/${b.slug}`,
                currentTitle: b.title,
                content: b.content || b.excerpt || ''
            });
        });

        console.log(`\nReady to optimize a total of ${totalItems.length} pages.`);
        console.log("==============================================");
        
        let successCount = 0;
        let skipCount = 0;

        for (let i = 0; i < totalItems.length; i++) {
            const item = totalItems[i];

            // Skip check
            try {
                let docSnap;
                if (item.type === 'service') {
                    docSnap = await db.collection('services').doc(item.id).get();
                } else if (item.type === 'blog') {
                    docSnap = await db.collection('blogPosts').doc(item.id).get();
                } else {
                    docSnap = await db.collection('staticSeo').doc(item.id).get();
                }

                if (docSnap.exists && docSnap.data()?.metaTitle && docSnap.data()?.metaDescription) {
                    console.log(`[SKIPPED] ${item.path} (Already optimized)`);
                    skipCount++;
                    continue;
                }
            } catch (err: any) {
                console.warn(`[WARN] Failed to check status for ${item.path}:`, err.message || err);
            }

            console.log(`\n[Optimizing] Type: ${item.type.toUpperCase()} | Path: ${item.path}`);
            
            // 12s sleep to strictly respect Gemini free-tier rate limits (5 RPM)
            if (successCount > 0) {
                console.log(`[Rate Limit Guard] Pausing 12 seconds...`);
                await delay(12000);
            }

            try {
                const seo = await executeWithRetry(item.currentTitle, item.content);
                
                const metaTitle = seo.metaTitle;
                const metaDescription = seo.metaDescription;
                const metaKeywords = seo.metaKeywords?.map((k: any) => typeof k === 'object' ? k.value : k) || [];

                console.log(`  -> Optimized Title: "${metaTitle}"`);
                console.log(`  -> Optimized Description: "${metaDescription}"`);
                console.log(`  -> Keywords: ${JSON.stringify(metaKeywords)}`);

                const commonData = {
                    metaTitle,
                    metaDescription,
                    metaKeywords,
                    seoImageUrl: '',
                    seoImageLabel: ''
                };

                // Direct Save to Firestore
                if (item.type === 'service') {
                    await db.collection('services').doc(item.id).set(commonData, { merge: true });
                    console.log(`  [Firestore Success] Saved to services/${item.id}`);
                } else if (item.type === 'blog') {
                    await db.collection('blogPosts').doc(item.id).set(commonData, { merge: true });
                    console.log(`  [Firestore Success] Saved to blogPosts/${item.id}`);
                } else {
                    await db.collection('staticSeo').doc(item.id).set({
                        ...commonData,
                        path: item.path
                    });
                    console.log(`  [Firestore Success] Saved to staticSeo/${item.id}`);
                }
                
                successCount++;
            } catch (pageError: any) {
                console.error(`  [Firestore SKIP] Failed to optimize page "${item.currentTitle}":`, pageError.message || pageError);
                skipCount++;
            }
        }

        console.log("\n==============================================");
        console.log("   BATCH SEO OPTIMIZATION COMPLETE!");
        console.log("==============================================");
        console.log(`Total Pages Processed: ${totalItems.length}`);
        console.log(`Successfully Optimized & Saved: ${successCount}`);
        console.log(`Failed / Skipped: ${skipCount}`);
        console.log("==============================================");

    } catch (err) {
        console.error("Critical error in batch optimization script:", err);
    }
}

startSeoBatchOptimization();
