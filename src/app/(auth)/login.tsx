import { supabase } from '@/src/lib/supabase';
import { Button, View } from 'react-native';

export default function Login() {
  const signInWithGithub = async () => {
    const redirectTo = `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo },
    });
    if (error) {
      console.log('OAuth error:', error.message);
    }
  };

  return (
    <View style={{ padding: 16 }}>
      <Button title="Continue with GitHub" onPress={signInWithGithub} />
    </View>
  );
}
