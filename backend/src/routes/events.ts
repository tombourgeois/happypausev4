import { Router, Request, Response } from 'express';
import pool from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, async (req: Request, res: Response) => {
  const body = Array.isArray(req.body) ? req.body : [req.body];
  const userId = req.userId!;
  for (const ev of body) {
    const { event_type, activity_id, category, payload } = ev;
    if (!event_type) continue;
    await pool.query(
      `INSERT INTO events (user_id, event_type, activity_id, category, payload)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, event_type, activity_id || null, category || null, payload ? JSON.stringify(payload) : null]
    );
  }
  res.json({ ok: true });
});

router.post('/user-activity-shown', requireAuth, async (req: Request, res: Response) => {
  const { activity_id } = req.body;
  if (!activity_id) return res.status(400).json({ error: 'activity_id required' });
  await pool.query(
    `INSERT INTO user_activity_shown (user_id, activity_id) VALUES ($1, $2)`,
    [req.userId, activity_id]
  );
  res.json({ ok: true });
});

router.get('/', requireAuth, async (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
  const r = await pool.query(
    `SELECT id, event_type, activity_id, category, payload, created_at
     FROM events WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [req.userId, limit]
  );
  res.json(r.rows);
});

export default router;
