import { getCommunityQuestions, getLeaderboard } from '@/app/actions/community';
import { CommunityQuestion } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { MessageSquare, Heart, CheckCircle2, Calendar, Search, Tag, Eye } from 'lucide-react';
import AskQuestionDialog from '@/components/partner/community/AskQuestionDialog';
import LeaderboardWidget from '@/components/partner/community/LeaderboardWidget';
import FeedLikeButton from '@/components/partner/community/FeedLikeButton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

// Force dynamic page rendering for freshness (Next.js App Router)
export const revalidate = 3600;

interface PageProps {
  searchParams: Promise<{
    search?: string;
    tag?: string;
    filter?: 'all' | 'unsolved' | 'solved';
  }>;
}

export default async function CommunityPage({ searchParams }: PageProps) {
  // Await searchParams in Next.js 15
  const resolvedParams = await searchParams;
  const search = resolvedParams.search || '';
  const tag = resolvedParams.tag || '';
  const filter = resolvedParams.filter || 'all';

  // Fetch data
  const { questions = [] } = await getCommunityQuestions({ search, tag, filterType: filter });
  const { leaderboard = [] } = await getLeaderboard();

  // Common tags for quick filter pills
  const popularTags = ['VAT', 'SARS', 'CIPC', 'Income Tax', 'Payroll', 'Accounting', 'Audit'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Premium Gradient Header */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-8 md:p-10 shadow-2xl">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="relative z-10 space-y-3">
          <Badge className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium px-3 py-1 rounded-full text-xs">
            Community Space
          </Badge>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-200">
            Partner Community Q&A
          </h1>
          <p className="text-sm md:text-base text-slate-400 max-w-2xl leading-relaxed">
            Collaborate, share knowledge, and solve client accounting questions together. Answer questions to raise your partner reputation profile.
          </p>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Filters and Feed (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Search & Filter Bar */}
          <div className="bg-card/75 border border-border backdrop-blur-md rounded-2xl p-4 shadow-md space-y-4">
            <form method="GET" className="flex flex-col sm:flex-row gap-3">
              {/* Maintain current filters in form */}
              {tag && <input type="hidden" name="tag" value={tag} />}
              {filter !== 'all' && <input type="hidden" name="filter" value={filter} />}
              
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="search"
                  placeholder="Search questions by keyword or topic..."
                  defaultValue={search}
                  className="pl-10 rounded-xl border-input bg-background/50 focus:ring-primary"
                />
              </div>
              <Button type="submit" className="rounded-xl bg-primary hover:bg-primary/95 text-white">
                Search
              </Button>
              {(search || tag || filter !== 'all') && (
                <Button variant="ghost" asChild className="rounded-xl text-muted-foreground hover:text-foreground">
                  <Link href="/partner/community">Reset</Link>
                </Button>
              )}
            </form>

            {/* Quick Navigation Tabs & Tags */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border/60">
              <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl">
                <Link
                  href={{ pathname: '/partner/community', query: { search, tag, filter: 'all' } }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filter === 'all'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All Questions
                </Link>
                <Link
                  href={{ pathname: '/partner/community', query: { search, tag, filter: 'unsolved' } }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filter === 'unsolved'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Unsolved
                </Link>
                <Link
                  href={{ pathname: '/partner/community', query: { search, tag, filter: 'solved' } }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filter === 'solved'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Solved
                </Link>
              </div>

              {/* Active tag badge indicator */}
              {tag && (
                <div className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 text-xs px-3 py-1.5 rounded-xl font-medium">
                  <Tag className="h-3 w-3" />
                  <span>Filtered: #{tag}</span>
                  <Link href={{ pathname: '/partner/community', query: { search, filter } }} className="hover:text-primary-foreground font-black ml-1 text-xs">
                    ×
                  </Link>
                </div>
              )}
            </div>

            {/* Quick tag pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              <span className="text-[10px] uppercase font-black tracking-wider text-muted-foreground whitespace-nowrap">
                Topics:
              </span>
              {popularTags.map((t) => (
                <Link
                  key={t}
                  href={{
                    pathname: '/partner/community',
                    query: { search, filter, tag: tag === t ? undefined : t },
                  }}
                  className={`text-xs px-3 py-1 rounded-full border transition-all whitespace-nowrap ${
                    tag === t
                      ? 'bg-primary text-white border-primary'
                      : 'bg-background hover:bg-muted border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  #{t}
                </Link>
              ))}
            </div>
          </div>

          {/* Questions Feed */}
          <div className="space-y-4">
            {questions.length === 0 ? (
              <Card className="border-border bg-card/60 backdrop-blur-md rounded-2xl p-10 text-center shadow-md">
                <CardContent className="space-y-4 p-0">
                  <div className="w-16 h-16 bg-muted/65 text-muted-foreground rounded-full flex items-center justify-center mx-auto">
                    <MessageSquare className="h-8 w-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold">No questions found</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-normal">
                      We couldn't find any questions matching your filters. Why not ask one yourself and kick off the conversation?
                    </p>
                  </div>
                  <div className="pt-2 max-w-[200px] mx-auto">
                    <AskQuestionDialog />
                  </div>
                </CardContent>
              </Card>
            ) : (
              questions.map((q: CommunityQuestion) => (
                <Card
                  key={q.id}
                  className={`group border-border hover:border-border/90 bg-card/75 hover:bg-card backdrop-blur-md rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${
                    q.isSolved ? 'border-l-4 border-l-emerald-500' : ''
                  }`}
                >
                  <CardContent className="p-6 space-y-4">
                    {/* Header: Author + Timestamp */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-indigo-500/10 text-indigo-500 text-[10px] font-bold flex items-center justify-center uppercase">
                          {q.authorName[0]}
                        </div>
                        <span className="font-semibold text-foreground">{q.authorName}</span>
                        <span className="text-muted-foreground/50">•</span>
                        <span className="capitalize text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted">
                          {q.authorRole.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDistanceToNow(new Date(q.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>

                    {/* Title and content preview */}
                    <div className="space-y-2">
                      <Link href={`/partner/community/${q.id}`} className="block">
                        <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                          {q.title}
                        </h2>
                      </Link>
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {q.content}
                      </p>
                    </div>

                    {/* Footer: Tags, stats & Solution Indicator */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/40">
                      {/* Tags */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {q.tags.map((t: string) => (
                          <Link
                            key={t}
                            href={{ pathname: '/partner/community', query: { tag: t } }}
                            className="text-[10px] bg-muted hover:bg-primary/10 border border-border/80 hover:border-primary/20 text-muted-foreground hover:text-primary px-2.5 py-1 rounded-md font-medium transition-all"
                          >
                            #{t}
                          </Link>
                        ))}
                      </div>

                      {/* Stats badges */}
                      <div className="flex items-center gap-3 text-muted-foreground">
                        {q.isSolved && (
                          <span className="flex items-center gap-1 text-xs text-emerald-500 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                            <CheckCircle2 className="h-3.5 w-3.5 fill-emerald-500 text-emerald-500" />
                            <span>Solved</span>
                          </span>
                        )}
                        <FeedLikeButton 
                          questionId={q.id} 
                          initialLikesCount={q.likesCount} 
                          likedBy={q.likedBy || []} 
                        />
                        <span className="flex items-center gap-1 text-xs hover:text-foreground">
                          <MessageSquare className="h-4 w-4" />
                          <span className="font-mono">{q.answersCount}</span>
                        </span>
                        <Button variant="ghost" size="sm" asChild className="rounded-xl h-8 text-xs font-semibold gap-1 hover:text-primary">
                          <Link href={`/partner/community/${q.id}`}>
                            <Eye className="h-3.5 w-3.5" />
                            View Thread
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Widgets (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Ask Question Widget wrapper */}
          <div className="bg-card/75 border border-border backdrop-blur-md rounded-2xl p-5 shadow-md text-center space-y-4">
            <h3 className="font-bold text-base">Have a question?</h3>
            <p className="text-xs text-muted-foreground leading-normal">
              Ask other professionals in the partner community. Share details and tag topics to get fast replies.
            </p>
            <AskQuestionDialog />
          </div>

          {/* Leaderboard Widget */}
          <LeaderboardWidget users={leaderboard} />

          {/* Rep points system info */}
          <Card className="border-border bg-card/65 backdrop-blur-md rounded-2xl shadow-md p-5">
            <h4 className="text-sm font-bold flex items-center gap-1.5 text-primary mb-2">
              <span className="w-1.5 h-4 bg-primary rounded-full inline-block" />
              Reputation System
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              Unlock tags and rise on the community rankings board by helping other members:
            </p>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li className="flex justify-between items-center bg-muted/40 p-2 rounded-lg">
                <span>Like on your Answer:</span>
                <span className="font-bold font-mono text-emerald-500">+5 pts</span>
              </li>
              <li className="flex justify-between items-center bg-muted/40 p-2 rounded-lg">
                <span>Marked as Correct Solution:</span>
                <span className="font-bold font-mono text-emerald-500">+15 pts</span>
              </li>
              <li className="flex justify-between items-center bg-muted/40 p-2 rounded-lg">
                <span>Giving an Answer:</span>
                <span className="font-bold font-mono text-emerald-500">+2 pts</span>
              </li>
              <li className="flex justify-between items-center bg-muted/40 p-2 rounded-lg">
                <span>Asking a Question:</span>
                <span className="font-bold font-mono text-emerald-500">+1 pt</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
