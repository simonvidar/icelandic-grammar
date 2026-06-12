import AppButton from '@/src/components/ui/AppButton';
import Card from '@/src/components/ui/Card';
import { theme } from '@/src/theme/theme';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  title: {
    marginTop: theme.spacing.xxl,
    fontSize: 24,
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.bold,
  },
  subtitle: {
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.regular,
  },
  cardTitle: {
    fontSize: 20,
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.bold,
  },
  cardDescription: {
    fontSize: 14,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.regular,
  },
});

export default function Index() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Icelandic Grammar</Text>
      <Text style={styles.subtitle}>
        Practice Icelandic grammar and compete with your friends.
      </Text>

      <Card>
        <Text style={styles.cardTitle}>Noun Gender</Text>
        <Text style={styles.cardDescription}>
          Guess whether each noun is masculine, feminine, or neuter.
        </Text>
        <AppButton
          onPress={() => router.push('/(app)/noun_gender_2')}
          accessibilityLabel="Go to the noun gender exercise"
        >
          Start exercise
        </AppButton>
      </Card>
    </View>
  );
}
