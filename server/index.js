require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const { createAnonymousUser, issueTransferCode, redeemTransferCode, requireAuth, getUserByToken } = require('./auth');
const { readDb, updateDb } = require('./db');
const { generatePetReply } = require('./ai-router');
const { uploadImage, deleteImage, UPLOAD_DIR } = require('./storage');
const { verifyGooglePlayPurchase } = require('./google-play-verify');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const IS_DEBUG = process.env.DEBUG === 'true';

// Security headers
app.use(helmet());

// CORS — 本番では許可オリジンを指定
const ALLOWED_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : undefined; // undefined = 全オリジン許可（開発用）
app.use(cors(ALLOWED_ORIGINS ? { origin: ALLOWED_ORIGINS } : undefined));

app.use(express.json({ limit: '5mb' }));
if (IS_DEBUG) {
  app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
    next();
  });
}

// Rate limiting for public endpoints
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_requests' },
});
// ローカル開発用: アップロード画像の静的配信
app.use('/uploads', express.static(UPLOAD_DIR));

function speakingStyleForSpecies(species) {
  switch (species) {
    case '猫':
      return '少し気まぐれで、近づいたり離れたりする';
    case '犬':
      return '素直で愛情が強く、反応が早い';
    case '鳥':
      return '軽やかで観察好き、テンポよく返す';
    default:
      return 'やわらかく自然体で返す';
  }
}

function buildPersonaPreview(pet) {
  return {
    summary: `${pet.name}は${pet.species}で、性格は「${pet.personality}」。一人称は「${pet.firstPerson || pet.name}」、ユーザの呼び方は「${pet.ownerCall || '飼い主さん'}」。`,
    speakingStyle: `${speakingStyleForSpecies(pet.species)} / 口調: ${pet.tone || 'ため口'}`,
    ownerAlias: pet.ownerCall || '飼い主さん',
  };
}

function buildBootstrap(user) {
  const db = readDb();
  const pets = db.pets.filter((pet) => pet.userId === user.id);
  const userConversations = db.conversations.filter((conversation) => conversation.userId === user.id);
  const messagesByPetId = Object.fromEntries(
    pets.map((pet) => {
      const conversation = userConversations.find((item) => item.petId === pet.id);
      const messages = conversation
        ? db.messages
            .filter((message) => message.conversationId === conversation.id)
            .map((message) => ({
              id: message.id,
              sender: message.role,
              text: message.content,
              time: new Date(message.createdAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
            }))
        : [];

      return [pet.id, messages];
    }),
  );

  return {
    session: user,
    pets,
    selectedPetId: pets[0]?.id ?? '',
    messagesByPetId,
  };
}

function ensureConversation(db, userId, petId, sessionKey) {
  let conversation = db.conversations.find((item) => item.userId === userId && item.petId === petId);
  if (!conversation) {
    conversation = {
      id: `conv-${crypto.randomUUID()}`,
      userId,
      petId,
      sessionKey,
      lastMessageAt: new Date().toISOString(),
    };
    db.conversations.push(conversation);
  }
  return conversation;
}

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/auth/register', publicLimiter, (req, res) => {
  const user = createAnonymousUser();
  return res.json({ session: user });
});

app.post('/api/auth/issue-transfer-code', requireAuth, (req, res) => {
  const result = issueTransferCode(req.user.id);
  if (!result) {
    return res.status(404).json({ error: 'user_not_found' });
  }
  return res.json(result);
});

app.post('/api/auth/redeem-transfer-code', (req, res) => {
  const { code } = req.body ?? {};
  const user = redeemTransferCode(code);
  if (!user) {
    return res.status(400).json({ error: 'invalid_or_expired_code' });
  }
  return res.json({ session: user });
});

app.get('/api/auth/me', (req, res) => {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const user = getUserByToken(token);

  if (!user) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  return res.json({ session: user });
});

app.get('/api/bootstrap', requireAuth, (req, res) => {
  res.json(buildBootstrap(req.user));
});

app.post('/api/persona/preview', (req, res) => {
  const { pet } = req.body ?? {};
  if (!pet?.name || !pet?.species || !pet?.personality) {
    return res.status(400).json({ error: 'invalid_pet_payload' });
  }

  return res.json(buildPersonaPreview(pet));
});

app.post('/api/pets', requireAuth, (req, res) => {
  const { pet } = req.body ?? {};
  if (!pet?.name || !pet?.species || !pet?.personality) {
    return res.status(400).json({ error: 'invalid_pet_payload' });
  }

  const db = readDb();
  const userPetCount = db.pets.filter((p) => p.userId === req.user.id).length;
  const petLimit = PET_LIMITS[req.user.plan] ?? 1;
  if (userPetCount >= petLimit) {
    return res.status(403).json({
      error: 'pet_limit_reached',
      limit: petLimit,
      plan: req.user.plan,
    });
  }

  let createdPet = null;

  updateDb((db) => {
    createdPet = {
      id: pet.id || `pet-${crypto.randomUUID()}`,
      userId: req.user.id,
      name: pet.name,
      nickname: pet.nickname || pet.name,
      species: pet.species,
      gender: pet.gender || '不明',
      personality: pet.personality,
      firstPerson: pet.firstPerson || pet.name,
      ownerCall: pet.ownerCall || '飼い主さん',
      tone: pet.tone || 'ため口',
      avatarUri: pet.avatarUri || '',
      sessionKey: pet.sessionKey || `pet:${pet.id}:main`,
      createdAt: new Date().toISOString(),
    };

    db.pets.push(createdPet);
    ensureConversation(db, req.user.id, createdPet.id, createdPet.sessionKey);
    return db;
  });

  return res.status(201).json({ pet: createdPet });
});

app.patch('/api/pets/:petId', requireAuth, (req, res) => {
  const { petId } = req.params;
  const { pet } = req.body ?? {};
  if (!pet?.name || !pet?.species || !pet?.personality) {
    return res.status(400).json({ error: 'invalid_pet_payload' });
  }

  let updatedPet = null;

  updateDb((db) => {
    const existing = db.pets.find((item) => item.userId === req.user.id && item.id === petId);
    if (!existing) {
      return db;
    }

    existing.name = pet.name;
    existing.nickname = pet.nickname || pet.name;
    existing.species = pet.species;
    existing.gender = pet.gender || '不明';
    existing.personality = pet.personality;
    existing.firstPerson = pet.firstPerson || pet.name;
    existing.ownerCall = pet.ownerCall || '飼い主さん';
    existing.tone = pet.tone || 'ため口';
    existing.avatarUri = pet.avatarUri || '';
    updatedPet = existing;
    return db;
  });

  if (!updatedPet) {
    return res.status(404).json({ error: 'pet_not_found' });
  }

  return res.json({ pet: updatedPet });
});

app.delete('/api/pets/:petId', requireAuth, (req, res) => {
  const { petId } = req.params;
  let deleted = false;

  updateDb((db) => {
    const idx = db.pets.findIndex((p) => p.userId === req.user.id && p.id === petId);
    if (idx === -1) return db;

    db.pets.splice(idx, 1);

    const convIds = db.conversations
      .filter((c) => c.userId === req.user.id && c.petId === petId)
      .map((c) => c.id);

    db.messages = db.messages.filter((m) => !convIds.includes(m.conversationId));
    db.conversations = db.conversations.filter((c) => !convIds.includes(c.id));

    deleted = true;
    return db;
  });

  if (!deleted) {
    return res.status(404).json({ error: 'pet_not_found' });
  }

  return res.json({ ok: true });
});

const PET_LIMITS = { free: 1, plus: 3 };
const DAILY_MESSAGE_LIMITS = { free: 5, plus: 50 };

function countTodayMessages(db, userId) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayIso = todayStart.toISOString();

  const userConvIds = new Set(
    db.conversations.filter((c) => c.userId === userId).map((c) => c.id),
  );

  return db.messages.filter(
    (m) => m.role === 'owner' && userConvIds.has(m.conversationId) && m.createdAt >= todayIso,
  ).length;
}

// 未ログインでもAI返答を取得できるエンドポイント
app.post('/api/chat/reply-guest', publicLimiter, async (req, res) => {
  const { pet, message, plan } = req.body ?? {};
  if (!pet?.id || !pet?.sessionKey || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'invalid_chat_payload' });
  }

  const conversationHistory = Array.isArray(req.body.conversationHistory) ? req.body.conversationHistory : [];

  const reply = await generatePetReply({
    pet,
    message: message.trim(),
    plan: plan || 'free',
    conversationHistory,
  });

  return res.json({
    provider: reply.provider,
    text: reply.text,
    sessionKey: pet.sessionKey,
  });
});

app.post('/api/chat/reply', requireAuth, async (req, res) => {
  const { pet, message, plan } = req.body ?? {};
  if (!pet?.id || !pet?.sessionKey || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'invalid_chat_payload' });
  }

  const db = readDb();
  const effectivePlan = req.user.plan || plan || 'free';
  const bonusMessages = typeof req.body.bonusMessages === 'number' ? Math.max(0, req.body.bonusMessages) : 0;

  const baseLimit = DAILY_MESSAGE_LIMITS[effectivePlan] ?? 5;
  const dailyLimit = baseLimit + bonusMessages;
  const todayCount = countTodayMessages(db, req.user.id);
  if (todayCount >= dailyLimit) {
    return res.status(429).json({
      error: 'daily_limit_reached',
      limit: dailyLimit,
      used: todayCount,
      plan: effectivePlan,
    });
  }

  let storedPet = db.pets.find((item) => item.userId === req.user.id && item.id === pet.id);
  if (!storedPet) {
    // ペットが未登録なら、リクエストのデータから自動作成
    if (!pet.name || !pet.species || !pet.personality) {
      return res.status(400).json({ error: 'pet_data_required_for_auto_create' });
    }
    storedPet = {
      id: pet.id,
      userId: req.user.id,
      name: pet.name,
      nickname: pet.nickname || pet.name,
      species: pet.species,
      gender: pet.gender || '不明',
      personality: pet.personality,
      firstPerson: pet.firstPerson || pet.name,
      ownerCall: pet.ownerCall || '飼い主さん',
      tone: pet.tone || 'ため口',
      avatarUri: pet.avatarUri || '',
      sessionKey: pet.sessionKey,
      createdAt: new Date().toISOString(),
    };
    updateDb((nextDb) => { nextDb.pets.push(storedPet); return nextDb; });
  }

  const conversation = db.conversations.find(
    (c) => c.userId === req.user.id && c.petId === storedPet.id,
  );
  const conversationHistory = conversation
    ? db.messages
        .filter((m) => m.conversationId === conversation.id)
        .map((m) => ({ role: m.role, content: m.content }))
    : [];

  const reply = await generatePetReply({
    pet: storedPet,
    message: message.trim(),
    plan: effectivePlan,
    conversationHistory,
  });

  updateDb((nextDb) => {
    const conversation = ensureConversation(nextDb, req.user.id, storedPet.id, storedPet.sessionKey);
    const now = new Date().toISOString();

    nextDb.messages.push({
      id: `msg-${crypto.randomUUID()}`,
      conversationId: conversation.id,
      role: 'owner',
      content: message.trim(),
      model: 'human',
      createdAt: now,
    });

    nextDb.messages.push({
      id: `msg-${crypto.randomUUID()}`,
      conversationId: conversation.id,
      role: 'pet',
      content: reply.text,
      model: reply.provider,
      createdAt: now,
    });

    conversation.lastMessageAt = now;
    return nextDb;
  });

  return res.json({
    provider: reply.provider,
    text: reply.text,
    sessionKey: storedPet.sessionKey,
  });
});

app.post('/api/upload/avatar', requireAuth, async (req, res) => {
  const { image, mimeType } = req.body ?? {};
  if (!image || !mimeType) {
    return res.status(400).json({ error: 'invalid_upload_payload' });
  }

  try {
    const buffer = Buffer.from(image, 'base64');
    const url = await uploadImage(buffer, mimeType, req.user.id);
    return res.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'upload_failed';
    return res.status(400).json({ error: message });
  }
});

app.post('/api/sync/upload', requireAuth, (req, res) => {
  const { pets: localPets, messagesByPetId } = req.body ?? {};
  if (!Array.isArray(localPets)) {
    return res.status(400).json({ error: 'invalid_sync_payload' });
  }

  const userId = req.user.id;
  let uploadedCount = 0;

  updateDb((db) => {
    const existingPetIds = new Set(db.pets.filter((p) => p.userId === userId).map((p) => p.id));
    const petLimit = PET_LIMITS[req.user.plan] ?? 1;

    for (const pet of localPets) {
      if (!pet.id || !pet.name || !pet.species || !pet.personality) continue;
      if (existingPetIds.has(pet.id)) continue;
      if (existingPetIds.size + uploadedCount >= petLimit) break;

      const serverPet = {
        id: pet.id,
        userId,
        name: pet.name,
        nickname: pet.nickname || pet.name,
        species: pet.species,
        gender: pet.gender || '不明',
        personality: pet.personality,
        firstPerson: pet.firstPerson || pet.name,
        ownerCall: pet.ownerCall || '飼い主さん',
        tone: pet.tone || 'ため口',
        avatarUri: pet.avatarUri || '',
        sessionKey: pet.sessionKey || `pet:${pet.id}:main`,
        createdAt: new Date().toISOString(),
      };

      db.pets.push(serverPet);
      const conversation = ensureConversation(db, userId, serverPet.id, serverPet.sessionKey);

      // Upload messages for this pet (skip duplicates by id)
      const localMessages = messagesByPetId?.[pet.id];
      if (Array.isArray(localMessages)) {
        const existingIds = new Set(db.messages.filter((m) => m.conversationId === conversation.id).map((m) => m.id));
        for (const msg of localMessages) {
          if (!msg.text || !msg.sender) continue;
          const msgId = msg.id || `msg-${crypto.randomUUID()}`;
          if (existingIds.has(msgId)) continue;
          db.messages.push({
            id: msgId,
            conversationId: conversation.id,
            role: msg.sender,
            content: msg.text,
            model: msg.sender === 'pet' ? 'mock' : 'human',
            createdAt: new Date().toISOString(),
          });
        }
      }

      uploadedCount++;
    }

    return db;
  });

  return res.json({ ok: true, uploadedCount });
});

app.post('/api/billing/subscribe', requireAuth, (req, res) => {
  const { plan } = req.body ?? {};
  if (!['free', 'plus'].includes(plan)) {
    return res.status(400).json({ error: 'invalid_plan' });
  }

  let updatedUser = null;

  updateDb((db) => {
    const user = db.users.find((item) => item.id === req.user.id);
    if (!user) {
      return db;
    }

    user.plan = plan;
    updatedUser = {
      id: user.id,
      plan: user.plan,
      authToken: user.authToken,
    };
    return db;
  });

  return res.json({
    session: updatedUser,
    checkout: {
      plan,
      status: 'mock-active',
    },
  });
});

/**
 * レシート検証エンドポイント
 *
 * Android: Google Play Developer API で purchaseToken を検証
 * iOS: 未実装（モックモード）
 * 開発環境: GOOGLE_SERVICE_ACCOUNT_KEY 未設定ならモックモード
 */
app.post('/api/billing/verify-receipt', requireAuth, async (req, res) => {
  const { productId, receipt, platform } = req.body ?? {};
  if (!productId || !receipt) {
    return res.status(400).json({ error: 'invalid_receipt_payload' });
  }

  let isValid = false;

  if (platform === 'android') {
    try {
      const result = await verifyGooglePlayPurchase(productId, receipt);
      if (result === null) {
        // モックモード（認証情報未設定）
        isValid = Boolean(receipt);
      } else {
        isValid = result.valid;
      }
    } catch (err) {
      console.error('Google Play verification error:', err.message);
      return res.status(502).json({ error: 'verification_service_error' });
    }
  } else {
    // iOS / その他: モックモード（将来対応）
    isValid = Boolean(receipt);
  }

  if (!isValid) {
    return res.status(400).json({ error: 'receipt_invalid' });
  }

  let updatedUser = null;

  updateDb((db) => {
    const user = db.users.find((item) => item.id === req.user.id);
    if (!user) return db;

    if (productId === 'plus_monthly') {
      user.plan = 'plus';
    }
    user.receiptData = { productId, platform: platform || 'unknown', verifiedAt: new Date().toISOString() };
    updatedUser = {
      id: user.id,
      plan: user.plan,
      authToken: user.authToken,
    };
    return db;
  });

  if (!updatedUser) {
    return res.status(404).json({ error: 'user_not_found' });
  }

  return res.json({
    session: updatedUser,
    verified: true,
    plan: updatedUser.plan,
  });
});

app.listen(PORT, () => {
  if (IS_DEBUG) console.log(`Pet Chat API listening on http://localhost:${PORT}`);
});
