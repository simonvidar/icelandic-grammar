import GameOverView from '@/src/components/noun_gender_2/GameOverView';
import { supabase } from '@/src/lib/supabase';
import { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import GameView from '../../../components/noun_gender_2/GameView';
import StartView from '../../../components/noun_gender_2/StartView';

type StartGameSessionResult = {
  session_id: string;
  lives_remaining: number;
  word_count: number;
  first_word_id: string;
  first_lemma: string;
};

type SubmitGuessResult = {
  was_correct: boolean;
  lives_remaining: number;
  current_score: number;
  is_game_over: boolean;
  next_word_id: string | null;
  next_lemma: string | null;
};

export type GameState = {
  sessionId: string;
  livesRemaining: number;
  wordCount: number;
  currentWordId: string | null;
  currentLemma: string | null;
  isGameOver: boolean;
  currentScore: number;
  lastGuessWasCorrect: boolean | null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
});

type Difficulty = 'very_easy' | 'easy' | 'medium' | 'hard';

export default function Index() {
  const [user, setUser] = useState<User | null>(null);

  const [gameState, setGameState] = useState<GameState | null>(null);

  const [isGameSessionLoading, setIsGameSessionLoading] = useState(false);
  const [isSubmittingGuess, setIsSubmittingGuess] = useState(false);

  const [startGameErrorMessage, setStartGameErrorMessage] = useState<
    string | null
  >(null);

  const [gameErrorMessage, setGameErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('getSession error:', error.message);
      }
      setUser(data.session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setUser(newSession?.user ?? null);
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleStartGame = async (difficulty: Difficulty) => {
    setIsGameSessionLoading(true);
    setStartGameErrorMessage(null);

    const { data: startGameSessionData, error: startGameSessionError } =
      await supabase.rpc('start_game_session', {
        p_game_type: 'gender_game',
        p_difficulty: difficulty,
      });

    if (startGameSessionError) {
      setStartGameErrorMessage(startGameSessionError.message);
      setIsGameSessionLoading(false);
      return;
    }

    if (!startGameSessionData || startGameSessionData.length === 0) {
      setStartGameErrorMessage('Could not start game. Please try again.');
      setIsGameSessionLoading(false);

      return;
    }

    const startedSession = startGameSessionData[0];

    setGameState({
      sessionId: startedSession.session_id,
      livesRemaining: startedSession.lives_remaining,
      wordCount: startedSession.word_count,
      currentWordId: startedSession.first_word_id,
      currentLemma: startedSession.first_lemma,
      isGameOver: false,
      currentScore: 0,
      lastGuessWasCorrect: null,
    });
    setIsGameSessionLoading(false);
  };

  const handleGuess = async (
    guessedGender: 'masculine' | 'feminine' | 'neuter',
  ) => {
    if (!gameState || !gameState.currentWordId || gameState.isGameOver) {
      return;
    }

    setIsSubmittingGuess(true);

    const { data: submitGuessData, error: submitGuessError } =
      await supabase.rpc('submit_guess', {
        p_session_id: gameState.sessionId,
        p_answered_gender: guessedGender,
      });

    if (submitGuessError) {
      setGameErrorMessage(submitGuessError.message);
      setIsSubmittingGuess(false);
      return;
    }

    if (!submitGuessData || submitGuessData.length === 0) {
      setGameErrorMessage('Could not send guess. Try again.');
      setIsSubmittingGuess(false);
      return;
    }

    const guessedResult = submitGuessData[0];

    setGameState((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        livesRemaining: guessedResult.lives_remaining,
        currentScore: guessedResult.current_score,
        isGameOver: guessedResult.is_game_over,
        lastGuessWasCorrect: guessedResult.was_correct,
        currentWordId: guessedResult.next_word_id,
        currentLemma: guessedResult.next_lemma,
      };
    });

    setIsSubmittingGuess(false);
  };

  useEffect(() => {
    const applyScores = async () => {
      if (gameState && gameState.sessionId) {
        await supabase.rpc('sync_score_publication_for_session', {
          p_session_id: gameState.sessionId,
        });
      }
    };

    if (gameState?.isGameOver) {
      applyScores();
    }
  }, [gameState?.isGameOver]);

  if (!user) {
    return <Text>You need to log in to view this page.</Text>;
  }

  if (gameState?.isGameOver) {
    return (
      <GameOverView
        restartGame={() => setGameState(null)}
        goToMenu={() => {
          setGameState(null);
        }}
        score={gameState?.currentScore}
      />
    );
  }

  return (
    <View style={styles.container}>
      {!gameState ? (
        <StartView startGame={handleStartGame} />
      ) : (
        <GameView
          gameState={gameState}
          handleGuess={handleGuess}
          isSubmittingGuess={isSubmittingGuess}
        />
      )}
    </View>
  );
}
