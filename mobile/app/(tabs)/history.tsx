import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';

const COLORS = {
  bg: '#36333a',
  primary: '#b1b7a2',
  text: '#f5f5f5',
  textMuted: 'rgba(245,245,245,0.6)',
};

type Event = { id: number; event_type: string; activity_id?: number; category?: string; created_at: string };

export default function HistoryScreen() {
  const { isAuthenticated } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    api
      .get('/events?limit=100')
      .then(res => setEvents(res.data))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const formatDate = (s: string) => {
    const d = new Date(s);
    return d.toLocaleString();
  };

  const eventLabel = (e: Event) => {
    const labels: Record<string, string> = {
      focus_started: 'Focus started',
      focus_paused: 'Focus paused',
      focus_resumed: 'Focus resumed',
      focus_stopped: 'Focus stopped',
      focus_restarted: 'Focus restarted',
      happypause_started: 'HappyPause started',
      happypause_done: 'HappyPause done',
      happypause_skipped: 'HappyPause skipped',
      happypause_cycled: 'HappyPause cycled',
      happypause_thumb_up: 'Thumbs up',
      happypause_thumb_down: 'Thumbs down',
      happypause_created: 'HappyPause created',
    };
    return labels[e.event_type] || e.event_type;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {events.length === 0 ? (
        <Text style={styles.empty}>No events yet</Text>
      ) : (
        events.map(e => (
          <View key={e.id} style={styles.row}>
            <Text style={styles.label}>{eventLabel(e)}</Text>
            {e.category && <Text style={styles.category}>{e.category}</Text>}
            <Text style={styles.time}>{formatDate(e.created_at)}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 24 },
  center: { flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  row: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  label: { fontFamily: 'Poppins_600SemiBold', color: COLORS.text },
  category: { fontSize: 12, color: COLORS.primary, marginTop: 4 },
  time: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  empty: { color: COLORS.textMuted },
});
