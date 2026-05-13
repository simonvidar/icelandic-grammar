import DrawerContent from '@/src/components/DrawerContent';
import { supabase } from '@/src/lib/supabase';
import { User } from '@supabase/supabase-js';
import { Drawer } from 'expo-router/drawer';
import { useEffect, useState } from 'react';

export default function AppLayout() {
  const [user, setUser] = useState<User | null>(null);

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

  return (
    <Drawer drawerContent={(props) => <DrawerContent {...props} />}>
      <Drawer.Screen
        name="index" // This is the name of the page and must match the url from root
        options={{
          drawerLabel: 'Home',
          title: 'Home',
        }}
      />
      <Drawer.Screen
        name="noun_gender_2/index" // This is the name of the page and must match the url from root
        options={{
          drawerLabel: 'Noun gender 2.0',
          title: 'Noun gender 2.0',
          drawerItemStyle: user ? undefined : { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="noun_gender/index" // This is the name of the page and must match the url from root
        options={{
          drawerLabel: 'Noun gender',
          title: 'Noun gender',
        }}
      />
      <Drawer.Screen
        name="legal/index" // This is the name of the page and must match the url from root
        options={{
          drawerLabel: 'Legal information',
          title: 'Legal information',
        }}
      />
    </Drawer>
  );
}
