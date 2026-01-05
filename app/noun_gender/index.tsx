import { loadGameWords } from '@/game/LoadGameWords'
import { Gender, WordEntry } from '@/types/word'
import { useEffect, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

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
})

export default function Index() {
  const [words, setWords] = useState<WordEntry[]>([])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [gameStarted, setGameStarted] = useState<boolean>(false)

  useEffect(() => {
    loadGameWords().then(setWords)
  }, [])

  const currentWord = words[currentIndex]

  function guessGender(guessedGender: Gender, correctGender: Gender) {
    if (guessedGender === correctGender) {
      alert('Correct!')
      setScore((s) => s + 1)
    } else if (guessedGender !== correctGender) {
      alert('Wrong!')
    }
    setCurrentIndex((i) => i + 1)
  }

  if (gameStarted && !currentWord) {
    return (
      <View>
        <Text>Game over 🎉</Text>
        <Text>
          Score: {score} / {words.length}
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {!gameStarted ? (
        <View style={styles.container}>
          <Text style={styles.titleText}>Noun Gender Execercise</Text>
          <Text style={styles.descriptiveText}>
            Guess the gender of the noun{'\n'}
            shown on the screen
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={() => setGameStarted(true)}
              style={styles.startButton}
              accessibilityLabel="Start the noun gender exercise"
            >
              <Text style={styles.buttonText}>Start</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.container}>
          <Text style={styles.titleText}>{currentWord.word}</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={() => guessGender('kk', currentWord.gender)}
              style={styles.genderButton}
              accessibilityLabel="Masculine"
            >
              <Text style={styles.buttonText}>Masculine</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={() => guessGender('kvk', currentWord.gender)}
              style={styles.genderButton}
              accessibilityLabel="Feminine"
            >
              <Text style={styles.buttonText}>Feminine</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={() => guessGender('hk', currentWord.gender)}
              style={styles.genderButton}
              accessibilityLabel="Neuter"
            >
              <Text style={styles.buttonText}>Neuter</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  )
}
