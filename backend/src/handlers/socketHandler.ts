import { Server, Socket } from 'socket.io';
import { Room } from '../models/Room';
import { Player } from '../models/Player';
import { Game } from '../models/Game';

const rooms = new Map<string, Room>();
const games = new Map<string, Game>();

function generateRoomId(): string {
  let id: string;
  let attempts = 0;
  do {
    id = Math.random().toString(36).substring(2, 6).toUpperCase();
    attempts++;
  } while (rooms.has(id) && attempts < 20);
  return id;
}

export function handleSockets(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // ── CREATE ROOM ───────────────────────────────────────────────
    socket.on('create_room', (data: { playerName: string; settings?: Partial<Room['settings']> }) => {
      const player = new Player(socket.id, data.playerName);
      const roomId = generateRoomId();
      const room = new Room(roomId, socket.id, data.settings);

      room.addPlayer(player);
      rooms.set(roomId, room);

      socket.join(roomId);
      player.roomId = roomId;

      socket.emit('room_created', { roomId });
      io.to(roomId).emit('room_state_update', room.getSafeguardedRoomState());
    });

    // ── JOIN ROOM ─────────────────────────────────────────────────
    socket.on('join_room', (data: { roomId: string; playerName: string }) => {
      const roomId = data.roomId.trim().toUpperCase();
      const room = rooms.get(roomId);

      console.log(`Join room ${roomId} by ${data.playerName} (socket ${socket.id})`);

      if (!room) {
        console.log(`Room ${roomId} not found`);
        socket.emit('error_message', `Room ${roomId} not found`);
        return;
      }
      if (room.isGameStarted) {
        socket.emit('error_message', 'Game already in progress.');
        return;
      }

      try {
        const player = new Player(socket.id, data.playerName);
        room.addPlayer(player);
        socket.join(roomId);
        io.to(roomId).emit('room_state_update', room.getSafeguardedRoomState());
        console.log(`${data.playerName} joined ${roomId}`);
      } catch (err: any) {
        console.log(`Join error: ${err.message}`);
        socket.emit('error_message', err.message || 'Could not join room.');
      }
    });

    // ── START GAME ────────────────────────────────────────────────
    socket.on('start_game', () => {
      const room = getRoomForSocket(socket.id);
      if (!room) return;
      if (room.hostId !== socket.id) {
        socket.emit('error_message', 'Only the host can start the game.');
        return;
      }
      if (room.players.size < 2) {
        socket.emit('error_message', 'Need at least 2 players to start.');
        return;
      }

      const game = new Game(io, room);
      games.set(room.id, game);
      game.startGame();
    });

    // ── WORD SELECTED ─────────────────────────────────────────────
    socket.on('word_selected', (word: string) => {
      const room = getRoomForSocket(socket.id);
      if (!room) return;
      const game = games.get(room.id);
      if (!game) return;
      game.selectWord(socket.id, word);
    });

    // ── SEND GUESS / CHAT ─────────────────────────────────────────
    // ALL player messages come through here — Game.handleMessage decides
    // whether it's a guess attempt or a plain chat message, and also
    // handles the drawer (who can always chat) and the lobby phase.
    socket.on('send_guess', (message: string) => {
      const room = getRoomForSocket(socket.id);
      if (!room) return;

      // Lobby chat — game not started yet
      if (!room.isGameStarted) {
        const player = room.players.get(socket.id);
        if (!player) return;
        io.to(room.id).emit('chat_message', {
          playerId: player.id,
          playerName: player.name,
          message,
        });
        return;
      }

      const game = games.get(room.id);
      if (!game) return;
      game.handleMessage(socket.id, message);
    });

    // ── DRAWING EVENTS ────────────────────────────────────────────
    socket.on('draw_start', (data: { point: { x: number; y: number }; color: string; size: number }) => {
      const room = getRoomForSocket(socket.id);
      if (!room || room.currentDrawerId !== socket.id) return;
      socket.to(room.id).emit('draw_start', data);
    });

    socket.on('draw_move', (data: { point: { x: number; y: number } }) => {
      const room = getRoomForSocket(socket.id);
      if (!room || room.currentDrawerId !== socket.id) return;
      socket.to(room.id).emit('draw_move', data);
    });

    socket.on('draw_end', () => {
      const room = getRoomForSocket(socket.id);
      if (!room || room.currentDrawerId !== socket.id) return;
      socket.to(room.id).emit('draw_end');
    });

    socket.on('canvas_clear', () => {
      const room = getRoomForSocket(socket.id);
      if (!room || room.currentDrawerId !== socket.id) return;
      io.to(room.id).emit('canvas_clear');
    });

    // ── DISCONNECT ────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      const room = getRoomForSocket(socket.id);
      if (!room) return;

      room.removePlayer(socket.id);

      if (room.players.size === 0) {
        // Clean up empty room
        const game = games.get(room.id);
        if (game) {
          game.destroy();
          games.delete(room.id);
        }
        rooms.delete(room.id);
        return;
      }

      // If the drawer disconnected mid-turn, end the turn immediately
      if (room.currentDrawerId === socket.id) {
        const game = games.get(room.id);
        if (game) game.endTurn();
      }

      io.to(room.id).emit('room_state_update', room.getSafeguardedRoomState());
    });
  });
}

// ── Helper ────────────────────────────────────────────────────────────────────
function getRoomForSocket(socketId: string): Room | null {
  for (const room of rooms.values()) {
    if (room.players.has(socketId)) return room;
  }
  return null;
}