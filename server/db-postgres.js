/**
 * PostgreSQL database adapter
 *
 * Setup:
 * 1. npm install pg
 * 2. Set DATABASE_URL environment variable
 * 3. Run: psql -d pet_chat -f server/schema.sql
 * 4. Set DB_DRIVER=postgres in environment
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});

// --- Users ---

async function findUserByEmail(email) {
  const { rows } = await pool.query(
    'SELECT id, email, plan, auth_token AS "authToken", created_at AS "createdAt" FROM users WHERE email = $1',
    [email],
  );
  return rows[0] || null;
}

async function findUserByToken(authToken) {
  if (!authToken) return null;
  const { rows } = await pool.query(
    'SELECT id, email, plan, auth_token AS "authToken" FROM users WHERE auth_token = $1',
    [authToken],
  );
  return rows[0] || null;
}

async function createUser({ id, email, plan, authToken }) {
  const { rows } = await pool.query(
    'INSERT INTO users (id, email, plan, auth_token) VALUES ($1, $2, $3, $4) RETURNING id, email, plan, auth_token AS "authToken"',
    [id, email, plan, authToken],
  );
  return rows[0];
}

async function updateUserToken(id, authToken) {
  await pool.query('UPDATE users SET auth_token = $1 WHERE id = $2', [authToken, id]);
}

async function updateUserPlan(id, plan) {
  const { rows } = await pool.query(
    'UPDATE users SET plan = $1 WHERE id = $2 RETURNING id, email, plan, auth_token AS "authToken"',
    [plan, id],
  );
  return rows[0] || null;
}

// --- Pets ---

async function findPetsByUserId(userId) {
  const { rows } = await pool.query(
    `SELECT id, user_id AS "userId", name, nickname, species, gender, personality,
            first_person AS "firstPerson", owner_call AS "ownerCall", tone,
            avatar_uri AS "avatarUri", session_key AS "sessionKey", created_at AS "createdAt"
     FROM pets WHERE user_id = $1 ORDER BY created_at`,
    [userId],
  );
  return rows;
}

async function findPetByIdAndUser(petId, userId) {
  const { rows } = await pool.query(
    `SELECT id, user_id AS "userId", name, nickname, species, gender, personality,
            first_person AS "firstPerson", owner_call AS "ownerCall", tone,
            avatar_uri AS "avatarUri", session_key AS "sessionKey"
     FROM pets WHERE id = $1 AND user_id = $2`,
    [petId, userId],
  );
  return rows[0] || null;
}

async function countPetsByUserId(userId) {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM pets WHERE user_id = $1', [userId]);
  return rows[0].count;
}

async function createPet(pet) {
  const { rows } = await pool.query(
    `INSERT INTO pets (id, user_id, name, nickname, species, gender, personality, first_person, owner_call, tone, avatar_uri, session_key)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING id, user_id AS "userId", name, nickname, species, gender, personality,
               first_person AS "firstPerson", owner_call AS "ownerCall", tone,
               avatar_uri AS "avatarUri", session_key AS "sessionKey", created_at AS "createdAt"`,
    [pet.id, pet.userId, pet.name, pet.nickname, pet.species, pet.gender, pet.personality, pet.firstPerson, pet.ownerCall, pet.tone, pet.avatarUri, pet.sessionKey],
  );
  return rows[0];
}

async function updatePet(petId, userId, updates) {
  const { rows } = await pool.query(
    `UPDATE pets SET name = $1, nickname = $2, species = $3, gender = $4, personality = $5,
                     first_person = $6, owner_call = $7, tone = $8, avatar_uri = $9
     WHERE id = $10 AND user_id = $11
     RETURNING id, user_id AS "userId", name, nickname, species, gender, personality,
               first_person AS "firstPerson", owner_call AS "ownerCall", tone,
               avatar_uri AS "avatarUri", session_key AS "sessionKey"`,
    [updates.name, updates.nickname, updates.species, updates.gender, updates.personality, updates.firstPerson, updates.ownerCall, updates.tone, updates.avatarUri, petId, userId],
  );
  return rows[0] || null;
}

async function deletePet(petId, userId) {
  const { rowCount } = await pool.query('DELETE FROM pets WHERE id = $1 AND user_id = $2', [petId, userId]);
  return rowCount > 0;
}

// --- Conversations ---

async function findConversation(userId, petId) {
  const { rows } = await pool.query(
    'SELECT id, user_id AS "userId", pet_id AS "petId", session_key AS "sessionKey", last_message_at AS "lastMessageAt" FROM conversations WHERE user_id = $1 AND pet_id = $2',
    [userId, petId],
  );
  return rows[0] || null;
}

async function findConversationsByUserId(userId) {
  const { rows } = await pool.query(
    'SELECT id, user_id AS "userId", pet_id AS "petId", session_key AS "sessionKey", last_message_at AS "lastMessageAt" FROM conversations WHERE user_id = $1',
    [userId],
  );
  return rows;
}

async function createConversation({ id, userId, petId, sessionKey }) {
  const { rows } = await pool.query(
    `INSERT INTO conversations (id, user_id, pet_id, session_key) VALUES ($1, $2, $3, $4)
     RETURNING id, user_id AS "userId", pet_id AS "petId", session_key AS "sessionKey", last_message_at AS "lastMessageAt"`,
    [id, userId, petId, sessionKey],
  );
  return rows[0];
}

async function ensureConversation(userId, petId, sessionKey) {
  let conv = await findConversation(userId, petId);
  if (!conv) {
    const crypto = require('crypto');
    conv = await createConversation({
      id: `conv-${crypto.randomUUID()}`,
      userId,
      petId,
      sessionKey,
    });
  }
  return conv;
}

// --- Messages ---

async function findMessagesByConversationId(conversationId) {
  const { rows } = await pool.query(
    `SELECT id, conversation_id AS "conversationId", role, content, model, created_at AS "createdAt"
     FROM messages WHERE conversation_id = $1 ORDER BY created_at`,
    [conversationId],
  );
  return rows;
}

async function createMessage({ id, conversationId, role, content, model }) {
  const { rows } = await pool.query(
    `INSERT INTO messages (id, conversation_id, role, content, model) VALUES ($1, $2, $3, $4, $5)
     RETURNING id, conversation_id AS "conversationId", role, content, model, created_at AS "createdAt"`,
    [id, conversationId, role, content, model],
  );
  // Update conversation last_message_at
  await pool.query('UPDATE conversations SET last_message_at = NOW() WHERE id = $1', [conversationId]);
  return rows[0];
}

async function countTodayMessages(userId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS count FROM messages m
     JOIN conversations c ON c.id = m.conversation_id
     WHERE c.user_id = $1 AND m.role = 'owner' AND m.created_at >= CURRENT_DATE`,
    [userId],
  );
  return rows[0].count;
}

async function close() {
  await pool.end();
}

module.exports = {
  // Users
  findUserByEmail,
  findUserByToken,
  createUser,
  updateUserToken,
  updateUserPlan,
  // Pets
  findPetsByUserId,
  findPetByIdAndUser,
  countPetsByUserId,
  createPet,
  updatePet,
  deletePet,
  // Conversations
  findConversation,
  findConversationsByUserId,
  createConversation,
  ensureConversation,
  // Messages
  findMessagesByConversationId,
  createMessage,
  countTodayMessages,
  // Lifecycle
  close,
};
