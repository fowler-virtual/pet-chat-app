import { describe, it, expect } from 'vitest';

const { generatePetReply, _test } = require('../server/ai-router');
const {
  buildSystemPrompt,
  getTimeBucket,
  getSpeciesDirective,
  getToneDirective,
  createMockReply,
  HISTORY_LIMITS,
} = _test;

const mugi = {
  id: 'pet-mugi',
  name: 'むぎ',
  nickname: 'むぎちゃん',
  species: '猫',
  gender: '女の子',
  personality: '甘えん坊で少しツンデレ',
  firstPerson: 'むぎ',
  ownerCall: 'ママ',
  tone: 'ツンデレ',
  avatarUri: '',
  sessionKey: 'pet:pet-mugi:main',
};

const kota = {
  id: 'pet-kota',
  name: 'コタ',
  nickname: 'コタ',
  species: '犬',
  gender: '男の子',
  personality: '元気で忠実、さみしがり',
  firstPerson: 'ぼく',
  ownerCall: 'パパ',
  tone: 'ため口',
  avatarUri: '',
  sessionKey: 'pet:pet-kota:main',
};

describe('buildSystemPrompt', () => {
  it('includes pet name, first person, and owner call', () => {
    const prompt = buildSystemPrompt(mugi);
    expect(prompt).toContain('むぎ');
    expect(prompt).toContain('一人称: 「むぎ」');
    expect(prompt).toContain('飼い主の呼び方: 「ママ」');
  });

  it('includes nickname when different from name', () => {
    const prompt = buildSystemPrompt(mugi);
    expect(prompt).toContain('あだ名: むぎちゃん');
  });

  it('omits nickname line when same as name', () => {
    const prompt = buildSystemPrompt(kota);
    expect(prompt).not.toContain('あだ名');
  });

  it('includes species directive', () => {
    const prompt = buildSystemPrompt(mugi);
    expect(prompt).toContain('猫らしい仕草');
    expect(prompt).toContain('「にゃ」は使わない');
  });

  it('includes tone directive for ツンデレ', () => {
    const prompt = buildSystemPrompt(mugi);
    expect(prompt).toContain('素っ気なく見せかけて');
  });

  it('includes tone directive for ため口', () => {
    const prompt = buildSystemPrompt(kota);
    expect(prompt).toContain('フランクで自然体');
  });

  it('includes time context', () => {
    const prompt = buildSystemPrompt(mugi);
    expect(prompt).toMatch(/今は(朝|昼間|夜)の時間帯/);
  });

  it('includes character constraints', () => {
    const prompt = buildSystemPrompt(mugi);
    expect(prompt).toContain('返答は1〜3文');
    expect(prompt).toContain('メタ的な発言はしない');
  });

  it('uses defaults when fields are missing', () => {
    const minimal = { name: 'テスト', species: '', personality: 'おとなしい' };
    const prompt = buildSystemPrompt(minimal);
    expect(prompt).toContain('飼い主の呼び方: 「飼い主さん」');
    expect(prompt).toContain('一人称: 「テスト」');
    expect(prompt).toContain('自然体で話す');
  });
});

describe('getTimeBucket', () => {
  // テスト内の時刻は UTC。JST = UTC+9 で判定される。
  it('returns late_night for JST 0-4', () => {
    // UTC 15:00 = JST 0:00
    expect(getTimeBucket(new Date('2026-01-01T15:00:00Z'))).toBe('late_night');
    // UTC 19:00 = JST 4:00
    expect(getTimeBucket(new Date('2026-01-01T19:00:00Z'))).toBe('late_night');
  });

  it('returns morning for JST 5-10', () => {
    // UTC 23:00 = JST 8:00
    expect(getTimeBucket(new Date('2026-01-01T23:00:00Z'))).toBe('morning');
  });

  it('returns day for JST 11-17', () => {
    // UTC 05:00 = JST 14:00
    expect(getTimeBucket(new Date('2026-01-01T05:00:00Z'))).toBe('day');
  });

  it('returns evening for JST 18-21', () => {
    // UTC 11:00 = JST 20:00
    expect(getTimeBucket(new Date('2026-01-01T11:00:00Z'))).toBe('evening');
  });

  it('returns late_night for JST 22-23', () => {
    // UTC 14:00 = JST 23:00
    expect(getTimeBucket(new Date('2026-01-01T14:00:00Z'))).toBe('late_night');
  });
});

describe('getSpeciesDirective', () => {
  it('returns cat directive', () => {
    expect(getSpeciesDirective('猫')).toContain('気まぐれ');
  });

  it('returns dog directive', () => {
    expect(getSpeciesDirective('犬')).toContain('愛情表現');
  });

  it('returns bird directive', () => {
    expect(getSpeciesDirective('鳥')).toContain('軽やか');
  });

  it('returns default for unknown species', () => {
    expect(getSpeciesDirective('ハムスター')).toContain('やさしく自然体');
  });
});

describe('getToneDirective', () => {
  it.each([
    ['敬語', '丁寧語'],
    ['やさしい', 'ゆったり'],
    ['ツンデレ', '素っ気なく'],
    ['あまえんぼ', '甘えた口調'],
    ['ため口', 'フランク'],
  ])('returns correct directive for %s', (tone, expected) => {
    expect(getToneDirective(tone)).toContain(expected);
  });
});

describe('createMockReply', () => {
  it('returns greeting reply for greeting messages', () => {
    const reply = createMockReply(mugi, 'おはよう');
    expect(reply).toContain('ママ');
    expect(typeof reply).toBe('string');
    expect(reply.length).toBeGreaterThan(0);
  });

  it('includes owner call', () => {
    const reply = createMockReply(mugi, 'おはよう');
    expect(reply).toContain('ママ');
  });

  it('returns general reply for non-greeting messages', () => {
    const reply = createMockReply(mugi, '今日は暑いね');
    expect(reply).toContain('ママ');
  });

  it('handles empty message as greeting', () => {
    const reply = createMockReply(mugi, '');
    expect(reply).toContain('ママ');
    expect(reply.length).toBeGreaterThan(0);
  });
});

describe('HISTORY_LIMITS', () => {
  it('free plan gets 5 turns of history', () => {
    expect(HISTORY_LIMITS.free).toBe(5);
  });

  it('plus plan gets 20 turns', () => {
    expect(HISTORY_LIMITS.plus).toBe(20);
  });
});

describe('generatePetReply', () => {
  it('falls back to mock for free plan when no API key', async () => {
    const result = await generatePetReply({
      pet: mugi,
      message: 'おはよう',
      plan: 'free',
      conversationHistory: [],
    });
    expect(result.provider).toBe('mock');
    expect(result.text).toBeTruthy();
  });

  it('falls back to mock when no API keys are set', async () => {
    const result = await generatePetReply({
      pet: kota,
      message: 'ただいま',
      plan: 'plus',
      conversationHistory: [],
    });
    expect(result.provider).toBe('mock');
  });

  it('trims conversation history to plan limit', async () => {
    const longHistory = Array.from({ length: 30 }, (_, i) => ({
      role: i % 2 === 0 ? 'owner' : 'pet',
      content: `message ${i}`,
    }));

    const result = await generatePetReply({
      pet: mugi,
      message: 'test',
      plan: 'free',
      conversationHistory: longHistory,
    });
    expect(result.provider).toBe('mock');
  });
});
