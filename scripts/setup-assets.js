#!/usr/bin/env node
/**
 * HappyPause Asset Transfer Script
 * - Copies ringtones from docs/ringtones to mobile/assets/sounds
 * - Copies activity images to backend/public/images/activityimages
 * - Renames images to {13-digit-id}.png based on CSV
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const RINGTONES_SRC = path.join(ROOT, 'docs', 'ringtones');
const RINGTONES_DST = path.join(ROOT, 'mobile', 'assets', 'sounds');
const IMAGES_SRC = path.join(ROOT, 'docs', 'activityimages');
const IMAGES_DST = path.join(ROOT, 'backend', 'public', 'images', 'activityimages');
const CSV_PATH = path.join(ROOT, 'docs', 'HappyPause-Activities-V3.csv');
const UPLOADS_DST = path.join(ROOT, 'backend', 'public', 'uploads');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log('Created:', dir);
  }
}

function copyRingtones() {
  ensureDir(RINGTONES_DST);
  if (fs.existsSync(RINGTONES_SRC)) {
    const files = fs.readdirSync(RINGTONES_SRC).filter(f => f.endsWith('.mp3'));
    for (const f of files) {
      fs.copyFileSync(path.join(RINGTONES_SRC, f), path.join(RINGTONES_DST, f));
      console.log('Copied ringtone:', f);
    }
  } else {
    console.warn('docs/ringtones/ not found - add Chimes.mp3, Piano.mp3, Spacey.mp3');
    fs.writeFileSync(path.join(RINGTONES_DST, '.gitkeep'), '');
  }
}

function parseCsv() {
  if (!fs.existsSync(CSV_PATH)) return [];
  const text = fs.readFileSync(CSV_PATH, 'utf8');
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const vals = line.split(',');
    const obj = {};
    headers.forEach((h, i) => obj[h.trim()] = vals[i]?.trim() || '');
    return obj;
  });
}

function copyActivityImages() {
  ensureDir(IMAGES_DST);
  ensureDir(UPLOADS_DST);
  const activities = parseCsv();
  const idToFilename = new Map();
  activities.forEach(a => idToFilename.set(a.ID, `${a.ID}.png`));

  if (fs.existsSync(IMAGES_SRC)) {
    const files = fs.readdirSync(IMAGES_SRC).filter(f => /\.(png|jpg|jpeg)$/i.test(f));
    const defaultImg = files.find(f => f.includes('1000100000001')) || files[0];
    for (const activity of activities) {
      const id = activity.ID;
      const targetPath = path.join(IMAGES_DST, `${id}.png`);
      const existing = files.find(f => f.replace(/\.[^.]+$/, '') === id || f.includes(id));
      if (existing) {
        const ext = path.extname(existing);
        fs.copyFileSync(path.join(IMAGES_SRC, existing), path.join(IMAGES_DST, `${id}${ext}`));
        console.log('Copied image:', existing, '->', `${id}${ext}`);
      } else if (defaultImg) {
        fs.copyFileSync(path.join(IMAGES_SRC, defaultImg), targetPath);
        console.log('Fallback image for', id, '->', targetPath);
      }
    }
  } else {
    console.warn('docs/activityimages/ not found - run seed to create placeholder');
    fs.writeFileSync(path.join(IMAGES_DST, '.gitkeep'), '');
  }
}

copyRingtones();
copyActivityImages();
console.log('Asset setup complete.');
