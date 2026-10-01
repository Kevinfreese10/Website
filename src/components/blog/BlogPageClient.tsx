'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export type BlogPostSummary = {
  id: string;
  slug: string;
  title: string;
  metaTitle?: string;
  excerpt: string;
  metaDescription?: string;
  date: string;
  author: string;
  category?: string;
  imageUrl: string;
  imageHint?: string;
  relatedProducts?: string[];
  readTimeMinutes: number;
};

const POSTS_PER_PAGE = 12;

function formatExcerpt(excerpt: string | undefined, maxLength = 160): string {
  if (!excerpt) return '';
  const trimmed = excerpt.trim();
  if (trimmed.length <= maxLength) return trimmed;
  const sliced = trimmed.slice(0, maxLength);
  const lastSpace = sliced.lastIndexOf(' ');
  const cleanCut = lastSpace > 110 ? sliced.slice(0, lastSpace) : sliced;
  return `${cleanCut.replace(/[.,;:\s]+$/, '')}...`;
}

function formatDateSafe(dateStr: string | undefined, formatPattern: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return format(d, formatPattern);
  } catch {
    return '';
  }
}

export default function BlogPageClient({ initialBlogPosts = [] }: { initialBlogPosts?: BlogPostSummary[] }) {
  const [currentPage, setCurrentPage] = useState(1);

  const rawPosts = initialBlogPosts || [];
  const blogPosts = [...rawPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const totalPages = Math.max(1, Math.ceil(blogPosts.length / POSTS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  // Page 1 shows 1 Featured Post + 11 Standard Posts (12 posts total)
  // Page 2+ shows 12 Standard Posts per page
  const featuredPost = safeCurrentPage === 1 && blogPosts.length > 0 ? blogPosts[0] : null;

  const standardPosts =
    safeCurrentPage === 1
      ? blogPosts.slice(1, POSTS_PER_PAGE)
      : blogPosts.slice((safeCurrentPage - 1) * POSTS_PER_PAGE, safeCurrentPage * POSTS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === safeCurrentPage) return;
    setCurrentPage(newPage);
    if (typeof window !== 'undefined') {
      const el = document.getElementById('blog-posts-top');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const getPaginationItems = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | 'ellipsis')[] = [];
    pages.push(1);
    if (safeCurrentPage > 3) {
      pages.push('ellipsis');
    }
    const start = Math.max(2, safeCurrentPage - 1);
    const end = Math.min(totalPages - 1, safeCurrentPage + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (safeCurrentPage < totalPages - 2) {
      pages.push('ellipsis');
    }
    pages.push(totalPages);
    return pages;
  };

  const paginationItems = getPaginationItems();

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
      
      <div id="blog-posts-top" className="container mx-auto px-4 pb-20 flex-grow max-w-6xl scroll-mt-8">
        {blogPosts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 mb-2">No Articles Found</h2>
            <p className="text-slate-500 text-sm">Please check back later for our latest tax tips and business guides.</p>
          </div>
        ) : (
          <div className="space-y-16">
            
            {/* FEATURED POST (Page 1 only) */}
            {featuredPost && (
              <div className="group relative bg-white rounded-xl overflow-hidden border border-slate-200 shadow-xl hover:shadow-2xl transition-all duration-500 flex flex-col lg:flex-row min-h-[400px]">
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
                    <span>{formatDateSafe(featuredPost.date, 'MMM d, yyyy')}</span>
                    <span className="flex items-center"><Clock className="h-4 w-4 mr-1" /> {featuredPost.readTimeMinutes || 1} min read</span>
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 mb-4 leading-tight group-hover:text-primary transition-colors">
                    <Link href={`/blog/${featuredPost.slug}`} className="before:absolute before:inset-0">
                      {featuredPost.title}
                    </Link>
                  </h2>
                  <p className="text-slate-600 leading-relaxed mb-8 text-lg">
                    {formatExcerpt(featuredPost.excerpt, 160)}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                      <Image src="/images/kevin.jpeg" alt={featuredPost.author || "Kevin Freese"} width={40} height={40} className="object-cover h-full w-full" unoptimized />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{featuredPost.author || "Kevin Freese"}</p>
                      <p className="text-xs font-semibold text-slate-500">Chartered Accountant</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PAGE HEADING (for page 2+) */}
            {safeCurrentPage > 1 && (
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <h2 className="text-2xl font-black text-slate-900">
                  Articles — Page {safeCurrentPage} of {totalPages}
                </h2>
                <span className="text-sm text-slate-500 font-medium">
                  Showing {(safeCurrentPage - 1) * POSTS_PER_PAGE + 1}–{Math.min(safeCurrentPage * POSTS_PER_PAGE, blogPosts.length)} of {blogPosts.length} articles
                </span>
              </div>
            )}

            {/* STANDARD POSTS */}
            {standardPosts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {standardPosts.map(post => (
                  <Card key={post.id} className="group relative flex flex-col overflow-hidden bg-white border border-slate-200 shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1 rounded-xl">
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
                        <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-slate-900 font-bold hover:bg-white">
                          {formatDateSafe(post.date, 'MMM d')}
                        </Badge>
                      </div>
                    </div>
                    <CardHeader className="px-6 pt-6 pb-4">
                      <div className="flex items-center text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">
                        <span className="flex items-center"><Clock className="h-3.5 w-3.5 mr-1" /> {post.readTimeMinutes || 1} min read</span>
                      </div>
                      <h2 className="text-xl font-black text-slate-900 leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        <Link href={`/blog/${post.slug}`} className="before:absolute before:inset-0">{post.title}</Link>
                      </h2>
                    </CardHeader>
                    <CardContent className="px-6 pb-6 flex-grow">
                      <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">
                        {formatExcerpt(post.excerpt, 160)}
                      </p>
                    </CardContent>
                    <CardFooter className="px-6 pb-6 pt-0 mt-auto border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 mt-4">
                        <div className="h-6 w-6 rounded-full overflow-hidden">
                          <Image src="/images/kevin.jpeg" alt={post.author || "Kevin Freese"} width={24} height={24} className="object-cover h-full w-full" unoptimized />
                        </div>
                        <span className="text-xs font-bold text-slate-700">{post.author || "Kevin Freese"}</span>
                      </div>
                      <span className="text-primary mt-4 group-hover:translate-x-1 transition-transform">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}

            {/* PAGINATION CONTROLS */}
            {totalPages > 1 && (
              <nav aria-label="Blog pagination" className="flex flex-wrap items-center justify-center gap-2 pt-8 pb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(safeCurrentPage - 1)}
                  disabled={safeCurrentPage === 1}
                  className="gap-1 font-medium"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </Button>

                <div className="flex items-center gap-1">
                  {paginationItems.map((item, idx) => {
                    if (item === 'ellipsis') {
                      return (
                        <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 select-none">
                          …
                        </span>
                      );
                    }
                    const isCurrent = safeCurrentPage === item;
                    return (
                      <Button
                        key={`page-${item}`}
                        variant={isCurrent ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(item)}
                        aria-current={isCurrent ? 'page' : undefined}
                        aria-label={`Page ${item}`}
                        className={cn(
                          'min-w-[36px] font-semibold',
                          isCurrent && 'pointer-events-none shadow-sm'
                        )}
                      >
                        {item}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(safeCurrentPage + 1)}
                  disabled={safeCurrentPage === totalPages}
                  className="gap-1 font-medium"
                  aria-label="Next page"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </nav>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
