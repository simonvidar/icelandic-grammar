import { GameState } from '@/src/app/(app)/noun_gender';
import { theme } from '@/src/theme/theme';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AppButton from '../ui/AppButton';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  titleText: {
    fontSize: 24,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  top: {
    alignItems: 'center',
    marginTop: 40,
  },
  feedbackText: {
    marginTop: 16,
    fontSize: 20,
    minHeight: 28,
  },
  genderSection: {
    flex: 1,
    gap: 16,
    justifyContent: 'center',
  },
  bottom: {
    alignItems: 'center',
    gap: 12,
    paddingBottom: 20,
    marginTop: 32,
  },
  genderButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 64,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  correctGender: {
    backgroundColor: '#34993b',
  },
  incorrectGender: {
    backgroundColor: '#994c34',
  },
  score: {
    fontSize: 18,
  },
  hidden: {
    opacity: 0,
  },
  lives: { textAlign: 'left' },
  livesContainer: {
    width: '100%',
  },
});

type Gender = 'masculine' | 'feminine' | 'neuter';

const genderButtonOptions: { value: Gender; label: string }[] = [
  {
    value: 'masculine',
    label: 'Masculine',
  },
  {
    value: 'feminine',
    label: 'Feminine',
  },
  {
    value: 'neuter',
    label: 'Neuter',
  },
];

type GameViewProps = {
  gameState: GameState;
  handleGuess: (guessedGender: Gender) => Promise<void>;
  isSubmittingGuess: boolean;
  goToNextWord: () => void;
};

export default function GameView({
  gameState,
  handleGuess,
  isSubmittingGuess,
  goToNextWord,
}: GameViewProps) {
  const guessMade = gameState.nextLemma !== null;

  const buttonStyle = (gender: Gender) => {
    if (!guessMade) {
      return [styles.genderButton];
    }

    if (
      (gameState.lastGuessWasCorrect &&
        gameState.lastCorrectGender === gender) ||
      (!gameState.lastGuessWasCorrect && gameState.lastCorrectGender === gender)
    ) {
      return [styles.genderButton, styles.correctGender];
    } else if (
      !gameState.lastGuessWasCorrect &&
      gameState.guessedGender === gender
    ) {
      return [styles.genderButton, styles.incorrectGender];
    } else {
      return [styles.genderButton];
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.livesContainer}>
        <Text style={styles.lives}>
          {gameState.livesRemaining
            ? Array(gameState.livesRemaining)
                .fill('❤️')
                .map((heart) => heart)
            : ''}
        </Text>
      </View>

      <View style={styles.top}>
        <Text style={styles.titleText}>{gameState.currentLemma}</Text>

        {gameState && gameState.lastGuessWasCorrect !== null && (
          <Text style={[styles.feedbackText, !guessMade && styles.hidden]}>
            {gameState.lastGuessWasCorrect ? 'Correct!' : 'Wrong!'}
          </Text>
        )}
      </View>

      <View style={styles.genderSection}>
        {genderButtonOptions.map((genderButtonOption) => (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={() => handleGuess(genderButtonOption.value)}
              style={buttonStyle(genderButtonOption.value)}
              accessibilityLabel={genderButtonOption.label}
              disabled={guessMade || isSubmittingGuess}
            >
              {isSubmittingGuess &&
              gameState.guessedGender === genderButtonOption.value ? (
                <ActivityIndicator
                  size="small"
                  color={theme.colors.textOnPrimary}
                />
              ) : (
                <Text style={styles.buttonText}>
                  {genderButtonOption.label}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.bottom}>
          <AppButton onPress={goToNextWord} hidden={!guessMade}>
            Next word
          </AppButton>
          <View>
            <Text style={styles.score}>
              Current score: {gameState.currentScore}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
