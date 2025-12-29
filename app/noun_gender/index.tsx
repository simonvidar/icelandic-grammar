import { loadGameWords } from "@/game/LoadGameWords";
import { WordEntry } from "@/types/word";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  titleText: {
  },
});

export default function Index() {

  const [words, setWords] = useState<WordEntry[]>([]);

  useEffect(() => {
    loadGameWords().then(setWords);
  }, []);

  return (
    <View
      style={styles.container}
    >
      <Text>Noun Gender</Text>
      <>
      {words.map(w => (
        <Text key={w.word}>
          {w.word}
        </Text>
      ))}</>
    </View>
  );
}
