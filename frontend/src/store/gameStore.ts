import { io, Socket } from 'socket.io-client';
import { create } from 'zustand';
import type { LeaderboardEntry } from '../types/Leaderboard';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
});

export interface Player {
  id: string;
  name: string;
  score: number;
  hasGuessedCorrectly: boolean;
}

export interface RoomSettings {
  maxPlayers: number;
  rounds: number;
  drawTime: number;
}

export interface RoomState {
  id: string;
  hostId: string;
  settings: RoomSettings;
  players: Player[];
  isGameStarted: boolean;
  currentRound: number;
  currentDrawerId: string | null;
  timeLeft: number;
  turnEndTime?: number;
  leaderboard?: LeaderboardEntry[];
}

export interface ChatMessage {
  playerId: string;
  playerName: string;
  message: string;
  isSystem?: boolean;
  isCorrectGuess?: boolean;
}

interface GameStore {
  me: { id: string; name: string } | null;
  room: RoomState | null;
  messages: ChatMessage[];
  wordHint: string;
  myWord: string;
  wordChoices: string[];
  setMe: (name: string, id: string) => void;
  setRoom: (room: RoomState) => void;
  addMessage: (msg: ChatMessage) => void;
  setWordHint: (hint: string) => void;
  setMyWord: (word: string) => void;
  setWordChoices: (choices: string[]) => void;
  setLeaderboard: (leaderboard: LeaderboardEntry[]) => void;
  clearMessages: () => void;
  // Resets everything game-related — call this when leaving a room
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  me:          null,
  room:        null,
  messages:    [],
  wordHint:    '',
  myWord:      '',
  wordChoices: [],

  setMe:          (name, id) => set({ me: { name, id } }),
  setRoom:        (room)     => set({ room }),
  addMessage:     (msg)      => set((state) => ({ messages: [...state.messages, msg] })),
  setWordHint:    (hint)     => set({ wordHint: hint }),
  setMyWord:      (word)     => set({ myWord: word }),
  setWordChoices: (choices)  => set({ wordChoices: choices }),
  setLeaderboard: (leaderboard) => set((state) => state.room ? ({
    ...state,
    room: { ...state.room, leaderboard }
  }) : state),
  clearMessages:  ()         => set({ messages: [] }),

  // Wipes all game state so the next room starts completely fresh
  resetGame: () => set({
    room:        null,
    messages:    [],
    wordHint:    '',
    myWord:      '',
    wordChoices: [],
  }),
}));

