import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useLocale } from '../../contexts/LocaleContext';

const COLORS = {
  bg: '#36333a',
  primary: '#b1b7a2',
  accent: '#abec13',
  text: '#f5f5f5',
  textMuted: 'rgba(245,245,245,0.6)',
  card: '#403d44',
};

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { t, locale, setLocale } = useLocale();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.avatar} />
        <Text style={styles.name}>{user?.username || user?.email || 'User'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {user?.id && <Text style={styles.userId}>ID: {user.id}</Text>}
      </View>

      <View style={styles.row}>
        <Text style={styles.rowLabel}>Language</Text>
        <View style={styles.langRow}>
          <TouchableOpacity style={[styles.langBtn, locale === 'EN' && styles.langBtnActive]} onPress={() => setLocale('EN')}>
            <Text style={[styles.langText, locale === 'EN' && styles.langTextActive]}>EN</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.langBtn, locale === 'FR' && styles.langBtnActive]} onPress={() => setLocale('FR')}>
            <Text style={[styles.langText, locale === 'FR' && styles.langTextActive]}>FR</Text>
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity style={styles.row} onPress={() => Linking.openURL('https://www.ajis.ca/legal')}>
        <Text style={styles.rowText}>{t.privacyPolicy}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.row} onPress={() => Linking.openURL('mailto:info@ajis.ca')}>
        <Text style={styles.rowText}>{t.helpSupport}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>{t.logout}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 24 },
  card: {
    backgroundColor: COLORS.card,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, marginBottom: 16 },
  name: { fontFamily: 'Poppins_700Bold', fontSize: 20, color: COLORS.text },
  email: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
  userId: { fontSize: 12, color: COLORS.textMuted, marginTop: 8 },
  row: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  rowLabel: { fontFamily: 'Poppins_400Regular', color: COLORS.textMuted, marginBottom: 8 },
  langRow: { flexDirection: 'row', gap: 8 },
  langBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: COLORS.card, borderRadius: 8 },
  langBtnActive: { backgroundColor: COLORS.primary },
  langText: { fontFamily: 'Poppins_400Regular', color: COLORS.text },
  langTextActive: { color: COLORS.bg },
  rowText: { fontFamily: 'Poppins_400Regular', color: COLORS.primary },
  logoutBtn: {
    marginTop: 32,
    padding: 16,
    backgroundColor: 'rgba(255,100,100,0.2)',
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: { fontFamily: 'Poppins_600SemiBold', color: '#ff6b6b' },
});
