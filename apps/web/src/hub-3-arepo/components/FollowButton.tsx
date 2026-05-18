// @ts-nocheck
// [Ver001.000] Follow/Unfollow button for player cards.
import { useFollows } from '../hooks/useFollows';

interface Props {
  player: { id: number; slug: string; handle: string; game: 'valorant' | 'cs2' };
}

export function FollowButton({ player }: Props) {
  const { follow, unfollow, isFollowing } = useFollows();
  const on = isFollowing(player.id);
  return (
    <button
      onClick={() => on ? unfollow(player.id) : follow(player)}
      style={{
        padding: '3px 10px', borderRadius: '4px', fontSize: '0.75rem',
        border: `1px solid ${on ? '#6366f1' : '#4b5563'}`,
        background: on ? '#6366f1' : 'transparent',
        color: on ? '#fff' : '#9ca3af', cursor: 'pointer',
      }}
    >
      {on ? '✓ Following' : '+ Follow'}
    </button>
  );
}
