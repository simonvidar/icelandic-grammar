import { loadGameWords } from '@/src/game/LoadGameWords';
import { Gender, WordEntry } from '@/src/types/word';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import GameView from '../../components/noun_gender/GameView';
import StartView from '../../components/noun_gender/StartView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
});

export default function Index() {
  const [words, setWords] = useState<WordEntry[]>([]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [guessedGender, setGuessedGender] = useState<Gender | ''>('');

  useEffect(() => {
    loadGameWords().then(setWords);
  }, []);

  const currentWord = words[currentIndex];
  const startGame = () => setGameStarted(true);

  function guessGender(guessedGender: Gender, correctGender: Gender) {
    if (guessedGender === correctGender) {
      setScore((s) => s + 1);
    }
    setGuessedGender(guessedGender);
  }

  function nextWord() {
    setCurrentIndex((i) => i + 1);
    setGuessedGender('');
  }

  if (gameStarted && !currentWord) {
    return (
      <View>
        <Text>Game over 🎉</Text>
        <Text>
          Score: {score} / {words.length}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!gameStarted ? (
        <StartView startGame={startGame} />
      ) : (
        <GameView
          currentWord={currentWord}
          guessGender={guessGender}
          guessedGender={guessedGender}
          nextWord={nextWord}
        />
      )}
    </View>
  );
}
