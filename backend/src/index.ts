import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import activitiesRoutes from './routes/activities.js';
import categoriesRoutes from './routes/categories.js';
import eventsRoutes from './routes/events.js';
import usersRoutes from './routes/users.js';
import statsRoutes from './routes/stats.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

[path.join(__dirname, '..', 'public', 'uploads'), path.join(__dirname, '..', 'public', 'images', 'activityimages')].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log('Created dir:', dir);
  }
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));
app.use('/images', express.static(path.join(__dirname, '..', 'public', 'images')));

app.use('/auth', authRoutes);
app.use('/activities', activitiesRoutes);
app.use('/categories', categoriesRoutes);
app.use('/events', eventsRoutes);
app.use('/users', usersRoutes);
app.use('/stats', statsRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`HappyPause API running on port ${PORT}`);
});
