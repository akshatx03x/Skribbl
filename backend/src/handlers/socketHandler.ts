import { Server, Socket } from 'socket.io';
import { Room } from '../models/Room';
import { Player } from '../models/Player';
import { Game } from '../models/Game';

// In-memory store
const rooms = new Map<string, Room>();
const games = new Map<string, Game>();
const socketToRoom = new Map<string, string>();

export const handleSockets = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    // Create Room
    socket.on('create_room', (data: { playerName: string }) => {
      // Simple random 4 chars for room code
      const roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
      
      const p = new Player(socket.id, data.playerName);
      const room = new Room(roomId, socket.id);
      
      room.addPlayer(p);
      rooms.set(roomId, room);
      socketToRoom.set(socket.id, roomId);
      
      socket.join(roomId);

      socket.emit('room_created', { roomId });
      io.to(roomId).emit('room_state_update', room.getSafeguardedRoomState());
    });

    // Join Room
    socket.on('join_room', (data: { roomId: string, playerName: string }) => {
      const roomId = data.roomId.toUpperCase();
      const room = rooms.get(roomId);

      if (!room) {
        socket.emit('error_message', 'Room not found');
        return;
      }

      if (room.isGameStarted) {
         socket.emit('error_message', 'Game already started');
         return;
      }

      try {
         const p = new Player(socket.id, data.playerName);
         room.addPlayer(p);
         socketToRoom.set(socket.id, roomId);
         socket.join(roomId);

         io.to(roomId).emit('room_state_update', room.getSafeguardedRoomState());

      } catch (e: any) {
         socket.emit('error_message', e.message);
      }
    });

    // Start Game
    socket.on('start_game', () => {
       const roomId = socketToRoom.get(socket.id);
       if (!roomId) return;
       const room = rooms.get(roomId);
       if (!room) return;

       if (room.hostId !== socket.id) return; // Only host can start

       const game = new Game(io, room);
       games.set(roomId, game);
       game.startGame();
       io.to(roomId).emit('room_state_update', room.getSafeguardedRoomState());
    });

    // Word Selection
    socket.on('word_selected', (word: string) => {
       const roomId = socketToRoom.get(socket.id);
       if (!roomId) return;
       const game = games.get(roomId);
       if (game) {
           game.selectWord(socket.id, word);
       }
    });

    // Drawing Events
    socket.on('draw_start', (data: any) => {
       const roomId = socketToRoom.get(socket.id);
       if (roomId) {
           socket.to(roomId).emit('draw_start', data);
       }
    });

    socket.on('draw_move', (data: any) => {
       const roomId = socketToRoom.get(socket.id);
       if (roomId) {
           socket.to(roomId).emit('draw_move', data);
       }
    });

    socket.on('draw_end', () => {
       const roomId = socketToRoom.get(socket.id);
       if (roomId) {
           socket.to(roomId).emit('draw_end');
       }
    });

    socket.on('canvas_clear', () => {
       const roomId = socketToRoom.get(socket.id);
       if (roomId) {
           socket.to(roomId).emit('canvas_clear');
       }
    });

    // Chat / Guessing Event
    socket.on('send_guess', (guess: string) => {
       const roomId = socketToRoom.get(socket.id);
       if (!roomId) return;
       const game = games.get(roomId);
       if (game) {
           game.checkGuess(socket.id, guess);
       } else {
           // pregame lobby chat
           const room = rooms.get(roomId);
           if (room) {
               const player = room.players.get(socket.id);
               if (player) {
                   io.to(roomId).emit('chat_message', { 
                       playerId: player.id, 
                       playerName: player.name, 
                       message: guess 
                   });
               }
           }
       }
    });

    // Disconnect
    socket.on('disconnect', () => {
      const roomId = socketToRoom.get(socket.id);
      if (roomId) {
         const room = rooms.get(roomId);
         if (room) {
            room.removePlayer(socket.id);
            socketToRoom.delete(socket.id);

            // Clean up if room is empty
            if (room.players.size === 0) {
               const game = games.get(roomId);
               if (game) {
                  game.destroy();
                  games.delete(roomId);
               }
               rooms.delete(roomId);
            } else {
               io.to(roomId).emit('room_state_update', room.getSafeguardedRoomState());
            }
         }
      }
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};
