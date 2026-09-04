-- Tavsiya etilgan Postgres / Supabase sxemasi (oddiy boshlang'ich)
-- Jadvallar: categories, questions, attempts, users, mistakes, years, codes

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS categories (
  key TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  accent TEXT
);

CREATE TABLE IF NOT EXISTS questions (
  id BIGSERIAL PRIMARY KEY,
  category_key TEXT REFERENCES categories(key) ON DELETE CASCADE,
  q TEXT NOT NULL,
  options JSONB NOT NULL,
  correct INTEGER NOT NULL,
  article TEXT,
  exp TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  name TEXT,
  provider TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attempts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  category_key TEXT,
  total_questions INTEGER,
  correct_count INTEGER,
  pct INTEGER,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  finished_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS mistakes (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  question_id BIGINT REFERENCES questions(id),
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  note TEXT
);

CREATE TABLE IF NOT EXISTS years (
  id BIGSERIAL PRIMARY KEY,
  year TEXT,
  date TEXT,
  title TEXT,
  description TEXT
);

CREATE TABLE IF NOT EXISTS codes (
  id BIGSERIAL PRIMARY KEY,
  name TEXT,
  date TEXT,
  url TEXT
);

CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category_key);
CREATE INDEX IF NOT EXISTS idx_attempts_user ON attempts(user_id);
