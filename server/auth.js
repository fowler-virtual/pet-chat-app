const crypto = require('crypto');
const { readDb, updateDb } = require('./db');

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    plan: user.plan,
    authToken: user.authToken,
  };
}

function createOrGetDemoUser(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    return null;
  }

  let resultUser = null;

  updateDb((db) => {
    const existing = db.users.find((user) => user.email === normalizedEmail);
    if (existing) {
      existing.authToken = crypto.randomUUID();
      resultUser = existing;
      return db;
    }

    const user = {
      id: `user-${crypto.randomUUID()}`,
      email: normalizedEmail,
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

function getUserByToken(authToken) {
  if (!authToken) {
    return null;
  }

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
  createOrGetDemoUser,
  getUserByToken,
  requireAuth,
};

