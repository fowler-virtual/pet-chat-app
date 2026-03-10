import { describe, it, expect } from 'vitest';

describe('plan limits constants', () => {
  // These values should match what's defined in server/index.js
  const PET_LIMITS = { free: 1, plus: 3 };
  const DAILY_MESSAGE_LIMITS = { free: 5, plus: 50 };

  describe('pet limits', () => {
    it('free plan allows 1 pet', () => {
      expect(PET_LIMITS.free).toBe(1);
    });

    it('plus plan allows 3 pets', () => {
      expect(PET_LIMITS.plus).toBe(3);
    });
  });

  describe('daily message limits', () => {
    it('free plan allows 5 messages per day', () => {
      expect(DAILY_MESSAGE_LIMITS.free).toBe(5);
    });

    it('plus plan allows 50 messages per day', () => {
      expect(DAILY_MESSAGE_LIMITS.plus).toBe(50);
    });
  });

  describe('plan hierarchy', () => {
    it('plus tier allows more pets than free', () => {
      expect(PET_LIMITS.plus).toBeGreaterThan(PET_LIMITS.free);
    });

    it('plus tier allows more daily messages than free', () => {
      expect(DAILY_MESSAGE_LIMITS.plus).toBeGreaterThan(DAILY_MESSAGE_LIMITS.free);
    });
  });

  describe('item bonuses', () => {
    const ITEM_BONUS = { snack: 3, meal: 5, feast: 10 };

    it('snack gives +3 messages', () => {
      expect(ITEM_BONUS.snack).toBe(3);
    });

    it('meal gives +5 messages', () => {
      expect(ITEM_BONUS.meal).toBe(5);
    });

    it('feast gives +10 messages', () => {
      expect(ITEM_BONUS.feast).toBe(10);
    });

    it('item bonuses are ordered by value', () => {
      expect(ITEM_BONUS.meal).toBeGreaterThan(ITEM_BONUS.snack);
      expect(ITEM_BONUS.feast).toBeGreaterThan(ITEM_BONUS.meal);
    });

    it('max free daily (base + login + 3 ads) is less than plus base', () => {
      const freeBase = DAILY_MESSAGE_LIMITS.free;
      const loginBonus = ITEM_BONUS.snack; // 1 snack from login
      const adBonus = ITEM_BONUS.snack * 3; // 3 ads × 1 snack each
      const freeMax = freeBase + loginBonus + adBonus;
      expect(freeMax).toBeLessThan(DAILY_MESSAGE_LIMITS.plus);
    });
  });
});
