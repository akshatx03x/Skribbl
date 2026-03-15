import { useEffect, useRef, useState } from 'react';
import { useGameStore, socket } from '../store/gameStore';
import { Send, CheckCircle2 } from 'lucide-react';

export default function Chat({ inLobby = false }: { inLobby?: boolean }) {
  const [input, setInput] = useState('');
  const { messages, me, room } = useGameStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const myPlayer = room?.players.find(p => p.id === me?.id);
  const alreadyGuessed = myPlayer?.hasGuessedCorrectly ?? false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || alreadyGuessed) return;
    socket.emit('send_guess', input.trim());
    setInput('');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 0,
      backgroundColor: '#171717',
      overflow: 'hidden',
    }}>
      {/* Header */}
      {!inLobby && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#262626',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          flexShrink: 0,
        }}>
          <h3 style={{
            fontWeight: 700,
            fontSize: '0.7rem',
            color: '#a3a3a3',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            textAlign: 'center',
            margin: 0,
          }}>
            Chat &amp; Guesses
          </h3>
        </div>
      )}

      {/* Messages area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        minHeight: 0,
      }}>
        {messages.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: 'rgba(255,255,255,0.15)',
            fontSize: '0.78rem',
            marginTop: '16px',
          }}>
            No messages yet…
          </div>
        )}

        {messages.map((msg, i) => {
          const isMine = msg.playerId === me?.id;

          /* System message */
          if (msg.isSystem) {
            return (
              <div key={i} style={{
                textAlign: 'center',
                fontSize: '0.7rem',
                padding: '5px 10px',
                margin: '4px 8px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255,255,255,0.04)',
                color: 'rgba(255,255,255,0.4)',
                border: '1px solid rgba(255,255,255,0.07)',
                fontWeight: 600,
                wordBreak: 'break-word',
              }}>
                {msg.message}
              </div>
            );
          }

          /* Correct guess banner */
          if (msg.isCorrectGuess) {
            return (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '10px',
                backgroundColor: 'rgba(34,197,94,0.15)',
                color: '#4ade80',
                border: '1px solid rgba(34,197,94,0.25)',
                fontWeight: 700,
                fontSize: '0.8rem',
                wordBreak: 'break-word',
              }}>
                <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                <span>{msg.playerName} guessed the word!</span>
              </div>
            );
          }

          /* Regular chat bubble */
          return (
            <div key={i} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: isMine ? 'flex-end' : 'flex-start',
              maxWidth: '100%',
            }}>
              {!isMine && (
                <span style={{
                  fontSize: '0.65rem',
                  color: 'rgba(255,255,255,0.35)',
                  marginBottom: '3px',
                  marginLeft: '4px',
                  fontWeight: 500,
                }}>
                  {msg.playerName}
                </span>
              )}
              <div style={{
                maxWidth: '85%',
                padding: '8px 12px',
                borderRadius: isMine ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                backgroundColor: isMine ? '#4f46e5' : '#2a2a2a',
                color: isMine ? '#fff' : '#e5e5e5',
                fontSize: '0.82rem',
                lineHeight: '1.45',
                fontWeight: 500,
                border: isMine ? 'none' : '1px solid rgba(255,255,255,0.06)',
                wordBreak: 'break-word',
                overflowWrap: 'anywhere',
                whiteSpace: 'pre-wrap',
              }}>
                {msg.message}
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div style={{
        padding: '10px',
        backgroundColor: '#262626',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        flexShrink: 0,
      }}>
        {alreadyGuessed ? (
          <div style={{
            width: '100%',
            padding: '12px',
            textAlign: 'center',
            fontSize: '0.82rem',
            color: '#4ade80',
            fontWeight: 700,
            backgroundColor: 'rgba(34,197,94,0.08)',
            borderRadius: '12px',
            border: '1px solid rgba(34,197,94,0.2)',
          }}>
            ✓ You guessed correctly!
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your guess…"
              maxLength={100}
              autoComplete="off"
              style={{
                flex: 1,
                minWidth: 0,
                backgroundColor: '#171717',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '0.82rem',
                color: '#fff',
                outline: 'none',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)')}
              onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              style={{
                flexShrink: 0,
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: input.trim() ? '#4f46e5' : '#2a2a2a',
                color: input.trim() ? '#fff' : 'rgba(255,255,255,0.2)',
                cursor: input.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.15s',
              }}
            >
              <Send size={15} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}