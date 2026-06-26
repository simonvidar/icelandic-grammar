import GameOverView from '@/src/components/noun_gender/GameOverView';
import { supabase } from '@/src/lib/supabase';
import { theme } from '@/src/theme/theme';
import { User } from '@supabase/supabase-js';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import GameView from '../../../components/noun_gender/GameView';

type StartGameSessionResult = {
  session_id: string;
  starting_lives_remaining: number;
  word_count: number;
  first_word_id: string;
  first_lemma: string;
  correct_gender: Gender;
};

type SubmitGuessResult = {
  was_correct: boolean;
  lives_remaining: number;
  current_score: number;
  is_game_over: boolean;
  next_word_id: string | null;
  next_lemma: string | null;
  correct_gender: Gender;
};

export type GameState = {
  sessionId: string;
  livesRemaining: number;
  wordCount: number;
  currentWordId: string | null;
  currentLemma: string | null;
  nextWordId: string | null;
  nextLemma: string | null;
  isGameOver: boolean;
  currentScore: number;
  guessedGender: Gender | null;
  lastGuessWasCorrect: boolean | null;
  lastCorrectGender: Gender | null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: theme.spacing.xxl,
  },
});

type Gender = 'masculine' | 'feminine' | 'neuter';

type Difficulty = 'very_easy' | 'easy' | 'medium' | 'hard';

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(false);

  const [gameState, setGameState] = useState<GameState | null>(null);

  const { selected_difficulty } = useLocalSearchParams<{
    selected_difficulty: Difficulty;
  }>();

  const [isGameSessionLoading, setIsGameSessionLoading] = useState(false);
  const [isSubmittingGuess, setIsSubmittingGuess] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<Difficulty>('very_easy');

  const [startGameErrorMessage, setStartGameErrorMessage] = useState<
    string | null
  >(null);

  const [gameErrorMessage, setGameErrorMessage] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    setIsUserLoading(true);
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('getSession error:', error.message);
      }
      setUser(data.session?.user ?? null);
    });
    setIsUserLoading(false);

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
      livesRemaining: startedSession.starting_lives_remaining,
      wordCount: startedSession.word_count,
      currentWordId: startedSession.first_word_id,
      currentLemma: startedSession.first_lemma,
      isGameOver: false,
      currentScore: 0,
      guessedGender: null,
      lastGuessWasCorrect: null,
      lastCorrectGender: null,
      nextLemma: null,
      nextWordId: null,
    });
    setIsGameSessionLoading(false);
  };

  const handleGuess = async (
    guessedGender: 'masculine' | 'feminine' | 'neuter',
  ) => {
    if (
      !gameState ||
      !gameState.currentWordId ||
      gameState.isGameOver ||
      isSubmittingGuess
    ) {
      return;
    }

    setIsSubmittingGuess(true);
    setGameState((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        guessedGender: guessedGender,
      };
    });

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
        nextWordId: guessedResult.next_word_id,
        nextLemma: guessedResult.next_lemma,
        lastCorrectGender: guessedResult.correct_gender,
      };
    });

    setIsSubmittingGuess(false);
  };

  const goToNextWord = () => {
    if (!gameState?.nextWordId || !gameState?.nextLemma) {
      return;
    }

    setGameState((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        currentWordId: current.nextWordId,
        currentLemma: current.nextLemma,
        nextWordId: null,
        nextLemma: null,
      };
    });
  };

  useEffect(() => {
    if (selected_difficulty && gameState === null) {
      setSelectedDifficulty(selected_difficulty);
      handleStartGame(selected_difficulty);
    }
  }, [selected_difficulty]);

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

  if (isGameSessionLoading || isUserLoading) {
    return (
      <View style={styles.loadingIndicator}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (gameState?.isGameOver) {
    return (
      <GameOverView
        restartGame={() => {
          setGameState(null);
          router.push({
            pathname: '/(app)/noun_gender',
            params: { selected_difficulty: selectedDifficulty },
          });
        }}
        goToHome={() => {
          setGameState(null);
          router.push('/');
        }}
        score={gameState?.currentScore}
      />
    );
  }

  if (gameState) {
    return (
      <GameView
        gameState={gameState}
        handleGuess={handleGuess}
        isSubmittingGuess={isSubmittingGuess}
        goToNextWord={goToNextWord}
      />
    );
  } else {
    return <View></View>;
  }
}
