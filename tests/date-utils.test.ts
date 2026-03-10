import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getTodayString,
  timeNow,
  updateLoginStreak,
  daysSince,
  resetBonusIfNewDay,
  resetAdRewardIfNewDay,
} from '../src/lib/dateUtils';

describe('getTodayString', () => {
  it('returns YYYY-MM-DD format', () => {
    const result = getTodayString();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('timeNow', () => {
  it('returns HH:MM format', () => {
    const result = timeNow();
    expect(result).toMatch(/^\d{1,2}:\d{2}$/);
  });
});

describe('updateLoginStreak', () => {
  it('creates initial stats when prev is undefined', () => {
    const result = updateLoginStreak(undefined);
    expect(result.loginStreak).toBe(1);
    expect(result.totalMessagesSent).toBe(0);
    expect(result.lastOpenDate).toBe(getTodayString());
    expect(result.firstOpenDate).toBe(getTodayString());
  });

  it('returns same stats if already opened today', () => {
    const today = getTodayString();
    const prev = { lastOpenDate: today, loginStreak: 5, totalMessagesSent: 10, firstOpenDate: '2025-01-01' };
    const result = updateLoginStreak(prev);
    expect(result).toBe(prev); // same reference
  });

  it('increments streak for consecutive day', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('sv-SE');
    const prev = { lastOpenDate: yesterdayStr, loginStreak: 3, totalMessagesSent: 10, firstOpenDate: '2025-01-01' };
    const result = updateLoginStreak(prev);
    expect(result.loginStreak).toBe(4);
    expect(result.lastOpenDate).toBe(getTodayString());
  });

  it('resets streak after gap', () => {
    const prev = { lastOpenDate: '2025-01-01', loginStreak: 10, totalMessagesSent: 50, firstOpenDate: '2024-12-01' };
    const result = updateLoginStreak(prev);
    expect(result.loginStreak).toBe(1);
    expect(result.lastOpenDate).toBe(getTodayString());
  });

  it('preserves totalMessagesSent and firstOpenDate', () => {
    const prev = { lastOpenDate: '2025-01-01', loginStreak: 5, totalMessagesSent: 42, firstOpenDate: '2024-06-15' };
    const result = updateLoginStreak(prev);
    expect(result.totalMessagesSent).toBe(42);
    expect(result.firstOpenDate).toBe('2024-06-15');
  });
});

describe('daysSince', () => {
  it('returns at least 1 for today', () => {
    const today = getTodayString();
    expect(daysSince(today)).toBeGreaterThanOrEqual(1);
  });

  it('returns correct days for past date', () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const dateStr = threeDaysAgo.toLocaleDateString('sv-SE');
    const result = daysSince(dateStr);
    expect(result).toBe(4); // 3 days ago + 1
  });
});

describe('resetBonusIfNewDay', () => {
  it('keeps bonus if same day', () => {
    const today = getTodayString();
    const result = resetBonusIfNewDay(today, 15);
    expect(result.bonus).toBe(15);
    expect(result.date).toBe(today);
  });

  it('resets bonus to 0 on new day', () => {
    const result = resetBonusIfNewDay('2025-01-01', 15);
    expect(result.bonus).toBe(0);
    expect(result.date).toBe(getTodayString());
  });
});

describe('resetAdRewardIfNewDay', () => {
  it('keeps state if same day', () => {
    const today = getTodayString();
    const prev = { date: today, viewCount: 2 };
    const result = resetAdRewardIfNewDay(prev);
    expect(result).toBe(prev); // same reference
  });

  it('resets viewCount to 0 on new day', () => {
    const prev = { date: '2025-01-01', viewCount: 3 };
    const result = resetAdRewardIfNewDay(prev);
    expect(result.viewCount).toBe(0);
    expect(result.date).toBe(getTodayString());
  });
});
