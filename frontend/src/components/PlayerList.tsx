import { type Player } from '../store/gameStore';
import type { LeaderboardEntry } from '../types/Leaderboard';
import { Paintbrush } from 'lucide-react';
import clsx from 'clsx';

interface PlayerListProps {
  players: Player[];
  drawerId?: string | null;
  leaderboard?: LeaderboardEntry[];
  winnerMode?: boolean;
}

export default function PlayerList({ players, drawerId, winnerMode = false }: PlayerListProps) {
  if (winnerMode) {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    
    // Compute dense ranks for ties
    const rankedPlayers: (Player & { rank: number })[] = [];
    let currentRank = 1;
    let prevScore = -1;
    for (let i = 0; i < sortedPlayers.length; i++) {
      const player = sortedPlayers[i];
      if (player.score !== prevScore) {
        currentRank = i + 1;
      }
      rankedPlayers.push({ ...player, rank: currentRank });
      prevScore = player.score;
    }

    return (
      <div className="w-72 flex flex-col gap-3">
        {rankedPlayers.map((player, index) => (
          <div 
            key={player.id}
            className={clsx(
              "p-4 rounded-2xl border-2 flex items-center gap-4 relative overflow-hidden shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all group",
              index === 0 
                ? "bg-gradient-to-r from-yellow-400/30 via-amber-400/30 to-yellow-500/30 border-yellow-500/60 shadow-yellow-500/40"
                : index === 1 
                ? "bg-gradient-to-r from-slate-400/20 to-gray-400/20 border-gray-400/50 shadow-gray-400/30"
                : index === 2 
                ? "bg-gradient-to-r from-orange-500/30 to-amber-500/30 border-orange-500/60 shadow-orange-500/40"
                : "bg-neutral-900/50 border-white/30 shadow-neutral-900/30"
            )}
          >
            <div className="flex-shrink-0 p-3 bg-black/30 backdrop-blur-sm rounded-2xl border border-white/40 shadow-lg">
              {index === 0 ? (
                <span className="text-2xl font-black text-yellow-400 drop-shadow-2xl animate-pulse">🏆</span>
              ) : index === 1 ? (
                <span className="text-xl text-gray-300 drop-shadow-lg">🥈</span>
              ) : index === 2 ? (
                <span className="text-xl text-amber-500 drop-shadow-lg">🥉</span>
              ) : (
                <span className="text-lg font-black text-white">{player.rank}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-xl bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent truncate">
                {player.name}
              </h3>
              <div className="text-2xl font-black text-yellow-400 flex items-baseline gap-1 mt-1">
                {player.score}
                <span className="text-lg font-normal text-yellow-300 tracking-wider">PTS</span>
              </div>
            </div>
            {index < 3 && (
              <div className="absolute top-1 right-1">
                <div className="w-4 h-4 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full blur-sm animate-pulse" />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Game mode (original)
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="w-56 flex flex-col gap-2 shrink-0">
      {sortedPlayers.map((player, index) => {
        const isDrawer = player.id === drawerId;
        const isGuessed = player.hasGuessedCorrectly;
        
        return (
          <div 
            key={player.id} 
            className={clsx(
              "p-3 rounded-xl border flex items-center gap-3 transition-all relative overflow-hidden shadow-md",
              isGuessed ? "bg-green-500/20 border-green-500/30 shadow-green-900/20" 
                : isDrawer ? "bg-indigo-500/20 border-indigo-500/30 shadow-indigo-900/20" 
                : "bg-neutral-800 border-white/5",
              index === 0 && players.length > 1 && player.score > 0 && "ring-2 ring-yellow-500/50 ring-offset-2 ring-offset-neutral-900"
            )}
          >
            <div className="absolute -top-2 -right-2 p-1 opacity-75">
              <span className="font-black text-lg bg-black/50 px-2 py-1 rounded-full text-yellow-400">#{index + 1}</span>
            </div>
            <div className={clsx(
              "w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-lg shrink-0 z-10",
              isGuessed ? "bg-green-600" : isDrawer ? "bg-indigo-600" : "bg-neutral-700"
            )}>
              {player.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0 flex-1 z-10">
              <span className={clsx("font-bold truncate text-sm", isGuessed ? "text-green-300" : "text-neutral-100")}>
                {player.name}
              </span>
              <span className="text-xs font-mono tracking-wider text-neutral-400 flex items-center gap-1">
                {player.score} PTS
              </span>
            </div>
            <div className="shrink-0 flex items-center gap-1 z-10">
              {isDrawer && (
                <div className="p-1.5 bg-indigo-500 text-white rounded-lg shadow-sm" title="Drawing">
                  <Paintbrush size={12} />
                </div>
              )}
              {isGuessed && (
                <div className="p-1.5 bg-green-500 text-white rounded-lg shadow-sm" title="Guessed!">
                  <CheckMark size={12} />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
const CheckMark = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
)
