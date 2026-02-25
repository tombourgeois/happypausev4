import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTimer } from '../contexts/TimerContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

const COLORS = {
  bg: '#36333a',
  primary: '#b1b7a2',
  text: '#f5f5f5',
  textMuted: 'rgba(245,245,245,0.6)',
};

const RINGTONES = ['Chimes.mp3', 'Piano.mp3', 'Spacey.mp3'];
const CATEGORIES = [
  { id: 1, name: 'FITNESS' },
  { id: 2, name: 'LEISURE' },
  { id: 3, name: 'SOCIAL' },
  { id: 4, name: 'MIND' },
  { id: 5, name: 'SPIRITUAL' },
  { id: 6, name: 'RELAXATION' },
];

export default function SettingsScreen() {
  const { setFocusMinutes, setPauseMinutes, focusMinutes, pauseMinutes } = useTimer();
  const { isAuthenticated } = useAuth();
  const [focusVal, setFocusVal] = useState(String(focusMinutes));
  const [pauseVal, setPauseVal] = useState(String(pauseMinutes));
  const [ringtone, setRingtone] = useState('Chimes.mp3');
  const [categoryEnabled, setCategoryEnabled] = useState<Record<number, boolean>>(
    Object.fromEntries(CATEGORIES.map(c => [c.id, true]))
  );

  useEffect(() => {
    if (isAuthenticated) {
      api.get('/users/me/settings').then(res => {
        const d = res.data;
        if (d) {
          setFocusVal(String(d.focus_minutes ?? 55));
          setPauseVal(String(d.pause_minutes ?? 5));
          setRingtone(d.ringtone || 'Chimes.mp3');
          if (d.categories_enabled) setCategoryEnabled(d.categories_enabled);
        }
      });
    }
  }, [isAuthenticated]);

  const save = async () => {
    const f = parseInt(focusVal, 10) || 55;
    const p = parseInt(pauseVal, 10) || 5;
    setFocusMinutes(f);
    setPauseMinutes(p);
    await AsyncStorage.setItem('settings', JSON.stringify({ focusMinutes: f, pauseMinutes: p, ringtone, categoryEnabled }));
    if (isAuthenticated) {
      try {
        await api.patch('/users/me/settings', {
          focus_minutes: f,
          pause_minutes: p,
          ringtone,
          categories_enabled: categoryEnabled,
        });
      } catch {}
    }
    router.back();
  };

  const toggleCategory = (id: number) => {
    setCategoryEnabled(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Ringtone</Text>
        <View style={styles.ringtoneRow}>
          {RINGTONES.map(r => (
            <TouchableOpacity
              key={r}
              style={[styles.ringtoneBtn, ringtone === r && styles.ringtoneBtnActive]}
              onPress={() => setRingtone(r)}
            >
              <Text style={[styles.ringtoneText, ringtone === r && styles.ringtoneTextActive]}>{r.replace('.mp3', '')}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Visible Categories</Text>
        {CATEGORIES.map(c => (
          <TouchableOpacity key={c.id} style={styles.row} onPress={() => toggleCategory(c.id)}>
            <Text style={styles.checkbox}>{categoryEnabled[c.id] !== false ? '☑' : '☐'}</Text>
            <Text style={styles.rowText}>{c.name}</Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>Focus session time (minutes)</Text>
        <TextInput
          style={styles.input}
          value={focusVal}
          onChangeText={setFocusVal}
          keyboardType="number-pad"
          placeholder="55"
        />

        <Text style={styles.sectionTitle}>HappyPause time (minutes)</Text>
        <TextInput
          style={styles.input}
          value={pauseVal}
          onChangeText={setPauseVal}
          keyboardType="number-pad"
          placeholder="5"
        />

        <TouchableOpacity style={styles.saveBtn} onPress={save}>
          <Text style={styles.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  backBtn: { fontSize: 24, color: COLORS.primary },
  title: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: COLORS.text },
  scroll: { flex: 1 },
  content: { padding: 24 },
  sectionTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: COLORS.text, marginTop: 24, marginBottom: 12 },
  ringtoneRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  ringtoneBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8 },
  ringtoneBtnActive: { backgroundColor: COLORS.primary },
  ringtoneText: { color: COLORS.text },
  ringtoneTextActive: { color: COLORS.bg },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  checkbox: { fontSize: 18, marginRight: 12, color: COLORS.primary },
  rowText: { fontFamily: 'Poppins_400Regular', color: COLORS.text },
  input: {
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    color: COLORS.text,
    fontSize: 16,
    marginBottom: 8,
  },
  saveBtn: { marginTop: 32, padding: 16, backgroundColor: COLORS.primary, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { fontFamily: 'Poppins_700Bold', color: COLORS.bg },
  version: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', marginTop: 24 },
});
