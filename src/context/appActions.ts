import type { Dispatch, MutableRefObject } from 'react';
import type { ChatMessage, ItemType, PetProfile, SubscriptionPlan } from '../types';
import { ITEM_BONUS, AD_VIEW_LIMIT, DAILY_BASE_LIMIT } from '../types';
import type { AppState, AppAction } from './types';
import {
  ApiError,
  createPet,
  deletePet,
  fetchAuthMe,
  fetchBootstrap,
  fetchHealth,
  signInDemo,
  subscribePlan,
  syncUpload,
  updatePet,
} from '../lib/api';
import { sendPetChatMessage } from '../lib/chatService';
import { getTodayString, timeNow } from '../lib/dateUtils';
import { normalizePetProfile } from '../lib/petUtils';
import { showRewardedAd } from '../lib/adService';

export interface AppActions {
  handleSignIn: () => Promise<void>;
  handleAddPet: (pet: PetProfile) => Promise<boolean>;
  handleSavePet: (pet: PetProfile) => Promise<boolean>;
  handleSendMessage: (overrideText?: string) => Promise<void>;
  handlePlanUpgrade: (plan: SubscriptionPlan) => Promise<void>;
  handleLogout: () => void;
  handleDeletePet: (petId: string) => void;
  confirmFarewell: () => Promise<void>;
  handleUseItem: (itemType: ItemType) => void;
  confirmUseItem: () => void;
  handleAdReward: () => Promise<void>;
  retryConnection: () => Promise<void>;
  retrySendMessage: () => Promise<void>;
  triggerDebugReply: (targetPetId?: string) => void;
}

export function createAppActions(
  stateRef: MutableRefObject<AppState>,
  dispatch: Dispatch<AppAction>,
): AppActions {
  function getState(): AppState {
    return stateRef.current;
  }

  async function handleSignIn() {
    const { emailInput, pets, messagesByPetId } = getState();
    const email = emailInput.trim();
    if (!email) return;

    dispatch({ type: 'SET_IS_AUTHENTICATING', value: true });
    dispatch({ type: 'SET_NOTICE', notice: null });

    try {
      const { session: nextSession } = await signInDemo(email);
      if (pets.length > 0) {
        try {
          await syncUpload({ pets, messagesByPetId }, nextSession.authToken);
        } catch {
          // sync failed, continue
        }
      }
      const bootstrap = await fetchBootstrap(nextSession.authToken);
      dispatch({
        type: 'SIGN_IN_COMPLETE',
        session: nextSession,
        pets: (bootstrap.pets ?? []).map(normalizePetProfile),
        selectedPetId: bootstrap.selectedPetId || bootstrap.pets[0]?.id || '',
        messagesByPetId: bootstrap.messagesByPetId,
      });
      dispatch({ type: 'SET_NOTICE', notice: `ログインしました: ${nextSession.email}` });
    } catch (error) {
      dispatch({ type: 'SET_NOTICE', notice: `ログインに失敗しました。${error instanceof Error ? error.message : ''}` });
      dispatch({ type: 'SET_API_STATUS', status: 'offline' });
      dispatch({ type: 'SET_IS_AUTHENTICATING', value: false });
    }
  }

  async function handleAddPet(pet: PetProfile): Promise<boolean> {
    if (!pet.name.trim() || !pet.personality.trim()) return false;

    const { session } = getState();
    dispatch({ type: 'SET_NOTICE', notice: null });

    const helloMessage: ChatMessage = {
      id: `hello-${Date.now()}`,
      sender: 'pet',
      text: `${pet.name}だよ。これからいっぱい話そうね。`,
      time: timeNow(),
    };

    if (session?.authToken) {
      try {
        const result = await createPet({ pet }, session.authToken);
        const normalized = normalizePetProfile(result.pet);
        dispatch({ type: 'ADD_PET', pet: normalized, messages: [{ ...helloMessage, text: `${normalized.name}だよ。これからいっぱい話そうね。` }] });
        dispatch({ type: 'SET_NOTICE', notice: `${normalized.name} を登録しました。` });
        dispatch({ type: 'SET_API_STATUS', status: 'online' });
        return true;
      } catch (error) {
        if (error instanceof ApiError && error.errorCode === 'pet_limit_reached') {
          const limit = error.detail.limit as number;
          dispatch({ type: 'SET_NOTICE', notice: `ペットは${limit}匹まで登録できます。プランをアップグレードすると増やせます。` });
        } else {
          dispatch({ type: 'SET_NOTICE', notice: `ペット登録に失敗しました。${error instanceof Error ? error.message : ''}` });
        }
        return false;
      }
    }

    const normalized = normalizePetProfile(pet);
    dispatch({ type: 'ADD_PET', pet: normalized, messages: [helloMessage] });
    dispatch({ type: 'SET_NOTICE', notice: `${normalized.name} を登録しました。` });
    return true;
  }

  async function handleSavePet(nextPet: PetProfile): Promise<boolean> {
    const { session } = getState();
    dispatch({ type: 'SET_IS_SAVING_PET', value: true });
    dispatch({ type: 'SET_NOTICE', notice: null });

    if (session?.authToken) {
      try {
        const result = await updatePet({ petId: nextPet.id, pet: nextPet }, session.authToken);
        dispatch({ type: 'UPDATE_PET', pet: normalizePetProfile(result.pet) });
        dispatch({ type: 'SET_SELECTED_PET_ID', petId: result.pet.id });
        dispatch({ type: 'SET_NOTICE', notice: `${result.pet.name} の情報を更新しました。` });
        return true;
      } catch (error) {
        dispatch({ type: 'SET_NOTICE', notice: `ペット更新に失敗しました。${error instanceof Error ? error.message : ''}` });
        return false;
      } finally {
        dispatch({ type: 'SET_IS_SAVING_PET', value: false });
      }
    }

    dispatch({ type: 'UPDATE_PET', pet: normalizePetProfile(nextPet) });
    dispatch({ type: 'SET_SELECTED_PET_ID', petId: nextPet.id });
    dispatch({ type: 'SET_NOTICE', notice: `${nextPet.name} の情報を更新しました。` });
    dispatch({ type: 'SET_IS_SAVING_PET', value: false });
    return true;
  }

  async function handleSendMessage(overrideText?: string) {
    const state = getState();
    const selectedPet = state.pets.find((p) => p.id === state.selectedPetId) ?? null;
    if (!selectedPet) return;

    const trimmed = (overrideText ?? state.input).trim();
    if (!trimmed) return;

    const ownerMessage: ChatMessage = {
      id: `owner-${Date.now()}`,
      sender: 'owner',
      text: trimmed,
      time: timeNow(),
    };

    dispatch({ type: 'APPEND_MESSAGE', petId: selectedPet.id, message: ownerMessage });
    dispatch({ type: 'SET_USER_STATS', stats: { ...state.userStats, totalMessagesSent: state.userStats.totalMessagesSent + 1 } });

    const today = getTodayString();
    if (state.dailySentDate !== today) {
      dispatch({ type: 'RESET_DAILY_SENT', date: today });
    }
    dispatch({ type: 'INCREMENT_DAILY_SENT' });
    dispatch({ type: 'SET_INPUT', value: '' });
    dispatch({ type: 'SET_IS_SENDING', value: true });
    dispatch({ type: 'SET_NOTICE', notice: null });
    dispatch({ type: 'SET_FAILED_MESSAGE', failedMessage: null });

    try {
      const response = await sendPetChatMessage(
        { pet: selectedPet, message: trimmed, plan: state.session?.plan ?? 'free', bonusMessages: state.bonusMessages },
        state.session?.authToken,
      );
      const petMessage: ChatMessage = {
        id: `pet-${Date.now() + 1}`,
        sender: 'pet',
        text: response.text,
        time: timeNow(),
      };
      dispatch({ type: 'APPEND_MESSAGE', petId: selectedPet.id, message: petMessage });

      const currentState = getState();
      if (!(currentState.activeTab === 'Talk' && currentState.selectedPetId === selectedPet.id)) {
        dispatch({ type: 'SET_UNREAD_COUNTS', counts: { ...currentState.unreadCounts, [selectedPet.id]: (currentState.unreadCounts[selectedPet.id] ?? 0) + 1 } });
      }
      if (response.provider !== 'mock') {
        dispatch({ type: 'SET_API_STATUS', status: 'online' });
      }
    } catch (error) {
      if (error instanceof ApiError && error.errorCode === 'daily_limit_reached') {
        dispatch({ type: 'SET_SHOW_LIMIT_MODAL', value: true });
      } else {
        dispatch({ type: 'SET_FAILED_MESSAGE', failedMessage: { petId: selectedPet.id, text: trimmed } });
        dispatch({ type: 'SET_NOTICE', notice: 'メッセージを送れませんでした。「再送」ボタンからもう一度送れます。' });
      }
    } finally {
      dispatch({ type: 'SET_IS_SENDING', value: false });
    }
  }

  async function handlePlanUpgrade(plan: SubscriptionPlan) {
    const { session } = getState();
    if (!session?.authToken) return;

    dispatch({ type: 'SET_IS_PLAN_UPDATING', value: true });
    dispatch({ type: 'SET_NOTICE', notice: null });

    try {
      const result = await subscribePlan(plan, session.authToken);
      dispatch({ type: 'SET_SESSION', session: result.session });
      dispatch({ type: 'SET_NOTICE', notice: `プランを ${plan.toUpperCase()} に更新しました。` });
      dispatch({ type: 'SET_API_STATUS', status: 'online' });
    } catch (error) {
      dispatch({ type: 'SET_NOTICE', notice: `プラン更新に失敗しました。${error instanceof Error ? error.message : ''}` });
    } finally {
      dispatch({ type: 'SET_IS_PLAN_UPDATING', value: false });
    }
  }

  function handleLogout() {
    dispatch({ type: 'SET_SESSION', session: null });
    dispatch({ type: 'SET_NOTICE', notice: 'ログアウトしました。' });
  }

  function handleDeletePet(petId: string) {
    const pet = getState().pets.find((p) => p.id === petId);
    if (!pet) return;
    dispatch({ type: 'SET_FAREWELL_TARGET', pet });
  }

  async function confirmFarewell() {
    const { farewellTarget, session } = getState();
    if (!farewellTarget) return;

    const petName = farewellTarget.name;
    if (session?.authToken) {
      try {
        await deletePet(farewellTarget.id, session.authToken);
      } catch {
        // server delete failed, still remove locally
      }
    }
    dispatch({ type: 'REMOVE_PET', petId: farewellTarget.id });
    dispatch({ type: 'SET_NOTICE', notice: `${petName}とお別れしました。` });
  }

  function handleUseItem(itemType: ItemType) {
    const { inventory } = getState();
    if (inventory[itemType] <= 0) return;
    dispatch({ type: 'SET_USE_ITEM_CONFIRM', itemType });
  }

  function confirmUseItem() {
    const { useItemConfirm, bonusDate, bonusMessages } = getState();
    if (!useItemConfirm) return;

    const itemType = useItemConfirm;
    const today = getTodayString();
    dispatch({ type: 'USE_INVENTORY_ITEM', itemType });

    const newBonus = bonusDate !== today
      ? ITEM_BONUS[itemType]
      : bonusMessages + ITEM_BONUS[itemType];
    dispatch({ type: 'SET_BONUS', bonus: newBonus, date: today });
    dispatch({ type: 'SET_USE_ITEM_CONFIRM', itemType: null });

    const labels: Record<ItemType, string> = { snack: 'おやつ', meal: 'ごはん', feast: 'ごちそう' };
    dispatch({ type: 'SET_NOTICE', notice: `${labels[itemType]}を使いました！おはなし+${ITEM_BONUS[itemType]}回` });
  }

  async function handleAdReward() {
    const { adReward } = getState();
    const today = getTodayString();
    const current = adReward.date === today ? adReward : { date: today, viewCount: 0 };
    if (current.viewCount >= AD_VIEW_LIMIT) return;

    const result = await showRewardedAd();
    if (!result.success) return;

    dispatch({ type: 'SET_AD_REWARD', adReward: { date: today, viewCount: current.viewCount + 1 } });
    dispatch({ type: 'ADD_INVENTORY_ITEM', itemType: 'snack', amount: 1 });
    dispatch({ type: 'SET_NOTICE', notice: 'おやつ×1をもらいました！' });
  }

  async function retryConnection() {
    dispatch({ type: 'SET_API_STATUS', status: 'checking' });
    try {
      await fetchHealth();
      dispatch({ type: 'SET_API_STATUS', status: 'online' });
      dispatch({ type: 'SET_NOTICE', notice: 'サーバーに再接続しました。' });
    } catch {
      dispatch({ type: 'SET_API_STATUS', status: 'offline' });
      dispatch({ type: 'SET_NOTICE', notice: 'サーバーに接続できません。' });
    }
  }

  async function retrySendMessage() {
    const { failedMessage } = getState();
    if (!failedMessage) return;

    dispatch({ type: 'SET_SELECTED_PET_ID', petId: failedMessage.petId });
    await handleSendMessage(failedMessage.text);
  }

  function triggerDebugReply(targetPetId?: string) {
    const state = getState();
    const petId = targetPetId ?? state.selectedPetId;
    const pet = state.pets.find((p) => p.id === petId);
    if (!pet) return;

    const debugMessage: ChatMessage = {
      id: `debug-${Date.now()}`,
      sender: 'pet',
      text: `${pet.name}だよ。これは未読確認用のテスト返信だよ。別タブにいるなら未読が増えるはず。`,
      time: timeNow(),
    };

    dispatch({ type: 'APPEND_MESSAGE', petId: pet.id, message: debugMessage });
    if (!(state.activeTab === 'Talk' && state.selectedPetId === pet.id)) {
      dispatch({ type: 'SET_UNREAD_COUNTS', counts: { ...state.unreadCounts, [pet.id]: (state.unreadCounts[pet.id] ?? 0) + 1 } });
    }
    dispatch({ type: 'SET_NOTICE', notice: `${pet.name} にテスト返信を発火しました。` });
  }

  return {
    handleSignIn,
    handleAddPet,
    handleSavePet,
    handleSendMessage,
    handlePlanUpgrade,
    handleLogout,
    handleDeletePet,
    confirmFarewell,
    handleUseItem,
    confirmUseItem,
    handleAdReward,
    retryConnection,
    retrySendMessage,
    triggerDebugReply,
  };
}
