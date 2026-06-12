import { AuthProvider, useAuth } from '@/src/app/auth/AuthProvider';
import {
  NunitoSans_400Regular,
  NunitoSans_600SemiBold,
  NunitoSans_700Bold,
  useFonts,
} from '@expo-google-fonts/nunito-sans';
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
  const [fontsLoaded] = useFonts({
    NunitoSans_400Regular,
    NunitoSans_600SemiBold,
    NunitoSans_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
