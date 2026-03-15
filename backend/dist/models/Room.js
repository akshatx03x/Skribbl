"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Room = void 0;
class Room {
    constructor(id, hostId, settings) {
        this.players = new Map();
        // Game State
        this.isGameStarted = false;
        this.currentRound = 0;
        // Turn state
        this.turnQueue = []; // Socket IDs of players who haven't drawn this round
        this.currentDrawerId = null;
        this.currentWord = '';
        this.timeLeft = 0;
        this.timerInterval = null;
        this.id = id;
        this.hostId = hostId;
        this.settings = {
            maxPlayers: settings?.maxPlayers || 8,
            rounds: settings?.rounds || 3,
            drawTime: settings?.drawTime || 80,
        };
    }
    addPlayer(player) {
        if (this.players.size >= this.settings.maxPlayers) {
            throw new Error('Room is full');
        }
        this.players.set(player.id, player);
        player.roomId = this.id;
    }
    removePlayer(playerId) {
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
            id: this.id,
            hostId: this.hostId,
            settings: this.settings,
            players: this.getPlayers().map(p => ({
                id: p.id,
                name: p.name,
                score: p.score,
                hasGuessedCorrectly: p.hasGuessedCorrectly
            })),
            isGameStarted: this.isGameStarted,
            currentRound: this.currentRound,
            currentDrawerId: this.currentDrawerId,
            timeLeft: this.timeLeft
        };
    }
}
exports.Room = Room;
//# sourceMappingURL=Room.js.map