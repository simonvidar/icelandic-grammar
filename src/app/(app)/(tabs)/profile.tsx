import AppButton from '@/src/components/ui/AppButton';
import Card from '@/src/components/ui/Card';
import { supabase } from '@/src/lib/supabase';
import { theme } from '@/src/theme/theme';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingBottom: theme.spacing.xxl,
  },
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  title: {
    marginTop: theme.spacing.xxl,
    fontSize: 24,
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.bold,
  },
  profileContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 22,
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.bold,
  },
  profileNameWrapper: {
    justifyContent: 'center',
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.bold,
  },
  actions: {
    marginTop: theme.spacing.xl,
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

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  const [profile, setProfile] = useState<{
    display_name: string | null;
    avatar_url: string | null;
  } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('getSession error:', error.message);
      }
      setUser(data.session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setUser(newSession?.user ?? null);
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Profile fetch error:', error.message);
        return;
      }

      setProfile(data);
    };

    fetchProfile();
  }, [user]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Sign out error:', error.message);
    }
  };

  const handleGoToLogin = () => {
    router.replace('/(auth)/login');
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((c) => c.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Profile</Text>
      <Card>
        <View style={styles.profileContainer}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>
                {profile?.display_name
                  ? getInitials(profile?.display_name)
                  : 'U'}
              </Text>
            </View>
          )}
          <View style={styles.profileNameWrapper}>
            <Text style={styles.profileName}>
              {profile?.display_name ?? (user ? 'Logged in' : 'Not logged in')}
            </Text>
          </View>
        </View>
        <View style={styles.actions}>
          {user ? (
            <AppButton
              onPress={handleLogout}
              accessibilityLabel="Log out"
              variant="danger"
            >
              Log out
            </AppButton>
          ) : (
            <AppButton onPress={handleGoToLogin} accessibilityLabel="Log in">
              Log in
            </AppButton>
          )}
        </View>
      </Card>
      {user ? (
        <Card>
          <Text style={styles.cardTitle}>My scores</Text>
          <Text style={styles.cardDescription}>
            Have a look at your scores.
          </Text>
          <AppButton
            onPress={() => router.push('/(app)/my_scores')}
            accessibilityLabel="Go to my scores"
            variant="secondary"
          >
            Go to my scores
          </AppButton>
        </Card>
      ) : (
        <Card>
          <Text style={styles.cardTitle}>Save your progress</Text>
          <Text style={styles.cardDescription}>
            Log in to save scores and view your history.
          </Text>

          <AppButton onPress={handleGoToLogin} accessibilityLabel="Log in">
            Log in
          </AppButton>
        </Card>
      )}
      <Card>
        <Text style={styles.cardTitle}>Legal information</Text>
        <Text style={styles.cardDescription}>
          See the legal information about data usage in the app.
        </Text>
        <AppButton
          onPress={() => router.push('/(app)/legal')}
          accessibilityLabel="See more"
          variant="secondary"
        >
          See more
        </AppButton>
      </Card>
    </ScrollView>
  );
}
