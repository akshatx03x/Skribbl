import { Server } from 'socket.io';
import { Room } from './Room';
import { Player } from './Player';
import { getRandomWords } from '../data/words';

// Points awarded per turn
const POINTS_FOR_CORRECT_GUESS = 10;   // guesser earns this
const POINTS_FOR_DRAWER_PER_GUESSER = 5; // drawer earns this per correct guesser

export class Game {
  io: Server;
  room: Room;

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

    // Reset per-round guess flags
    this.room.getPlayers().forEach(p => p.resetRound());

    // Every player draws once per round
    this.room.turnQueue = this.room.getPlayers().map(p => p.id);

    this.io.to(this.room.id).emit('round_start', { round: this.room.currentRound });

    this.startTurn();
  }

  startTurn() {
    if (this.room.turnQueue.length === 0) {
      this.endRound();
      return;
    }

    // Reset per-turn guess flags so the scoreboard clears between turns
    this.room.getPlayers().forEach(p => p.resetRound());

    this.room.currentDrawerId = this.room.turnQueue.shift() || null;
    this.room.currentWord = '';

    this.io.to(this.room.id).emit('turn_start', {
      drawerId: this.room.currentDrawerId,
    });

    // Broadcast fresh room state so everyone sees the new drawer & cleared scores
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
    this.room.timeLeft = this.room.settings.drawTime; // 30 s default

    // Blanked hint for guessers
    const hint = word.replace(/[a-zA-Z]/g, '_');
    this.io.to(this.room.id).emit('word_hint', hint);

    // Actual word only to drawer
    this.io.to(playerId).emit('your_word', word);

    this.startTimer();
  }

  startTimer() {
    if (this.room.timerInterval) {
      clearInterval(this.room.timerInterval);
    }

    this.room.timerInterval = setInterval(() => {
      this.room.timeLeft--;
      this.io.to(this.room.id).emit('timer_update', this.room.timeLeft);

      if (this.room.timeLeft <= 0) {
        // Time ran out — split a single match (10 pts) equally among all players
        this.awardEqualSplit();
        this.endTurn();
      }
    }, 1000);
  }

  /**
   * When nobody guesses in time, divide 10 points equally among all players.
   * Fractional points are floored; any remainder goes to nobody (keeps it simple).
   */
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

  /**
   * Handle a message from any player.
   *
   * Rules:
   *  - Drawer's messages always go to chat (they cannot guess their own word).
   *  - Non-drawers: if a word has been chosen, treat as a guess attempt;
   *    correct → award points, incorrect → broadcast as chat.
   *  - If no word is chosen yet (choosing phase), treat as lobby-style chat.
   */
  handleMessage(playerId: string, message: string) {
    const player = this.room.players.get(playerId);
    if (!player) return;

    const isDrawer = playerId === this.room.currentDrawerId;

    // Drawer always chats (never guesses)
    if (isDrawer) {
      this.io.to(this.room.id).emit('chat_message', {
        playerId: player.id,
        playerName: player.name,
        message,
      });
      return;
    }

    // No word chosen yet → pure chat
    if (!this.room.currentWord) {
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

      // Flat 10 pts for the guesser
      player.score += POINTS_FOR_CORRECT_GUESS;

      // Drawer gets 5 pts per successful guesser
      const drawer = this.room.players.get(this.room.currentDrawerId!);
      if (drawer) {
        drawer.score += POINTS_FOR_DRAWER_PER_GUESSER;
      }

      this.io.to(this.room.id).emit('correct_guess', {
        playerId: player.id,
        playerName: player.name,
      });

      this.io.to(this.room.id).emit(
        'room_state_update',
        this.room.getSafeguardedRoomState()
      );

      // End turn if everyone (except drawer) has guessed
      const allGuessed = this.room
        .getPlayers()
        .every(p => p.id === this.room.currentDrawerId || p.hasGuessedCorrectly);

      if (allGuessed) {
        this.endTurn();
      }
    } else {
      // Wrong guess → show as chat
      this.io.to(this.room.id).emit('chat_message', {
        playerId: player.id,
        playerName: player.name,
        message: guess,
      });
    }
  }

  endTurn() {
    if (this.room.timerInterval) {
      clearInterval(this.room.timerInterval);
    }

    this.io.to(this.room.id).emit('turn_end', {
      word: this.room.currentWord,
    });

    // Clear canvas for all clients
    this.io.to(this.room.id).emit('canvas_clear');

    setTimeout(() => {
      this.startTurn();
    }, 3000);
  }

  endRound() {
    this.io.to(this.room.id).emit('round_end', {
      round: this.room.currentRound,
    });

    this.room.currentRound++;

    setTimeout(() => {
      this.startRound();
    }, 5000);
  }

  endGame() {
    this.room.isGameStarted = false;
    this.room.currentRound = 0;
    this.room.currentDrawerId = null;
    this.room.currentWord = '';

    if (this.room.timerInterval) {
      clearInterval(this.room.timerInterval);
    }

    const leaderboard = this.room
      .getPlayers()
      .sort((a, b) => b.score - a.score)
      .map(p => ({ id: p.id, name: p.name, score: p.score }));

    this.io.to(this.room.id).emit('game_over', { leaderboard });
  }

  destroy() {
    if (this.room.timerInterval) {
      clearInterval(this.room.timerInterval);
    }
  }
}