import { Linking, StyleSheet, Text, View } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  titleText: {
    marginTop: 40,
    marginBottom: 20,
    fontSize: 24,
  },
  linkText: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  legalText: {
    marginTop: 20,
  },
});

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>Legal information</Text>
      <Text style={styles.legalText}>
        The language data that is used in this app comes from{' '}
        <Text
          style={styles.linkText}
          dataDetectorType="link"
          onPress={() => Linking.openURL('https://bin.arnastofnun.is')}
        >
          The Database of Icelandic Morphology. The Árni Magnússon Institute for
          Icelandic Studies. Author and editor Kristín Bjarnadóttir
        </Text>
      </Text>
      <Text style={styles.legalText}>
        It is used with license{' '}
        <Text
          style={styles.linkText}
          dataDetectorType="link"
          onPress={() =>
            Linking.openURL('https://creativecommons.org/licenses/by-sa/4.0/')
          }
        >
          Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA
          4.0)
        </Text>
      </Text>
      <Text style={styles.legalText}>
        The specific data that is being used is is{' '}
        <Text
          style={styles.linkText}
          dataDetectorType="link"
          onPress={() =>
            Linking.openURL('https://bin.arnastofnun.is/DMII/LTdata/word-list/')
          }
        >
          the list of headwords
        </Text>
        . It has been modified in the following way: The id has been removed,
        and all rows that doesn't contain nouns has been removed. It has been
        further modified in that way that only the common nouns in modern
        Icelandic has been kept, and all duplicate words have been removed.
      </Text>
      <Text></Text>
      <Text></Text>
      <Text></Text>
    </View>
  );
}
