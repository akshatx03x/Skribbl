import { useEffect } from 'react';
import { useGameStore, socket, type Player } from '../store/gameStore';

export function useGameSocket() {
  const { setMyWord, setWordChoices, setWordHint, addMessage, room } = useGameStore();

  useEffect(() => {
    // Game Loop Events
    socket.on('game_started', () => {
      addMessage({ playerId: 'system', playerName: 'System', message: 'The game has started!', isSystem: true });
    });

    socket.on('round_start', (data: { round: number }) => {
      addMessage({ playerId: 'system', playerName: 'System', message: `Round ${data.round} started!`, isSystem: true });
    });

    socket.on('turn_start', (data: { drawerId: string }) => {
       const drawer = room?.players.find((p: Player) => p.id === data.drawerId);
       const name = drawer?.name || 'Someone';
       addMessage({ playerId: 'system', playerName: 'System', message: `${name} is drawing now.`, isSystem: true });
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

    socket.on('correct_guess', (data: { playerId: string, playerName: string }) => {
       addMessage({
         playerId: data.playerId,
         playerName: data.playerName,
         message: 'Guessed the word!',
         isCorrectGuess: true
       });
    });

    socket.on('chat_message', (msg: any) => {
       addMessage(msg);
    });

    socket.on('turn_end', (data: { word: string }) => {
      addMessage({ playerId: 'system', playerName: 'System', message: `Turn over! The word was ${data.word}`, isSystem: true });
      setWordHint('');
      setMyWord('');
    });

    socket.on('round_end', (data: { round: number }) => {
      addMessage({ playerId: 'system', playerName: 'System', message: `Round ${data.round} over!`, isSystem: true });
    });

    socket.on('game_over', (data: { leaderboard: any[] }) => {
      addMessage({ playerId: 'system', playerName: 'System', message: `Game Over! Check the leaderboard.`, isSystem: true });
      // Depending on implementation, you might show a specific game over screen here
    });

    return () => {
      socket.off('game_started');
      socket.off('round_start');
      socket.off('turn_start');
      socket.off('word_choices');
      socket.off('word_hint');
      socket.off('your_word');
      socket.off('correct_guess');
      socket.off('chat_message');
      socket.off('turn_end');
      socket.off('round_end');
      socket.off('game_over');
    };
  }, [addMessage, room?.players, setMyWord, setWordChoices, setWordHint]);
}
