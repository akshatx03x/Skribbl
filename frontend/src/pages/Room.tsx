import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore, socket, type RoomState } from '../store/gameStore';
import Canvas from '../components/Canvas';
import Chat from '../components/Chat';
import PlayerList from '../components/PlayerList';
import WinnerList from '../components/WinnerList';
import { useGameSocket } from '../hooks/useGameSocket';
import { Users, Clock, Hash, Play, LogOut } from 'lucide-react';

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { me, room, setRoom, resetGame, wordHint, myWord, wordChoices } = useGameStore();

  // Prevent accidental back navigation
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useGameSocket();

  const [computedTimeLeft, setComputedTimeLeft] = useState(0);

  useEffect(() => {
    const tick = () => {
      if (room?.turnEndTime) {
        setComputedTimeLeft(Math.max(0, Math.floor((room.turnEndTime - Date.now()) / 1000)));
      } else {
        setComputedTimeLeft(room?.timeLeft || 0);
      }
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [room?.turnEndTime, room?.timeLeft]);

  const isUrgent = computedTimeLeft <= 10;
  const isHost = me?.id === room?.hostId;
  const isDrawer = room?.currentDrawerId === me?.id;
  const drawerName = room?.players.find(p => p.id === room?.currentDrawerId)?.name || 'Someone';

  useEffect(() => {
    const onConnect = () => {
      if (document.visibilityState === 'visible') {
        window.location.reload();
      }
    };
    socket.on('connect', onConnect);
    return () => { socket.off('connect', onConnect); };
  }, []);

  useEffect(() => {
    if (!me) { navigate('/'); return; }
    const onRoomUpdate = (updatedRoom: RoomState) => {
      setRoom(updatedRoom);
      useGameStore.getState().addMessage({
        playerId: 'system',
        playerName: 'System',
        message: '✅ You can start the game!',
        isSystem: true,
      });
    };
    const onError = (msg: string) => { alert(msg); navigate('/'); };
    socket.on('room_state_update', onRoomUpdate);
    socket.on('error_message', onError);
    socket.emit('join_room', { roomId, playerName: me.name });
    return () => {
      socket.off('room_state_update', onRoomUpdate);
      socket.off('error_message', onError);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  useEffect(() => {
    return () => { resetGame(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fireworks = useMemo(() =>
    Array.from({ length: 24 }, (_, i) => ({
      id: i,
      left: `${(i * 4.3 + 2) % 100}%`,
      delay: `${(i * 0.07) % 1.4}s`,
      duration: `${1.3 + (i % 5) * 0.18}s`,
      color: ['#FFD700','#FF6B6B','#4f46e5','#22c55e','#FFD93D','#c77dff'][i % 6],
    })), []);

  /* ── LOADING ──────────────────────────────────────────────────── */
  if (!room) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
          .room-loading { min-height:100vh; min-height:100dvh; background:#0a0a0f; display:flex; align-items:center; justify-content:center; }
          .room-spinner { width:44px; height:44px; border-radius:50%; border:3px solid #ffffff10; border-top-color:#FF6B6B; animation:spin 0.8s linear infinite; }
          @keyframes spin { to { transform:rotate(360deg); } }
        `}</style>
        <div className="room-loading">
          <div className="room-spinner" />
        </div>
      </>
    );
  }

  /* ── LOBBY ──────────────────────────────────────────────────────── */
  if (!room.isGameStarted) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
          *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

          .lobby-root {
            min-height:100vh; min-height:100dvh;
            background:#0a0a0f;
            display:flex; align-items:center; justify-content:center;
            padding:32px 24px;
            font-family:'DM Sans',sans-serif;
            position:relative; overflow:hidden;
          }
          .lobby-root::before {
            content:''; position:fixed; inset:0;
            background-image:radial-gradient(circle,#ffffff08 1px,transparent 1px);
            background-size:32px 32px; pointer-events:none;
          }
          .blob { position:fixed; width:500px; height:500px; border-radius:50%; filter:blur(130px); opacity:0.15; pointer-events:none; }
          .blob-a { top:-140px; left:-100px; background:#FF6B6B; }
          .blob-b { bottom:-120px; right:-80px; background:#4f46e5; }

          .lobby-inner {
            position:relative; z-index:1;
            width:100%; max-width:960px;
            display:flex; gap:20px;
          }
          .lobby-main {
            flex:1;
            background:#13131a; border:1px solid #ffffff15; border-radius:24px;
            padding:32px; box-shadow:0 32px 80px #00000060;
          }
          .lobby-header {
            display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;
            margin-bottom:28px;
          }
          .lobby-title { font-family:'Syne',sans-serif; font-size:1.8rem; font-weight:800; color:#fff; letter-spacing:-0.5px; }
          .lobby-title span { color:#FF6B6B; }
          .room-badge {
            display:flex; align-items:center; gap:8px;
            padding:8px 16px; background:#0d0d14;
            border:1.5px solid #ffffff15; border-radius:12px;
            font-family:'Syne',sans-serif; font-size:1.1rem; font-weight:700; letter-spacing:0.2em; color:#fff;
          }
          .room-badge svg { color:#FF6B6B; }

          .player-grid {
            display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr));
            gap:12px; margin-bottom:28px;
          }
          .player-tile {
            background:#0d0d14; border:1.5px solid #ffffff0e; border-radius:16px;
            padding:20px 12px 16px; display:flex; flex-direction:column; align-items:center; gap:10px;
            position:relative; transition:border-color 0.2s,transform 0.2s;
          }
          .player-tile:hover { border-color:#ffffff22; transform:translateY(-2px); }
          .player-avatar {
            width:54px; height:54px; border-radius:50%;
            background:linear-gradient(135deg,#FF6B6B,#c77dff);
            display:flex; align-items:center; justify-content:center;
            font-family:'Syne',sans-serif; font-size:1.4rem; font-weight:800; color:#fff;
            box-shadow:0 4px 16px #FF6B6B44;
          }
          .player-name { font-size:0.82rem; font-weight:500; color:#ffffffcc; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:100%; }
          .host-badge {
            position:absolute; top:8px; right:8px;
            background:#FFD93D; color:#000;
            font-family:'Syne',sans-serif; font-size:0.55rem; font-weight:800; letter-spacing:0.06em;
            padding:2px 7px; border-radius:99px;
          }
          .empty-tile {
            background:transparent; border:1.5px dashed #ffffff12; border-radius:16px;
            padding:20px 12px 16px; display:flex; flex-direction:column; align-items:center; gap:10px;
            color:#ffffff20;
          }
          .empty-tile svg { opacity:0.4; }
          .empty-label { font-size:0.72rem; color:#ffffff20; }

          .btn-start {
            width:100%; padding:15px; background:#22c55e; border:none; border-radius:14px;
            color:#000; font-family:'Syne',sans-serif; font-size:1rem; font-weight:800; letter-spacing:0.02em;
            cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;
            transition:opacity 0.18s,transform 0.15s,box-shadow 0.2s;
            box-shadow:0 6px 28px #22c55e44;
            min-height:48px; touch-action:manipulation;
          }
          .btn-start:hover { opacity:0.88; transform:translateY(-1px); }
          .btn-start:active { transform:scale(0.97); }
          .btn-start:disabled { background:#1e1e28; color:#ffffff25; box-shadow:none; cursor:not-allowed; transform:none; }

          .waiting-bar {
            width:100%; padding:15px; background:#0d0d14;
            border:1.5px solid #ffffff0e; border-radius:14px;
            color:#ffffff40; font-size:0.88rem; font-weight:500;
            display:flex; align-items:center; justify-content:center; gap:8px;
          }
          .waiting-bar svg { animation:pulse 1.5s ease-in-out infinite; }
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

          .lobby-chat {
            width:300px; flex-shrink:0;
            background:#13131a; border:1px solid #ffffff15; border-radius:24px;
            padding:24px; box-shadow:0 32px 80px #00000060;
            display:flex; flex-direction:column;
          }
          .chat-title { font-family:'Syne',sans-serif; font-size:1rem; font-weight:700; color:#fff; margin-bottom:16px; }
          .chat-title span { color:#FF6B6B; }

          @media (max-width: 768px) {
            .lobby-root { padding: 20px 16px; align-items: flex-start; }
            .lobby-inner { flex-direction: column; gap: 16px; }
            .lobby-main { padding: 24px 20px; border-radius: 18px; }
            .lobby-chat { width: 100%; border-radius: 18px; padding: 20px; }
            .lobby-title { font-size: 1.5rem; }
            .player-grid { grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px; }
            .player-avatar { width: 44px; height: 44px; font-size: 1.1rem; }
            .blob { width: 300px; height: 300px; filter: blur(80px); }
          }

          @media (max-width: 480px) {
            .lobby-root { padding: 16px 12px; }
            .lobby-main { padding: 20px 16px; }
            .lobby-header { margin-bottom: 20px; }
            .lobby-title { font-size: 1.3rem; }
            .room-badge { font-size: 0.9rem; padding: 7px 12px; }
            .player-grid { grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 8px; }
            .player-tile { padding: 14px 8px 12px; border-radius: 12px; }
            .player-avatar { width: 38px; height: 38px; font-size: 1rem; }
            .player-name { font-size: 0.75rem; }
            .lobby-chat { padding: 16px; }
          }

          @media (hover: none) {
            .player-tile:hover { transform: none; }
            .btn-start:hover { opacity: 1; transform: none; }
          }
        `}</style>
        <div className="lobby-root">
          <div className="blob blob-a" />
          <div className="blob blob-b" />
          <div className="lobby-inner">
            <div className="lobby-main">
              <div className="lobby-header">
                <div className="lobby-title">Waiting <span>Room</span></div>
                <div className="room-badge"><Hash size={16} />{room.id}</div>
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
                <button className="btn-start" onClick={() => socket.emit('start_game')} disabled={room.players.length < 2}>
                  <Play size={20} />Launch Game
                </button>
              ) : (
                <div className="waiting-bar"><Clock size={16} />Waiting for the host to start…</div>
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

  /* ── GAME OVER ──────────────────────────────────────────────────── */
  if (room.leaderboard) {
    const sorted = [...room.leaderboard].sort((a, b) => b.score - a.score);
    const winner = sorted[0];

    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
          *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

          .go-root {
            height: 100vh; height: 100dvh; width: 100vw;
            background: #0a0a0f;
            display: flex; align-items: center; justify-content: center;
            font-family: 'DM Sans', sans-serif;
            position: relative; overflow: hidden;
            padding: 16px;
          }
          .go-root::before {
            content: ''; position: fixed; inset: 0;
            background-image: radial-gradient(circle, #ffffff06 1px, transparent 1px);
            background-size: 28px 28px; pointer-events: none;
          }
          .go-blob { position: fixed; border-radius: 50%; filter: blur(120px); pointer-events: none; opacity: 0.12; }
          .go-blob-a { width:600px; height:600px; top:-180px; left:-120px; background:#FFD700; }
          .go-blob-b { width:500px; height:500px; bottom:-140px; right:-100px; background:#4f46e5; }
          .go-blob-c { width:300px; height:300px; top:40%; left:50%; transform:translate(-50%,-50%); background:#FF6B6B; opacity:0.07; }
          .go-fw {
            position: fixed; width:5px; height:5px; border-radius:50%; bottom:-10px;
            animation: goFw linear infinite;
          }
          @keyframes goFw {
            0%   { transform:translateY(0) scale(1); opacity:1; }
            80%  { opacity:0.6; }
            100% { transform:translateY(-105vh) scale(0); opacity:0; }
          }
          .go-card {
            position: relative; z-index: 10;
            background: #13131a; border: 1px solid #ffffff12; border-radius: 28px;
            padding: 40px 48px 36px;
            width: 100%; max-width: 580px;
            box-shadow: 0 40px 100px #00000080;
            animation: goSlide 0.55s cubic-bezier(0.25,0.46,0.45,0.94);
            max-height: calc(100vh - 32px); max-height: calc(100dvh - 32px);
            overflow-y: auto;
          }
          @keyframes goSlide {
            from { opacity:0; transform:scale(0.88) translateY(28px); }
            to   { opacity:1; transform:scale(1) translateY(0); }
          }
          @keyframes goGlow {
            0%,100% { filter:drop-shadow(0 0 14px #FFD700) drop-shadow(0 0 28px #FFA500); }
            50%     { filter:drop-shadow(0 0 24px #FFD700) drop-shadow(0 0 48px #FFA500) drop-shadow(0 0 8px #FF6B6B); }
          }
          .go-trophy { animation: goGlow 2.2s ease-in-out infinite; }
          .go-btn-primary {
            flex: 1; padding: 14px 0;
            background: #22c55e; border: none; border-radius: 14px;
            color: #000; font-family: 'Syne', sans-serif; font-size: 0.95rem; font-weight: 800;
            cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
            transition: opacity 0.15s, transform 0.15s;
            box-shadow: 0 6px 24px #22c55e44;
            min-height: 48px; touch-action: manipulation;
          }
          .go-btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }
          .go-btn-primary:active { transform: scale(0.97); }
          .go-btn-secondary {
            flex: 1; padding: 14px 0;
            background: transparent; border: 1.5px solid #ffffff20; border-radius: 14px;
            color: #ffffffcc; font-family: 'Syne', sans-serif; font-size: 0.95rem; font-weight: 800;
            cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
            transition: border-color 0.15s, background 0.15s, transform 0.15s;
            min-height: 48px; touch-action: manipulation;
          }
          .go-btn-secondary:hover { border-color: #ffffff44; background: #ffffff08; transform: translateY(-1px); }
          .go-btn-secondary:active { transform: scale(0.97); }
          .go-divider {
            height: 1px; background: linear-gradient(90deg, transparent, #ffffff15, transparent);
            margin: 24px 0;
          }
          @media (max-width: 600px) {
            .go-card { padding: 28px 24px 24px; border-radius: 20px; }
            .go-blob-a { width: 320px; height: 320px; filter: blur(80px); }
            .go-blob-b { width: 280px; height: 280px; filter: blur(80px); }
          }
          @media (max-width: 400px) {
            .go-card { padding: 22px 16px 20px; border-radius: 16px; }
            .go-fw:nth-child(n+13) { display: none; }
          }
          @media (hover: none) {
            .go-btn-primary:hover { opacity: 1; transform: none; }
            .go-btn-secondary:hover { border-color: #ffffff20; background: transparent; transform: none; }
          }
        `}</style>

        <div className="go-root">
          <div className="go-blob go-blob-a" />
          <div className="go-blob go-blob-b" />
          <div className="go-blob go-blob-c" />
          {fireworks.map(fw => (
            <div key={fw.id} className="go-fw" style={{
              left: fw.left, background: fw.color,
              animationDelay: fw.delay, animationDuration: fw.duration,
              boxShadow: `0 0 6px 2px ${fw.color}88`,
            }} />
          ))}
          <div className="go-card">
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div className="go-trophy" style={{ fontSize: '3.4rem', lineHeight: 1, marginBottom: 12 }}>🏆</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1.4rem, 5vw, 2rem)', color: '#FFD700', letterSpacing: '-0.5px', marginBottom: 6 }}>
                Game Complete!
              </div>
              {winner && (
                <div style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>
                  🎉 <span style={{ color: '#FFD700', fontWeight: 700 }}>{winner.name}</span> wins with {winner.score} pts
                </div>
              )}
            </div>
            <div className="go-divider" />
            <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>
              Final Standings
            </div>
            <WinnerList leaderboard={sorted} />
            <div className="go-divider" />
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="go-btn-secondary" onClick={() => navigate('/')}>
                <LogOut size={17} />New Game
              </button>
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

        /* ═══════════════════════════════════════════════════════════
           ROOT — fills the entire viewport, nothing overflows
        ═══════════════════════════════════════════════════════════ */
        .game-root {
          height: 100vh;
          height: 100dvh;
          width: 100vw;
          display: flex;
          flex-direction: column;
          background: #0a0a0f;
          font-family: 'DM Sans', sans-serif;
          overflow: hidden;
          color: #fff;
        }

        /* ── TOP BAR ─────────────────────────────────────────────── */
        .topbar {
          height: 52px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          background: #13131a;
          border-bottom: 1px solid #ffffff10;
          gap: 8px;
          /* Never let topbar grow taller */
          overflow: hidden;
        }

        .topbar-left {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .round-info {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .round-label {
          font-size: 0.58rem;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #ffffff35;
          white-space: nowrap;
        }

        .timer-row {
          display: flex;
          align-items: center;
          gap: 5px;
          font-family: 'Syne', sans-serif;
          font-size: 1.2rem;
          font-weight: 800;
          transition: color 0.3s;
        }

        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }

        /* ── CENTRE AREA OF TOPBAR (word / hint / choices) ────────── */
        .topbar-center {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        /* Word choices: pill buttons, scroll if they overflow */
        .word-choices {
          display: flex;
          align-items: center;
          gap: 6px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          max-width: 100%;
          padding: 0 2px;
        }
        .word-choices::-webkit-scrollbar { display: none; }

        .word-choices-label {
          font-size: 0.65rem;
          color: #ffffff40;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          flex-shrink: 0;
        }

        .word-choice-btn {
          padding: 6px 14px;
          background: #FF6B6B;
          border: none;
          border-radius: 99px;
          color: #000;
          font-family: 'Syne', sans-serif;
          font-size: 0.78rem;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: opacity 0.15s, transform 0.15s;
          min-height: 32px;
          touch-action: manipulation;
        }
        .word-choice-btn:hover { opacity: 0.85; }
        .word-choice-btn:active { transform: scale(0.95); }

        /* My word (drawer) */
        .my-word {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          overflow: hidden;
        }
        .my-word-label {
          font-size: 0.65rem;
          color: #ffffff40;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          flex-shrink: 0;
        }
        .my-word-value {
          font-family: 'Syne', sans-serif;
          font-size: clamp(0.9rem, 4vw, 1.4rem);
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #22c55e;
          text-shadow: 0 0 20px #22c55e55;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Word hint (guesser) */
        .hint-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1px;
          min-width: 0;
          overflow: hidden;
        }
        .hint-label {
          font-size: 0.58rem;
          color: #ffffff30;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .hint-letters {
          font-family: 'Syne', sans-serif;
          font-size: clamp(0.9rem, 4vw, 1.5rem);
          font-weight: 800;
          letter-spacing: 0.4em;
          color: #FFD93D;
          text-shadow: 0 0 16px #FFD93D55;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }

        .choosing-text {
          font-size: 0.82rem;
          color: #ffffff50;
          animation: fadepulse 1.4s ease-in-out infinite;
          white-space: nowrap;
        }
        @keyframes fadepulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .room-chip {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          background: #0d0d14;
          border: 1.5px solid #ffffff12;
          border-radius: 9px;
          font-family: 'Syne', sans-serif;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #ffffff80;
          white-space: nowrap;
        }
        .room-chip svg { color: #FF6B6B; }

        /* ═══════════════════════════════════════════════════════════
           GAME BODY — the area under the topbar
        ═══════════════════════════════════════════════════════════ */

        /*
         * DESKTOP / TABLET LANDSCAPE (> 700 px wide):
         *   [ PlayerList ] [ Canvas ] [ Chat ]
         *   All side-by-side, single row.
         */
        .game-body {
          flex: 1;
          min-height: 0;          /* ← critical: allow flex child to shrink */
          display: flex;
          flex-direction: row;
          overflow: hidden;
          padding: 10px;
          gap: 10px;
        }

        .canvas-wrap {
          flex: 1;
          min-width: 0;
          min-height: 0;
          background: #13131a;
          border: 1px solid #ffffff10;
          border-radius: 16px;
          overflow: hidden;
          position: relative;
          box-shadow: 0 8px 40px #00000060;
        }

        .chat-wrap {
          width: 260px;
          flex-shrink: 0;
          min-height: 0;
          background: #13131a;
          border: 1px solid #ffffff10;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 8px 40px #00000060;
        }

        /* ── Reduce chat at medium tablet ────────────────────────── */
        @media (max-width: 900px) {
          .chat-wrap { width: 220px; }
        }

        /* ═══════════════════════════════════════════════════════════
           MOBILE PORTRAIT  ≤ 700 px wide
           Stack:  topbar / canvas / player-row / chat
        ═══════════════════════════════════════════════════════════ */
        @media (max-width: 700px) {

          /* Topbar */
          .topbar {
            height: auto;
            min-height: 48px;
            padding: 6px 10px;
            flex-wrap: nowrap;
          }
          .round-label { display: none; }
          .room-chip   { display: none; }
          .timer-row   { font-size: 1rem; }

          /* Body: column stack */
          .game-body {
            flex-direction: column;
            padding: 6px;
            gap: 6px;
          }

          /* Canvas gets a fixed reasonable height; adjusts with dvh */
          .canvas-wrap {
            /* Take up as much remaining space as possible */
            flex: 1;
            min-height: 180px;
            border-radius: 12px;
          }

          /* Chat pinned to bottom, fixed height */
          .chat-wrap {
            width: 100%;
            height: 170px;
            flex-shrink: 0;
            border-radius: 12px;
          }

          /* PlayerList becomes a horizontal strip — handled below */
        }

        /* ── Extra-small phones (≤ 400 px wide) ─────────────────── */
        @media (max-width: 400px) {
          .topbar { padding: 5px 8px; }
          .timer-row { font-size: 0.95rem; }
          .word-choice-btn { padding: 5px 10px; font-size: 0.72rem; }
          .game-body { padding: 4px; gap: 4px; }
          .chat-wrap { height: 150px; }
        }

        /* ── Landscape phone: side-by-side again ─────────────────── */
        @media (max-width: 700px) and (orientation: landscape) {
          .game-body { flex-direction: row; }
          .canvas-wrap { flex: 1; min-height: 0; }
          .chat-wrap { width: 190px; height: auto; }
        }

        /* ── Suppress hover effects on touch devices ─────────────── */
        @media (hover: none) {
          .word-choice-btn:hover { opacity: 1; transform: none; }
        }

        /* ═══════════════════════════════════════════════════════════
           PLAYER LIST — horizontal scrolling strip on mobile
           (PlayerList component renders inside .player-list-wrap)
        ═══════════════════════════════════════════════════════════ */
        /*
         * On desktop the PlayerList sits as a sidebar column.
         * On mobile (≤700px) we inject a thin horizontal strip
         * between the topbar and the canvas.
         * The PlayerList component itself must be flexible —
         * these wrapper rules handle placement.
         */

        /* Desktop sidebar */
        .player-list-wrap {
          width: 130px;
          flex-shrink: 0;
          min-height: 0;
          background: #13131a;
          border: 1px solid #ffffff10;
          border-radius: 16px;
          overflow-y: auto;
          overflow-x: hidden;
          box-shadow: 0 8px 40px #00000060;
        }

        @media (max-width: 900px) {
          .player-list-wrap { width: 110px; }
        }

        /* Mobile: thin horizontal scrolling strip */
        @media (max-width: 700px) {
          .player-list-wrap {
            width: 100%;
            height: 58px;          /* fixed strip height */
            flex-shrink: 0;
            border-radius: 10px;
            overflow-x: auto;
            overflow-y: hidden;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .player-list-wrap::-webkit-scrollbar { display: none; }
        }

        @media (max-width: 700px) and (orientation: landscape) {
          .player-list-wrap {
            width: 64px;
            height: auto;
            overflow-x: hidden;
            overflow-y: auto;
          }
        }
      `}</style>

      <div className="game-root">

        {/* ── TOP BAR ───────────────────────────────────────────────── */}
        <div className="topbar">
          <div className="topbar-left">
            <div className="round-info">
              <span className="round-label">Round {room.currentRound} / {room.settings.rounds}</span>
              <div className="timer-row">
                <Clock
                  size={16}
                  style={{
                    color: isUrgent ? '#ef4444' : '#FF6B6B',
                    ...(isUrgent ? { animation: 'pulse 0.6s ease-in-out infinite' } : {}),
                  }}
                />
                <span style={{ color: isUrgent ? '#ef4444' : '#FF6B6B' }}>{computedTimeLeft}</span>
              </div>
            </div>
          </div>

          <div className="topbar-center">
            {wordChoices.length > 0 && isDrawer ? (
              <div className="word-choices">
                <span className="word-choices-label">Pick</span>
                {wordChoices.map(w => (
                  <button
                    key={w}
                    className="word-choice-btn"
                    onClick={() => socket.emit('word_selected', w)}
                  >
                    {w}
                  </button>
                ))}
              </div>
            ) : myWord ? (
              <div className="my-word">
                <span className="my-word-label">Draw:</span>
                <span className="my-word-value">{myWord}</span>
              </div>
            ) : wordHint ? (
              <div className="hint-wrap">
                <span className="hint-label">Guess</span>
                <span className="hint-letters">{wordHint.split('').join(' ')}</span>
              </div>
            ) : room.currentDrawerId ? (
              <span className="choosing-text">{drawerName} is picking…</span>
            ) : (
              <span className="choosing-text">Waiting…</span>
            )}
          </div>

          <div className="topbar-right">
            <div className="room-chip"><Hash size={13} />{room.id}</div>
          </div>
        </div>

        {/* ── GAME BODY ─────────────────────────────────────────────── */}
        <div className="game-body">
          {/* Player list — sidebar on desktop, horizontal strip on mobile */}
          <div className="player-list-wrap">
            <PlayerList players={room.players} drawerId={room.currentDrawerId} />
          </div>

          {/* Canvas */}
          <div className="canvas-wrap">
            <Canvas isDrawer={isDrawer} />
          </div>

          {/* Chat */}
          <div className="chat-wrap">
            <Chat />
          </div>
        </div>

      </div>
    </>
  );
}