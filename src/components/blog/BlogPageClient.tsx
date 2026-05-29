'use client';
import Image from 'next/image';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useBlog } from '@/contexts/BlogContext';
import { format } from 'date-fns';

export default function BlogPageClient() {
  const { blogPosts, isLoading } = useBlog();

  return (
    <div className="w-full bg-white flex flex-col min-h-screen animate-in fade-in">
      {/* PREMIUM HERO SECTION */}
      <section className="relative w-full overflow-hidden bg-slate-50 border-b pt-12 pb-16 text-center mb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Badge variant="secondary" className="mb-4 uppercase tracking-wider">Tax Tip Blog</Badge>
          <h1 className="mb-6 text-4xl font-black tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
            Stay Informed & <span className="text-gradient">Tax-Compliant</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg font-medium text-muted-foreground md:text-xl leading-relaxed">
            Get the latest articles, guides, tips, and professional regulatory updates from Kevin Freese and our expert accounting team.
          </p>
        </div>
      </section>
      
      <div className="container mx-auto px-4 pb-12 flex-grow">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map(post => (
              <Card key={post.id} className="flex flex-col overflow-hidden bg-slate-50 border-2 shadow-sm">
                  <Link href={`/blog/${post.slug}`} className="block">
                  <div className="relative h-48 w-full">
                      <Image
                      src={post.imageUrl}
                      alt={post.title}
                      fill
                      className="object-cover"
                      data-ai-hint={post.imageHint}
                      />
                  </div>
                  </Link>
                  <CardHeader>
                  <CardTitle className="leading-tight hover:text-primary transition-colors">
                      <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </CardTitle>
                  <CardDescription>
                      by Kevin Freese (CIBA, SAIT) on {format(new Date(post.date), 'dd/MM/yyyy')}
                  </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                  <p className="text-muted-foreground text-sm leading-relaxed">{post.excerpt}</p>
                  </CardContent>
                  <CardFooter>
                  <Button variant="link" asChild className="p-0 font-bold">
                      <Link href={`/blog/${post.slug}`}>
                      Read More <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                  </Button>
                  </CardFooter>
              </Card>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}