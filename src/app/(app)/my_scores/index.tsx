import { supabase } from '@/src/lib/supabase';
import { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 40,
  },
  score: {
    marginHorizontal: 15,
    marginVertical: 8,
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#f0f0f0',

    // shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  text: {
    margin: 20,
  },
  scoreText: {
    fontSize: 30,
    fontWeight: 'bold',
  },
  scoreTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreDateText: {
    fontSize: 13,
    marginTop: 8,
    color: '#666',
  },
  difficultyBadge: {
    fontWeight: 'bold',
    fontSize: 15,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 999,
  },
});

type Difficulty = 'very_easy' | 'easy' | 'medium' | 'hard';

type ScoreVisibility = 'private' | 'friends' | 'global';

type Score = {
  id: string;
  score: number;
  difficulty: Difficulty;
  visibility: ScoreVisibility;
  anonymous: boolean;
  created_at: string;
};

const difficultyLabels: Record<Difficulty, string> = {
  very_easy: 'Very easy',
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

const difficultyBadgeColors: Record<
  Difficulty,
  { backgroundColor: string; color: string }
> = {
  very_easy: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
  },
  easy: {
    backgroundColor: '#CCFBF1',
    color: '#0F766E',
  },
  medium: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  hard: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
};

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [scores, setScores] = useState<Score[]>([]);

  const [isLoadingScores, setIsLoadingScores] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [scoresErrorMessage, setScoresErrorMessage] = useState<string | null>(
    null,
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('getSession error:', error.message);
      }
      setUser(data.session?.user ?? null);
      setIsLoadingUser(false);
    });
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }
    setIsLoadingScores(true);
    setScoresErrorMessage(null);
    supabase
      .from('scores')
      .select('id, score, difficulty, visibility, anonymous, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error(`Scores fetching error: ${error.message}`);
          setScoresErrorMessage('Could not load scores.');
          setIsLoadingScores(false);
          return;
        }
        setScores(data ?? []);
        setIsLoadingScores(false);
      });
  }, [user]);

  if (isLoadingUser || isLoadingScores) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading scores...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Log in to see your scores.</Text>
      </View>
    );
  }

  if (scoresErrorMessage) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>{scoresErrorMessage}</Text>
      </View>
    );
  }

  const renderScoreItem = ({ item }: { item: Score }) => (
    <View style={styles.score}>
      <View style={styles.scoreTopRow}>
        <Text style={styles.scoreText}>{item.score} points</Text>
        <Text
          style={[
            styles.difficultyBadge,
            difficultyBadgeColors[item.difficulty],
          ]}
        >
          {difficultyLabels[item.difficulty]}
        </Text>
      </View>

      <Text style={styles.scoreDateText}>
        {new Date(item.created_at).toISOString().split('T')[0]} ·{' '}
        {new Date(item.created_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={scores}
        keyExtractor={(score) => score.id}
        ListEmptyComponent={<Text style={styles.text}>No scores yet.</Text>}
        renderItem={renderScoreItem}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}
