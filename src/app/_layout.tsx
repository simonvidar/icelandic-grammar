import { AuthProvider, useAuth } from '@/src/app/auth/AuthProvider';
import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';

function RootNavigator() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return;
    }

  }, [session, loading, router]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function Layout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
