import { useEffect } from 'react';
import { useGameStore, socket } from '../store/gameStore';
import type { LeaderboardEntry } from '../types/Leaderboard';

export function useGameSocket() {
  const { setMyWord, setWordChoices, setWordHint, addMessage, setRoom, room } = useGameStore();

  useEffect(() => {
    // ── Game lifecycle ──────────────────────────────────────────────────────

    socket.on('game_started', () => {
      addMessage({
        playerId: 'system',
        playerName: 'System',
        message: 'The game has started!',
        isSystem: true,
      });
    });

    socket.on('round_start', (data: { round: number }) => {
      addMessage({
        playerId: 'system',
        playerName: 'System',
        message: `Round ${data.round} started!`,
        isSystem: true,
      });
    });

    // FIX: read the drawer name from the room_state_update that follows this
    // event rather than from a potentially stale `room` closure.
    // We just announce a generic message here; the PlayerList shows who's drawing.
    socket.on('turn_start', (data: { drawerId: string }) => {
      // Pull the latest room snapshot from the store at call-time, not closure-time
      const latestRoom = useGameStore.getState().room;
      const drawer = latestRoom?.players.find(p => p.id === data.drawerId);
      const name = drawer?.name ?? 'Someone';

      addMessage({
        playerId: 'system',
        playerName: 'System',
        message: `${name} is drawing now.`,
        isSystem: true,
      });

      setWordHint('');
      setMyWord('');
      setWordChoices([]);
    });

    socket.on('word_choices', (choices: string[]) => {
      setWordChoices(choices);
    });

    socket.on('word_hint', (hint: string) => {
      setWordHint(hint);
    });

    socket.on('your_word', (word: string) => {
      setMyWord(word);
      setWordChoices([]);
    });

    // ── Timer ───────────────────────────────────────────────────────────────
    // Keep the store's timeLeft in sync so the topbar timer stays accurate.
    socket.on('timer_update', (timeLeft: number) => {
      const latestRoom = useGameStore.getState().room;
      if (latestRoom) {
        setRoom({ ...latestRoom, timeLeft });
      }
    });

    // ── Guesses & chat ──────────────────────────────────────────────────────

    socket.on('correct_guess', (data: { playerId: string; playerName: string }) => {
      addMessage({
        playerId: data.playerId,
        playerName: data.playerName,
        message: 'Guessed the word!',
        isCorrectGuess: true,
      });
    });

    socket.on('chat_message', (msg: { playerId: string; playerName: string; message: string }) => {
      addMessage(msg);
    });

    // ── Turn / round / game end ─────────────────────────────────────────────

    socket.on('turn_end', (data: { word: string }) => {
      addMessage({
        playerId: 'system',
        playerName: 'System',
        message: `Turn over! The word was "${data.word}".`,
        isSystem: true,
      });

      setWordHint('');
      setMyWord('');
    });

    socket.on('round_end', (data: { round: number }) => {
      addMessage({
        playerId: 'system',
        playerName: 'System',
        message: `Round ${data.round} over!`,
        isSystem: true,
      });
    });

    socket.on('game_over', (data: { leaderboard: LeaderboardEntry[] }) => {
      const { setLeaderboard } = useGameStore.getState();
      setLeaderboard(data.leaderboard);
      
      const top = data.leaderboard[0];
      addMessage({
        playerId: 'system',
        playerName: 'System',
        message: top
          ? `Game Over! 🏆 ${top.name} wins with ${top.score} pts!`
          : 'Game Over!',
        isSystem: true,
      });
    });

    return () => {
      socket.off('game_started');
      socket.off('round_start');
      socket.off('turn_start');
      socket.off('word_choices');
      socket.off('word_hint');
      socket.off('your_word');
      socket.off('timer_update');
      socket.off('correct_guess');
      socket.off('chat_message');
      socket.off('turn_end');
      socket.off('round_end');
      socket.off('game_over');
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // empty deps — we use getState() to avoid stale closures
}