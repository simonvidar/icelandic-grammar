import GameOverView from '@/src/components/noun_gender/GameOverView';
import { NUMBER_OF_LIVES } from '@/src/config/words';
import { loadGameWords } from '@/src/game/LoadGameWords';
import { Gender, WordEntry } from '@/src/types/word';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
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
  const [numberOfLives, setNumberOfLives] = useState(NUMBER_OF_LIVES);

  useEffect(() => {
    loadGameWords().then(setWords);
  }, []);

  const currentWord = words[currentIndex];
  const startGame = () => setGameStarted(true);
  const resetGame = () => {
    setGameStarted(true);
    setNumberOfLives(NUMBER_OF_LIVES);
    setGuessedGender('');
    setScore(0);
    setCurrentIndex(0);
    loadGameWords().then(setWords);
  };

  const goToMenu = () => {
    resetGame();
    setGameStarted(false);
  };

  function guessGender(guessedGender: Gender, correctGender: Gender) {
    if (guessedGender === correctGender) {
      setScore((s) => s + 1);
    } else if (guessedGender !== correctGender) {
      setNumberOfLives((l) => l - 1);
    }
    setGuessedGender(guessedGender);
  }

  function nextWord() {
    setCurrentIndex((i) => i + 1);
    setGuessedGender('');
  }

  if (gameStarted && (!currentWord || numberOfLives === 0)) {
    return (
      <GameOverView restartGame={resetGame} goToMenu={goToMenu} score={score} />
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
          currentScore={score}
          numberOfLives={numberOfLives}
        />
      )}
    </View>
  );
}
