import { supabase } from '@/src/lib/supabase';
import { Button, View } from 'react-native';

export default function Login() {
  const signInWithOAuth = async (provider: 'github' | 'google') => {
    const redirectTo = `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });

    if (error) {
      console.error(`${provider} sign-in error:`, error.message);
    }
  };

  return (
    <View>
      <View style={{ padding: 16 }}>
        <Button
          title="Continue with GitHub"
          onPress={() => signInWithOAuth('github')}
        />
      </View>
      <View style={{ padding: 16 }}>
        <Button
          title="Continue with Google"
          onPress={() => signInWithOAuth('google')}
        />
      </View>
    </View>
  );
}
