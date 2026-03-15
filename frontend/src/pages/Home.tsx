import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore, socket } from '../store/gameStore';

export default function Home() {
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setMe = useGameStore((state) => state.setMe);

  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

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

  const handleCreateRoom = async () => {
    if (status !== 'connected') { setError('Server not connected'); return; }
    if (!name.trim()) { setError('Enter a nickname first'); return; }
    
    setError('');
    setMe(name, socket.id!);
    
    return new Promise<void>((resolve) => {
      socket.once('room_created', (data: { roomId: string }) => {
        navigate(`/room/${data.roomId}`);
        resolve();
      });
      socket.once('error_message', (msg) => {
        setError(msg);
        resolve();
      });
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
      socket.once('room_state_update', () => {
        navigate(`/room/${joinId}`);
        resolve();
      });
      socket.once('error_message', (msg) => {
        setError(msg);
        resolve();
      });
      socket.emit('join_room', { roomId: joinId, playerName: name });
    });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

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

        /* Animated dot grid */
        .home-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: radial-gradient(circle, #ffffff0a 1px, transparent 1px);
          background-size: 32px 32px;
          pointer-events: none;
        }

        /* Colour blob */
        .blob {
          position: fixed;
          width: 520px; height: 520px;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.18;
          pointer-events: none;
          transition: background 0.6s ease;
        }
        .blob-1 { top: -120px; left: -120px; background: #FF6B6B; }
        .blob-2 { bottom: -100px; right: -100px; background: #4f46e5; }

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
        }

        /* Header */
        .logo {
          font-family: 'Syne', sans-serif;
          font-size: 2.4rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -1px;
          line-height: 1;
          margin-bottom: 4px;
        }
        .logo span { color: var(--accent); transition: color 0.4s; }
        .tagline {
          font-size: 0.82rem;
          color: #ffffff50;
          margin-bottom: 32px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        /* Input */
        .input-group { margin-bottom: 16px; }
        .input-label {
          display: block;
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
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          /* Prevent iOS zoom on focus */
          font-size: max(16px, 0.95rem);
        }
        .input-field::placeholder { color: #ffffff25; }
        .input-field:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-glow);
        }

        /* Primary CTA */
        .btn-primary {
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
          /* Better tap target */
          min-height: 48px;
          touch-action: manipulation;
        }
        .btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }
        .btn-primary:active { transform: scale(0.97); }

        /* Divider */
        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .divider-line { flex: 1; height: 1px; background: #ffffff10; }
        .divider-text { font-size: 0.72rem; color: #ffffff30; letter-spacing: 0.08em; }

        /* Join row */
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
          min-height: 48px;
        }
        .join-code::placeholder { color: #ffffff20; letter-spacing: 0.12em; font-weight: 400; }
        .join-code:focus {
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px #4f46e530;
        }
        .btn-join {
          padding: 13px 20px;
          background: #4f46e5;
          border: none;
          border-radius: 12px;
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-size: 0.9rem;
          font-weight: 800;
          cursor: pointer;
          transition: background 0.18s, transform 0.15s;
          white-space: nowrap;
          min-height: 48px;
          touch-action: manipulation;
        }
        .btn-join:hover { background: #6056f5; transform: translateY(-1px); }
        .btn-join:active { transform: scale(0.97); }

        /* Error */
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

        /* ── Responsive: small phones ─────────────────────────────── */
        @media (max-width: 400px) {
          .home-root { padding: 16px 12px; }
          .card { padding: 24px 18px 20px; border-radius: 18px; }
          .logo { font-size: 1.9rem; }
          .tagline { margin-bottom: 24px; }
          /* Stack join row on very small screens */
          .join-row { flex-direction: column; }
          .btn-join { width: 100%; }
          .blob { width: 320px; height: 320px; filter: blur(80px); }
        }

        /* ── Responsive: mid-size phones ─────────────────────────── */
        @media (min-width: 401px) and (max-width: 480px) {
          .home-root { padding: 20px 16px; }
          .card { padding: 28px 22px 24px; }
        }

        /* ── Disable hover transforms on touch devices ────────────── */
        @media (hover: none) {
          .btn-primary:hover { opacity: 1; transform: none; }
          .btn-join:hover { background: #4f46e5; transform: none; }
        }
      `}</style>

      <div
        className="home-root"
        style={{ '--accent': '#FF6B6B', '--accent-glow': '#ff6b6b55' } as React.CSSProperties}
      >
        <div className="blob blob-1" />
        <div className="blob blob-2" />

        <div className="card">
          <div className="logo">Skrib<span>bl</span></div>
          <div className="tagline">Draw. Guess. Repeat.</div>

          {status === 'error' && <div className="error-msg">❌ Server disconnected. Check VITE_BACKEND_URL.</div>}
          {error && <div className="error-msg">{error}</div>}
          {status === 'connecting' && <div className="error-msg" style={{background: '#333'}}>⏳ Connecting to server...</div>}

          {/* Name */}
          <div className="input-group">
            <label className="input-label">Nickname</label>
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

          {/* Create */}
          <button className="btn-primary" onClick={handleCreateRoom} disabled={status !== 'connected'}>
            {status === 'connected' ? 'Start a New Room ✏️' : 'Waiting for server...'}
          </button>

          {/* Join */}
          <div className="divider">
            <div className="divider-line" />
            <span className="divider-text">or join a friend</span>
            <div className="divider-line" />
          </div>

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
                {status === 'connected' ? 'Jump In →' : 'Waiting...'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}