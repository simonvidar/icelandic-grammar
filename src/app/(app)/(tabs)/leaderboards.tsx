import { supabase } from '@/src/lib/supabase';
import { theme } from '@/src/theme/theme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
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
    flex: 1,
  },
  listContent: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xxl,
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
    width: 18,
  },
  avatarColumn: {
    marginHorizontal: theme.spacing.sm,
    width: 28,
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
  loadingIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: theme.spacing.xxl,
  },
  errorText: {
    color: theme.colors.danger,
    padding: theme.spacing.xl,
    textAlign: 'center',
    fontFamily: theme.fonts.semiBold,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  avatarFallback: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.bold,
  },
  anonymousAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

type LeaderboardEntry = {
  id: string;
  rank: number;
  user_id: string;
  display_name: string;
  score: number;
  difficulty: Difficulty;
  created_at: string;
  anonymous: boolean;
  avatar_url: string | null;
};

type ScoreRow = {
  id: string;
  session_id: string;
  user_id: string;
  score: number;
  visibility: Visibility;
  anonymous: boolean;
  created_at: string;
  difficulty: Difficulty;
};

type Profiles = {
  [id: string]: {
    display_name: string;
    avatar_url: string | null;
  };
};

type Visibility = 'private' | 'friends' | 'global';
type LeaderboardScope = 'global' | 'friends' | 'personal';
type Difficulty = 'very_easy' | 'easy' | 'medium' | 'hard';
type Period = 'all_time' | 'monthly' | 'weekly' | 'daily';

const leaderboardScopeOptions: { value: LeaderboardScope; label: string }[] = [
  {
    value: 'global',
    label: 'Global',
  },
  // {
  //   value: 'friends',
  //   label: 'Friends',
  // },
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

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((c) => c.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

type AvatarProps = {
  avatarUrl: string | null;
  displayName: string;
  anonymous: boolean;
};

function Avatar({ avatarUrl, displayName, anonymous }: AvatarProps) {
  if (anonymous) {
    return (
      <View style={styles.anonymousAvatar}>
        <FontAwesome size={14} name="user" color={theme.colors.textSecondary} />
      </View>
    );
  }

  return avatarUrl ? (
    <Image source={{ uri: avatarUrl }} style={styles.avatar} />
  ) : (
    <View style={styles.avatarFallback}>
      <Text style={styles.avatarInitials}>
        {displayName ? getInitials(displayName) : 'U'}
      </Text>
    </View>
  );
}

export default function Leaderboards() {
  const [scope, setScope] = useState<LeaderboardScope>('global');
  const [difficulty, setDifficulty] = useState<Difficulty>('very_easy');
  const [period, setPeriod] = useState<Period>('all_time');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('getSession error:', error.message);
      }
      setUser(data.session?.user ?? null);
    });
  }, []);

  const fetchLeaderboardEntries = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    let query = supabase
      .from('scores')
      .select(
        'id, session_id, user_id, score, visibility, anonymous, created_at, difficulty',
      )
      .eq('difficulty', difficulty);

    if (scope === 'global') {
      query.eq('visibility', 'global');
    } else if (scope === 'friends') {
      setEntries([]);
      setIsLoading(false);
      return;
    } else if (scope === 'personal') {
      if (user) {
        query.eq('user_id', user.id);
      } else {
        setEntries([]);
        setIsLoading(false);
        return;
      }
    }

    const now = new Date();
    const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

    if (period === 'monthly') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_IN_MILLISECONDS);
      query.gte('created_at', thirtyDaysAgo.toISOString());
    } else if (period === 'weekly') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_IN_MILLISECONDS);
      query.gte('created_at', sevenDaysAgo.toISOString());
    } else if (period === 'daily') {
      const twentyFourHoursAgo = new Date(now.getTime() - DAY_IN_MILLISECONDS);
      query.gte('created_at', twentyFourHoursAgo.toISOString());
    }

    const { data: entriesData, error: entriesError } = await query
      .lt('created_at', now.toISOString())
      .order('score', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);

    if (entriesError) {
      setErrorMessage(entriesError.message);
      setEntries([]);
      setIsLoading(false);
      return;
    }

    if (!entriesData) {
      setEntries([]);
      setIsLoading(false);
      return;
    }

    const userIds = [
      ...new Set(
        entriesData
          .filter((entry) => !entry.anonymous)
          .map((entry) => entry.user_id),
      ),
    ];

    const profiles: Profiles = {};

    if (userIds.length !== 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        console.error(profilesError.message);
      }

      if (profilesData) {
        profilesData.forEach((profile) => {
          profiles[profile.id] = {
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
          };
        });
      }
    }

    setEntries(
      entriesData
        .filter(
          (entry, index, self) =>
            entry.anonymous ||
            scope === 'personal' ||
            (scope === 'global' &&
              index ===
                self.findIndex(
                  (e) => e.user_id === entry.user_id && !e.anonymous,
                )),
        )
        .map((entry: ScoreRow, index: number) => {
          const profile = profiles[entry.user_id];

          const displayName = entry.anonymous
            ? 'Anonymous'
            : (profile?.display_name ?? 'Unknown player');

          const avatarUrl = entry.anonymous
            ? null
            : (profile?.avatar_url ?? null);

          return {
            id: entry.id,
            rank: index + 1,
            display_name: displayName,
            score: entry.score,
            user_id: entry.user_id,
            difficulty: entry.difficulty,
            created_at: entry.created_at,
            anonymous: entry.anonymous,
            avatar_url: avatarUrl,
          };
        }),
    );

    setIsLoading(false);
  };

  const renderScoreItem = ({ item }: { item: LeaderboardEntry }) => (
    <View style={styles.leaderboardRow}>
      <Text style={styles.placeColumn}>{item.rank}</Text>
      <View style={styles.avatarColumn}>
        <Avatar
          avatarUrl={item.avatar_url}
          displayName={item.display_name}
          anonymous={item.anonymous}
        />
      </View>
      <Text style={styles.nameColumn}>{item.display_name}</Text>
      <Text style={styles.scoreColumn}>{item.score}</Text>
    </View>
  );

  useEffect(() => {
    fetchLeaderboardEntries();
  }, [difficulty, scope, period, user?.id]);

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
        {isLoading ? (
          <View style={styles.loadingIndicator}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : errorMessage ? (
          <Text style={styles.errorText}>
            Could not load leaderboard: {errorMessage}
          </Text>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(score) => score.id}
            ListEmptyComponent={() => (
              <Text style={styles.emptyText}>No scores yet.</Text>
            )}
            renderItem={renderScoreItem}
            ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </View>
  );
}
