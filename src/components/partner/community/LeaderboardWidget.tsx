'use client';

import { Trophy, Award, Star, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface LeaderboardUser {
  id: string;
  name: string;
  companyName?: string;
  communityPoints: number;
  questionsCount: number;
  answersCount: number;
  solutionsCount: number;
}

interface LeaderboardWidgetProps {
  users: LeaderboardUser[];
}

export default function LeaderboardWidget({ users }: LeaderboardWidgetProps) {
  // Helper to determine role badges or levels
  const getReputationBadge = (points: number) => {
    if (points >= 500) {
      return {
        label: 'Gold Expert',
        classes: 'bg-gradient-to-r from-amber-500/10 to-yellow-600/10 text-yellow-600 border-yellow-500/20',
      };
    }
    if (points >= 100) {
      return {
        label: 'Silver Advisor',
        classes: 'bg-gradient-to-r from-slate-400/10 to-slate-500/10 text-slate-500 border-slate-400/20',
      };
    }
    return {
      label: 'Bronze Helper',
      classes: 'bg-gradient-to-r from-amber-700/10 to-amber-800/10 text-amber-700 border-amber-800/20',
    };
  };

  return (
    <Card className="w-full border-border bg-card/65 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-b from-muted/50 to-transparent">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500 animate-bounce" />
          <span>Top Contributors</span>
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Earn points by asking and answering questions to rise in ranks.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {users.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No contributions yet. Start the conversation!
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {users.slice(0, 5).map((item, index) => {
              const rank = index + 1;
              const badge = getReputationBadge(item.communityPoints);

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors"
                >
                  {/* Rank Badge */}
                  <div className="flex items-center justify-center w-6 h-6 font-bold text-xs">
                    {rank === 1 ? (
                      <Trophy className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    ) : rank === 2 ? (
                      <Award className="h-5 w-5 text-slate-400 fill-slate-400" />
                    ) : rank === 3 ? (
                      <Award className="h-5 w-5 text-amber-700 fill-amber-700" />
                    ) : (
                      <span className="text-muted-foreground">#{rank}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-9 w-9 border border-border/80">
                    <AvatarFallback className="bg-gradient-to-tr from-muted to-muted/80 text-xs font-semibold">
                      {item.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>

                  {/* User Stats Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-semibold truncate text-foreground">
                        {item.name}
                      </p>
                      <span className="text-xs font-black font-mono text-primary flex items-center gap-0.5">
                        <Flame className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
                        {item.communityPoints}
                      </span>
                    </div>
                    {item.companyName && (
                      <p className="text-[10px] text-muted-foreground truncate">
                        {item.companyName}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0", badge.classes)}>
                        {badge.label}
                      </Badge>
                      {item.solutionsCount > 0 && (
                        <span className="text-[9px] text-emerald-500 font-medium flex items-center gap-0.5">
                          <Star className="h-2.5 w-2.5 fill-emerald-500" />
                          {item.solutionsCount} Solved
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
