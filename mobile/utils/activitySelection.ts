/**
 * Weighted activity selection per HappyPause spec (thumbs algorithm).
 * Works offline with local cache.
 */

export type Activity = {
  id: string | number;
  category_id: number;
  category_name?: string;
  title: string;
  description?: string;
  url?: string;
  thumbs_pref: number;
  image_ext?: string;
  creator_user_id?: number;
};

export type ShownRecord = { user_id: number; activity_id: string | number; shown_at: string };

const MIN_WEIGHT = 0.0001;
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const RECENT_LIST_SIZE = 4;

function clamp(score: number): number {
  return Math.max(-10, Math.min(10, score));
}

function baseWeight(score: number): number {
  if (score === 0) return 1;
  if (score > 0) return score + 1;
  return 1 / (Math.abs(score) + 1);
}

function twoHourModeration(score: number, shownWithin2h: boolean): number {
  if (!shownWithin2h) return baseWeight(score);
  const magnitude = 1 + Math.abs(score);
  const reduced = Math.max(1, magnitude / 2);
  if (score >= 0) return reduced;
  return 1 / reduced;
}

export function selectActivity(
  activities: Activity[],
  recentShown: ShownRecord[],
  enabledCategoryIds: number[]
): Activity | null {
  const enabled = activities.filter(a => enabledCategoryIds.includes(a.category_id));
  if (enabled.length === 0) return null;

  const recentByUser = recentShown
    .sort((a, b) => new Date(b.shown_at).getTime() - new Date(a.shown_at).getTime())
    .slice(0, RECENT_LIST_SIZE * 10);
  const recentIds = new Set(recentByUser.map(r => String(r.activity_id)));
  const lastShownMap = new Map<string, number>();
  recentByUser.forEach(r => {
    const k = String(r.activity_id);
    if (!lastShownMap.has(k)) lastShownMap.set(k, new Date(r.shown_at).getTime());
  });
  const recentList = recentByUser
    .filter((r, i, arr) => arr.findIndex(x => String(x.activity_id) === String(r.activity_id)) === i)
    .slice(0, RECENT_LIST_SIZE)
    .map(r => String(r.activity_id));

  const now = Date.now();
  const weights = enabled.map(a => {
    const id = String(a.id);
    const score = clamp(a.thumbs_pref ?? 0);
    const shownWithin2h = (lastShownMap.get(id) || 0) > now - TWO_HOURS_MS;
    let w = twoHourModeration(score, shownWithin2h);
    if (recentList.includes(id)) w *= 0.1;
    return Math.max(MIN_WEIGHT, w);
  });

  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < enabled.length; i++) {
    r -= weights[i];
    if (r <= 0) return enabled[i];
  }
  return enabled[enabled.length - 1];
}
