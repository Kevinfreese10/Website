'use client';

import { useAuth } from '@/contexts/AuthContext';
import { toggleLikeQuestion } from '@/app/actions/community';
import LikeButton from './LikeButton';

interface FeedLikeButtonProps {
  questionId: string;
  initialLikesCount: number;
  likedBy: string[];
}

export default function FeedLikeButton({
  questionId,
  initialLikesCount,
  likedBy,
}: FeedLikeButtonProps) {
  const { user } = useAuth();
  const initialIsLiked = user ? likedBy.includes(user.uid) : false;

  const handleLikeToggle = async () => {
    if (!user) return { success: false, error: 'Not authenticated' };
    return toggleLikeQuestion({ questionId, userId: user.uid });
  };

  return (
    <LikeButton
      initialLikesCount={initialLikesCount}
      initialIsLiked={initialIsLiked}
      onLikeToggle={handleLikeToggle}
      disabled={!user}
    />
  );
}
