import { useEffect, useRef, useState } from 'react';
import { useGameStore, socket } from '../store/gameStore';
import { Send, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

export default function Chat({ inLobby = false }: { inLobby?: boolean }) {
  const [input, setInput] = useState('');
  const { messages, me, room } = useGameStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // The only player who cannot type is one who already guessed correctly
  // (they'd reveal the word to others). The drawer CAN type — their messages
  // go to chat via Game.handleMessage on the server.
  const myPlayer = room?.players.find(p => p.id === me?.id);
  const alreadyGuessed = myPlayer?.hasGuessedCorrectly ?? false;
  const isInputDisabled = alreadyGuessed;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isInputDisabled) return;
    socket.emit('send_guess', input.trim());
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900">
      {!inLobby && (
        <div className="p-3 bg-neutral-800 border-b border-white/5 shadow-sm z-10">
          <h3 className="font-bold text-sm text-neutral-300 uppercase tracking-widest text-center">
            Chat &amp; Guesses
          </h3>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-2 font-medium text-sm">
        {messages.map((msg, i) => {
          const isMine = msg.playerId === me?.id;

          if (msg.isSystem) {
            return (
              <div
                key={i}
                className="text-center text-xs p-1.5 my-2 rounded-lg bg-white/5 text-white/50 border border-white/10 font-bold mx-4 shadow-sm"
              >
                {msg.message}
              </div>
            );
          }

          if (msg.isCorrectGuess) {
            return (
              <div
                key={i}
                className="flex items-center gap-2 p-2 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 font-bold max-w-[90%] w-fit shadow-md"
              >
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{msg.playerName} guessed the word!</span>
              </div>
            );
          }

          return (
            <div
              key={i}
              className={clsx(
                'flex flex-col max-w-[90%]',
                isMine ? 'ml-auto items-end' : 'mr-auto items-start'
              )}
            >
              {!isMine && (
                <span className="text-xs text-white/40 mb-1 ml-1">{msg.playerName}</span>
              )}
              <div
                className={clsx(
                  'px-3 py-2 rounded-2xl break-words whitespace-pre-wrap shadow-sm text-sm',
                  isMine
                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                    : 'bg-neutral-800 text-neutral-200 border border-white/5 rounded-tl-sm'
                )}
              >
                {msg.message}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 bg-neutral-800 border-t border-white/5 shrink-0">
        {alreadyGuessed ? (
          <div className="w-full py-3 text-center text-sm text-green-400 font-bold bg-green-500/10 rounded-xl border border-green-500/20">
            ✓ You guessed correctly!
          </div>
        ) : (
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your guess here..."
              className="w-full bg-neutral-900 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner"
              maxLength={100}
              autoComplete="off"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg transition-colors shadow-md disabled:opacity-50"
              disabled={!input.trim()}
            >
              <Send size={16} />
            </button>
          </div>
        )}
      </form>
    </div>
  );
}