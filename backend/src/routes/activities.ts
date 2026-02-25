import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', '..', 'public', 'uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    const id = (req as Request & { activityId?: string }).activityId || Date.now();
    cb(null, `${id}${ext}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response) => {
  const userId = req.userId!;
  const catPrefs = await pool.query(
    'SELECT category_id, enabled FROM user_category_preferences WHERE user_id = $1',
    [userId]
  );
  const prefMap = Object.fromEntries(catPrefs.rows.map((r: { category_id: number; enabled: boolean }) => [r.category_id, r.enabled]));
  const allCats = [1, 2, 3, 4, 5, 6];
  const enabledIds = catPrefs.rows.length === 0
    ? allCats
    : allCats.filter(c => prefMap[c] !== false);
  let query = `
    SELECT a.id, a.category_id, c.category_name, a.title, a.description, a.url, a.thumbs_pref, a.image_ext, a.creator_user_id
    FROM activities a
    JOIN categories c ON a.category_id = c.id
  `;
  const params: (number | number[])[] = [];
  if (enabledIds.length > 0) {
    query += ' WHERE a.category_id = ANY($1::int[])';
    params.push(enabledIds);
  }
  query += ' ORDER BY a.category_id, a.id';
  const r = await pool.query(query, params.length ? params : undefined);
  res.json(r.rows);
});

router.post('/', requireAuth, async (req: Request, res: Response) => {
  const { category_id, title, description, url } = req.body;
  if (!category_id || !title) {
    return res.status(400).json({ error: 'category_id and title required' });
  }
  const nextId = await getNextActivityId(category_id);
  await pool.query(
    `INSERT INTO activities (id, category_id, title, description, url, thumbs_pref, creator_user_id)
     VALUES ($1, $2, $3, $4, $5, 0, $6)`,
    [nextId, category_id, title, description || null, url || null, req.userId]
  );
  const r = await pool.query(
    'SELECT a.*, c.category_name FROM activities a JOIN categories c ON a.category_id = c.id WHERE a.id = $1',
    [nextId]
  );
  res.status(201).json(r.rows[0]);
});

router.post('/:id/upload', requireAuth, (req, res, next) => {
  (req as Request & { activityId?: string }).activityId = req.params.id;
  upload.single('image')(req, res, async (err) => {
    if (err) {
      console.error('[upload] multer error:', err.message);
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      console.error('[upload] no file in request');
      return res.status(400).json({ error: 'No image file received' });
    }
    const ext = path.extname(req.file.originalname) || '.png';
    console.log(`[upload] saved ${req.params.id}${ext} to ${uploadsDir}`);
    await pool.query('UPDATE activities SET image_ext = $1 WHERE id = $2', [ext, req.params.id]);
    res.json({ ok: true, imageUrl: `/uploads/${req.params.id}${ext}` });
  });
});

router.post('/:id/thumb-up', requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id;
  await pool.query(
    `UPDATE activities SET thumbs_pref = LEAST(10, thumbs_pref + 1) WHERE id = $1`,
    [id]
  );
  res.json({ ok: true });
});

router.post('/:id/thumb-down', requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id;
  await pool.query(
    `UPDATE activities SET thumbs_pref = GREATEST(-10, thumbs_pref - 1) WHERE id = $1`,
    [id]
  );
  res.json({ ok: true });
});

async function getNextActivityId(categoryId: number): Promise<string> {
  const r = await pool.query(
    `SELECT id FROM activities WHERE category_id = $1 ORDER BY id DESC LIMIT 1`,
    [categoryId]
  );
  const last = r.rows[0]?.id;
  const seq = last ? BigInt(last) % BigInt(100000000) + BigInt(1) : 1n;
  const batch = 1;
  const custom = 1;
  const cat = String(categoryId).padStart(3, '0');
  const seqStr = String(seq).padStart(8, '0');
  return `${batch}${custom}${cat}${seqStr}`;
}

export default router;
