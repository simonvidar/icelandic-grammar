import { supabase } from '@/src/lib/supabase';
import { useRouter } from 'expo-router';
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
  buttonContainer: {
    width: '100%',
    marginTop: 40,
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

const logout = async () => {
  console.log('Logout button pressed');
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.log('logout error:', error.message);
  }

  console.log('Logout successful');
};

export default function Index() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>Icelandic Grammar Exercies</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={() => router.navigate('/(app)/noun_gender')}
          style={styles.button}
          accessibilityLabel="Go to the noun gender exercise"
        >
          <Text style={styles.buttonText}>Noun gender exercise</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={() => logout()}
          style={styles.button}
          accessibilityLabel="Log out"
        >
          <Text style={styles.buttonText}>Log out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
