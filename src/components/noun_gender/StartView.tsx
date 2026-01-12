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
  descriptiveText: {
    marginTop: 40,
    fontSize: 18,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 40,
    paddingHorizontal: 20,
  },
  startButton: {
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

type StartViewProps = {
  startGame: () => void;
};

export default function StartView({ startGame }: StartViewProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>Noun Gender Execercise</Text>
      <Text style={styles.descriptiveText}>
        Guess the gender of the noun{'\n'}
        shown on the screen. You have 5 ❤️.{'\n'}
        Each time you guess wrong,{'\n'}
        you loose a ❤️.
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={startGame}
          style={styles.startButton}
          accessibilityLabel="Start the noun gender exercise"
        >
          <Text style={styles.buttonText}>Start game</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
