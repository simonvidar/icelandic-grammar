import { theme } from '@/src/theme/theme';
import { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  title: {
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
    fontSize: 24,
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.bold,
  },
  listContainer: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.lg,
    borderRadius: theme.radius.list,
    overflow: 'hidden',

    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  emptyText: {
    padding: theme.spacing.xl,
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.regular,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
  },
  listSeparator: {
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
  },
  placeColumn: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.textSecondary,
    width: 32,
  },
  nameColumn: {
    flex: 1,
    fontFamily: theme.fonts.bold,
    color: theme.colors.textPrimary,
  },
  scoreColumn: {
    minWidth: 48,
    textAlign: 'right',
    fontFamily: theme.fonts.bold,
    color: theme.colors.textPrimary,
  },
  scopeSelector: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    marginTop: theme.spacing.lg,
    marginHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.surface,

    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  scopeOption: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.radius.button,
  },
  scopeOptionActive: {
    backgroundColor: theme.colors.primary,
  },
  scopeOptionText: {
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.semiBold,
  },
  scopeOptionTextActive: {
    color: theme.colors.textOnPrimary,
  },
  filterLabel: {
    marginTop: theme.spacing.sm,
    color: theme.colors.textSecondary,
    marginHorizontal: theme.spacing.xl,
    fontFamily: theme.fonts.semiBold,
  },
  difficultySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: theme.spacing.xl,
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  difficultyOption: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 999,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  difficultyOptionText: {
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
  },
  difficultyOptionTextActive: {
    color: theme.colors.textPrimary,
  },
  difficultyOptionActive: {
    backgroundColor: theme.colors.secondaryBackground,
    borderColor: theme.colors.primary,
  },
  periodSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: theme.spacing.xl,
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  periodOption: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 999,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  periodOptionText: {
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.semiBold,
    fontSize: 12,
  },
  periodOptionTextActive: {
    color: theme.colors.textPrimary,
  },
  periodOptionActive: {
    backgroundColor: theme.colors.secondaryBackground,
    borderColor: theme.colors.primary,
  },
});

type LeaderboardScore = {
  id: string;
  place: string;
  name: string;
  score: number;
};

type LeaderboardScope = 'global' | 'friends' | 'personal';
type Difficulty = 'very_easy' | 'easy' | 'medium' | 'hard';
type Period = 'all_time' | 'monthly' | 'weekly' | 'daily';

const scores: LeaderboardScore[] = [
  {
    id: '123',
    place: '1',
    name: 'Simon',
    score: 120,
  },
  {
    id: '124',
    place: '2',
    name: 'Anonymous',
    score: 95,
  },
  {
    id: '125',
    place: '3',
    name: 'Player',
    score: 88,
  },
  {
    id: '126',
    place: '4',
    name: 'John',
    score: 82,
  },
  {
    id: '127',
    place: '5',
    name: 'Joe',
    score: 81,
  },
  {
    id: '128',
    place: '6',
    name: 'Smith',
    score: 76,
  },
  {
    id: '129',
    place: '7',
    name: 'PLayer C',
    score: 75,
  },
  {
    id: '130',
    place: '8',
    name: 'Unknown',
    score: 70,
  },
];

const leaderboardScopeOptions: { value: LeaderboardScope; label: string }[] = [
  {
    value: 'global',
    label: 'Global',
  },
  {
    value: 'friends',
    label: 'Friends',
  },
  {
    value: 'personal',
    label: 'Personal',
  },
];

const difficultyOptions: { value: Difficulty; label: string }[] = [
  {
    value: 'very_easy',
    label: 'Very easy',
  },
  {
    value: 'easy',
    label: 'Easy',
  },
  {
    value: 'medium',
    label: 'Medium',
  },
  {
    value: 'hard',
    label: 'Hard',
  },
];

const periodOptions: { value: Period; label: string }[] = [
  {
    value: 'all_time',
    label: 'All',
  },
  {
    value: 'monthly',
    label: 'Month',
  },
  {
    value: 'weekly',
    label: 'Week',
  },
  {
    value: 'daily',
    label: 'Day',
  },
];

export default function Leaderboards() {
  const [scope, setScope] = useState<LeaderboardScope>('global');
  const [difficulty, setDifficulty] = useState<Difficulty>('very_easy');
  const [period, setPeriod] = useState<Period>('all_time');

  const renderScoreItem = ({ item }: { item: LeaderboardScore }) => (
    <View style={styles.leaderboardRow}>
      <Text style={styles.placeColumn}>{item.place}</Text>
      <Text style={styles.nameColumn}>{item.name}</Text>
      <Text style={styles.scoreColumn}>{item.score}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Leaderboards</Text>
      <View style={styles.scopeSelector}>
        {leaderboardScopeOptions.map((scopeOption) => (
          <TouchableOpacity
            key={scopeOption.value}
            onPress={() => setScope(scopeOption.value)}
            style={[
              styles.scopeOption,
              scope === scopeOption.value && styles.scopeOptionActive,
            ]}
            accessibilityRole="button"
            accessibilityState={{
              selected: scope === scopeOption.value,
            }}
          >
            <Text
              style={[
                styles.scopeOptionText,
                scope === scopeOption.value && styles.scopeOptionTextActive,
              ]}
            >
              {scopeOption.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.filterLabel}>Difficulty</Text>
      <View style={styles.difficultySelector}>
        {difficultyOptions.map((difficultyOption) => (
          <TouchableOpacity
            key={difficultyOption.value}
            onPress={() => setDifficulty(difficultyOption.value)}
            style={[
              styles.difficultyOption,
              difficulty === difficultyOption.value &&
                styles.difficultyOptionActive,
            ]}
            accessibilityRole="button"
            accessibilityState={{
              selected: difficulty === difficultyOption.value,
            }}
          >
            <Text
              style={[
                styles.difficultyOptionText,
                difficulty === difficultyOption.value &&
                  styles.difficultyOptionTextActive,
              ]}
            >
              {difficultyOption.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.filterLabel}>Period</Text>
      <View style={styles.periodSelector}>
        {periodOptions.map((periodOption) => (
          <TouchableOpacity
            key={periodOption.value}
            onPress={() => setPeriod(periodOption.value)}
            style={[
              styles.periodOption,
              period === periodOption.value && styles.periodOptionActive,
            ]}
            accessibilityRole="button"
            accessibilityState={{
              selected: period === periodOption.value,
            }}
          >
            <Text
              style={[
                styles.periodOptionText,
                period === periodOption.value && styles.periodOptionTextActive,
              ]}
            >
              {periodOption.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.listContainer}>
        <FlatList
          data={scores}
          keyExtractor={(score) => score.id}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No scores yet.</Text>
          }
          renderItem={renderScoreItem}
          ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
        />
      </View>
    </View>
  );
}
