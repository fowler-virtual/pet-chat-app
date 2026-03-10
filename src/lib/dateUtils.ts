import type { AdRewardState, UserStats } from '../types';

export function getTodayString(): string {
  return new Date().toLocaleDateString('sv-SE'); // 'YYYY-MM-DD'
}

export function timeNow(): string {
  return new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}

export function updateLoginStreak(prev: UserStats | undefined): UserStats {
  const today = getTodayString();
  if (!prev) {
    return { lastOpenDate: today, loginStreak: 1, totalMessagesSent: 0, firstOpenDate: today };
  }
  if (prev.lastOpenDate === today) {
    return prev;
  }
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString('sv-SE');
  const streak = prev.lastOpenDate === yesterdayStr ? prev.loginStreak + 1 : 1;
  return { ...prev, lastOpenDate: today, loginStreak: streak };
}

export function daysSince(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)) + 1);
}

export function resetBonusIfNewDay(prevDate: string, prevBonus: number): { bonus: number; date: string } {
  const today = getTodayString();
  if (prevDate === today) return { bonus: prevBonus, date: prevDate };
  return { bonus: 0, date: today };
}

export function resetAdRewardIfNewDay(prev: AdRewardState): AdRewardState {
  const today = getTodayString();
  if (prev.date === today) return prev;
  return { date: today, viewCount: 0 };
}
