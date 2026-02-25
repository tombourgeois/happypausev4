import { Router, Request, Response } from 'express';
import pool from '../db/pool.js';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const r = await pool.query('SELECT id, category_name FROM categories ORDER BY id');
  res.json(r.rows);
});

export default router;
