import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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

type Difficulty = 'very_easy' | 'easy' | 'medium' | 'hard';

type StartViewProps = {
  startGame: (difficulty: Difficulty) => Promise<void>;
};

export default function StartView(props: StartViewProps) {
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<Difficulty>('very_easy');

  const difficultyOptions: { value: Difficulty; label: string }[] = [
    { value: 'very_easy', label: 'Very easy' },
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>Noun Gender Execercise</Text>
      <Text style={styles.descriptiveText}>
        Guess the gender of the noun{'\n'}
        shown on the screen. You have 5 ❤️.{'\n'}
        Each time you guess wrong,{'\n'}
        you loose a ❤️.
      </Text>

      <View style={{ gap: 8 }}>
        {difficultyOptions.map((item) => {
          const selected = selectedDifficulty === item.value;

          return (
            <Pressable
              key={item.value}
              onPress={() => {
                void setSelectedDifficulty(item.value);
              }}
              style={{
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: selected ? 'black' : 'lightgray',
                backgroundColor: selected ? '#eee' : 'white',
              }}
            >
              <Text>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={() => props.startGame(selectedDifficulty)}
          style={styles.startButton}
          accessibilityLabel="Start the noun gender exercise"
        >
          <Text style={styles.buttonText}>Start game</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
