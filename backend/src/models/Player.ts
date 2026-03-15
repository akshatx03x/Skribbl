export class Player {
  id: string; // Socket ID
  name: string;
  score: number = 0;
  roomId: string | null = null;
  hasGuessedCorrectly: boolean = false;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  resetRound() {
    this.hasGuessedCorrectly = false;
  }
}
