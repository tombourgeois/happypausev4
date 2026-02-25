import { Router, Request, Response } from 'express';
import pool from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const r = await pool.query(
    'SELECT id, email, username, name, surname, family_name FROM users WHERE id = $1',
    [req.userId]
  );
  if (!r.rows[0]) return res.status(404).json({ error: 'User not found' });
  res.json(r.rows[0]);
});

router.patch('/me', requireAuth, async (req: Request, res: Response) => {
  const { name, surname, family_name } = req.body;
  const parts = [name, surname, family_name].filter(Boolean);
  const username = parts.length > 0 ? parts.join('') : undefined;
  const updates: string[] = [];
  const vals: (string | number)[] = [];
  let i = 1;
  if (name !== undefined) { updates.push(`name = $${i++}`); vals.push(name); }
  if (surname !== undefined) { updates.push(`surname = $${i++}`); vals.push(surname); }
  if (family_name !== undefined) { updates.push(`family_name = $${i++}`); vals.push(family_name); }
  if (username !== undefined) { updates.push(`username = $${i++}`); vals.push(username); }
  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
  vals.push(req.userId!);
  await pool.query(
    `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${i}`,
    vals
  );
  const r = await pool.query('SELECT id, email, username, name, surname, family_name FROM users WHERE id = $1', [req.userId]);
  res.json(r.rows[0]);
});

router.get('/me/settings', requireAuth, async (req: Request, res: Response) => {
  const r = await pool.query('SELECT * FROM user_settings WHERE user_id = $1', [req.userId]);
  const row = r.rows[0];
  if (!row) return res.status(404).json({ error: 'Settings not found' });
  delete row.user_id;
  const prefs = await pool.query(
    'SELECT category_id, enabled FROM user_category_preferences WHERE user_id = $1',
    [req.userId]
  );
  const categories_enabled = prefs.rows.reduce((o, p) => ({ ...o, [p.category_id]: p.enabled }), {});
  res.json({ ...row, categories_enabled });
});

router.patch('/me/settings', requireAuth, async (req: Request, res: Response) => {
  const { focus_minutes, pause_minutes, ringtone, categories_enabled, timezone, language, notification_on, sound_on } = req.body;
  await pool.query(
    `INSERT INTO user_settings (user_id, focus_minutes, pause_minutes, ringtone, timezone, language, notification_on, sound_on, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       focus_minutes = COALESCE($2, user_settings.focus_minutes),
       pause_minutes = COALESCE($3, user_settings.pause_minutes),
       ringtone = COALESCE($4, user_settings.ringtone),
       timezone = COALESCE($5, user_settings.timezone),
       language = COALESCE($6, user_settings.language),
       notification_on = COALESCE($7, user_settings.notification_on),
       sound_on = COALESCE($8, user_settings.sound_on),
       updated_at = NOW()`,
    [
      req.userId,
      focus_minutes ?? 55,
      pause_minutes ?? 5,
      ringtone ?? 'Chimes.mp3',
      timezone ?? 'UTC',
      language ?? 'EN',
      notification_on ?? true,
      sound_on ?? true,
    ]
  );
  if (categories_enabled && typeof categories_enabled === 'object') {
    for (const [catId, enabled] of Object.entries(categories_enabled)) {
      await pool.query(
        `INSERT INTO user_category_preferences (user_id, category_id, enabled)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, category_id) DO UPDATE SET enabled = $3`,
        [req.userId, parseInt(catId, 10), !!enabled]
      );
    }
  }
  const r = await pool.query('SELECT * FROM user_settings WHERE user_id = $1', [req.userId]);
  res.json(r.rows[0]);
});

export default router;
