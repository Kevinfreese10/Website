import { getAdminDb } from '../lib/firebase-admin';
import { generateBlogPost } from '../ai/flows/generate-blog-post';
import * as dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const topics = [
    { keyword: 'How to file an IRP6 return in South Africa', intent: 'Informational', slug: 'how-to-file-irp6-return-south-africa' },
    { keyword: 'VAT123e form explained (SARS VAT Registration)', intent: 'Informational', slug: 'vat123e-form-explained-sars-vat-registration' },
    { keyword: 'How to submit an ITR12 tax return', intent: 'Informational', slug: 'how-to-submit-itr12-tax-return' },
    { keyword: 'What is a beneficial ownership declaration CIPC?', intent: 'Informational', slug: 'beneficial-ownership-declaration-cipc-explained' },
    { keyword: 'How to apply for a SARS tax directive', intent: 'Transactional', slug: 'how-to-apply-sars-tax-directive' }
] as const;

async function run() {
    const db = getAdminDb();
    console.log('Starting content gap generation...');

    for (const topic of topics) {
        console.log(`Generating content for: ${topic.keyword}...`);
        
        try {
            // Check if it already exists to avoid duplicates
            const existing = await db.collection('blogPosts').where('slug', '==', topic.slug).get();
            if (!existing.empty) {
                console.log(`Blog post ${topic.slug} already exists. Skipping.`);
                continue;
            }

            const output = await generateBlogPost({
                primaryKeyword: topic.keyword,
                searchIntent: topic.intent
            });

            const id = crypto.randomUUID();
            const dateStr = new Date().toISOString();

            const blogPost = {
                id,
                slug: topic.slug,
                title: output.title,
                excerpt: output.excerpt,
                content: output.content,
                imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=2000&auto=format&fit=crop',
                imageHint: 'Accounting or finance related image',
                author: 'My Accountant Team',
                date: dateStr,
                metaTitle: output.title.substring(0, 60),
                metaDescription: output.excerpt.substring(0, 160)
            };

            await db.collection('blogPosts').doc(id).set(blogPost);
            console.log(`✅ Successfully generated and saved: ${topic.slug}`);
            
            // Wait 5 seconds to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (err: any) {
            console.error(`❌ Failed to generate ${topic.slug}:`, err.message);
        }
    }

    console.log('Finished generating content.');
    process.exit(0);
}

run().catch((e) => {
    console.error(e);
    process.exit(1);
});
