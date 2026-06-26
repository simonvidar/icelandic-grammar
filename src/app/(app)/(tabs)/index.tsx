import AppButton from '@/src/components/ui/AppButton';
import Card from '@/src/components/ui/Card';
import { theme } from '@/src/theme/theme';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  quickStartButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  quickStartButton: {
    borderRadius: theme.radius.button,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderWidth: 1,
  },
  quickStartButtonText: {
    fontFamily: theme.fonts.bold,
  },
  title: {
    marginTop: theme.spacing.xxl,
    fontSize: 24,
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.bold,
  },
  cardSmallTitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.semiBold,
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

type Difficulty = 'very_easy' | 'easy' | 'medium' | 'hard';

export default function Index() {
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<Difficulty>('very_easy');

  const router = useRouter();

  const difficultyOptions: { value: Difficulty; label: string }[] = [
    { value: 'very_easy', label: 'Very easy' },
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
  ];

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
        <Text style={styles.cardSmallTitle}>Difficulty</Text>
        <View style={styles.quickStartButtons}>
          {difficultyOptions.map((difficultyOption) => {
            const isSelected = selectedDifficulty === difficultyOption.value;

            return (
              <TouchableOpacity
                onPress={() => setSelectedDifficulty(difficultyOption.value)}
                style={[
                  styles.quickStartButton,
                  {
                    backgroundColor: isSelected
                      ? theme.colors.difficultyButtonBackgrounds[
                          difficultyOption.value
                        ]
                      : theme.colors.background,
                    borderColor: isSelected
                      ? theme.colors.difficultyButtonBorderColors[
                          difficultyOption.value
                        ]
                      : theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.quickStartButtonText,
                    {
                      color: isSelected
                        ? theme.colors.difficultyButtonColors[
                            difficultyOption.value
                          ]
                        : theme.colors.textSecondary,
                    },
                  ]}
                >
                  {difficultyOption.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <AppButton
          onPress={() =>
            router.push({
              pathname: '/(app)/noun_gender',
              params: { selected_difficulty: selectedDifficulty },
            })
          }
          accessibilityLabel="Go to the noun gender exercise"
        >
          Start exercise
        </AppButton>
      </Card>
    </View>
  );
}
