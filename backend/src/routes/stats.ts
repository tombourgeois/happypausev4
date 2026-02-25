import { Router, Request, Response } from 'express';
import pool from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response) => {
  const userId = req.userId!;

  const focusEvents = await pool.query(
    `SELECT event_type, payload, created_at FROM events
     WHERE user_id = $1 AND event_type IN ('focus_started', 'focus_paused', 'focus_resumed', 'focus_stopped', 'focus_restarted', 'happypause_started', 'happypause_done', 'happypause_skipped', 'happypause_cycled')
     ORDER BY created_at ASC`,
    [userId]
  );

  let totalFocusMs = 0;
  let totalPauseMs = 0;
  let focusStart: Date | null = null;
  let pauseStart: Date | null = null;
  let focusDuration = 55 * 60 * 1000;
  let pauseDuration = 5 * 60 * 1000;

  for (const ev of focusEvents.rows) {
    const ts = new Date(ev.created_at).getTime();
    if (ev.event_type === 'focus_started' || ev.event_type === 'focus_restarted') {
      if (focusStart) totalFocusMs += ts - focusStart.getTime();
      focusStart = new Date(ev.created_at);
    } else if (ev.event_type === 'focus_paused') {
      if (focusStart) {
        totalFocusMs += ts - focusStart.getTime();
        focusStart = null;
      }
    } else if (ev.event_type === 'focus_resumed') {
      focusStart = new Date(ev.created_at);
    } else if (ev.event_type === 'focus_stopped') {
      if (focusStart) {
        totalFocusMs += ts - focusStart.getTime();
        focusStart = null;
      }
    } else if (ev.event_type === 'happypause_started') {
      if (focusStart) {
        totalFocusMs += ts - focusStart.getTime();
        focusStart = null;
      }
      pauseStart = new Date(ev.created_at);
    } else if (ev.event_type === 'happypause_done' || ev.event_type === 'happypause_skipped' || ev.event_type === 'happypause_cycled') {
      if (pauseStart) {
        totalPauseMs += ts - pauseStart.getTime();
        pauseStart = null;
      }
    }
  }
  if (focusStart) totalFocusMs += Date.now() - focusStart.getTime();
  if (pauseStart) totalPauseMs += Date.now() - pauseStart.getTime();

  const categoryBreakdown = await pool.query(
    `SELECT c.category_name as category,
       SUM(CASE WHEN e.event_type = 'happypause_done' THEN 1 ELSE 0 END)::int as done_count,
       SUM(CASE WHEN e.event_type = 'happypause_skipped' THEN 1 ELSE 0 END)::int as skipped_count
     FROM events e
     LEFT JOIN activities a ON e.activity_id = a.id
     LEFT JOIN categories c ON a.category_id = c.id
     WHERE e.user_id = $1 AND e.event_type IN ('happypause_done', 'happypause_skipped')
     GROUP BY c.category_name`,
    [userId]
  );

  const weekly = await pool.query(
    `SELECT date_trunc('day', created_at) as day, event_type, COUNT(*) as cnt
     FROM events
     WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
     GROUP BY date_trunc('day', created_at), event_type`,
    [userId]
  );

  res.json({
    totalFocusMinutes: Math.round(totalFocusMs / 60000),
    totalPauseMinutes: Math.round(totalPauseMs / 60000),
    categoryBreakdown: categoryBreakdown.rows,
    weekly: weekly.rows,
  });
});

export default router;
