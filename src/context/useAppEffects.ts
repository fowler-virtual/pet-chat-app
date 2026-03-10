import { useEffect } from 'react';
import type { Dispatch } from 'react';
import type { AppState, AppAction } from './types';
import { loadPersistedAppState, savePersistedAppState } from '../lib/storage';
import { fetchAuthMe, fetchBootstrap, fetchHealth } from '../lib/api';
import { getTodayString, updateLoginStreak, resetBonusIfNewDay, resetAdRewardIfNewDay } from '../lib/dateUtils';
import { normalizePetProfile } from '../lib/petUtils';

export function useHydration(dispatch: Dispatch<AppAction>) {
  useEffect(() => {
    let active = true;
    async function hydrate() {
      try {
        const stored = await loadPersistedAppState();
        if (!active || !stored) return;

        const storedInventory = stored.inventory ?? { snack: 0, meal: 0, feast: 0 };
        const prevStats = stored.userStats;
        const isNewDay = !prevStats || prevStats.lastOpenDate !== getTodayString();
        if (isNewDay) {
          storedInventory.snack += 1;
        }
        const { bonus, date } = resetBonusIfNewDay(stored.bonusDate ?? getTodayString(), stored.bonusMessages ?? 0);

        dispatch({
          type: 'HYDRATE',
          payload: {
            session: stored.session,
            pets: (stored.pets ?? []).map(normalizePetProfile),
            selectedPetId: stored.selectedPetId,
            messagesByPetId: stored.messagesByPetId,
            unreadCounts: stored.unreadCounts ?? {},
            userStats: updateLoginStreak(stored.userStats),
            inventory: storedInventory,
            adReward: resetAdRewardIfNewDay(stored.adReward ?? { date: getTodayString(), viewCount: 0 }),
            bonusMessages: bonus,
            bonusDate: date,
            notice: isNewDay ? 'ログインボーナス！おやつ×1をもらいました' : null,
            dailySentCount: isNewDay ? 0 : undefined,
            dailySentDate: isNewDay ? getTodayString() : undefined,
          },
        });
      } finally {
        if (active) dispatch({ type: 'SET_IS_HYDRATING', value: false });
      }
    }
    void hydrate();
    return () => { active = false; };
  }, [dispatch]);
}

export function usePersistence(state: AppState) {
  useEffect(() => {
    if (state.isHydrating) return;
    void savePersistedAppState({
      session: state.session,
      pets: state.pets,
      selectedPetId: state.selectedPetId,
      messagesByPetId: state.messagesByPetId,
      unreadCounts: state.unreadCounts,
      userStats: state.userStats,
      inventory: state.inventory,
      adReward: state.adReward,
      bonusMessages: state.bonusMessages,
      bonusDate: state.bonusDate,
    });
  }, [state.isHydrating, state.session, state.pets, state.selectedPetId, state.messagesByPetId, state.unreadCounts, state.userStats, state.inventory, state.adReward, state.bonusMessages, state.bonusDate]);
}

export function useHealthCheck(dispatch: Dispatch<AppAction>) {
  useEffect(() => {
    let active = true;
    async function check() {
      try {
        const result = await fetchHealth();
        if (active) dispatch({ type: 'SET_API_STATUS', status: result.ok ? 'online' : 'offline' });
      } catch {
        if (active) dispatch({ type: 'SET_API_STATUS', status: 'offline' });
      }
    }
    void check();
    return () => { active = false; };
  }, [dispatch]);
}

export function useSessionRefresh(authToken: string | undefined, dispatch: Dispatch<AppAction>) {
  useEffect(() => {
    if (!authToken) return;
    let active = true;
    async function refresh() {
      try {
        const [{ session: freshSession }, bootstrap] = await Promise.all([
          fetchAuthMe(authToken!),
          fetchBootstrap(authToken!),
        ]);
        if (!active) return;
        dispatch({
          type: 'SIGN_IN_COMPLETE',
          session: freshSession,
          pets: (bootstrap.pets ?? []).map(normalizePetProfile),
          selectedPetId: bootstrap.selectedPetId || bootstrap.pets[0]?.id || '',
          messagesByPetId: bootstrap.messagesByPetId,
        });
      } catch {
        if (active) dispatch({ type: 'SET_API_STATUS', status: 'offline' });
      }
    }
    void refresh();
    return () => { active = false; };
  }, [authToken, dispatch]);
}

export function useClearUnread(activeTab: string, selectedPetId: string, dispatch: Dispatch<AppAction>) {
  useEffect(() => {
    if (activeTab === 'Talk' && selectedPetId) {
      dispatch({ type: 'CLEAR_UNREAD', petId: selectedPetId });
    }
  }, [activeTab, selectedPetId, dispatch]);
}

export function useAutoDismissNotice(notice: string | null, dispatch: Dispatch<AppAction>) {
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => dispatch({ type: 'SET_NOTICE', notice: null }), 4000);
    return () => clearTimeout(timer);
  }, [notice, dispatch]);
}
