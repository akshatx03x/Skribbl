import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore, socket } from '../store/gameStore';

export default function Home() {
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setMe = useGameStore((state) => state.setMe);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }
    
    setMe(name, socket.id as string);
    socket.emit('create_room', { playerName: name });
    
    // Listen for room_created
    socket.once('room_created', (data: { roomId: string }) => {
      navigate(`/room/${data.roomId}`);
    });
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !roomId.trim()) {
      setError('Please enter a name and room code');
      return;
    }
    
    setMe(name, socket.id as string);
    socket.emit('join_room', { roomId, playerName: name });
    
    // If successful, the room_state_update will handle the rest in the Room component, 
    // but we can just navigate immediately or wait for success. We'll navigate immediately
    // and let the Room component handle errors if the room doesn't exist.
    navigate(`/room/${roomId.toUpperCase()}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-indigo-400 text-center mb-8 drop-shadow-md">
          Skribbl Clone
        </h1>
        
        {error && (
          <div className="mb-4 p-3 rounded bg-red-500/20 border border-red-500 text-red-100 text-sm text-center">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-indigo-200 mb-1">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-white placeholder-white/30 transition-all outline-none"
              placeholder="Enter your nickname..."
              maxLength={15}
            />
          </div>

          <div className="pt-4 space-y-4">
            <button
              onClick={handleCreateRoom}
              className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg transform transition-all active:scale-95"
            >
              Create Private Room
            </button>
            
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink-0 mx-4 text-white/30 text-sm">or</span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            <form onSubmit={handleJoinRoom} className="flex gap-2">
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                className="flex-grow px-4 py-3 bg-black/30 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-white placeholder-white/30 uppercase text-center tracking-widest outline-none transition-all"
                placeholder="ROOM CODE"
                maxLength={4}
              />
              <button
                type="submit"
                className="py-3 px-6 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl shadow-lg transform transition-all active:scale-95"
              >
                Join
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
