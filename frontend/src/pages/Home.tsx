import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore, socket } from '../store/gameStore';

const FLOATING_ICONS = ['✏️', '🎨', '🖌️', '🎯', '⭐', '💡', '🖍️', '🎪'];
const PLAYER_TICKER = ['Alex is drawing...', 'Sam guessed it!', 'Jordan joined', 'Riley scored 340pts', 'Casey is drawing...', 'Morgan guessed it!'];

export default function Home() {
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setMe = useGameStore((state) => state.setMe);

  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [tickerIdx, setTickerIdx] = useState(0);

  useEffect(() => {
    const onConnect = () => setStatus('connected');
    const onDisconnect = () => setStatus('error');
    const onConnectError = () => setStatus('error');

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTickerIdx(i => (i + 1) % PLAYER_TICKER.length), 2800);
    return () => clearInterval(id);
  }, []);

  const handleCreateRoom = async () => {
    if (status !== 'connected') { setError('Server not connected'); return; }
    if (!name.trim()) { setError('Enter a nickname first'); return; }
    setError('');
    setMe(name, socket.id!);
    return new Promise<void>((resolve) => {
      socket.once('room_created', (data: { roomId: string }) => { navigate(`/room/${data.roomId}`); resolve(); });
      socket.once('error_message', (msg) => { setError(msg); resolve(); });
      socket.emit('create_room', { playerName: name });
    });
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== 'connected') { setError('Server not connected'); return; }
    if (!name.trim() || !roomId.trim()) { setError('Enter your name and room code'); return; }
    setError('');
    const joinId = roomId.trim().toUpperCase();
    setMe(name, socket.id!);
    return new Promise<void>((resolve) => {
      socket.once('room_state_update', () => { navigate(`/room/${joinId}`); resolve(); });
      socket.once('error_message', (msg) => { setError(msg); resolve(); });
      socket.emit('join_room', { roomId: joinId, playerName: name });
    });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --accent: #FF6B6B;
          --accent-glow: #ff6b6b55;
          --indigo: #4f46e5;
          --indigo-glow: #4f46e530;
          --green: #22c55e;
          --yellow: #facc15;
        }

        .home-root {
          min-height: 100vh;
          min-height: 100dvh;
          background: #0a0a0f;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* ── Dot grid ── */
        .home-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: radial-gradient(circle, #ffffff0a 1px, transparent 1px);
          background-size: 32px 32px;
          pointer-events: none;
          z-index: 0;
        }

        /* ── Colour blobs ── */
        .blob {
          position: fixed;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.18;
          pointer-events: none;
        }
        .blob-1 { width: 520px; height: 520px; top: -120px; left: -120px; background: #FF6B6B; }
        .blob-2 { width: 520px; height: 520px; bottom: -100px; right: -100px; background: #4f46e5; }
        .blob-3 { width: 300px; height: 300px; top: 40%; left: 55%; background: #facc15; opacity: 0.07; }

        /* ── Sketch lines ── */
        .sketch-lines {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }
        .sketch-line {
          position: absolute;
          background: linear-gradient(90deg, transparent, #ffffff08, transparent);
          height: 1px;
          width: 100%;
          animation: scanline 8s linear infinite;
        }
        .sketch-line:nth-child(1) { top: 22%; animation-delay: 0s; }
        .sketch-line:nth-child(2) { top: 55%; animation-delay: 3s; }
        .sketch-line:nth-child(3) { top: 78%; animation-delay: 5.5s; }
        @keyframes scanline {
          0%   { transform: translateX(-100%); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }

        /* ── Floating icons ── */
        .floating-icon {
          position: fixed;
          font-size: 1.6rem;
          pointer-events: none;
          z-index: 0;
          animation: floatUp linear infinite;
          opacity: 0;
          filter: blur(0.5px);
        }
        @keyframes floatUp {
          0%   { transform: translateY(0) rotate(0deg) scale(0.8); opacity: 0; }
          10%  { opacity: 0.35; }
          80%  { opacity: 0.25; }
          100% { transform: translateY(-110vh) rotate(360deg) scale(1.1); opacity: 0; }
        }

        /* ── Live ticker ── */
        .ticker-bar {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 10;
          background: #13131aee;
          border-bottom: 1px solid #ffffff10;
          padding: 7px 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.72rem;
          letter-spacing: 0.05em;
          overflow: hidden;
        }
        .ticker-live {
          background: var(--green);
          color: #000;
          font-weight: 700;
          font-family: 'Syne', sans-serif;
          font-size: 0.6rem;
          padding: 2px 7px;
          border-radius: 99px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          flex-shrink: 0;
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { box-shadow: 0 0 0 0 #22c55e55; }
          50%       { box-shadow: 0 0 0 5px #22c55e00; }
        }
        .ticker-dot { color: #ffffff20; }
        .ticker-text {
          color: #ffffff60;
          overflow: hidden;
          white-space: nowrap;
        }
        .ticker-text span {
          display: inline-block;
          animation: tickerSlide 0.5s ease both;
        }
        @keyframes tickerSlide {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ticker-count {
          margin-left: auto;
          color: #ffffff30;
          font-size: 0.68rem;
          flex-shrink: 0;
        }
        .ticker-count strong { color: var(--green); }

        /* ── Main card ── */
        .card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 480px;
          background: #13131a;
          border: 1px solid #ffffff18;
          border-radius: 24px;
          padding: 36px 32px 32px;
          box-shadow: 0 32px 80px #00000060;
          animation: cardIn 0.55s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(28px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Pencil underline decoration under logo */
        .logo-wrap { position: relative; display: inline-block; margin-bottom: 4px; }
        .logo {
          font-family: 'Syne', sans-serif;
          font-size: 2.4rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -1px;
          line-height: 1;
        }
        .logo span { color: var(--accent); }

        /* Wavy sketch underline */
        .logo-underline {
          position: absolute;
          bottom: -6px; left: 0;
          width: 100%;
          height: 5px;
          overflow: visible;
        }
        .logo-underline path {
          stroke: var(--accent);
          stroke-width: 2.5;
          fill: none;
          stroke-dasharray: 200;
          stroke-dashoffset: 200;
          animation: drawLine 0.9s 0.4s ease forwards;
        }
        @keyframes drawLine {
          to { stroke-dashoffset: 0; }
        }

        .tagline {
          font-size: 0.82rem;
          color: #ffffff50;
          margin-bottom: 28px;
          margin-top: 14px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .tagline::before, .tagline::after { content: '—'; color: #ffffff20; }

        /* ── Stats strip ── */
        .stats-strip {
          display: flex;
          gap: 0;
          margin-bottom: 26px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #ffffff10;
        }
        .stat-item {
          flex: 1;
          padding: 10px 8px;
          text-align: center;
          background: #0d0d14;
          border-right: 1px solid #ffffff08;
        }
        .stat-item:last-child { border-right: none; }
        .stat-val {
          font-family: 'Syne', sans-serif;
          font-size: 1.1rem;
          font-weight: 800;
          color: #fff;
          line-height: 1;
          margin-bottom: 2px;
        }
        .stat-val.green { color: var(--green); }
        .stat-val.yellow { color: var(--yellow); }
        .stat-val.red { color: var(--accent); }
        .stat-label {
          font-size: 0.6rem;
          color: #ffffff30;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        /* ── Input ── */
        .input-group { margin-bottom: 16px; }
        .input-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #ffffff45;
          margin-bottom: 7px;
        }
        .input-field {
          width: 100%;
          padding: 13px 16px;
          background: #0d0d14;
          border: 1.5px solid #ffffff12;
          border-radius: 12px;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: max(16px, 0.95rem);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input-field::placeholder { color: #ffffff25; }
        .input-field:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-glow);
        }

        /* ── Btn primary ── */
        .btn-primary {
          position: relative;
          width: 100%;
          padding: 14px;
          background: var(--accent);
          border: none;
          border-radius: 12px;
          color: #000;
          font-family: 'Syne', sans-serif;
          font-size: 1rem;
          font-weight: 800;
          letter-spacing: 0.02em;
          cursor: pointer;
          transition: opacity 0.18s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 6px 28px var(--accent-glow);
          margin-bottom: 20px;
          min-height: 52px;
          touch-action: manipulation;
          overflow: hidden;
        }
        .btn-primary::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #ffffff22 0%, transparent 60%);
          border-radius: inherit;
          pointer-events: none;
        }
        /* Shimmer sweep */
        .btn-primary::before {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 60%;
          height: 100%;
          background: linear-gradient(90deg, transparent, #ffffff28, transparent);
          transform: skewX(-15deg);
          animation: shimmer 3s 1.2s ease-in-out infinite;
        }
        @keyframes shimmer {
          0%   { left: -100%; }
          100% { left: 200%; }
        }
        .btn-primary:hover { opacity: 0.88; transform: translateY(-1px); box-shadow: 0 10px 36px var(--accent-glow); }
        .btn-primary:active { transform: scale(0.97); }
        .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

        /* ── Divider ── */
        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .divider-line { flex: 1; height: 1px; background: #ffffff10; }
        .divider-text { font-size: 0.72rem; color: #ffffff30; letter-spacing: 0.08em; }

        /* ── Join row ── */
        .join-row { display: flex; gap: 8px; }
        .join-code {
          flex: 1;
          padding: 13px 16px;
          background: #0d0d14;
          border: 1.5px solid #ffffff12;
          border-radius: 12px;
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-size: max(16px, 1rem);
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          text-align: center;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          min-height: 52px;
        }
        .join-code::placeholder { color: #ffffff20; letter-spacing: 0.12em; font-weight: 400; }
        .join-code:focus { border-color: var(--indigo); box-shadow: 0 0 0 3px var(--indigo-glow); }
        .btn-join {
          padding: 13px 20px;
          background: var(--indigo);
          border: none;
          border-radius: 12px;
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-size: 0.9rem;
          font-weight: 800;
          cursor: pointer;
          transition: background 0.18s, transform 0.15s, box-shadow 0.2s;
          white-space: nowrap;
          min-height: 52px;
          touch-action: manipulation;
          box-shadow: 0 4px 20px #4f46e540;
        }
        .btn-join:hover { background: #6056f5; transform: translateY(-1px); box-shadow: 0 8px 28px #4f46e555; }
        .btn-join:active { transform: scale(0.97); }
        .btn-join:disabled { opacity: 0.4; cursor: not-allowed; }

        /* ── Error ── */
        .error-msg {
          margin-bottom: 16px;
          padding: 10px 14px;
          background: #ff4d4d18;
          border: 1px solid #ff4d4d55;
          border-radius: 10px;
          color: #ff8080;
          font-size: 0.82rem;
          text-align: center;
        }

        /* ── How to play hint ── */
        .how-to-play {
          margin-top: 20px;
          display: flex;
          gap: 6px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .htp-chip {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          background: #0d0d14;
          border: 1px solid #ffffff0d;
          border-radius: 99px;
          font-size: 0.68rem;
          color: #ffffff35;
          letter-spacing: 0.04em;
        }
        .htp-chip .num {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ffffff10;
          color: #ffffff50;
          font-family: 'Syne', sans-serif;
          font-size: 0.62rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* ── Responsive ── */
        @media (max-width: 400px) {
          .home-root { padding: 16px 12px; }
          .card { padding: 24px 18px 20px; border-radius: 18px; }
          .logo { font-size: 1.9rem; }
          .join-row { flex-direction: column; }
          .btn-join { width: 100%; }
          .blob { width: 320px; height: 320px; filter: blur(80px); }
          .stats-strip { display: none; }
        }
        @media (min-width: 401px) and (max-width: 480px) {
          .home-root { padding: 20px 16px; }
          .card { padding: 28px 22px 24px; }
        }
        @media (hover: none) {
          .btn-primary:hover { opacity: 1; transform: none; }
          .btn-join:hover { background: var(--indigo); transform: none; }
        }
      `}</style>

      <div className="home-root">
        {/* BG layers */}
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div className="sketch-lines">
          <div className="sketch-line" />
          <div className="sketch-line" />
          <div className="sketch-line" />
        </div>

        {/* Floating emoji icons */}
        {FLOATING_ICONS.map((icon, i) => (
          <div
            key={i}
            className="floating-icon"
            style={{
              left: `${8 + (i * 12)}%`,
              bottom: '-60px',
              animationDuration: `${9 + i * 1.3}s`,
              animationDelay: `${i * 1.1}s`,
              fontSize: `${1.2 + (i % 3) * 0.5}rem`,
            }}
          >
            {icon}
          </div>
        ))}

        {/* Live ticker */}
        <div className="ticker-bar">
          <span className="ticker-live">Live</span>
          <span className="ticker-dot">•</span>
          <span className="ticker-text">
            <span key={tickerIdx}>{PLAYER_TICKER[tickerIdx]}</span>
          </span>
          <span className="ticker-count"><strong></strong> online now</span>
        </div>
        <div className="card">
          {/* Logo */}
          <div className="logo-wrap">
            <div className="logo">Skrib<span>bl</span></div>
            <svg className="logo-underline" viewBox="0 0 130 5" preserveAspectRatio="none">
              <path d="M2 3 Q16 1 30 3 Q44 5 58 3 Q72 1 86 3 Q100 5 114 3 Q121 1 128 3" />
            </svg>
          </div>
          <div className="tagline">Draw · Guess · Repeat</div>

          
          {/* Status errors */}
          {status === 'error' && <div className="error-msg">❌ Server disconnected. Check VITE_BACKEND_URL.</div>}
          {error && <div className="error-msg">{error}</div>}

          {/* Name input */}
          <div className="input-group">
            <label className="input-label">
              <span>🎭</span> Nickname
            </label>
            <input
              className="input-field"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What do they call you?"
              maxLength={15}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          </div>

          {/* Create room */}
          <button className="btn-primary" onClick={handleCreateRoom} disabled={status !== 'connected'}>
            {status === 'connected' ? '  Start a New Room' : 'Waiting for server…'}
          </button>

          {/* Join divider */}
          <div className="divider">
            <div className="divider-line" />
            <span className="divider-text">or join a friend</span>
            <div className="divider-line" />
          </div>

          {/* Join form */}
          <form onSubmit={handleJoinRoom}>
            <div className="join-row">
              <input
                className="join-code"
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder="ROOM CODE"
                maxLength={4}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
              />
              <button type="submit" className="btn-join" disabled={status !== 'connected'}>
                {status === 'connected' ? 'Jump In →' : 'Waiting…'}
              </button>
            </div>
          </form>

          {/* How to play chips */}
          <div className="how-to-play">
            {[
              ['1', 'Pick a word'],
              ['2', 'Draw it fast'],
              ['3', 'Others guess'],
              ['4', 'Score points'],
            ].map(([n, t]) => (
              <div className="htp-chip" key={n}>
                <span className="num">{n}</span>
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}