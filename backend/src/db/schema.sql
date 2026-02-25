-- HappyPause PostgreSQL Schema

CREATE SEQUENCE IF NOT EXISTS users_id_seq START 100;

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY,
  category_name VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY DEFAULT nextval('users_id_seq'),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  name VARCHAR(255),
  surname VARCHAR(255),
  family_name VARCHAR(255),
  google_id VARCHAR(255) UNIQUE,
  apple_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT users_id_reserved CHECK (id >= 100 OR id = 1)
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS users_google_id_idx ON users(google_id);
CREATE UNIQUE INDEX IF NOT EXISTS users_apple_id_idx ON users(apple_id);

CREATE TABLE IF NOT EXISTS activities (
  id BIGINT PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  url VARCHAR(500),
  thumbs_pref INTEGER DEFAULT 0 CHECK (thumbs_pref BETWEEN -10 AND 10),
  creator_user_id INTEGER REFERENCES users(id),
  image_ext VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS activities_category_idx ON activities(category_id);

CREATE TABLE IF NOT EXISTS user_activity_shown (
  user_id INTEGER NOT NULL REFERENCES users(id),
  activity_id BIGINT NOT NULL REFERENCES activities(id),
  shown_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, activity_id, shown_at)
);

CREATE INDEX IF NOT EXISTS user_activity_shown_user_shown_idx ON user_activity_shown(user_id, shown_at DESC);
CREATE INDEX IF NOT EXISTS user_activity_shown_user_activity_idx ON user_activity_shown(user_id, activity_id);

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  event_type VARCHAR(50) NOT NULL,
  activity_id BIGINT REFERENCES activities(id),
  category VARCHAR(50),
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS events_user_timestamp_idx ON events(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  focus_minutes INTEGER DEFAULT 55,
  pause_minutes INTEGER DEFAULT 5,
  ringtone VARCHAR(50) DEFAULT 'Chimes.mp3',
  notification_on BOOLEAN DEFAULT true,
  sound_on BOOLEAN DEFAULT true,
  timezone VARCHAR(50) DEFAULT 'UTC',
  language VARCHAR(5) DEFAULT 'EN',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_category_preferences (
  user_id INTEGER NOT NULL REFERENCES users(id),
  category_id INTEGER NOT NULL REFERENCES categories(id),
  enabled BOOLEAN DEFAULT true,
  PRIMARY KEY (user_id, category_id)
);

-- Insert categories
INSERT INTO categories (id, category_name) VALUES
  (1, 'FITNESS'),
  (2, 'LEISURE'),
  (3, 'SOCIAL'),
  (4, 'MIND'),
  (5, 'SPIRITUAL'),
  (6, 'RELAXATION')
ON CONFLICT (id) DO NOTHING;

-- Admin user (id=1) - reserved
INSERT INTO users (id, email, username, password_hash, created_at, updated_at)
SELECT 1, 'admin@happypause.local', 'admin', '$2b$10$placeholder', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 1);
