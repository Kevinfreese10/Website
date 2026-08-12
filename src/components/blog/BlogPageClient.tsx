'use client';
import Image from 'next/image';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Loader2, Clock } from 'lucide-react';
import { useBlog } from '@/contexts/BlogContext';
import { format } from 'date-fns';
import { BlogPost } from '@/lib/types';
import { cn } from '@/lib/utils';

// Helper to estimate read time
const calculateReadTime = (content: string | undefined) => {
    if (!content) return 1;
    const words = content.replace(/<[^>]*>?/gm, '').split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
};

export default function BlogPageClient({ initialBlogPosts }: { initialBlogPosts?: BlogPost[] }) {
  const { blogPosts: contextPosts, isLoading } = useBlog();
  
  const rawPosts = initialBlogPosts && initialBlogPosts.length > 0 ? initialBlogPosts : contextPosts;
  const blogPosts = [...rawPosts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const showLoader = isLoading && (!initialBlogPosts || initialBlogPosts.length === 0);

  const featuredPost = blogPosts.length > 0 ? blogPosts[0] : null;
  const standardPosts = blogPosts.length > 1 ? blogPosts.slice(1) : [];

  return (
    <div className="w-full bg-slate-50 flex flex-col min-h-screen animate-in fade-in">
      {/* PREMIUM HERO SECTION */}
      <section className="relative w-full overflow-hidden bg-white border-b pt-16 pb-20 text-center mb-12 shadow-sm">
        <div className="absolute inset-0 bg-grid-slate-100/[0.04] bg-[size:20px_20px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/80" />
        <div className="container relative mx-auto px-4 max-w-4xl z-10">
          <Badge variant="secondary" className="mb-6 uppercase tracking-widest font-extrabold bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1">Tax Tip Blog</Badge>
          <h1 className="mb-6 text-4xl font-black tracking-tight md:text-5xl lg:text-7xl text-slate-900 pb-2">
            Tax insights for <span className="text-gradient from-blue-600 to-indigo-600">smart businesses.</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg font-medium text-slate-600 md:text-xl leading-relaxed">
            Read our latest tax tips and accounting guides. Stay compliant and save money with advice from our expert team.
          </p>
        </div>
      </section>
      
      <div className="container mx-auto px-4 pb-20 flex-grow max-w-6xl">
        {showLoader ? (
          <div className="flex justify-center items-center h-64">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-16">
            
            {/* FEATURED POST */}
            {featuredPost && (
              <div className="group relative bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xl hover:shadow-2xl transition-all duration-500 flex flex-col lg:flex-row min-h-[400px]">
                <div className="relative w-full lg:w-3/5 h-64 lg:h-auto overflow-hidden">
                  <Image
                    src={featuredPost.imageUrl}
                    alt={featuredPost.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    data-ai-hint={featuredPost.imageHint}
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent lg:bg-gradient-to-r" />
                  <Badge className="absolute top-6 left-6 bg-primary text-primary-foreground font-bold tracking-wider uppercase">Featured</Badge>
                </div>
                <div className="flex flex-col justify-center p-8 lg:p-12 w-full lg:w-2/5">
                  <div className="flex items-center gap-4 text-sm font-semibold text-slate-500 mb-4">
                    <span>{format(new Date(featuredPost.date), 'MMM d, yyyy')}</span>
                    <span className="flex items-center"><Clock className="h-4 w-4 mr-1" /> {calculateReadTime(featuredPost.content)} min read</span>
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 mb-4 leading-tight group-hover:text-primary transition-colors">
                    <Link href={`/blog/${featuredPost.slug}`} className="before:absolute before:inset-0">
                      {featuredPost.title}
                    </Link>
                  </h2>
                  <p className="text-slate-600 leading-relaxed mb-8 text-lg">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                      {/* Avatar placeholder for Kevin */}
                      <Image src="/images/kevin.jpeg" alt="Kevin Freese" width={40} height={40} className="object-cover h-full w-full" unoptimized />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Kevin Freese</p>
                      <p className="text-xs font-semibold text-slate-500">Chartered Accountant</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

                {standardPosts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {standardPosts.map(post => (
                  <Card key={post.id} className="group relative flex flex-col overflow-hidden bg-white border border-slate-200 shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1 rounded-2xl">
                      <div className="relative h-56 w-full overflow-hidden">
                          <Image
                            src={post.imageUrl}
                            alt={post.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                            data-ai-hint={post.imageHint}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <div className="absolute top-4 left-4 flex gap-2">
                             <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-slate-900 font-bold hover:bg-white">{format(new Date(post.date), 'MMM d')}</Badge>
                          </div>
                      </div>
                      <CardHeader className="px-6 pt-6 pb-4">
                        <div className="flex items-center text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">
                          <span className="flex items-center"><Clock className="h-3.5 w-3.5 mr-1" /> {calculateReadTime(post.content)} min read</span>
                        </div>
                        <h2 className="text-xl font-black text-slate-900 leading-snug group-hover:text-primary transition-colors line-clamp-2">
                            <Link href={`/blog/${post.slug}`} className="before:absolute before:inset-0">{post.title}</Link>
                        </h2>
                      </CardHeader>
                      <CardContent className="px-6 pb-6 flex-grow">
                        <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">{post.excerpt}</p>
                      </CardContent>
                      <CardFooter className="px-6 pb-6 pt-0 mt-auto border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 mt-4">
                          <div className="h-6 w-6 rounded-full overflow-hidden">
                            <Image src="/images/kevin.jpeg" alt="Kevin Freese" width={24} height={24} className="object-cover h-full w-full" unoptimized />
                          </div>
                          <span className="text-xs font-bold text-slate-700">Kevin Freese</span>
                        </div>
                        <span className="text-primary mt-4 group-hover:translate-x-1 transition-transform">
                            <ArrowRight className="h-4 w-4" />
                        </span>
                      </CardFooter>
                  </Card>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
