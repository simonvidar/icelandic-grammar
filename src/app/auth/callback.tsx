import { supabase } from '@/src/lib/supabase';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

export default function AuthCallback() {
  const router = useRouter();
  const [debugUrl, setDebugUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setDebugUrl(window.location.href);

        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          router.replace('/');
          return;
        }

        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        const errDesc =
          url.searchParams.get('error_description') ||
          url.searchParams.get('error');

        if (errDesc) {
          setError(`OAuth returned error: ${errDesc}`);
          return;
        }

        if (!code) {
          setError('Missing ?code= in callback URL.');
          return;
        }

        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setError(error.message);
          return;
        }

        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
        router.replace('/');
      } catch (e: any) {
        setError(e?.message ?? 'Unknown error');
      }
    };

    run();
  }, [router]);

  return (
    <View style={{ padding: 16, gap: 8 }}>
      <Text>Signing you in...</Text>
      {error ? <Text>Error: {error}</Text> : null}
      {error ? <Text>Debug URL: {debugUrl}</Text> : null}
    </View>
  );
}
