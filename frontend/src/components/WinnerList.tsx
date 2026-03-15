import type { LeaderboardEntry } from '../types/Leaderboard';
import { Crown, Medal } from 'lucide-react';

interface WinnerListProps {
  leaderboard: LeaderboardEntry[];
}

export default function WinnerList({ leaderboard }: WinnerListProps) {
  // Dense rank for ties
  const ranked: (LeaderboardEntry & { rank: number })[] = [];
  let currentRank = 1;
  let prevScore = -1;
  for (let i = 0; i < leaderboard.length; i++) {
    const player = leaderboard[i];
    if (player.score !== prevScore) currentRank = i + 1;
    ranked.push({ ...player, rank: currentRank });
    prevScore = player.score;
  }

  const rankStyle = (index: number): React.CSSProperties => {
    if (index === 0) return {
      background: 'linear-gradient(135deg, rgba(251,191,36,0.18) 0%, rgba(245,158,11,0.10) 100%)',
      border: '1.5px solid rgba(251,191,36,0.45)',
      boxShadow: '0 4px 32px rgba(251,191,36,0.12)',
    };
    if (index === 1) return {
      background: 'linear-gradient(135deg, rgba(148,163,184,0.14) 0%, rgba(100,116,139,0.08) 100%)',
      border: '1.5px solid rgba(148,163,184,0.35)',
      boxShadow: '0 4px 24px rgba(148,163,184,0.08)',
    };
    if (index === 2) return {
      background: 'linear-gradient(135deg, rgba(217,119,6,0.14) 0%, rgba(180,83,9,0.08) 100%)',
      border: '1.5px solid rgba(217,119,6,0.35)',
      boxShadow: '0 4px 24px rgba(217,119,6,0.08)',
    };
    return {
      background: 'rgba(255,255,255,0.03)',
      border: '1.5px solid rgba(255,255,255,0.08)',
    };
  };

  const RankIcon = ({ index }: { index: number }) => {
    if (index === 0) return (
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: 'linear-gradient(135deg,#fbbf24,#f59e0b)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(251,191,36,0.4)',
        flexShrink: 0,
      }}>
        <Crown size={22} color="#000" strokeWidth={2.5} />
      </div>
    );
    if (index === 1) return (
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: 'linear-gradient(135deg,#94a3b8,#64748b)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(148,163,184,0.3)',
        flexShrink: 0,
      }}>
        <Medal size={22} color="#fff" strokeWidth={2.5} />
      </div>
    );
    if (index === 2) return (
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: 'linear-gradient(135deg,#d97706,#b45309)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(217,119,6,0.3)',
        flexShrink: 0,
      }}>
        <Medal size={20} color="#fff" strokeWidth={2.5} />
      </div>
    );
    return (
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        fontFamily: 'Syne, sans-serif',
        fontWeight: 800, fontSize: '1rem',
        color: 'rgba(255,255,255,0.4)',
      }}>
        #{ranked[index].rank}
      </div>
    );
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: 560,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      {ranked.map((player, index) => (
        <div
          key={player.id}
          style={{
            ...rankStyle(index),
            borderRadius: 16,
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            transition: 'transform 0.2s',
            position: 'relative',
            overflow: 'hidden',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <RankIcon index={index} />

          {/* Name + score */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: '1.1rem',
              color: index === 0 ? '#fbbf24' : index === 1 ? '#cbd5e1' : index === 2 ? '#d97706' : '#ffffff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginBottom: 2,
            }}>
              {player.name}
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: index === 0 ? 'rgba(251,191,36,0.7)' : 'rgba(255,255,255,0.3)',
              letterSpacing: '0.08em',
            }}>
              {player.score} PTS
            </div>
          </div>

          {/* Big score on right */}
          <div style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: '1.5rem',
            color: index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : index === 2 ? '#d97706' : 'rgba(255,255,255,0.25)',
            letterSpacing: '-0.02em',
            flexShrink: 0,
          }}>
            {player.score}
          </div>

          {/* Ping dot for top 3 */}
          {index < 3 && (
            <div style={{
              position: 'absolute', top: 10, right: 10,
              width: 8, height: 8,
              borderRadius: '50%',
              background: index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : '#d97706',
              opacity: 0.7,
              animation: 'ping 1.5s ease-in-out infinite',
            }} />
          )}
        </div>
      ))}

      <style>{`
        @keyframes ping {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.6); opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}