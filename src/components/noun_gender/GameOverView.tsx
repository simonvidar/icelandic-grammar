import { StyleSheet, Text, View } from 'react-native';
import AppButton from '../ui/AppButton';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  titleText: {
    marginTop: 40,
    fontSize: 24,
  },
  scoreText: {
    marginTop: 40,
    fontSize: 18,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

type GameOverProps = {
  restartGame: () => void;
  goToHome: () => void;
  score: number;
};

export default function GameOver({
  restartGame,
  goToHome,
  score,
}: GameOverProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>Game over</Text>
      <Text style={styles.scoreText}>Score: {score}</Text>
      <View style={styles.buttonContainer}>
        <AppButton
          onPress={restartGame}
          accessibilityLabel="Start the noun gender exercise again"
        >
          Restart game
        </AppButton>
      </View>
      <View style={styles.buttonContainer}>
        <AppButton onPress={goToHome} accessibilityLabel="Go to home">
          Go to home
        </AppButton>
      </View>
    </View>
  );
}
