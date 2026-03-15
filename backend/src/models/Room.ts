import { Player } from './Player';

export interface RoomSettings {
  maxPlayers: number;
  rounds: number;
  drawTime: number; // in seconds
}

export class Room {
  id: string;
  hostId: string;
  players: Map<string, Player> = new Map();
  settings: RoomSettings;

  // Game State
  isGameStarted: boolean = false;
  currentRound: number = 0;

  // Turn state
  turnQueue: string[] = [];
  currentDrawerId: string | null = null;
  currentWord: string = '';
  timeLeft: number = 0;
  timerInterval: NodeJS.Timeout | null = null;

  constructor(id: string, hostId: string, settings?: Partial<RoomSettings>) {
    this.id = id;
    this.hostId = hostId;
    this.settings = {
      maxPlayers: settings?.maxPlayers || 8,
      rounds:     settings?.rounds    || 3,
      drawTime:   settings?.drawTime  || 30, // ← changed from 80 → 30
    };
  }

  addPlayer(player: Player) {
    if (this.players.size >= this.settings.maxPlayers) {
      throw new Error('Room is full');
    }
    this.players.set(player.id, player);
    player.roomId = this.id;
  }

  removePlayer(playerId: string) {
    this.players.delete(playerId);
    this.turnQueue = this.turnQueue.filter(id => id !== playerId);

    if (playerId === this.hostId && this.players.size > 0) {
      const nextPlayer = Array.from(this.players.values())[0];
      if (nextPlayer) {
        this.hostId = nextPlayer.id;
      }
    }
  }

  getPlayers() {
    return Array.from(this.players.values());
  }

  getSafeguardedRoomState() {
    return {
      id:              this.id,
      hostId:          this.hostId,
      settings:        this.settings,
      players:         this.getPlayers().map(p => ({
        id:                  p.id,
        name:                p.name,
        score:               p.score,
        hasGuessedCorrectly: p.hasGuessedCorrectly,
      })),
      isGameStarted:   this.isGameStarted,
      currentRound:    this.currentRound,
      currentDrawerId: this.currentDrawerId,
      timeLeft:        this.timeLeft,
    };
  }
}