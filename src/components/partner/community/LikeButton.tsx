'use client';

import { useState, useTransition } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface LikeButtonProps {
  initialLikesCount: number;
  initialIsLiked: boolean;
  onLikeToggle: () => Promise<any>;
  disabled?: boolean;
}

export default function LikeButton({
  initialLikesCount,
  initialIsLiked,
  onLikeToggle,
  disabled = false,
}: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isPending, startTransition] = useTransition();

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || isPending) return;

    // Optimistic UI updates
    const nextIsLiked = !isLiked;
    setIsLiked(nextIsLiked);
    setLikesCount((prev) => (nextIsLiked ? prev + 1 : prev - 1));

    startTransition(async () => {
      try {
        const res = await onLikeToggle();
        if (!res?.success) {
          // Rollback on failure
          setIsLiked(isLiked);
          setLikesCount(likesCount);
        }
      } catch (err) {
        // Rollback on error
        setIsLiked(isLiked);
        setLikesCount(likesCount);
      }
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={disabled}
      onClick={handleLike}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 active:scale-90 select-none",
        isLiked 
          ? "text-rose-500 bg-rose-500/10 hover:bg-rose-500/15" 
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-all duration-300",
          isLiked ? "fill-rose-500 stroke-rose-500 scale-110 animate-glow-pulse" : "scale-100"
        )}
      />
      <span className="font-mono">{likesCount}</span>
    </Button>
  );
}
