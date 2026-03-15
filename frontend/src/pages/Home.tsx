import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore, socket } from '../store/gameStore';

export default function Home() {
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setMe = useGameStore((state) => state.setMe);

  const handleCreateRoom = () => {
    if (!name.trim()) { setError('Enter a nickname first'); return; }
    setMe(name, socket.id as string);
    socket.emit('create_room', { playerName: name });
    socket.once('room_created', (data: { roomId: string }) => {
      navigate(`/room/${data.roomId}`);
    });
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !roomId.trim()) { setError('Enter your name and room code'); return; }
    setMe(name, socket.id as string);
    socket.emit('join_room', { roomId, playerName: name });
    navigate(`/room/${roomId.toUpperCase()}`);
  };;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .home-root {
          min-height: 100vh;
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
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          text-align: center;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
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

        @media (max-width: 400px) {
          .card { padding: 28px 20px 24px; }
          .logo { font-size: 2rem; }
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

          {error && <div className="error-msg">{error}</div>}

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
            />
          </div>

          {/* Create */}
          <button className="btn-primary" onClick={handleCreateRoom}>
            Start a New Room ✏️
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
              />
              <button type="submit" className="btn-join">Jump In →</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}