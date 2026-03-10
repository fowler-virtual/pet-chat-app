import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import type { AppState, AppAction } from './types';
import { appReducer, createInitialState } from './appReducer';
import { createAppActions, type AppActions } from './appActions';
import { DAILY_BASE_LIMIT } from '../types';
import {
  useHydration,
  usePersistence,
  useHealthCheck,
  useSessionRefresh,
  useClearUnread,
  useAutoDismissNotice,
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

  // Keep a ref to latest state for async actions
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });

  const actions = useMemo(() => createAppActions(stateRef, dispatch), []);

  // --- Effects ---
  useHydration(dispatch);
  usePersistence(state);
  useHealthCheck(dispatch);
  useSessionRefresh(state.session?.authToken, dispatch);
  useClearUnread(state.activeTab, state.selectedPetId, dispatch);
  useAutoDismissNotice(state.notice, dispatch);

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

  const dailyLimit = useMemo(
    () => DAILY_BASE_LIMIT[state.session?.plan ?? 'free'] + state.bonusMessages,
    [state.session?.plan, state.bonusMessages],
  );

  const remainingMessages = useMemo(
    () => Math.max(0, dailyLimit - state.dailySentCount),
    [dailyLimit, state.dailySentCount],
  );

  const value = useMemo<AppContextValue>(
    () => ({ state, dispatch, actions, selectedPet, selectedMessages, remainingMessages, dailyLimit, totalUnreadCount, conversationMetaByPetId }),
    [state, actions, selectedPet, selectedMessages, remainingMessages, dailyLimit, totalUnreadCount, conversationMetaByPetId],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
