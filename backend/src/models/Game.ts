import { Server } from 'socket.io';
import { Room } from './Room';
import { getRandomWords } from '../data/words';

const POINTS_FOR_CORRECT_GUESS     = 10;
const POINTS_FOR_DRAWER_PER_GUESSER = 5;

export class Game {
  io: Server;
  room: Room;
  syncInterval: NodeJS.Timeout | null = null;

  constructor(io: Server, room: Room) {
    this.io = io;
    this.room = room;
  }

  startGame() {
    this.room.isGameStarted = true;
    this.room.currentRound = 1;
    this.room.getPlayers().forEach(p => (p.score = 0));

    this.io.to(this.room.id).emit('game_started');
    this.startRound();
  }

  startRound() {
    if (this.room.currentRound > this.room.settings.rounds) {
      this.endGame();
      return;
    }

    this.room.getPlayers().forEach(p => p.resetRound());
    this.room.turnQueue = this.room.getPlayers().map(p => p.id);

    this.io.to(this.room.id).emit('round_start', { round: this.room.currentRound });
    this.startTurn();
  }

  startTurn() {
    if (this.room.turnQueue.length === 0) {
      this.endRound();
      return;
    }

    // Reset per-turn guess flags so hasGuessedCorrectly clears between turns
    this.room.getPlayers().forEach(p => p.resetRound());

    this.room.currentDrawerId = this.room.turnQueue.shift() || null;
    this.room.currentWord = '';

    this.io.to(this.room.id).emit('turn_start', {
      drawerId: this.room.currentDrawerId,
    });

    this.io.to(this.room.id).emit(
      'room_state_update',
      this.room.getSafeguardedRoomState()
    );

    if (this.room.currentDrawerId) {
      const words = getRandomWords(3);
      this.io.to(this.room.currentDrawerId).emit('word_choices', words);
    }
  }

  selectWord(playerId: string, word: string) {
    if (this.room.currentDrawerId !== playerId) return;

    this.room.currentWord = word;
    this.room.timeLeft = this.room.settings.drawTime;
    this.room.turnEndTime = Date.now() + (this.room.timeLeft * 1000);

    const hint = word.replace(/[a-zA-Z]/g, '_');
    this.io.to(this.room.id).emit('word_hint', hint);
    this.io.to(playerId).emit('your_word', word);

    this.startTimer();
  }

  startTimer() {
    // Clear any existing timers
    if (this.room.timerInterval) clearInterval(this.room.timerInterval as any);
    if (this.syncInterval) clearInterval(this.syncInterval);

    // Initial sync emit
    this.io.to(this.room.id).emit('timer_sync', { endTime: this.room.turnEndTime });

    // Periodic sync every 5s to correct client drift
    this.syncInterval = setInterval(() => {
      this.io.to(this.room.id).emit('timer_sync', { endTime: this.room.turnEndTime });
      // Update approximate timeLeft for room state consistency
      this.room.timeLeft = Math.max(0, Math.floor((this.room.turnEndTime - Date.now()) / 1000));
      this.io.to(this.room.id).emit('room_state_update', this.room.getSafeguardedRoomState());
    }, 5000);

    // Server-side end check
    const checkEnd = () => {
      if (Date.now() >= this.room.turnEndTime) {
        this.awardEqualSplit();
        this.endTurn();
      }
    };

    // Check every second for end
    this.room.timerInterval = setInterval(checkEnd, 1000);
  }

  private awardEqualSplit() {
    const players = this.room.getPlayers();
    if (players.length === 0) return;
    const share = Math.floor(POINTS_FOR_CORRECT_GUESS / players.length);
    if (share > 0) {
      players.forEach(p => (p.score += share));
      this.io.to(this.room.id).emit(
        'room_state_update',
        this.room.getSafeguardedRoomState()
      );
    }
  }

  handleMessage(playerId: string, message: string) {
    const player = this.room.players.get(playerId);
    if (!player) return;

    const isDrawer = playerId === this.room.currentDrawerId;

    if (isDrawer || !this.room.currentWord) {
      this.io.to(this.room.id).emit('chat_message', {
        playerId: player.id,
        playerName: player.name,
        message,
      });
      return;
    }

    this.checkGuess(playerId, message);
  }

  checkGuess(playerId: string, guess: string) {
    if (playerId === this.room.currentDrawerId) return;

    const player = this.room.players.get(playerId);
    if (!player || player.hasGuessedCorrectly) return;

    const correct =
      this.room.currentWord &&
      guess.trim().toLowerCase() === this.room.currentWord.toLowerCase();

    if (correct) {
      player.hasGuessedCorrectly = true;
      player.score += POINTS_FOR_CORRECT_GUESS;

      const drawer = this.room.players.get(this.room.currentDrawerId!);
      if (drawer) drawer.score += POINTS_FOR_DRAWER_PER_GUESSER;

      this.io.to(this.room.id).emit('correct_guess', {
        playerId: player.id,
        playerName: player.name,
      });

      this.io.to(this.room.id).emit(
        'room_state_update',
        this.room.getSafeguardedRoomState()
      );

      const allGuessed = this.room
        .getPlayers()
        .every(p => p.id === this.room.currentDrawerId || p.hasGuessedCorrectly);

      if (allGuessed) this.endTurn();
    } else {
      this.io.to(this.room.id).emit('chat_message', {
        playerId: player.id,
        playerName: player.name,
        message: guess,
      });
    }
  }

  endTurn() {
    if (this.room.timerInterval) clearInterval(this.room.timerInterval as any);
    if (this.syncInterval) clearInterval(this.syncInterval);

    this.io.to(this.room.id).emit('turn_end', { word: this.room.currentWord });
    this.io.to(this.room.id).emit('canvas_clear');

    // ── No delay: shift to next player immediately after word reveal ──
    // The `turn_end` event already shows the word on clients.
    // A small 1 s pause is enough for players to read it, with no artificial wait.
    setTimeout(() => this.startTurn(), 1000);
  }

  endRound() {
    this.io.to(this.room.id).emit('round_end', { round: this.room.currentRound });
    this.room.currentRound++;
    setTimeout(() => this.startRound(), 3000);
  }

  endGame() {
    this.room.isGameStarted = false;
    this.room.currentRound = 0;
    this.room.currentDrawerId = null;
    this.room.currentWord = '';
    this.room.turnEndTime = 0;
    if (this.room.timerInterval) clearInterval(this.room.timerInterval as any);
    if (this.syncInterval) clearInterval(this.syncInterval);

    const leaderboard = this.room
      .getPlayers()
      .sort((a, b) => b.score - a.score)
      .map(p => ({ id: p.id, name: p.name, score: p.score }));

    this.io.to(this.room.id).emit('game_over', { leaderboard });
  }

  destroy() {
    if (this.room.timerInterval) clearInterval(this.room.timerInterval as any);
    if (this.syncInterval) clearInterval(this.syncInterval);
  }
}
