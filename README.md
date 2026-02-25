# HappyPause

Focus timer app with guided break activities. Built with React Native (Expo) and Node.js/PostgreSQL.

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL
- Expo CLI / EAS CLI (for builds)

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with DATABASE_URL, JWT_SECRET
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

### Mobile

```bash
cd mobile
cp .env.example .env
# Set EXPO_PUBLIC_API_URL (use your machine's IP for device testing, e.g. http://192.168.1.x:3000)
npm install
node ../scripts/setup-assets.js   # Copies ringtones and activity images
npm start
```

### Assets

Place ringtones (Chimes.mp3, Piano.mp3, Spacey.mp3) in `docs/ringtones/` and activity images in `docs/activityimages/` before running the setup script.

## API Base URL

- Dev: `http://localhost:3000` (or your machine IP for physical devices)
- Prod: `https://happypausetime.mobileappslabs.ca`

## Build (EAS)

```bash
cd mobile
eas build --platform all
```
