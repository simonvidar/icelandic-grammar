import { Gender, WordEntry } from '@/src/types/word';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  titleText: {
    marginTop: 40,
    fontSize: 24,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 40,
    paddingHorizontal: 20,
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
});

type GameViewProps = {
  currentWord: WordEntry;
  guessGender: (guessedGender: Gender, correctGender: Gender) => void;
  guessedGender: Gender | '';
  nextWord: () => void;
};

export default function GameView({
  currentWord,
  guessGender,
  guessedGender,
  nextWord,
}: GameViewProps) {
  const guessMade = guessedGender !== '';
  const guessedCorrect = guessedGender === currentWord.gender;

  const buttonStyle = (gender: Gender) => {
    if (!guessMade) {
      return [styles.genderButton];
    }

    if (
      (guessedCorrect && guessedGender === gender) ||
      (!guessedCorrect && currentWord.gender === gender)
    ) {
      return [styles.genderButton, styles.correctGender];
    } else if (!guessedCorrect && guessedGender === gender) {
      return [styles.genderButton, styles.incorrectGender];
    } else {
      return [styles.genderButton];
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>{currentWord.word}</Text>
      {guessedGender && (
        <>
          <Text style={styles.titleText}>
            {guessedCorrect ? 'Correct!' : 'Incorrect!'}
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={nextWord}
              style={styles.nextButton}
              accessibilityLabel="Next word in exercise"
            >
              <Text style={styles.buttonText}>Next word</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={() => guessGender('kk', currentWord.gender)}
          style={buttonStyle('kk')}
          accessibilityLabel="Masculine"
          disabled={guessMade}
        >
          <Text style={styles.buttonText}>Masculine</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={() => guessGender('kvk', currentWord.gender)}
          style={buttonStyle('kvk')}
          accessibilityLabel="Feminine"
          disabled={guessMade}
        >
          <Text style={styles.buttonText}>Feminine</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={() => guessGender('hk', currentWord.gender)}
          style={buttonStyle('hk')}
          accessibilityLabel="Neuter"
          disabled={guessMade}
        >
          <Text style={styles.buttonText}>Neuter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
