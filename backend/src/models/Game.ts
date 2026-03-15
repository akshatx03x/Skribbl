import { Server } from 'socket.io';
import { Room } from './Room';
import { Player } from './Player';
import { getRandomWords } from '../data/words';

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
    this.room.getPlayers().forEach(p => p.score = 0);
    
    this.io.to(this.room.id).emit('game_started');
    this.startRound();
  }

  startRound() {
    if (this.room.currentRound > this.room.settings.rounds) {
      this.endGame();
      return;
    }

    // Reset player guess states
    this.room.getPlayers().forEach(p => p.resetRound());
    
    // Initialize turn queue with all players
    this.room.turnQueue = this.room.getPlayers().map(p => p.id);
    
    this.io.to(this.room.id).emit('round_start', { round: this.room.currentRound });
    
    this.startTurn();
  }

  startTurn() {
    if (this.room.turnQueue.length === 0) {
      // Turn queue is empty, round is over
      this.endRound();
      return;
    }

    // Pop the next player from the turn queue
    this.room.currentDrawerId = this.room.turnQueue.shift() || null;
    this.room.currentWord = ''; // Word is not chosen yet

    // Inform everyone whose turn it is
    this.io.to(this.room.id).emit('turn_start', { 
       drawerId: this.room.currentDrawerId 
    });

    if (this.room.currentDrawerId) {
       // Send 3 random words to the drawer to choose from
       const words = getRandomWords(3);
       this.io.to(this.room.currentDrawerId).emit('word_choices', words);
    }
  }

  selectWord(playerId: string, word: string) {
    if (this.room.currentDrawerId !== playerId) return;

    this.room.currentWord = word;
    this.room.timeLeft = this.room.settings.drawTime;

    // Send hint (asterisks or underscores) to everyone
    const hint = word.replace(/[a-zA-Z]/g, '_');
    this.io.to(this.room.id).emit('word_hint', hint);

    // Send the actual word only to the drawer
    this.io.to(playerId).emit('your_word', word);

    // Start timer interval
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
        this.endTurn();
      }
    }, 1000);
  }

  checkGuess(playerId: string, guess: string) {
    // If player is the drawer, or already guessed correctly, ignore
    if (playerId === this.room.currentDrawerId) return;
    
    const player = this.room.players.get(playerId);
    if (!player || player.hasGuessedCorrectly) return;

    // Check if word is correct (case insensitive)
    if (this.room.currentWord && guess.toLowerCase() === this.room.currentWord.toLowerCase()) {
       player.hasGuessedCorrectly = true;
       
       // Calculate points (e.g. based on time left)
       const pointsEarned = Math.max(10, Math.floor((this.room.timeLeft / this.room.settings.drawTime) * 100));
       player.score += pointsEarned;

       // Drawer also gets some points when someone guesses correctly
       const drawer = this.room.players.get(this.room.currentDrawerId!);
       if (drawer) {
          drawer.score += 20;
       }

       this.io.to(this.room.id).emit('correct_guess', { 
           playerId: player.id, 
           playerName: player.name 
       });

       this.io.to(this.room.id).emit('room_state_update', this.room.getSafeguardedRoomState());

       // Check if all other players have guessed
       const allGuessed = this.room.getPlayers().every(p => 
           p.id === this.room.currentDrawerId || p.hasGuessedCorrectly
       );

       if (allGuessed) {
           this.endTurn();
       }
    } else {
       // Incorrect guess, send as normal chat
       this.io.to(this.room.id).emit('chat_message', { 
           playerId: player.id, 
           playerName: player.name, 
           message: guess 
       });
    }
  }

  endTurn() {
    if (this.room.timerInterval) {
      clearInterval(this.room.timerInterval);
    }

    this.io.to(this.room.id).emit('turn_end', { 
       word: this.room.currentWord
    });

    // Wait a few seconds before starting the next turn
    setTimeout(() => {
       this.startTurn();
    }, 3000);
  }

  endRound() {
     this.io.to(this.room.id).emit('round_end', { 
         round: this.room.currentRound 
     });

     this.room.currentRound++;

     // Wait a bit before next round or game over
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

      this.io.to(this.room.id).emit('game_over', {
          leaderboard: this.room.getPlayers().sort((a,b) => b.score - a.score).map(p => ({
              id: p.id,
              name: p.name,
              score: p.score
          }))
      });
  }

  destroy() {
      if (this.room.timerInterval) {
          clearInterval(this.room.timerInterval);
      }
  }
}
