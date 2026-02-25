import { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { useTimer } from '../../contexts/TimerContext';
import { logEvent } from '../../lib/events';

const COLORS = {
  bg: '#36333a',
  primary: '#b1b7a2',
  text: '#f5f5f5',
  textMuted: 'rgba(245,245,245,0.5)',
  button: '#403d44',
};

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function getEndTime(sec: number) {
  const d = new Date();
  d.setSeconds(d.getSeconds() + sec);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function TimerScreen() {
  const {
    mode,
    remainingSeconds,
    isRunning,
    focusMinutes,
    startFocus,
    startHappyPause,
    togglePause,
    stop,
    restart,
    registerOnFocusEnd,
    registerOnHappyPauseEnd,
  } = useTimer();

  useEffect(() => {
    const unregFocus = registerOnFocusEnd(() => {
      logEvent('happypause_started');
      startHappyPause();
      router.push('/happypause');
    });
    const unregPause = registerOnHappyPauseEnd(() => {
      startFocus();
      logEvent('focus_started');
      router.back();
    });
    return () => {
      unregFocus();
      unregPause();
    };
  }, [registerOnFocusEnd, registerOnHappyPauseEnd, startFocus, startHappyPause]);

  if (mode === 'happypause') {
    return null;
  }

  const totalSec = focusMinutes * 60;
  const progress = 1 - remainingSeconds / totalSec;
  const circumference = 2 * Math.PI * 48;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={styles.container}>
      <View style={styles.circleWrap}>
        <Svg width={280} height={280} style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle
            cx={140}
            cy={140}
            r={134}
            stroke="rgba(245,245,245,0.1)"
            strokeWidth={6}
            fill="transparent"
          />
          <Circle
            cx={140}
            cy={140}
            r={134}
            stroke={COLORS.primary}
            strokeWidth={6}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </Svg>
        <View style={styles.circleContent}>
          <View style={styles.capsule}>
            <Text style={styles.capsuleText}>FOCUS SESSION</Text>
          </View>
          <Text style={styles.endsAt}>Ends at {getEndTime(remainingSeconds)}</Text>
          <Text style={styles.time}>{formatTime(remainingSeconds)}</Text>
          <Text style={styles.untilBreak}>Until break</Text>
          <TouchableOpacity
            style={styles.happyPauseBtn}
            onPress={() => {
              logEvent('happypause_started');
              startHappyPause();
              router.push('/happypause');
            }}
          >
            <Text style={styles.happyPauseBtnText}>Have a HappyPause</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn} onPress={() => { logEvent('focus_stopped'); stop(); }}>
          <Text style={styles.controlIcon}>⏹</Text>
        </TouchableOpacity>
        <TouchableOpacity
            style={[styles.controlBtn, styles.controlBtnMain]}
            onPress={() => {
              if (!isRunning && remainingSeconds === focusMinutes * 60) logEvent('focus_started');
              else logEvent(isRunning ? 'focus_paused' : 'focus_resumed');
              togglePause();
            }}
          >
          <Text style={styles.controlIconMain}>{isRunning ? '⏸' : '▶'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={() => { logEvent('focus_restarted'); restart(); }}>
          <Text style={styles.controlIcon}>↻</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
  circleWrap: { width: 280, height: 280, alignItems: 'center', justifyContent: 'center' },
  circleContent: { position: 'absolute', alignItems: 'center' },
  capsule: {
    backgroundColor: 'rgba(177,183,162,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 4,
  },
  capsuleText: { fontFamily: 'Poppins_700Bold', fontSize: 10, color: COLORS.primary, letterSpacing: 2 },
  endsAt: { fontSize: 11, color: COLORS.textMuted, marginBottom: 8 },
  time: { fontFamily: 'Poppins_700Bold', fontSize: 56, color: COLORS.text, letterSpacing: -2 },
  untilBreak: { fontSize: 10, color: COLORS.textMuted, marginTop: 8, letterSpacing: 2 },
  happyPauseBtn: {
    marginTop: 24,
    backgroundColor: 'rgba(245,245,245,0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(245,245,245,0.1)',
  },
  happyPauseBtnText: { fontFamily: 'Poppins_700Bold', fontSize: 11, color: COLORS.text },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 32, marginTop: 48 },
  controlBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(245,245,245,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(245,245,245,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnMain: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary },
  controlIcon: { fontSize: 24, color: COLORS.text },
  controlIconMain: { fontSize: 32, color: COLORS.bg },
});
