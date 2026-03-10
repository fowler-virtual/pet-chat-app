import { describe, it, expect } from 'vitest';
import { getPetDefaults, normalizePetProfile } from '../src/lib/petUtils';

const basePet = {
  id: 'pet-1',
  name: 'むぎ',
  nickname: '',
  species: '猫',
  gender: '女の子' as const,
  personality: '甘えん坊',
  firstPerson: '',
  ownerCall: '',
  tone: '',
  avatarUri: '',
  sessionKey: 'pet:pet-1:main',
};

describe('getPetDefaults', () => {
  it('uses name as nickname fallback', () => {
    const result = getPetDefaults({ name: 'むぎ' });
    expect(result.nickname).toBe('むぎ');
  });

  it('prefers nickname over name', () => {
    const result = getPetDefaults({ name: 'むぎ', nickname: 'むぎちゃん' });
    expect(result.nickname).toBe('むぎちゃん');
  });

  it('uses name as firstPerson fallback', () => {
    const result = getPetDefaults({ name: 'むぎ' });
    expect(result.firstPerson).toBe('むぎ');
  });

  it('defaults ownerCall to 飼い主さん', () => {
    const result = getPetDefaults({});
    expect(result.ownerCall).toBe('飼い主さん');
  });

  it('defaults tone to ツンデレで少し甘える話し方', () => {
    const result = getPetDefaults({});
    expect(result.tone).toBe('ツンデレで少し甘える話し方');
  });

  it('respects provided values', () => {
    const result = getPetDefaults({
      nickname: 'コタくん',
      firstPerson: 'ぼく',
      ownerCall: 'パパ',
      tone: 'やさしい',
    });
    expect(result.nickname).toBe('コタくん');
    expect(result.firstPerson).toBe('ぼく');
    expect(result.ownerCall).toBe('パパ');
    expect(result.tone).toBe('やさしい');
  });

  it('handles undefined input', () => {
    const result = getPetDefaults(undefined);
    expect(result.nickname).toBe('');
    expect(result.firstPerson).toBe('わたし');
    expect(result.ownerCall).toBe('飼い主さん');
  });
});

describe('normalizePetProfile', () => {
  it('applies defaults to empty fields', () => {
    const result = normalizePetProfile(basePet);
    expect(result.nickname).toBe('むぎ');
    expect(result.firstPerson).toBe('むぎ');
    expect(result.ownerCall).toBe('飼い主さん');
  });

  it('converts legacy gender 不明 to その他', () => {
    const pet = { ...basePet, gender: '不明' as any };
    const result = normalizePetProfile(pet);
    expect(result.gender).toBe('その他');
  });

  it('keeps valid gender unchanged', () => {
    const result = normalizePetProfile(basePet);
    expect(result.gender).toBe('女の子');
  });

  it('preserves all original fields', () => {
    const result = normalizePetProfile(basePet);
    expect(result.id).toBe('pet-1');
    expect(result.name).toBe('むぎ');
    expect(result.species).toBe('猫');
    expect(result.personality).toBe('甘えん坊');
    expect(result.sessionKey).toBe('pet:pet-1:main');
  });
});
