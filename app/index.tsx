import { StyleSheet, Text, View } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  titleText: {
    marginTop: 40,
    fontSize: 24,
  },
});

export default function Index() {
  return (
    <View
      style={styles.container}
    >
      <Text style={styles.titleText}>Icelandic Grammar Exercies</Text>
    </View>
  );
}
