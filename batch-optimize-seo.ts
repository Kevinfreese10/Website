import { generateBlogPostSeo } from './src/ai/flows/generate-blog-post-seo';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { firebaseApp } from './src/lib/firebase';
import * as dotenv from 'dotenv';

dotenv.config();

const db = getFirestore(firebaseApp);

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
    { id: 'ai-accountant', path: '/ai-accountant', title: 'AI Accountant | Smart Financial Assistant', description: 'The AI Accountant automates your entire accounting workflow — from receipts to reconciliations — saving you hours of manual work.' },
    { id: 'ai-accountant-signup', path: '/ai-accountant-signup', title: 'AI Accountant Signup | Start Automating', description: 'Create your AI Accountant profile and start automating your bookkeeping today.' },
    { id: 'partner-signup', path: '/partner-signup', title: 'Partner Signup | Join the BEI', description: 'Join our partner network and get access to starting credits and white-label tools.' },
    { id: 'franchise', path: '/franchise', title: 'Own a My Accountant Franchise', description: 'Explore exclusive territory opportunities with the My Accountant Franchise model.' },
    { id: 'franchise-signup', path: '/franchise-signup', title: 'Franchise Signup | My Accountant', description: 'Apply to own your exclusive My Accountant territory and scale with our proven systems.' },
    { id: 'popia', path: '/popia', title: 'POPIA Compliance Policy', description: 'Read the My Accountant (Pty) Ltd policy on the Protection of Personal Information Act (POPIA).' },
    { id: 'refund-policy', path: '/refund-policy', title: 'Refund Policy | My Accountant', description: 'Understand the terms and conditions for refunds on services purchased from My Accountant.' },
    { id: 'terms', path: '/terms', title: 'Terms & Conditions', description: 'Review the official Terms and Conditions for My Accountant services and partner programs.' },
    { id: 'login', path: '/login', title: 'Portal Login | My Accountant', description: 'Access your secure client or partner dashboard to manage your orders and services.' },
    { id: 'signup', path: '/signup', title: 'Create an Account | My Accountant', description: 'Sign up for a My Accountant account to manage your tax and accounting services online.' },
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
        const serviceSnap = await getDocs(collection(db, "services"));
        const services = serviceSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as any));
        console.log(`Successfully loaded ${services.length} Service Pages.`);

        // 2. Fetch Blog Posts
        console.log("\n[2/3] Fetching Blog Posts from Firestore...");
        const blogSnap = await getDocs(collection(db, "blogPosts"));
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
            console.log(`\n[Optimizing ${i + 1}/${totalItems.length}] Type: ${item.type.toUpperCase()} | Path: ${item.path}`);
            
            // 12s sleep to strictly respect Gemini free-tier rate limits (5 RPM)
            if (i > 0) {
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
                    await setDoc(doc(db, 'services', item.id), commonData, { merge: true });
                    console.log(`  [Firestore Success] Saved to services/${item.id}`);
                } else if (item.type === 'blog') {
                    await setDoc(doc(db, 'blogPosts', item.id), commonData, { merge: true });
                    console.log(`  [Firestore Success] Saved to blogPosts/${item.id}`);
                } else {
                    await setDoc(doc(db, 'staticSeo', item.id), {
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
