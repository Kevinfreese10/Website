import BlogPageClient, { BlogPostSummary } from '@/components/blog/BlogPageClient';
import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import { getAdminDb, serializeDbData } from '@/lib/firebase-admin';

export const revalidate = 1800;

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Tax Tip Blog | My Accountant',
        description: 'Stay informed with our latest articles, tips, and updates on tax-related topics relevant to South African individuals and businesses.',
    };
    return getStaticPageMetadata('blog', defaults);
}

export default async function BlogPage() {
  let blogPosts: BlogPostSummary[] = [];
  try {
    const db = getAdminDb();
    const blogPostsSnapshot = await db.collection("blogPosts").orderBy("date", "desc").get();
    blogPosts = blogPostsSnapshot.docs.map(doc => {
        const data = doc.data();
        let dateStr: string;
        if (data.date && typeof data.date === 'object' && 'toDate' in data.date) {
            dateStr = data.date.toDate().toISOString();
        } else if (data.date instanceof Date) {
            dateStr = data.date.toISOString();
        } else if (typeof data.date === 'string') {
            dateStr = data.date;
        } else {
            dateStr = new Date().toISOString();
        }

        const words = (data.content || '').replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
        const readTimeMinutes = Math.max(1, Math.ceil(words / 200));

        const summary: BlogPostSummary = {
            id: doc.id,
            slug: data.slug || '',
            title: data.title || '',
            metaTitle: data.metaTitle || '',
            excerpt: data.excerpt || '',
            metaDescription: data.metaDescription || '',
            date: dateStr,
            author: data.author || 'Kevin Freese',
            category: data.category || '',
            imageUrl: data.imageUrl || '',
            imageHint: data.imageHint || '',
            relatedProducts: Array.isArray(data.relatedProducts) ? data.relatedProducts : [],
            readTimeMinutes,
        };

        return serializeDbData(summary) as BlogPostSummary;
    });
  } catch (error) {
    console.error("Error fetching blog posts for SSR:", error);
  }

  return <BlogPageClient initialBlogPosts={blogPosts} />;
}

export type { BlogPostSummary };
