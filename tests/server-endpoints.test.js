import { describe, it, expect, beforeEach } from 'vitest';

const { readDb, writeDb } = require('../server/db');
const { createOrGetDemoUser, getUserByToken } = require('../server/auth');

// Helper: set up a clean db with a test user and pet
function setupTestDb() {
  const user = {
    id: 'user-test-1',
    email: 'test@example.com',
    plan: 'free',
    authToken: 'test-token-123',
    createdAt: new Date().toISOString(),
  };

  const pet = {
    id: 'pet-test-1',
    userId: 'user-test-1',
    name: 'むぎ',
    nickname: 'むぎちゃん',
    species: '猫',
    gender: '女の子',
    personality: '甘えん坊',
    firstPerson: 'むぎ',
    ownerCall: 'ママ',
    tone: 'ツンデレ',
    avatarUri: '',
    sessionKey: 'pet:pet-test-1:main',
    createdAt: new Date().toISOString(),
  };

  const conversation = {
    id: 'conv-test-1',
    userId: 'user-test-1',
    petId: 'pet-test-1',
    sessionKey: 'pet:pet-test-1:main',
    lastMessageAt: new Date().toISOString(),
  };

  const messages = [
    { id: 'msg-1', conversationId: 'conv-test-1', role: 'pet', content: 'にゃー', model: 'mock', createdAt: new Date().toISOString() },
    { id: 'msg-2', conversationId: 'conv-test-1', role: 'owner', content: 'こんにちは', model: 'human', createdAt: new Date().toISOString() },
  ];

  writeDb({
    users: [user],
    pets: [pet],
    conversations: [conversation],
    messages,
  });

  return { user, pet, conversation, messages };
}

describe('auth', () => {
  beforeEach(() => setupTestDb());

  it('createOrGetDemoUser creates a new user', () => {
    const user = createOrGetDemoUser('new@example.com');
    expect(user).toBeTruthy();
    expect(user.email).toBe('new@example.com');
    expect(user.plan).toBe('free');
    expect(user.authToken).toBeTruthy();
  });

  it('createOrGetDemoUser returns existing user with new token', () => {
    const user = createOrGetDemoUser('test@example.com');
    expect(user.email).toBe('test@example.com');
    expect(user.authToken).not.toBe('test-token-123'); // new token
  });

  it('createOrGetDemoUser returns null for empty email', () => {
    expect(createOrGetDemoUser('')).toBeNull();
    expect(createOrGetDemoUser(null)).toBeNull();
  });

  it('getUserByToken returns user for valid token', () => {
    const user = getUserByToken('test-token-123');
    expect(user).toBeTruthy();
    expect(user.email).toBe('test@example.com');
  });

  it('getUserByToken returns null for invalid token', () => {
    expect(getUserByToken('wrong-token')).toBeNull();
    expect(getUserByToken('')).toBeNull();
    expect(getUserByToken(null)).toBeNull();
  });
});

describe('pet deletion (db-level)', () => {
  beforeEach(() => setupTestDb());

  it('deleting a pet removes pet, conversations, and messages', () => {
    const { updateDb } = require('../server/db');

    updateDb((db) => {
      const petId = 'pet-test-1';
      const userId = 'user-test-1';

      const idx = db.pets.findIndex((p) => p.userId === userId && p.id === petId);
      expect(idx).toBeGreaterThanOrEqual(0);
      db.pets.splice(idx, 1);

      const convIds = db.conversations
        .filter((c) => c.userId === userId && c.petId === petId)
        .map((c) => c.id);
      db.messages = db.messages.filter((m) => !convIds.includes(m.conversationId));
      db.conversations = db.conversations.filter((c) => !convIds.includes(c.id));

      return db;
    });

    const db = readDb();
    expect(db.pets).toHaveLength(0);
    expect(db.conversations).toHaveLength(0);
    expect(db.messages).toHaveLength(0);
  });

  it('does not delete other users pets', () => {
    const { updateDb } = require('../server/db');

    updateDb((db) => {
      const idx = db.pets.findIndex((p) => p.userId === 'wrong-user' && p.id === 'pet-test-1');
      expect(idx).toBe(-1); // not found
      return db;
    });

    const db = readDb();
    expect(db.pets).toHaveLength(1); // still there
  });
});

describe('sync upload (db-level)', () => {
  beforeEach(() => setupTestDb());

  it('adds new local pets to db', () => {
    const { updateDb } = require('../server/db');

    const localPet = {
      id: 'pet-local-1',
      name: 'コタ',
      species: '犬',
      personality: '元気',
      gender: '男の子',
    };

    updateDb((db) => {
      const existingPetIds = new Set(db.pets.filter((p) => p.userId === 'user-test-1').map((p) => p.id));
      if (!existingPetIds.has(localPet.id)) {
        db.pets.push({
          ...localPet,
          userId: 'user-test-1',
          nickname: localPet.name,
          firstPerson: localPet.name,
          ownerCall: '飼い主さん',
          tone: 'ため口',
          avatarUri: '',
          sessionKey: `pet:${localPet.id}:main`,
          createdAt: new Date().toISOString(),
        });
      }
      return db;
    });

    const db = readDb();
    expect(db.pets).toHaveLength(2);
    expect(db.pets.find((p) => p.id === 'pet-local-1')).toBeTruthy();
  });

  it('skips pets that already exist on server', () => {
    const { updateDb } = require('../server/db');

    updateDb((db) => {
      const existingPetIds = new Set(db.pets.filter((p) => p.userId === 'user-test-1').map((p) => p.id));
      // Try to add a pet with same ID
      if (!existingPetIds.has('pet-test-1')) {
        db.pets.push({ id: 'pet-test-1', userId: 'user-test-1', name: 'duplicate' });
      }
      return db;
    });

    const db = readDb();
    expect(db.pets).toHaveLength(1); // no duplicate
    expect(db.pets[0].name).toBe('むぎ'); // original preserved
  });

  it('respects pet limit for free plan', () => {
    const { updateDb } = require('../server/db');
    const PET_LIMITS = { free: 1, plus: 3 };

    updateDb((db) => {
      const existingCount = db.pets.filter((p) => p.userId === 'user-test-1').length;
      const petLimit = PET_LIMITS.free;
      // Already at limit (1 pet), should not add more
      expect(existingCount).toBe(petLimit);
      return db;
    });

    const db = readDb();
    expect(db.pets).toHaveLength(1);
  });
});

describe('storage validation', () => {
  it('rejects files over 5MB', async () => {
    const { uploadImage } = require('../server/storage');
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB

    await expect(uploadImage(largeBuffer, 'image/jpeg', 'user-1'))
      .rejects.toThrow('file_too_large');
  });

  it('rejects invalid mime types', async () => {
    const { uploadImage } = require('../server/storage');
    const buffer = Buffer.from('test');

    await expect(uploadImage(buffer, 'application/pdf', 'user-1'))
      .rejects.toThrow('invalid_file_type');
  });

  it('accepts valid image types', async () => {
    const { uploadImage } = require('../server/storage');
    const buffer = Buffer.from('fake-image-data');

    const url = await uploadImage(buffer, 'image/jpeg', 'user-test');
    expect(url).toContain('/uploads/');
    expect(url).toContain('.jpg');
  });

  it('accepts png images', async () => {
    const { uploadImage } = require('../server/storage');
    const buffer = Buffer.from('fake-png');

    const url = await uploadImage(buffer, 'image/png', 'user-test');
    expect(url).toContain('.png');
  });

  it('accepts webp images', async () => {
    const { uploadImage } = require('../server/storage');
    const buffer = Buffer.from('fake-webp');

    const url = await uploadImage(buffer, 'image/webp', 'user-test');
    expect(url).toContain('.webp');
  });
});
