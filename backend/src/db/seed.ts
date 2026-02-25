import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseCsv(filePath: string): Record<string, string>[] {
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => obj[h] = vals[i] || '');
    return obj;
  });
}

async function seed() {
  const csvPath = path.join(__dirname, '..', '..', '..', 'docs', 'HappyPause-Activities-V3.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('CSV not found:', csvPath);
    process.exit(1);
  }
  const activities = parseCsv(csvPath);
  for (const a of activities) {
    const id = BigInt(a.ID);
    const categoryId = parseInt(a.ID.toString().slice(2, 5), 10);
    await pool.query(
      `INSERT INTO activities (id, category_id, title, description, url, thumbs_pref, creator_user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET title = $3, description = $4, url = $5`,
      [id, categoryId, a.TITLE, a.DESCRIPTION, a.URL, parseInt(a.thumbs_pref || '0', 10), 1]
    );
  }
  console.log('Seeded', activities.length, 'activities');
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
