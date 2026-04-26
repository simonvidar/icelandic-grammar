import { supabase } from '@/src/lib/supabase';
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { Button, Image, Text, View } from 'react-native';

export default function DrawerContent(props: DrawerContentComponentProps) {
  const [user, setUser] = useState<User | null>(null);

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

  return (
    <DrawerContentScrollView {...props}>
      <View style={{ padding: 16, gap: 8 }}>
        {profile?.avatar_url ? (
          <Image
            source={{ uri: profile?.avatar_url }}
            style={{ width: 48, height: 48, borderRadius: 24 }}
          />
        ) : null}
        <Text>
          {profile?.display_name ?? (user ? 'Logged in' : 'Not logged in')}
        </Text>
        {user ? <Button title="Log out" onPress={handleLogout} /> : null}
      </View>
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}
