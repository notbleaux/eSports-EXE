// [Ver001.000] Player follow system — localStorage persistence.
import { useState, useCallback } from 'react';

const KEY = 'njz_followed_players';

export interface FollowedPlayer {
  id: number; slug: string; handle: string;
  game: 'valorant' | 'cs2'; followedAt: string;
}

export function useFollows() {
  const [followed, setFollowed] = useState<FollowedPlayer[]>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); }
    catch { return []; }
  });

  const follow = useCallback((p: Omit<FollowedPlayer, 'followedAt'>) => {
    setFollowed(prev => {
      if (prev.some(x => x.id === p.id)) return prev;
      const next = [...prev, { ...p, followedAt: new Date().toISOString() }];
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const unfollow = useCallback((id: number) => {
    setFollowed(prev => {
      const next = prev.filter(p => p.id !== id);
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isFollowing = useCallback(
    (id: number) => followed.some(p => p.id === id), [followed]
  );

  return { followed, follow, unfollow, isFollowing, count: followed.length };
}
