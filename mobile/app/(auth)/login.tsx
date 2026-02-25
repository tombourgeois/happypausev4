import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

const COLORS = {
  bg: '#36333a',
  input: '#444148',
  primary: '#b1b7a2',
  accent: '#abec13',
  text: '#f5f5f5',
  textMuted: 'rgba(245,245,245,0.6)',
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, signInWithGoogle, signInWithApple } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (e: unknown) {
      setError((e as Error).message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      router.replace('/(tabs)');
    } catch (e: unknown) {
      setError((e as Error).message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleApple = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithApple();
      router.replace('/(tabs)');
    } catch (e: unknown) {
      setError((e as Error).message || 'Apple sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoPlaceholder} />
        <Text style={styles.title}>HappyPause</Text>
        <Text style={styles.subtitle}>Take a pause. Be happy.</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="hello@happypause.com"
          placeholderTextColor={COLORS.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor={COLORS.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color={COLORS.bg} /> : <Text style={styles.loginBtnText}>Login</Text>}
        </TouchableOpacity>

        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.orLine} />
        </View>

        <TouchableOpacity style={styles.socialBtn} onPress={handleGoogle} disabled={loading}>
          <Text style={styles.socialBtnText}>Continue with Google</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.socialBtn, styles.appleBtn]} onPress={handleApple} disabled={loading}>
          <Text style={styles.appleBtnText}>Continue with Apple</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Don't have an account?{' '}
          <Link href="/(auth)/signup" asChild>
            <Text style={styles.signupLink}>Sign Up</Text>
          </Link>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 24, justifyContent: 'space-between' },
  header: { alignItems: 'center', paddingTop: 48 },
  logoPlaceholder: { width: 96, height: 96, backgroundColor: '#fff', borderRadius: 16, marginBottom: 16 },
  title: { fontSize: 28, fontFamily: 'Poppins_700Bold', color: COLORS.text },
  subtitle: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: COLORS.primary, marginTop: 4 },
  form: { flex: 1, justifyContent: 'center', maxWidth: 400, width: '100%', alignSelf: 'center' },
  label: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: COLORS.primary, marginBottom: 8, marginLeft: 4 },
  input: {
    height: 56,
    backgroundColor: COLORS.input,
    borderRadius: 12,
    paddingHorizontal: 16,
    color: COLORS.text,
    fontSize: 16,
    marginBottom: 16,
  },
  error: { color: '#ff6b6b', fontSize: 12, marginBottom: 8 },
  loginBtn: {
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginBtnText: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: COLORS.bg },
  orRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  orLine: { flex: 1, height: 1, backgroundColor: 'rgba(177,183,162,0.3)' },
  orText: { fontSize: 12, fontFamily: 'Poppins_700Bold', color: COLORS.textMuted, marginHorizontal: 12 },
  socialBtn: {
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  socialBtnText: { fontFamily: 'Poppins_400Regular', color: '#3c4043' },
  appleBtn: { backgroundColor: '#000' },
  appleBtnText: { fontFamily: 'Poppins_400Regular', color: '#fff' },
  footer: { paddingBottom: 24 },
  footerText: { fontSize: 14, color: COLORS.primary, textAlign: 'center' },
  signupLink: { fontFamily: 'Poppins_700Bold', color: COLORS.accent },
});
