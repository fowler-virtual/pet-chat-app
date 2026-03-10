-- ペットとおはなし — PostgreSQL Schema
-- Usage: psql -d pet_chat -f server/schema.sql

CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  email       TEXT UNIQUE NOT NULL,
  plan        TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'plus')),
  auth_token  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pets (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  nickname     TEXT NOT NULL DEFAULT '',
  species      TEXT NOT NULL,
  gender       TEXT NOT NULL DEFAULT '不明',
  personality  TEXT NOT NULL,
  first_person TEXT NOT NULL DEFAULT '',
  owner_call   TEXT NOT NULL DEFAULT '飼い主さん',
  tone         TEXT NOT NULL DEFAULT 'ため口',
  avatar_uri   TEXT NOT NULL DEFAULT '',
  session_key  TEXT NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversations (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pet_id          TEXT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  session_key     TEXT NOT NULL DEFAULT '',
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id              TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('owner', 'pet')),
  content         TEXT NOT NULL,
  model           TEXT NOT NULL DEFAULT 'human',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pets_user_id ON pets(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_pet_id ON conversations(pet_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_users_auth_token ON users(auth_token);
