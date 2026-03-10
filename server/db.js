/**
 * Database abstraction layer
 *
 * DB_DRIVER=json  (default) — JSON file storage (development)
 * DB_DRIVER=postgres        — PostgreSQL (production)
 *
 * JSON mode exports: readDb, writeDb, updateDb
 * Postgres mode: import db-postgres.js directly for async query functions
 */

const fs = require('fs');
const path = require('path');

const DB_DRIVER = process.env.DB_DRIVER || 'json';

// --- JSON file driver (default) ---

const dataDir = path.join(__dirname, 'data');
const dbFile = path.join(dataDir, 'db.json');

const defaultDb = {
  users: [],
  pets: [],
  conversations: [],
  messages: [],
};

function ensureDb() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(dbFile, JSON.stringify(defaultDb, null, 2));
  }
}

function readDb() {
  ensureDb();
  const raw = fs.readFileSync(dbFile, 'utf8');
  return JSON.parse(raw);
}

function writeDb(nextDb) {
  ensureDb();
  fs.writeFileSync(dbFile, JSON.stringify(nextDb, null, 2));
}

function updateDb(mutator) {
  const db = readDb();
  const nextDb = mutator(db) ?? db;
  writeDb(nextDb);
  return nextDb;
}

module.exports = {
  DB_DRIVER,
  readDb,
  writeDb,
  updateDb,
};
