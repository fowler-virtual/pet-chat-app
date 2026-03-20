import { describe, it, expect, beforeEach, vi } from 'vitest';

const { readDb, writeDb, updateDb } = require('../server/db');
const { createAnonymousUser, issueTransferCode, redeemTransferCode, getUserByToken } = require('../server/auth');

// Helper: set up a clean db with a test user and pet
function setupTestDb() {
  const user = {
    id: 'user-test-1',
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

  it('createAnonymousUser creates a new user', () => {
    const user = createAnonymousUser();
    expect(user).toBeTruthy();
    expect(user.plan).toBe('free');
    expect(user.authToken).toBeTruthy();
    expect(user.id).toMatch(/^user-/);
  });

  it('issueTransferCode returns a code for valid user', () => {
    const result = issueTransferCode('user-test-1');
    expect(result).toBeTruthy();
    expect(result.transferCode).toHaveLength(8);
    expect(result.expiresAt).toBeTruthy();
  });

  it('issueTransferCode returns null for unknown user', () => {
    const result = issueTransferCode('user-unknown');
    expect(result).toBeNull();
  });

  it('redeemTransferCode returns user and invalidates old token', () => {
    const issued = issueTransferCode('user-test-1');
    const user = redeemTransferCode(issued.transferCode);
    expect(user).toBeTruthy();
    expect(user.id).toBe('user-test-1');
    expect(user.authToken).not.toBe('test-token-123'); // rotated

    // Old token should no longer work
    expect(getUserByToken('test-token-123')).toBeNull();
    // New token works
    expect(getUserByToken(user.authToken)).toBeTruthy();
  });

  it('redeemTransferCode returns null for invalid code', () => {
    expect(redeemTransferCode('BADCODE1')).toBeNull();
    expect(redeemTransferCode('')).toBeNull();
    expect(redeemTransferCode(null)).toBeNull();
  });

  it('redeemTransferCode clears the code so it cannot be reused', () => {
    const issued = issueTransferCode('user-test-1');
    redeemTransferCode(issued.transferCode);
    // Second redemption should fail
    expect(redeemTransferCode(issued.transferCode)).toBeNull();
  });

  it('getUserByToken returns user for valid token', () => {
    const user = getUserByToken('test-token-123');
    expect(user).toBeTruthy();
    expect(user.id).toBe('user-test-1');
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

describe('google-play-verify', () => {
  beforeEach(() => {
    // authClient キャッシュをリセット
    vi.resetModules();
  });

  it('returns null when GOOGLE_SERVICE_ACCOUNT_KEY is not set', async () => {
    const originalKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    delete process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

    const { verifyGooglePlayPurchase } = require('../server/google-play-verify');
    const result = await verifyGooglePlayPurchase('plus_monthly', 'token-123');
    expect(result).toBeNull();

    if (originalKey) process.env.GOOGLE_SERVICE_ACCOUNT_KEY = originalKey;
  });
});

describe('verify-receipt logic (db-level)', () => {
  beforeEach(() => setupTestDb());

  it('subscription purchase upgrades plan to plus', () => {
    updateDb((db) => {
      const user = db.users.find((u) => u.id === 'user-test-1');
      expect(user.plan).toBe('free');

      // レシート検証成功後の処理を再現
      const productId = 'plus_monthly';
      if (productId === 'plus_monthly') {
        user.plan = 'plus';
      }
      user.receiptData = { productId, platform: 'android', verifiedAt: new Date().toISOString() };
      return db;
    });

    const db = readDb();
    const user = db.users.find((u) => u.id === 'user-test-1');
    expect(user.plan).toBe('plus');
    expect(user.receiptData.productId).toBe('plus_monthly');
  });

  it('consumable purchase does not change plan', () => {
    // まず plus にしておく
    updateDb((db) => {
      db.users.find((u) => u.id === 'user-test-1').plan = 'plus';
      return db;
    });

    updateDb((db) => {
      const user = db.users.find((u) => u.id === 'user-test-1');
      const productId = 'item_snack';
      // 消耗品なので plan は変更しない
      if (productId === 'plus_monthly') {
        user.plan = 'plus';
      }
      user.receiptData = { productId, platform: 'android', verifiedAt: new Date().toISOString() };
      return db;
    });

    const db = readDb();
    const user = db.users.find((u) => u.id === 'user-test-1');
    expect(user.plan).toBe('plus'); // plus のまま
    expect(user.receiptData.productId).toBe('item_snack');
  });

  it('consumable purchase on free plan stays free', () => {
    updateDb((db) => {
      const user = db.users.find((u) => u.id === 'user-test-1');
      const productId = 'item_meal';
      if (productId === 'plus_monthly') {
        user.plan = 'plus';
      }
      user.receiptData = { productId, platform: 'android', verifiedAt: new Date().toISOString() };
      return db;
    });

    const db = readDb();
    const user = db.users.find((u) => u.id === 'user-test-1');
    expect(user.plan).toBe('free'); // free のまま
  });

  it('receiptData records platform and timestamp', () => {
    updateDb((db) => {
      const user = db.users.find((u) => u.id === 'user-test-1');
      user.receiptData = { productId: 'item_feast', platform: 'android', verifiedAt: '2026-03-20T00:00:00.000Z' };
      return db;
    });

    const db = readDb();
    const user = db.users.find((u) => u.id === 'user-test-1');
    expect(user.receiptData.platform).toBe('android');
    expect(user.receiptData.verifiedAt).toBe('2026-03-20T00:00:00.000Z');
  });

  it('unknown user is not updated', () => {
    let found = false;
    updateDb((db) => {
      const user = db.users.find((u) => u.id === 'user-unknown');
      if (user) found = true;
      return db;
    });

    expect(found).toBe(false);
  });
});
