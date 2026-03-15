"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
class Player {
    constructor(id, name) {
        this.score = 0;
        this.roomId = null;
        this.hasGuessedCorrectly = false;
        this.id = id;
        this.name = name;
    }
    resetRound() {
        this.hasGuessedCorrectly = false;
    }
}
exports.Player = Player;
//# sourceMappingURL=Player.js.map