const crypto = require('crypto');
const { readDb, updateDb } = require('./db');

// 紛らわしい文字を除外: 0/O, 1/I/L
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;
const CODE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24時間

function sanitizeUser(user) {
  return {
    id: user.id,
    plan: user.plan,
    authToken: user.authToken,
  };
}

function generateTransferCode() {
  let code = '';
  const bytes = crypto.randomBytes(CODE_LENGTH);
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[bytes[i] % CODE_CHARS.length];
  }
  return code;
}

/** 匿名ユーザーを新規作成 */
function createAnonymousUser() {
  let resultUser = null;

  updateDb((db) => {
    const user = {
      id: `user-${crypto.randomUUID()}`,
      plan: 'free',
      authToken: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    resultUser = user;
    return db;
  });

  return sanitizeUser(resultUser);
}

/** 引き継ぎコードを発行（24時間有効） */
function issueTransferCode(userId) {
  const code = generateTransferCode();
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MS).toISOString();
  let success = false;

  updateDb((db) => {
    const user = db.users.find((u) => u.id === userId);
    if (!user) return db;
    user.transferCode = code;
    user.transferCodeExpiresAt = expiresAt;
    success = true;
    return db;
  });

  return success ? { transferCode: code, expiresAt } : null;
}

/** 引き継ぎコードでデータ復元（旧端末は無効化） */
function redeemTransferCode(code) {
  const normalized = String(code || '').trim().toUpperCase();
  if (normalized.length !== CODE_LENGTH) return null;

  let resultUser = null;

  updateDb((db) => {
    const user = db.users.find(
      (u) => u.transferCode === normalized && u.transferCodeExpiresAt && new Date(u.transferCodeExpiresAt) > new Date(),
    );
    if (!user) return db;

    // 旧端末のトークンを無効化 & 新トークン発行
    user.authToken = crypto.randomUUID();
    user.transferCode = null;
    user.transferCodeExpiresAt = null;
    resultUser = user;
    return db;
  });

  return resultUser ? sanitizeUser(resultUser) : null;
}

function getUserByToken(authToken) {
  if (!authToken) return null;
  const db = readDb();
  const user = db.users.find((item) => item.authToken === authToken);
  return user ? sanitizeUser(user) : null;
}

function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const user = getUserByToken(token);

  if (!user) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  req.user = user;
  return next();
}

module.exports = {
  createAnonymousUser,
  issueTransferCode,
  redeemTransferCode,
  getUserByToken,
  requireAuth,
};
