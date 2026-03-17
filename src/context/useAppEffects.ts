import { useEffect } from 'react';
import type { Dispatch, MutableRefObject } from 'react';
import type { AppState, AppAction } from './types';
import type { AppActions } from './appActions';
import { loadPersistedAppState, savePersistedAppState } from '../lib/storage';
import { ApiError, fetchAuthMe, fetchBootstrap, fetchHealth, syncUpload } from '../lib/api';
import { getTodayString, updateLoginStreak, resetBonusIfNewDay, resetAdRewardIfNewDay } from '../lib/dateUtils';
import { normalizePetProfile } from '../lib/petUtils';
import { initializeIAP } from '../lib/iapService';
import type { ThemeKey } from '../theme';

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
            ...(stored.themeKey ? { themeKey: stored.themeKey as ThemeKey } : {}),
            notice: isNewDay ? 'ログインボーナス！おやつ×1をもらいました' : null,
            ...(isNewDay ? { dailySentCount: 0, dailySentDate: getTodayString() } : {}),
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
      themeKey: state.themeKey,
    });
  }, [state.isHydrating, state.session, state.pets, state.selectedPetId, state.messagesByPetId, state.unreadCounts, state.userStats, state.inventory, state.adReward, state.bonusMessages, state.bonusDate, state.themeKey]);
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

export function useSessionRefresh(authToken: string | undefined, stateRef: React.RefObject<AppState>, dispatch: Dispatch<AppAction>) {
  useEffect(() => {
    if (!authToken) return;
    let active = true;
    async function refresh() {
      try {
        const { pets, messagesByPetId } = stateRef.current!;
        let syncFailed = false;
        const [{ session: freshSession }] = await Promise.all([
          fetchAuthMe(authToken!),
          pets.length > 0
            ? syncUpload({ pets, messagesByPetId }, authToken!).catch(() => { syncFailed = true; })
            : Promise.resolve(),
        ]);
        if (!active) return;
        const bootstrap = await fetchBootstrap(authToken!);
        if (!active) return;
        const serverPets = (bootstrap.pets ?? []).map(normalizePetProfile);
        const serverPetIds = new Set(serverPets.map((p: { id: string }) => p.id));
        const localOnlyPets = syncFailed ? pets.filter((p) => !serverPetIds.has(p.id)) : [];
        const mergedPets = [...serverPets, ...localOnlyPets];
        const localOnlyMessages = syncFailed
          ? Object.fromEntries(Object.entries(messagesByPetId).filter(([id]) => !bootstrap.messagesByPetId?.[id]))
          : {};
        dispatch({
          type: 'SIGN_IN_COMPLETE',
          session: freshSession,
          pets: mergedPets,
          selectedPetId: bootstrap.selectedPetId || mergedPets[0]?.id || '',
          messagesByPetId: { ...localOnlyMessages, ...bootstrap.messagesByPetId },
        });
      } catch (error) {
        if (!active) return;
        if (error instanceof ApiError && error.status === 401) {
          // トークンが無効 → セッションをクリアしてゲストモードに戻す
          dispatch({ type: 'SET_SESSION', session: null });
        } else {
          dispatch({ type: 'SET_API_STATUS', status: 'offline' });
        }
      }
    }
    void refresh();
    return () => { active = false; };
  }, [authToken, stateRef, dispatch]);
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

export function useIAPSetup(isHydrating: boolean, actions: AppActions) {
  useEffect(() => {
    if (isHydrating) return;
    let active = true;

    async function setup() {
      await initializeIAP();
      if (!active) return;
      await actions.restoreSubscription();
    }

    void setup();
    return () => { active = false; };
  }, [isHydrating, actions]);
}
