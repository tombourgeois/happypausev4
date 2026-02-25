import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Linking } from 'react-native';
import { router } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { useTimer } from '../contexts/TimerContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { selectActivity, Activity } from '../utils/activitySelection';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COLORS = {
  bg: '#36333a',
  primary: '#b1b7a2',
  accent: '#abec13',
  text: '#f5f5f5',
  textMuted: 'rgba(245,245,245,0.6)',
  button: '#403d44',
};

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function HappyPauseScreen() {
  const { remainingSeconds, isRunning, pauseMinutes, togglePause, stop, restart } = useTimer();
  const { user } = useAuth();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [thumbsPref, setThumbsPref] = useState(0);
  const [recentShown, setRecentShown] = useState<{ user_id: number; activity_id: string; shown_at: string }[]>([]);

  const loadActivitiesAndPick = async () => {
    let acts: Activity[] = [];
    try {
      const res = await api.get('/activities');
      acts = res.data || [];
      setActivities(acts);
      await AsyncStorage.setItem('activities_cache', JSON.stringify(acts));
    } catch {
      const stored = await AsyncStorage.getItem('activities_cache');
      if (stored) {
        acts = JSON.parse(stored);
        setActivities(acts);
      }
    }
    const enabledIds = acts.length ? [...new Set(acts.map((a: Activity) => a.category_id))] : [1, 2, 3, 4, 5, 6];
    const stored = await AsyncStorage.getItem('recent_shown');
    const rec = stored ? JSON.parse(stored) : [];
    const act = selectActivity(acts, rec, enabledIds) || acts[0];
    if (act) {
      setActivity(act as Activity);
      setThumbsPref(act.thumbs_pref ?? 0);
      const entry = { user_id: user?.id || 0, activity_id: String(act.id), shown_at: new Date().toISOString() };
      const newRec = [entry, ...rec.filter((r: { activity_id: string }) => r.activity_id !== String(act.id))].slice(0, 4);
      await AsyncStorage.setItem('recent_shown', JSON.stringify(newRec));
      try {
        await api.post('/events/user-activity-shown', { activity_id: act.id });
      } catch {}
    }
  };

  useEffect(() => {
    loadActivitiesAndPick();
  }, []);

  const totalSec = pauseMinutes * 60;
  const progress = 1 - remainingSeconds / totalSec;
  const circumference = 2 * Math.PI * 134;
  const strokeDashoffset = circumference * (1 - progress);

  const handleCycle = () => loadActivitiesAndPick();
  const handleDone = async () => {
    if (activity) {
      try {
        await api.post('/events', { event_type: 'happypause_done', activity_id: activity.id, category: activity.category_name });
      } catch {}
    }
    router.back();
  };
  const handleSkip = async () => {
    if (activity) {
      try {
        await api.post('/events', { event_type: 'happypause_skipped', activity_id: activity.id, category: activity.category_name });
      } catch {}
    }
    router.back();
  };

  const thumbUp = async () => {
    if (!activity) return;
    setThumbsPref(p => Math.min(10, p + 1));
    try {
      await api.post(`/activities/${activity.id}/thumb-up`);
      await api.post('/events', { event_type: 'happypause_thumb_up', activity_id: activity.id });
    } catch {}
  };

  const thumbDown = async () => {
    if (!activity) return;
    setThumbsPref(p => Math.max(-10, p - 1));
    try {
      await api.post(`/activities/${activity.id}/thumb-down`);
      await api.post('/events', { event_type: 'happypause_thumb_down', activity_id: activity.id });
    } catch {}
  };

  const imageUri = activity
    ? activity.image_ext
      ? `${API_URL}/uploads/${activity.id}${activity.image_ext}`
      : `${API_URL}/images/activityimages/${activity.id}.png`
    : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>HAPPYPAUSE IN PROGRESS</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.circleWrap}>
        <Svg width={340} height={340} style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle cx={170} cy={170} r={162} stroke="rgba(245,245,245,0.05)" strokeWidth={6} fill="transparent" />
          <Circle
            cx={170}
            cy={170}
            r={162}
            stroke={COLORS.primary}
            strokeWidth={6}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </Svg>
        <TouchableOpacity
          style={styles.circleTouch}
          onPress={() => activity?.url && Linking.openURL(activity.url)}
          activeOpacity={1}
        >
          <View style={styles.circleContent}>
            {activity && (
              <>
                <Text style={styles.category}>{activity.category_name || 'ACTIVITY'}</Text>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityDesc}>{activity.description || ''}</Text>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.activityImage} />
                ) : (
                  <View style={styles.imagePlaceholder} />
                )}
                <Text style={styles.breakTime}>{formatTime(remainingSeconds)}</Text>
                <Text style={styles.remaining}>remaining</Text>
              </>
            )}
          </View>
        </TouchableOpacity>
        <Text style={styles.pressMore}>PRESS TO KNOW MORE</Text>
      </View>

      <View style={styles.thumbs}>
        <TouchableOpacity style={styles.thumbBtn} onPress={thumbDown}>
          <Text style={styles.thumbIcon}>👎</Text>
          {thumbsPref < 0 && <Text style={styles.thumbScore}>{thumbsPref}</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.thumbBtn} onPress={thumbUp}>
          <Text style={styles.thumbIcon}>👍</Text>
          {thumbsPref > 0 && <Text style={styles.thumbScore}>+{thumbsPref}</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn} onPress={handleCycle}>
          <Text style={styles.controlIcon}>↻</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlBtn, styles.controlBtnMain]} onPress={handleDone}>
          <Text style={styles.controlIconMain}>✓</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={handleSkip}>
          <Text style={styles.controlIcon}>⏭</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/create-happypause')}>
        <Text style={styles.createBtnText}>Create a HappyPause</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  closeBtn: { fontSize: 20, color: COLORS.primary },
  title: { fontFamily: 'Poppins_700Bold', fontSize: 12, color: COLORS.textMuted, letterSpacing: 2 },
  circleWrap: { alignItems: 'center', position: 'relative' },
  circleTouch: { position: 'absolute', width: 340, height: 340, alignItems: 'center', justifyContent: 'center' },
  circleContent: { alignItems: 'center', padding: 24 },
  category: { fontFamily: 'Poppins_700Bold', fontSize: 11, color: COLORS.primary, letterSpacing: 2, marginBottom: 4 },
  activityTitle: { fontFamily: 'Poppins_700Bold', fontSize: 22, color: COLORS.text, textAlign: 'center' },
  activityDesc: { fontSize: 12, color: COLORS.textMuted, marginTop: 4, textAlign: 'center' },
  activityImage: { width: 120, height: 40, marginTop: 16, resizeMode: 'contain' },
  imagePlaceholder: { width: 120, height: 40, backgroundColor: COLORS.button, marginTop: 16 },
  breakTime: { fontFamily: 'Poppins_700Bold', fontSize: 28, color: COLORS.text, marginTop: 16 },
  remaining: { fontSize: 10, color: COLORS.textMuted, marginTop: 4 },
  pressMore: { fontSize: 8, color: COLORS.textMuted, marginTop: 8 },
  thumbs: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 16 },
  thumbBtn: { alignItems: 'center' },
  thumbIcon: { fontSize: 24 },
  thumbScore: { fontSize: 12, color: COLORS.accent },
  controls: { flexDirection: 'row', justifyContent: 'center', gap: 32, marginTop: 24 },
  controlBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(245,245,245,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnMain: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary },
  controlIcon: { fontSize: 24, color: COLORS.text },
  controlIconMain: { fontSize: 32, color: COLORS.bg },
  createBtn: {
    marginTop: 24,
    padding: 16,
    backgroundColor: COLORS.button,
    borderRadius: 12,
    alignItems: 'center',
  },
  createBtnText: { fontFamily: 'Poppins_600SemiBold', color: COLORS.text },
});
