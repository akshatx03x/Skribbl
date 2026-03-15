import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore, socket, type RoomState } from '../store/gameStore';
import Canvas from '../components/Canvas';
import Chat from '../components/Chat';
import PlayerList from '../components/PlayerList';

import { useGameSocket } from '../hooks/useGameSocket';
import { Users, Clock, Hash, Play, HelpCircle } from 'lucide-react';
import clsx from 'clsx';

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { me, room, setRoom, wordHint, myWord, wordChoices } = useGameStore();

  useGameSocket();

  useEffect(() => {
    if (!me) {
      navigate('/');
      return;
    }

    const onRoomUpdate = (updatedRoom: RoomState) => {
      setRoom(updatedRoom);
    };

    const onError = (msg: string) => {
      alert(msg);
      navigate('/');
    };

    socket.on('room_state_update', onRoomUpdate);
    socket.on('error_message', onError);

    // Initial join/create is handled outside, but just in case we reconnected
    if (!room) {
      socket.emit('join_room', { roomId, playerName: me.name });
    }

    return () => {
      socket.off('room_state_update', onRoomUpdate);
      socket.off('error_message', onError);
    };
  }, [me, navigate, roomId, room, setRoom]);

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const isHost = me?.id === room.hostId;
  const isDrawer = room.currentDrawerId === me?.id;
  const drawerName = room.players.find(p => p.id === room.currentDrawerId)?.name || 'Someone';

  if (!room.isGameStarted) {
    // Lobby View
    return (
      <div className="min-h-screen p-8 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900">
        <div className="max-w-4xl mx-auto flex gap-8">

          <div className="flex-1 bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-indigo-400">
                Waiting Lobby
              </h2>
              <div className="px-4 py-2 bg-black/30 rounded-lg flex items-center gap-2 font-mono text-xl tracking-widest border border-white/10">
                <Hash size={20} className="text-indigo-400" />
                {room.id}
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {room.players.map((p) => (
                <div key={p.id} className="bg-black/20 rounded-xl p-4 flex flex-col items-center justify-center border border-white/5 relative group transition-all hover:bg-black/30">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-pink-500 to-indigo-500 flex items-center justify-center text-2xl font-bold text-white mb-3 shadow-lg group-hover:scale-105 transition-transform">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-white/90 truncate w-full text-center">
                    {p.name}
                  </span>
                  {p.id === room.hostId && (
                    <span className="absolute top-2 right-2 text-xs bg-yellow-500 text-black px-2 py-1 rounded-full font-bold shadow-md">
                      HOST
                    </span>
                  )}
                </div>
              ))}

              {Array.from({ length: Math.max(0, room.settings.maxPlayers - room.players.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="border-2 border-dashed border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-white/20">
                  <Users size={32} className="mb-2 opacity-50" />
                  <span className="text-sm font-medium">Waiting...</span>
                </div>
              ))}
            </div>

            {isHost ? (
              <button
                onClick={() => socket.emit('start_game')}
                disabled={room.players.length < 2}
                className="w-full py-4 px-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 disabled:from-neutral-700 disabled:to-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transform transition-all active:scale-95 flex justify-center items-center gap-2 text-lg"
              >
                <Play size={24} />
                Start Game
              </button>
            ) : (
              <div className="w-full py-4 text-center text-white/50 bg-black/20 rounded-xl border border-white/5 font-medium flex items-center justify-center gap-2">
                <Clock className="animate-pulse" size={20} />
                Waiting for host to start...
              </div>
            )}
          </div>

          <div className="w-80 flex flex-col gap-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 h-full flex flex-col">
              <h3 className="font-bold text-lg mb-4 text-white/90">Lobby Chat</h3>
              <Chat inLobby={true} />
            </div>
          </div>

        </div>
      </div>
    );
  }

  // Game View
  return (
    <div className="h-screen flex flex-col bg-neutral-900 overflow-hidden text-neutral-100">

      {/* Top Bar */}
      <div className="h-16 flex items-center justify-between px-6 bg-neutral-950/50 border-b border-white/10 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-white/50 font-medium">Round {room.currentRound} of {room.settings.rounds}</span>
            <div className="flex items-center gap-2 text-xl font-bold font-mono tracking-widest text-indigo-400">
              <Clock size={20} className={clsx("transition-colors", room.timeLeft <= 10 && "text-red-500 animate-pulse")} />
              <span className={clsx(room.timeLeft <= 10 && "text-red-500")}>{room.timeLeft}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex justify-center items-center">
          {wordChoices.length > 0 && isDrawer ? (
            <div className="flex bg-black/50 p-3 rounded-2xl gap-3 backdrop-blur-sm border border-white/10 shadow-2xl">
              <span className="text-white/50 text-sm flex items-center mr-2">Choose a word:</span>
              {wordChoices.map(w => (
                <button
                  key={w}
                  onClick={() => socket.emit('word_selected', w)}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold transition-transform hover:scale-105 active:scale-95 shadow-lg"
                >
                  {w}
                </button>
              ))}
            </div>
          ) : myWord ? (
            <div className="flex items-center gap-3">
              <span className="text-white/50 font-medium">Draw this:</span>
              <span className="text-3xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 uppercase drop-shadow-sm">
                {myWord}
              </span>
            </div>
          ) : wordHint ? (
            <div className="flex flex-col items-center">
              <span className="text-xs text-white/50 font-medium tracking-wider mb-1 uppercase">Guess the word</span>
              <span className="text-3xl font-mono tracking-[0.5em] font-bold text-yellow-400 drop-shadow-md">
                {wordHint.split('').join(' ')}
              </span>
            </div>
          ) : room.currentDrawerId ? (
            <div className="animate-pulse flex items-center gap-2 text-white/70">
              {drawerName} is choosing a word...
            </div>
          ) : (
            <div className="text-white/50 italic">Waiting...</div>
          )}
        </div>

        <div className="flex items-center gap-3 text-sm font-medium">
          <div className="px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 flex items-center gap-2">
            <Hash size={16} className="text-indigo-400" /> {room.id}
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        <PlayerList players={room.players} drawerId={room.currentDrawerId} />

        <div className="flex-1 flex flex-col min-w-0 bg-neutral-950 rounded-2xl overflow-hidden border border-white/5 shadow-2xl relative shadow-black/50">

          <div className="flex-1 relative cursor-crosshair">
            <Canvas isDrawer={isDrawer} />
          </div>
        </div>

        <div className="w-80 flex flex-col bg-neutral-950 rounded-2xl overflow-hidden border border-white/5 shadow-xl shadow-black/50">
          <Chat />
        </div>
      </div>

    </div>
  );
}
