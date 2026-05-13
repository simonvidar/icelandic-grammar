import { GameState } from '@/src/app/(app)/noun_gender_2';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

type GameViewProps = {
  gameState: GameState;
  handleGuess: (
    guessedGender: 'masculine' | 'feminine' | 'neuter',
  ) => Promise<void>;
  isSubmittingGuess: boolean;
};

export default function GameView({
  gameState,
  handleGuess,
  isSubmittingGuess,
}: GameViewProps) {
  // const buttonStyle = (gender: Gender) => {
  //   if (!guessMade) {
  //     return [styles.genderButton];
  //   }

  //   if (
  //     (guessedCorrect && guessedGender === gender) ||
  //     (!guessedCorrect && currentWord.gender === gender)
  //   ) {
  //     return [styles.genderButton, styles.correctGender];
  //   } else if (!guessedCorrect && guessedGender === gender) {
  //     return [styles.genderButton, styles.incorrectGender];
  //   } else {
  //     return [styles.genderButton];
  //   }
  // };

  return (
    <View style={styles.container}>
      <View style={styles.livesContainer}>
        <Text style={styles.lives}>
          {gameState.livesRemaining &&
            Array(gameState.livesRemaining)
              .fill('❤️')
              .map((heart) => heart)}
        </Text>
      </View>

      <View style={styles.top}>
        <Text style={styles.titleText}>{gameState.currentLemma}</Text>

        {gameState && gameState.lastGuessWasCorrect !== null && (
          <Text style={styles.feedbackText}>
            {gameState.lastGuessWasCorrect ? 'Correct!' : 'Wrong!'}
          </Text>
        )}
      </View>

      <View style={styles.genderSection}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={() => handleGuess('masculine')}
            style={styles.genderButton}
            accessibilityLabel="Masculine"
            disabled={isSubmittingGuess}
          >
            <Text style={styles.buttonText}>Masculine</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={() => handleGuess('feminine')}
            style={styles.genderButton}
            accessibilityLabel="Feminine"
            disabled={isSubmittingGuess}
          >
            <Text style={styles.buttonText}>Feminine</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={() => handleGuess('neuter')}
            style={styles.genderButton}
            accessibilityLabel="Neuter"
            disabled={isSubmittingGuess}
          >
            <Text style={styles.buttonText}>Neuter</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottom}>
          {/* <TouchableOpacity
            onPress={nextWord}
            style={[styles.nextButton, !guessedGender && styles.hidden]}
            accessibilityLabel="Next word in exercise"
          >
            <Text style={styles.buttonText}>Next word</Text>
          </TouchableOpacity> */}
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
