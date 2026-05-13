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
  goToMenu: () => void;
  score: number;
};

export default function GameOver({
  restartGame,
  goToMenu,
  score,
}: GameOverProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>Game over</Text>
      <Text style={styles.scoreText}>Score: {score}</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={restartGame}
          style={styles.button}
          accessibilityLabel="Start the noun gender exercise again"
        >
          <Text style={styles.buttonText}>Restart game</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={goToMenu}
          style={styles.button}
          accessibilityLabel="Go to menu"
        >
          <Text style={styles.buttonText}>Go to menu</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
