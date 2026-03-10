import { describe, it, expect } from 'vitest';
import {
  genderOptions,
  planOptions,
  SPECIES_OPTIONS,
  OWNER_CALL_OPTIONS,
  FIRST_PERSON_OPTIONS,
  TONE_OPTIONS,
  AVATAR_ICONS,
} from '../src/data/constants';

describe('genderOptions', () => {
  it('contains exactly 3 options', () => {
    expect(genderOptions).toHaveLength(3);
  });

  it('includes 男の子, 女の子, その他', () => {
    expect(genderOptions).toContain('男の子');
    expect(genderOptions).toContain('女の子');
    expect(genderOptions).toContain('その他');
  });
});

describe('planOptions', () => {
  it('contains free and plus', () => {
    expect(planOptions).toEqual(['free', 'plus']);
  });
});

describe('SPECIES_OPTIONS', () => {
  it('includes common pet species', () => {
    expect(SPECIES_OPTIONS).toContain('猫');
    expect(SPECIES_OPTIONS).toContain('犬');
    expect(SPECIES_OPTIONS).toContain('うさぎ');
  });

  it('ends with その他', () => {
    expect(SPECIES_OPTIONS[SPECIES_OPTIONS.length - 1]).toBe('その他');
  });
});

describe('OWNER_CALL_OPTIONS', () => {
  it('includes ママ and パパ', () => {
    expect(OWNER_CALL_OPTIONS).toContain('ママ');
    expect(OWNER_CALL_OPTIONS).toContain('パパ');
  });

  it('uses hiragana for かいぬし', () => {
    expect(OWNER_CALL_OPTIONS).toContain('かいぬし');
  });
});

describe('FIRST_PERSON_OPTIONS', () => {
  it('includes common first-person pronouns', () => {
    expect(FIRST_PERSON_OPTIONS).toContain('ぼく');
    expect(FIRST_PERSON_OPTIONS).toContain('わたし');
  });
});

describe('TONE_OPTIONS', () => {
  it('includes ツンデレ and やさしい', () => {
    expect(TONE_OPTIONS).toContain('ツンデレ');
    expect(TONE_OPTIONS).toContain('やさしい');
  });
});

describe('AVATAR_ICONS', () => {
  it('has icon and label for each entry', () => {
    for (const item of AVATAR_ICONS) {
      expect(item).toHaveProperty('icon');
      expect(item).toHaveProperty('label');
      expect(typeof item.icon).toBe('string');
      expect(typeof item.label).toBe('string');
    }
  });

  it('includes cat and dog', () => {
    const icons = AVATAR_ICONS.map((i) => i.icon);
    expect(icons).toContain('cat');
    expect(icons).toContain('dog');
  });

  it('includes paw as fallback icon', () => {
    const icons = AVATAR_ICONS.map((i) => i.icon);
    expect(icons).toContain('paw');
  });
});
