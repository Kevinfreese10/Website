'use client';
import { Facebook, Twitter, Linkedin, Link2 } from 'lucide-react';
import { SITE_URL } from '@/lib/constants';

export default function ShareWidget({ postTitle, postSlug }: { postTitle: string, postSlug: string }) {
    const handleCopy = () => {
        navigator.clipboard.writeText(`${SITE_URL}/blog/${postSlug}`);
        // Optionally show a toast here in the future
    };

    return (
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Share this article</p>
          <div className="flex items-center gap-3">
            <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`${SITE_URL}/blog/${postSlug}`)}&text=${encodeURIComponent(postTitle)}`} target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-blue-100 hover:text-blue-600 transition-colors">
              <Twitter className="h-4 w-4 fill-current" />
            </a>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${SITE_URL}/blog/${postSlug}`)}`} target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-blue-100 hover:text-blue-700 transition-colors">
              <Facebook className="h-4 w-4 fill-current" />
            </a>
            <a href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(`${SITE_URL}/blog/${postSlug}`)}&title=${encodeURIComponent(postTitle)}`} target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-blue-100 hover:text-blue-800 transition-colors">
              <Linkedin className="h-4 w-4 fill-current" />
            </a>
            <button onClick={handleCopy} className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors" title="Copy Link">
              <Link2 className="h-4 w-4" />
            </button>
          </div>
        </div>
    );
}
