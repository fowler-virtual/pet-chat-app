/**
 * Migration script: JSON file DB → PostgreSQL
 *
 * Usage:
 *   1. Create database: createdb pet_chat
 *   2. Run schema: psql -d pet_chat -f server/schema.sql
 *   3. Set DATABASE_URL: export DATABASE_URL=postgres://localhost/pet_chat
 *   4. Run: node server/migrate-json-to-pg.js
 */

const { readDb } = require('./db');
const { Pool } = require('pg');

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  const db = readDb();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Users
    for (const user of db.users) {
      await client.query(
        'INSERT INTO users (id, email, plan, auth_token, created_at) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING',
        [user.id, user.email, user.plan, user.authToken, user.createdAt || new Date().toISOString()],
      );
    }
    console.log(`Migrated ${db.users.length} users`);

    // Pets
    for (const pet of db.pets) {
      await client.query(
        `INSERT INTO pets (id, user_id, name, nickname, species, gender, personality, first_person, owner_call, tone, avatar_uri, session_key, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) ON CONFLICT (id) DO NOTHING`,
        [pet.id, pet.userId, pet.name, pet.nickname || pet.name, pet.species, pet.gender || '不明', pet.personality, pet.firstPerson || pet.name, pet.ownerCall || '飼い主さん', pet.tone || 'ため口', pet.avatarUri || '', pet.sessionKey || '', pet.createdAt || new Date().toISOString()],
      );
    }
    console.log(`Migrated ${db.pets.length} pets`);

    // Conversations
    for (const conv of db.conversations) {
      await client.query(
        `INSERT INTO conversations (id, user_id, pet_id, session_key, last_message_at)
         VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`,
        [conv.id, conv.userId, conv.petId, conv.sessionKey || '', conv.lastMessageAt || new Date().toISOString()],
      );
    }
    console.log(`Migrated ${db.conversations.length} conversations`);

    // Messages
    for (const msg of db.messages) {
      await client.query(
        `INSERT INTO messages (id, conversation_id, role, content, model, created_at)
         VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
        [msg.id, msg.conversationId, msg.role, msg.content, msg.model || 'human', msg.createdAt || new Date().toISOString()],
      );
    }
    console.log(`Migrated ${db.messages.length} messages`);

    await client.query('COMMIT');
    console.log('Migration complete!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
