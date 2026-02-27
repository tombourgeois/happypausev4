import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { OAuth2Client } from 'google-auth-library';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRY = '7d';

function signToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

function emailToUsername(email: string): string {
  return email.split('@')[0] || 'user';
}

router.post('/register', async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  const username = name || emailToUsername(email);
  const hash = await bcrypt.hash(password, 10);
  try {
    const r = await pool.query(
      `INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3)
       RETURNING id, email, username`,
      [email, username, hash]
    );
    const user = r.rows[0];
    await pool.query(
      'INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT DO NOTHING',
      [user.id]
    );
    res.status(201).json({
      token: signToken(user.id),
      user: { id: user.id, email: user.email, username: user.username },
    });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === '23505') {
      return res.status(400).json({ error: 'Email already registered' });
    }
    throw e;
  }
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  const r = await pool.query(
    'SELECT id, email, username, password_hash FROM users WHERE email = $1',
    [email]
  );
  const user = r.rows[0];
  if (!user || !user.password_hash) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({
    token: signToken(user.id),
    user: { id: user.id, email: user.email, username: user.username },
  });
});

router.post('/google', async (req: Request, res: Response) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ error: 'idToken required' });
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(501).json({ error: 'Google sign-in not configured' });
  }
  const client = new OAuth2Client(clientId);
  let ticket;
  try {
    ticket = await client.verifyIdToken({ idToken, audience: clientId });
  } catch {
    return res.status(401).json({ error: 'Invalid Google token' });
  }
  const payload = ticket.getPayload();
  if (!payload?.email) return res.status(401).json({ error: 'Invalid Google token' });
  const googleId = payload.sub;
  const email = payload.email;
  const name = payload.name || emailToUsername(email);
  let r = await pool.query('SELECT id, email, username FROM users WHERE google_id = $1', [googleId]);
  let user = r.rows[0];
  if (!user) {
    r = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (r.rows[0]) {
      await pool.query('UPDATE users SET google_id = $1, updated_at = NOW() WHERE id = $2', [googleId, r.rows[0].id]);
      user = (await pool.query('SELECT id, email, username FROM users WHERE id = $1', [r.rows[0].id])).rows[0];
    } else {
      r = await pool.query(
        'INSERT INTO users (email, username, google_id) VALUES ($1, $2, $3) RETURNING id, email, username',
        [email, name, googleId]
      );
      user = r.rows[0];
      await pool.query('INSERT INTO user_settings (user_id) VALUES ($1)', [user.id]);
    }
  }
  res.json({
    token: signToken(user.id),
    user: { id: user.id, email: user.email, username: user.username },
  });
});

router.post('/apple', async (req: Request, res: Response) => {
  const { identityToken, name: appleName } = req.body;
  if (!identityToken) return res.status(400).json({ error: 'identityToken required' });
  const appleClientId = process.env.APPLE_CLIENT_ID;
  if (!appleClientId) {
    return res.status(501).json({ error: 'Apple sign-in not configured' });
  }
  const jwtPayload = JSON.parse(Buffer.from(identityToken.split('.')[1], 'base64').toString());
  const appleId = jwtPayload.sub;
  const email = jwtPayload.email;
  const name = appleName || emailToUsername(email || appleId);
  let r = await pool.query('SELECT id, email, username FROM users WHERE apple_id = $1', [appleId]);
  let user = r.rows[0];
  if (!user) {
    if (email) {
      r = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (r.rows[0]) {
        await pool.query('UPDATE users SET apple_id = $1, updated_at = NOW() WHERE id = $2', [appleId, r.rows[0].id]);
        user = (await pool.query('SELECT id, email, username FROM users WHERE id = $1', [r.rows[0].id])).rows[0];
      }
    }
    if (!user) {
      r = await pool.query(
        'INSERT INTO users (email, username, apple_id) VALUES ($1, $2, $3) RETURNING id, email, username',
        [email || `${appleId}@privaterelay.appleid.com`, name, appleId]
      );
      user = r.rows[0];
      await pool.query('INSERT INTO user_settings (user_id) VALUES ($1)', [user.id]);
    }
  }
  res.json({
    token: signToken(user.id),
    user: { id: user.id, email: user.email, username: user.username },
  });
});

export default router;
