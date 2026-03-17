import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import type { AppState, AppAction } from './types';
import { appReducer, createInitialState } from './appReducer';
import { createAppActions, type AppActions } from './appActions';
import { DAILY_BASE_LIMIT } from '../types';
import { getTodayString } from '../lib/dateUtils';
import { getPalette, ThemeProvider } from '../theme';
import {
  useHydration,
  usePersistence,
  useHealthCheck,
  useSessionRefresh,
  useClearUnread,
  useAutoDismissNotice,
  useIAPSetup,
} from './useAppEffects';

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  actions: AppActions;
  // Derived values
  selectedPet: import('../types').PetProfile | null;
  selectedMessages: import('../types').ChatMessage[];
  remainingMessages: number;
  dailyLimit: number;
  totalUnreadCount: number;
  conversationMetaByPetId: Record<string, { lastTime: string; lastText: string; unreadCount: number }>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, createInitialState);

  // Keep a ref to latest state for async actions (sync update, not useEffect)
  const stateRef = useRef(state);
  stateRef.current = state;

  const actions = useMemo(() => createAppActions(stateRef, dispatch), []);

  // --- Effects ---
  useHydration(dispatch);
  usePersistence(state);
  useHealthCheck(dispatch);
  useSessionRefresh(state.session?.authToken, stateRef, dispatch);
  useClearUnread(state.activeTab, state.selectedPetId, dispatch);
  useAutoDismissNotice(state.notice, dispatch);
  useIAPSetup(state.isHydrating, actions);

  // --- Derived values ---
  const selectedPet = useMemo(
    () => state.pets.find((p) => p.id === state.selectedPetId) ?? null,
    [state.pets, state.selectedPetId],
  );

  const selectedMessages = useMemo(
    () => (selectedPet ? (state.messagesByPetId[selectedPet.id] ?? []) : []),
    [selectedPet, state.messagesByPetId],
  );

  const totalUnreadCount = useMemo(
    () => Object.values(state.unreadCounts).reduce((sum, c) => sum + c, 0),
    [state.unreadCounts],
  );

  const conversationMetaByPetId = useMemo(
    () =>
      Object.fromEntries(
        state.pets.map((pet) => {
          const messages = state.messagesByPetId[pet.id] ?? [];
          const last = messages[messages.length - 1];
          return [pet.id, { lastTime: last?.time ?? '', lastText: last?.text?.slice(0, 24) ?? '', unreadCount: state.unreadCounts[pet.id] ?? 0 }];
        }),
      ) as Record<string, { lastTime: string; lastText: string; unreadCount: number }>,
    [state.messagesByPetId, state.pets, state.unreadCounts],
  );

  const dailyLimit = useMemo(() => {
    const base = DAILY_BASE_LIMIT[state.session?.plan ?? 'free'];
    const bonus = state.bonusDate === getTodayString() ? state.bonusMessages : 0;
    return base + bonus;
  }, [state.session?.plan, state.bonusMessages, state.bonusDate]);

  const remainingMessages = useMemo(() => {
    const sent = state.dailySentDate === getTodayString() ? state.dailySentCount : 0;
    return Math.max(0, dailyLimit - sent);
  }, [dailyLimit, state.dailySentCount, state.dailySentDate]);

  const value = useMemo<AppContextValue>(
    () => ({ state, dispatch, actions, selectedPet, selectedMessages, remainingMessages, dailyLimit, totalUnreadCount, conversationMetaByPetId }),
    [state, actions, selectedPet, selectedMessages, remainingMessages, dailyLimit, totalUnreadCount, conversationMetaByPetId],
  );

  const currentPalette = useMemo(() => getPalette(state.themeKey), [state.themeKey]);

  return (
    <AppContext.Provider value={value}>
      <ThemeProvider value={currentPalette}>{children}</ThemeProvider>
    </AppContext.Provider>
  );
}
