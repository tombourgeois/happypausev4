import { api } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'event_queue';

export async function logEvent(event_type: string, payload?: { activity_id?: number; category?: string }) {
  const item = { event_type, ...payload, ts: Date.now() };
  try {
    await api.post('/events', [item]);
  } catch {
    const q = (await AsyncStorage.getItem(QUEUE_KEY)) || '[]';
    const arr = JSON.parse(q);
    arr.push(item);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(arr));
  }
}

export async function flushEventQueue() {
  try {
    const q = await AsyncStorage.getItem(QUEUE_KEY);
    if (!q) return;
    const arr = JSON.parse(q);
    if (arr.length === 0) return;
    const toSend = arr.map(({ ts, ...rest }: { ts: number }) => rest);
    await api.post('/events', toSend);
    await AsyncStorage.setItem(QUEUE_KEY, '[]');
  } catch {}
}
