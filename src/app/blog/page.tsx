import BlogPageClient from '@/components/blog/BlogPageClient';
import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import { getAdminDb, serializeDbData } from '@/lib/firebase-admin';
import { BlogPost } from '@/lib/types';

export const revalidate = 1800;

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Tax Tip Blog | My Accountant',
        description: 'Stay informed with our latest articles, tips, and updates on tax-related topics relevant to South African individuals and businesses.',
    };
    return getStaticPageMetadata('blog', defaults);
}

export default async function BlogPage() {
  let blogPosts: BlogPost[] = [];
  try {
    const db = getAdminDb();
    const blogPostsSnapshot = await db.collection("blogPosts").orderBy("date", "desc").get();
    blogPosts = blogPostsSnapshot.docs.map(doc => {
        const data = doc.data();
        if (data.date && typeof data.date === 'object' && 'toDate' in data.date) {
            data.date = data.date.toDate().toISOString();
        } else if (data.date instanceof Date) {
            data.date = data.date.toISOString();
        }
        return serializeDbData({ ...data, id: doc.id }) as BlogPost;
    });
  } catch (error) {
    console.error("Error fetching blog posts for SSR:", error);
  }

  return <BlogPageClient initialBlogPosts={blogPosts} />;
}
