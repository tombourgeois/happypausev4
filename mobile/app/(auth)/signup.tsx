import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
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

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();

  const handleSignUp = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register(email, password, name);
      router.replace('/(tabs)');
    } catch (e: unknown) {
      setError((e as Error).message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join HappyPause</Text>
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
        <Text style={styles.label}>Name (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Your name"
          placeholderTextColor={COLORS.textMuted}
          value={name}
          onChangeText={setName}
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
        <TouchableOpacity style={styles.btn} onPress={handleSignUp} disabled={loading}>
          {loading ? <ActivityIndicator color={COLORS.bg} /> : <Text style={styles.btnText}>Sign Up</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Already have an account?{' '}
          <Link href="/(auth)/login" asChild>
            <Text style={styles.signupLink}>Login</Text>
          </Link>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 24, justifyContent: 'space-between' },
  header: { paddingTop: 48 },
  title: { fontSize: 28, fontFamily: 'Poppins_700Bold', color: COLORS.text },
  subtitle: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: COLORS.primary, marginTop: 4 },
  form: { flex: 1, justifyContent: 'center', maxWidth: 400 },
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
  btn: {
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: COLORS.bg },
  footer: { paddingBottom: 24 },
  footerText: { fontSize: 14, color: COLORS.primary, textAlign: 'center' },
  signupLink: { fontFamily: 'Poppins_700Bold', color: COLORS.accent },
});
