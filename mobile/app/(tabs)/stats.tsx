import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';

const COLORS = {
  bg: '#36333a',
  primary: '#b1b7a2',
  accent: '#abec13',
  text: '#f5f5f5',
  textMuted: 'rgba(245,245,245,0.6)',
  card: '#403d44',
};

export default function StatsScreen() {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<{
    totalFocusMinutes?: number;
    totalPauseMinutes?: number;
    categoryBreakdown?: { category: string; done_count: string; skipped_count: string }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    api
      .get('/stats')
      .then(res => setData(res.data))
      .catch(() => setData({ totalFocusMinutes: 0, totalPauseMinutes: 0 }))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.row}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Total Focus Time</Text>
          <Text style={styles.cardValue}>{data?.totalFocusMinutes ?? 0}m</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Total HappyPause Time</Text>
          <Text style={styles.cardValue}>{data?.totalPauseMinutes ?? 0}m</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Category Breakdown</Text>
      {data?.categoryBreakdown?.length ? (
        data.categoryBreakdown.map((c, i) => (
          <View key={i} style={styles.rowItem}>
            <Text style={styles.rowLabel}>{c.category || 'Other'}</Text>
            <Text style={styles.rowValue}>
              Done: {c.done_count} | Skipped: {c.skipped_count}
            </Text>
          </View>
        ))
      ) : (
        <Text style={styles.empty}>No data yet</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 24 },
  center: { flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  card: {
    flex: 1,
    backgroundColor: COLORS.card,
    padding: 20,
    borderRadius: 16,
  },
  cardLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: 4 },
  cardValue: { fontFamily: 'Poppins_700Bold', fontSize: 24, color: COLORS.accent },
  sectionTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 18, color: COLORS.text, marginBottom: 16 },
  rowItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  rowLabel: { fontFamily: 'Poppins_400Regular', color: COLORS.text },
  rowValue: { fontSize: 12, color: COLORS.textMuted },
  empty: { color: COLORS.textMuted, marginTop: 16 },
});
