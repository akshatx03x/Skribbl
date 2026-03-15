import { type Player } from '../store/gameStore';
import { Paintbrush } from 'lucide-react';
import clsx from 'clsx';

interface PlayerListProps {
  players: Player[];
  drawerId: string | null;
}

export default function PlayerList({ players, drawerId }: PlayerListProps) {
  // Sort players by score
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="w-56 flex flex-col gap-2 shrink-0">
      {sortedPlayers.map((player, index) => {
        const isDrawer = player.id === drawerId;
        
        return (
          <div 
            key={player.id} 
            className={clsx(
              "p-3 rounded-xl border flex items-center gap-3 transition-all relative overflow-hidden shadow-md",
              player.hasGuessedCorrectly 
                ? "bg-green-500/20 border-green-500/30 shadow-green-900/20" 
                : isDrawer
                  ? "bg-indigo-500/20 border-indigo-500/30 shadow-indigo-900/20"
                  : "bg-neutral-800 border-white/5",
              index === 0 && players.length > 1 && player.score > 0 && "ring-1 ring-yellow-500/50"
            )}
          >
            {/* Rank Indicator */}
            <div className="absolute top-0 right-0 p-1 opacity-20">
               <span className="font-bold text-2xl italic pl-2">#{index + 1}</span>
            </div>

            <div className={clsx(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-inner shrink-0 z-10",
                player.hasGuessedCorrectly ? "bg-green-600" : isDrawer ? "bg-indigo-600" : "bg-neutral-700"
            )}>
                {player.name.charAt(0).toUpperCase()}
            </div>
            
            <div className="flex flex-col min-w-0 flex-1 z-10">
              <span className={clsx("font-bold truncate text-sm", player.hasGuessedCorrectly ? "text-green-400" : "text-neutral-200")}>
                {player.name}
              </span>
              <span className="text-xs font-medium text-neutral-400 font-mono tracking-wider flex items-center gap-1">
                 {player.score} PTS
              </span>
            </div>

            {/* Badges */}
            <div className="shrink-0 flex items-center z-10 gap-1">
                {isDrawer && (
                  <div className="p-1.5 bg-indigo-500 text-white rounded-md shadow-sm" title="Drawing Now">
                    <Paintbrush size={14} />
                  </div>
                )}
                {player.hasGuessedCorrectly && (
                  <div className="p-1.5 bg-green-500 text-white rounded-md shadow-sm" title="Guessed Correctly">
                    <CheckMark size={14} />
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
