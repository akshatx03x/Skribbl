import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore, socket, type RoomState } from '../store/gameStore';
import Canvas from '../components/Canvas';
import Chat from '../components/Chat';
import PlayerList from '../components/PlayerList';
import { useGameSocket } from '../hooks/useGameSocket';
import { Users, Clock, Hash, Play } from 'lucide-react';

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { me, room, setRoom, wordHint, myWord, wordChoices } = useGameStore();

  useGameSocket();

  useEffect(() => {
    if (!me) { navigate('/'); return; }

    const onRoomUpdate = (updatedRoom: RoomState) => setRoom(updatedRoom);
    const onError = (msg: string) => { alert(msg); navigate('/'); };

    socket.on('room_state_update', onRoomUpdate);
    socket.on('error_message', onError);

    if (!room) socket.emit('join_room', { roomId, playerName: me.name });

    return () => {
      socket.off('room_state_update', onRoomUpdate);
      socket.off('error_message', onError);
    };
  }, [me, navigate, roomId, room, setRoom]);

  if (!room) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
          .loading-screen {
            min-height: 100vh; background: #0a0a0f;
            display: flex; align-items: center; justify-content: center;
            font-family: 'Syne', sans-serif;
          }
          .spinner {
            width: 44px; height: 44px; border-radius: 50%;
            border: 3px solid #ffffff10; border-top-color: #FF6B6B;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
        <div className="loading-screen"><div className="spinner" /></div>
      </>
    );
  }

  const isHost = me?.id === room.hostId;
  const isDrawer = room.currentDrawerId === me?.id;
  const drawerName = room.players.find(p => p.id === room.currentDrawerId)?.name || 'Someone';
  const isUrgent = room.timeLeft <= 10;

  /* ── LOBBY ─────────────────────────────────────────────────────── */
  if (!room.isGameStarted) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

          .lobby-root {
            min-height: 100vh;
            background: #0a0a0f;
            display: flex; align-items: center; justify-content: center;
            padding: 32px 24px;
            font-family: 'DM Sans', sans-serif;
            position: relative; overflow: hidden;
          }
          .lobby-root::before {
            content: '';
            position: fixed; inset: 0;
            background-image: radial-gradient(circle, #ffffff08 1px, transparent 1px);
            background-size: 32px 32px;
            pointer-events: none;
          }
          .blob {
            position: fixed; width: 500px; height: 500px;
            border-radius: 50%; filter: blur(130px); opacity: 0.15; pointer-events: none;
          }
          .blob-a { top: -140px; left: -100px; background: #FF6B6B; }
          .blob-b { bottom: -120px; right: -80px; background: #4f46e5; }

          .lobby-inner {
            position: relative; z-index: 1;
            width: 100%; max-width: 960px;
            display: flex; gap: 20px;
          }

          /* Left panel */
          .lobby-main {
            flex: 1;
            background: #13131a;
            border: 1px solid #ffffff15;
            border-radius: 24px;
            padding: 32px;
            box-shadow: 0 32px 80px #00000060;
          }

          .lobby-header {
            display: flex; align-items: center; justify-content: space-between;
            margin-bottom: 28px;
          }
          .lobby-title {
            font-family: 'Syne', sans-serif;
            font-size: 1.8rem; font-weight: 800;
            color: #fff; letter-spacing: -0.5px;
          }
          .lobby-title span { color: #FF6B6B; }

          .room-badge {
            display: flex; align-items: center; gap-8px;
            gap: 8px;
            padding: 8px 16px;
            background: #0d0d14;
            border: 1.5px solid #ffffff15;
            border-radius: 12px;
            font-family: 'Syne', sans-serif;
            font-size: 1.1rem; font-weight: 700;
            letter-spacing: 0.2em; color: #fff;
          }
          .room-badge svg { color: #FF6B6B; }

          /* Player grid */
          .player-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
            gap: 12px;
            margin-bottom: 28px;
          }

          .player-tile {
            background: #0d0d14;
            border: 1.5px solid #ffffff0e;
            border-radius: 16px;
            padding: 20px 12px 16px;
            display: flex; flex-direction: column; align-items: center;
            gap: 10px;
            position: relative;
            transition: border-color 0.2s, transform 0.2s;
          }
          .player-tile:hover { border-color: #ffffff22; transform: translateY(-2px); }

          .player-avatar {
            width: 54px; height: 54px; border-radius: 50%;
            background: linear-gradient(135deg, #FF6B6B, #c77dff);
            display: flex; align-items: center; justify-content: center;
            font-family: 'Syne', sans-serif;
            font-size: 1.4rem; font-weight: 800; color: #fff;
            box-shadow: 0 4px 16px #FF6B6B44;
          }
          .player-name {
            font-size: 0.82rem; font-weight: 500;
            color: #ffffffcc; text-align: center;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            width: 100%;
          }
          .host-badge {
            position: absolute; top: 8px; right: 8px;
            background: #FFD93D; color: #000;
            font-family: 'Syne', sans-serif;
            font-size: 0.55rem; font-weight: 800;
            letter-spacing: 0.06em;
            padding: 2px 7px; border-radius: 99px;
          }

          .empty-tile {
            background: transparent;
            border: 1.5px dashed #ffffff12;
            border-radius: 16px;
            padding: 20px 12px 16px;
            display: flex; flex-direction: column; align-items: center;
            gap: 10px;
            color: #ffffff20;
          }
          .empty-tile svg { opacity: 0.4; }
          .empty-label { font-size: 0.72rem; color: #ffffff20; }

          /* Buttons */
          .btn-start {
            width: 100%; padding: 15px;
            background: #22c55e;
            border: none; border-radius: 14px;
            color: #000;
            font-family: 'Syne', sans-serif;
            font-size: 1rem; font-weight: 800;
            letter-spacing: 0.02em;
            cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 8px;
            transition: opacity 0.18s, transform 0.15s, box-shadow 0.2s;
            box-shadow: 0 6px 28px #22c55e44;
          }
          .btn-start:hover { opacity: 0.88; transform: translateY(-1px); }
          .btn-start:active { transform: scale(0.97); }
          .btn-start:disabled {
            background: #1e1e28; color: #ffffff25;
            box-shadow: none; cursor: not-allowed; transform: none;
          }

          .waiting-bar {
            width: 100%; padding: 15px;
            background: #0d0d14;
            border: 1.5px solid #ffffff0e;
            border-radius: 14px;
            color: #ffffff40;
            font-size: 0.88rem; font-weight: 500;
            display: flex; align-items: center; justify-content: center; gap: 8px;
          }
          .waiting-bar svg { animation: pulse 1.5s ease-in-out infinite; }
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

          /* Right panel — chat */
          .lobby-chat {
            width: 300px;
            background: #13131a;
            border: 1px solid #ffffff15;
            border-radius: 24px;
            padding: 24px;
            box-shadow: 0 32px 80px #00000060;
            display: flex; flex-direction: column;
          }
          .chat-title {
            font-family: 'Syne', sans-serif;
            font-size: 1rem; font-weight: 700;
            color: #fff; margin-bottom: 16px;
          }
          .chat-title span { color: #FF6B6B; }
        `}</style>

        <div className="lobby-root">
          <div className="blob blob-a" />
          <div className="blob blob-b" />

          <div className="lobby-inner">
            <div className="lobby-main">
              <div className="lobby-header">
                <div className="lobby-title">
                  Waiting <span>Room</span>
                </div>
                <div className="room-badge">
                  <Hash size={16} />
                  {room.id}
                </div>
              </div>

              <div className="player-grid">
                {room.players.map((p) => (
                  <div key={p.id} className="player-tile">
                    <div className="player-avatar">{p.name.charAt(0).toUpperCase()}</div>
                    <span className="player-name">{p.name}</span>
                    {p.id === room.hostId && <span className="host-badge">HOST</span>}
                  </div>
                ))}
                {Array.from({ length: Math.max(0, room.settings.maxPlayers - room.players.length) }).map((_, i) => (
                  <div key={`empty-${i}`} className="empty-tile">
                    <Users size={28} />
                    <span className="empty-label">Open slot</span>
                  </div>
                ))}
              </div>

              {isHost ? (
                <button
                  className="btn-start"
                  onClick={() => socket.emit('start_game')}
                  disabled={room.players.length < 2}
                >
                  <Play size={20} />
                  Launch Game
                </button>
              ) : (
                <div className="waiting-bar">
                  <Clock size={16} />
                  Waiting for the host to start…
                </div>
              )}
            </div>

            <div className="lobby-chat">
              <div className="chat-title">Lobby <span>Chat</span></div>
              <Chat inLobby={true} />
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ── GAME ───────────────────────────────────────────────────────── */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .game-root {
          height: 100vh; display: flex; flex-direction: column;
          background: #0a0a0f;
          font-family: 'DM Sans', sans-serif;
          overflow: hidden; color: #fff;
        }

        /* Top bar */
        .topbar {
          height: 60px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 20px;
          background: #13131a;
          border-bottom: 1px solid #ffffff10;
        }

        .topbar-left { display: flex; align-items: center; gap: 16px; }

        .round-info {
          display: flex; flex-direction: column;
          gap: 1px;
        }
        .round-label {
          font-size: 0.62rem; font-weight: 500;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: #ffffff35;
        }
        .timer-row {
          display: flex; align-items: center; gap-6px;
          gap: 6px;
          font-family: 'Syne', sans-serif;
          font-size: 1.3rem; font-weight: 800;
          color: ${isUrgent ? '#ef4444' : '#FF6B6B'};
          transition: color 0.3s;
        }
        .timer-row svg {
          ${isUrgent ? 'animation: pulse 0.6s ease-in-out infinite;' : ''}
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }

        .topbar-center { flex: 1; display: flex; justify-content: center; align-items: center; }

        .word-choices {
          display: flex; align-items: center; gap: 10px;
          background: #13131a;
          border: 1px solid #ffffff15;
          border-radius: 14px;
          padding: 8px 16px;
        }
        .word-choices-label {
          font-size: 0.7rem; color: #ffffff40;
          letter-spacing: 0.08em; text-transform: uppercase;
          margin-right: 4px;
        }
        .word-choice-btn {
          padding: 7px 18px;
          background: #FF6B6B;
          border: none; border-radius: 10px;
          color: #000;
          font-family: 'Syne', sans-serif;
          font-size: 0.82rem; font-weight: 800;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.15s;
        }
        .word-choice-btn:hover { opacity: 0.85; transform: translateY(-1px); }

        .my-word {
          display: flex; align-items: center; gap: 10px;
        }
        .my-word-label {
          font-size: 0.72rem; color: #ffffff40;
          text-transform: uppercase; letter-spacing: 0.1em;
        }
        .my-word-value {
          font-family: 'Syne', sans-serif;
          font-size: 1.5rem; font-weight: 800;
          letter-spacing: 0.05em; text-transform: uppercase;
          color: #22c55e;
          text-shadow: 0 0 20px #22c55e55;
        }

        .hint-wrap { display: flex; flex-direction: column; align-items: center; gap: 2px; }
        .hint-label {
          font-size: 0.6rem; color: #ffffff30;
          text-transform: uppercase; letter-spacing: 0.12em;
        }
        .hint-letters {
          font-family: 'Syne', sans-serif;
          font-size: 1.6rem; font-weight: 800;
          letter-spacing: 0.45em;
          color: #FFD93D;
          text-shadow: 0 0 16px #FFD93D55;
        }

        .choosing-text {
          font-size: 0.88rem; color: #ffffff50;
          animation: fadepulse 1.4s ease-in-out infinite;
        }
        @keyframes fadepulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

        .topbar-right { display: flex; align-items: center; gap: 8px; }
        .room-chip {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 12px;
          background: #0d0d14;
          border: 1.5px solid #ffffff12;
          border-radius: 10px;
          font-family: 'Syne', sans-serif;
          font-size: 0.82rem; font-weight: 700;
          letter-spacing: 0.12em; color: #ffffff80;
        }
        .room-chip svg { color: #FF6B6B; }

        /* Main area */
        .game-body {
          flex: 1; display: flex; overflow: hidden;
          padding: 12px; gap: 12px;
        }

        .canvas-wrap {
          flex: 1; min-width: 0;
          background: #13131a;
          border: 1px solid #ffffff10;
          border-radius: 18px;
          overflow: hidden;
          position: relative;
          box-shadow: 0 8px 40px #00000060;
        }

        .chat-wrap {
          width: 288px; flex-shrink: 0;
          background: #13131a;
          border: 1px solid #ffffff10;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 8px 40px #00000060;
        }
      `}</style>

      <div className="game-root">
        {/* Top bar */}
        <div className="topbar">
          <div className="topbar-left">
            <div className="round-info">
              <span className="round-label">Round {room.currentRound} / {room.settings.rounds}</span>
              <div className="timer-row">
                <Clock size={18} style={{ color: isUrgent ? '#ef4444' : '#FF6B6B', ...(isUrgent ? { animation: 'pulse 0.6s ease-in-out infinite' } : {}) }} />
                <span style={{ color: isUrgent ? '#ef4444' : '#FF6B6B' }}>{room.timeLeft}</span>
              </div>
            </div>
          </div>

          <div className="topbar-center">
            {wordChoices.length > 0 && isDrawer ? (
              <div className="word-choices">
                <span className="word-choices-label">Pick a word</span>
                {wordChoices.map(w => (
                  <button key={w} className="word-choice-btn" onClick={() => socket.emit('word_selected', w)}>
                    {w}
                  </button>
                ))}
              </div>
            ) : myWord ? (
              <div className="my-word">
                <span className="my-word-label">Draw this:</span>
                <span className="my-word-value">{myWord}</span>
              </div>
            ) : wordHint ? (
              <div className="hint-wrap">
                <span className="hint-label">Guess the word</span>
                <span className="hint-letters">{wordHint.split('').join(' ')}</span>
              </div>
            ) : room.currentDrawerId ? (
              <span className="choosing-text">{drawerName} is picking a word…</span>
            ) : (
              <span className="choosing-text">Waiting…</span>
            )}
          </div>

          <div className="topbar-right">
            <div className="room-chip">
              <Hash size={14} />
              {room.id}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="game-body">
          <PlayerList players={room.players} drawerId={room.currentDrawerId} />

          <div className="canvas-wrap">
            <Canvas isDrawer={isDrawer} />
          </div>

          <div className="chat-wrap">
            <Chat />
          </div>
        </div>
      </div>
    </>
  );
}