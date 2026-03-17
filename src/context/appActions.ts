import type { Dispatch, MutableRefObject } from 'react';
import type { ChatMessage, ItemType, PetProfile, SubscriptionPlan } from '../types';
import { ITEM_BONUS, AD_VIEW_LIMIT, DAILY_BASE_LIMIT } from '../types';
import type { AppState, AppAction } from './types';
import {
  ApiError,
  apiIssueTransferCode,
  apiRedeemTransferCode,
  createPet,
  deletePet,
  fetchAuthMe,
  fetchBootstrap,
  fetchHealth,
  registerAnonymous,
  subscribePlan,
  syncUpload,
  updatePet,
  verifyReceipt,
} from '../lib/api';
import { sendPetChatMessage } from '../lib/chatService';
import { getTodayString, timeNow } from '../lib/dateUtils';
import { normalizePetProfile } from '../lib/petUtils';
import { showRewardedAd } from '../lib/adService';
import { purchaseSubscription } from '../lib/iapService';

function getPlatformOS(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native').Platform?.OS ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

export interface AppActions {
  handleIssueTransferCode: () => Promise<void>;
  handleRedeemTransferCode: () => Promise<void>;
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
  restoreSubscription: () => Promise<void>;
  retryConnection: () => Promise<void>;
  retrySendMessage: () => Promise<void>;
  triggerDebugReply: (targetPetId?: string) => void;
}

const AD_REWARD_WEIGHTS: { type: ItemType; weight: number }[] = [
  { type: 'snack', weight: 70 },
  { type: 'meal', weight: 25 },
  { type: 'feast', weight: 5 },
];

const ITEM_LABEL: Record<ItemType, string> = { snack: 'おやつ', meal: 'ごはん', feast: 'ごちそう' };

function rollAdRewardItem(): ItemType {
  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const entry of AD_REWARD_WEIGHTS) {
    cumulative += entry.weight;
    if (roll < cumulative) return entry.type;
  }
  return 'snack';
}

let _lastSendTime = 0;

export function _resetSendThrottle() {
  _lastSendTime = 0;
}

export function createAppActions(
  stateRef: MutableRefObject<AppState>,
  dispatch: Dispatch<AppAction>,
): AppActions {
  function getState(): AppState {
    return stateRef.current;
  }

  async function handleIssueTransferCode() {
    dispatch({ type: 'SET_IS_AUTHENTICATING', value: true });
    dispatch({ type: 'SET_NOTICE', notice: null });

    try {
      let { session } = getState();
      const { pets, messagesByPetId } = getState();

      // セッションがなければ匿名ユーザーを作成してデータをアップロード
      if (!session?.authToken) {
        const reg = await registerAnonymous();
        session = reg.session;
        dispatch({ type: 'SET_SESSION', session });
        if (pets.length > 0) {
          await syncUpload({ pets, messagesByPetId }, session.authToken);
        }
        // ストアで有効な課金があればサーバーにも反映
        await restoreSubscription();
      }

      try {
        const result = await apiIssueTransferCode(session!.authToken);
        dispatch({ type: 'SET_ISSUED_TRANSFER_CODE', code: result.transferCode });
      } catch (apiErr) {
        // トークンが無効（サーバー再起動等）→ 再作成してリトライ
        if (apiErr instanceof ApiError && apiErr.status === 401) {
          const reg = await registerAnonymous();
          session = reg.session;
          dispatch({ type: 'SET_SESSION', session });
          if (pets.length > 0) {
            await syncUpload({ pets, messagesByPetId }, session.authToken);
          }
          const result = await apiIssueTransferCode(session.authToken);
          dispatch({ type: 'SET_ISSUED_TRANSFER_CODE', code: result.transferCode });
        } else {
          throw apiErr;
        }
      }
    } catch (error) {
      dispatch({ type: 'SET_NOTICE', notice: `引き継ぎコードの発行に失敗しました。${error instanceof Error ? error.message : ''}` });
    } finally {
      dispatch({ type: 'SET_IS_AUTHENTICATING', value: false });
    }
  }

  async function handleRedeemTransferCode() {
    const { transferCodeInput } = getState();
    const code = transferCodeInput.trim();
    if (!code) return;

    dispatch({ type: 'SET_IS_AUTHENTICATING', value: true });
    dispatch({ type: 'SET_NOTICE', notice: null });

    try {
      const { session: nextSession } = await apiRedeemTransferCode(code);
      const bootstrap = await fetchBootstrap(nextSession.authToken);
      const serverPets = (bootstrap.pets ?? []).map(normalizePetProfile);
      dispatch({
        type: 'SIGN_IN_COMPLETE',
        session: nextSession,
        pets: serverPets,
        selectedPetId: bootstrap.selectedPetId || serverPets[0]?.id || '',
        messagesByPetId: bootstrap.messagesByPetId ?? {},
      });
      dispatch({ type: 'SET_NOTICE', notice: 'データを引き継ぎました' });
    } catch (error) {
      const msg = error instanceof ApiError && error.errorCode === 'invalid_or_expired_code'
        ? '引き継ぎコードが無効または期限切れです'
        : `引き継ぎに失敗しました。${error instanceof Error ? error.message : ''}`;
      dispatch({ type: 'SET_NOTICE', notice: msg });
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
          dispatch({ type: 'SET_NOTICE', notice: `ペットは${limit}匹までおむかえできます。プランをアップグレードすると増やせます。` });
        } else {
          dispatch({ type: 'SET_NOTICE', notice: `おむかえに失敗しました。${error instanceof Error ? error.message : ''}` });
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
        // トークン無効 → セッション破棄してローカル保存にフォールバック
        if (error instanceof ApiError && error.status === 401) {
          dispatch({ type: 'SET_SESSION', session: null });
        } else {
          dispatch({ type: 'SET_NOTICE', notice: `ペット更新に失敗しました。${error instanceof Error ? error.message : ''}` });
          dispatch({ type: 'SET_IS_SAVING_PET', value: false });
          return false;
        }
      }
    }

    dispatch({ type: 'UPDATE_PET', pet: normalizePetProfile(nextPet) });
    dispatch({ type: 'SET_SELECTED_PET_ID', petId: nextPet.id });
    dispatch({ type: 'SET_NOTICE', notice: `${nextPet.name} の情報を更新しました。` });
    dispatch({ type: 'SET_IS_SAVING_PET', value: false });
    return true;
  }

  async function handleSendMessage(overrideText?: string) {
    const now = Date.now();
    if (now - _lastSendTime < 2000) return;
    _lastSendTime = now;
    // Always read latest state to pick up bonus changes
    const state = getState();
    const selectedPet = state.pets.find((p) => p.id === state.selectedPetId) ?? null;
    if (!selectedPet) { _lastSendTime = 0; return; }

    const trimmed = (overrideText ?? state.input).trim();
    if (!trimmed) { _lastSendTime = 0; return; }

    const today = getTodayString();
    const bonus = state.bonusDate === today ? state.bonusMessages : 0;
    const dailyLimit = DAILY_BASE_LIMIT[state.session?.plan ?? 'free'] + bonus;
    const todayCount = state.dailySentDate === today ? state.dailySentCount : 0;
    if (todayCount >= dailyLimit) {
      _lastSendTime = 0;
      return;
    }

    const ownerMessage: ChatMessage = {
      id: `owner-${Date.now()}`,
      sender: 'owner',
      text: trimmed,
      time: timeNow(),
    };

    dispatch({ type: 'SET_IS_SENDING', value: true });
    dispatch({ type: 'APPEND_MESSAGE', petId: selectedPet.id, message: ownerMessage });
    dispatch({ type: 'SET_USER_STATS', stats: { ...state.userStats, totalMessagesSent: state.userStats.totalMessagesSent + 1 } });

    if (state.dailySentDate !== today) {
      dispatch({ type: 'RESET_DAILY_SENT', date: today });
    }
    dispatch({ type: 'INCREMENT_DAILY_SENT' });
    dispatch({ type: 'SET_INPUT', value: '' });
    dispatch({ type: 'SET_NOTICE', notice: null });
    dispatch({ type: 'SET_FAILED_MESSAGE', failedMessage: null });

    try {
      const authToken = state.session?.authToken;

      const latestState = getState();
      const currentBonus = latestState.bonusDate === today ? latestState.bonusMessages : 0;
      const response = await sendPetChatMessage(
        { pet: selectedPet, message: trimmed, plan: latestState.session?.plan ?? 'free', bonusMessages: currentBonus },
        authToken,
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
      if (!(error instanceof ApiError && error.errorCode === 'daily_limit_reached')) {
        dispatch({ type: 'SET_FAILED_MESSAGE', failedMessage: { petId: selectedPet.id, text: trimmed } });
        dispatch({ type: 'SET_NOTICE', notice: 'メッセージを送れませんでした。「再送」ボタンからもう一度送れます。' });
      }
    } finally {
      dispatch({ type: 'SET_IS_SENDING', value: false });
    }
  }

  async function handlePlanUpgrade(plan: SubscriptionPlan) {
    const state = getState();
    if (state.isPlanUpdating) return;

    dispatch({ type: 'SET_IS_PLAN_UPDATING', value: true });
    dispatch({ type: 'SET_NOTICE', notice: null });

    try {
      // 1. ストアで購入
      const purchaseResult = await purchaseSubscription();

      if (!purchaseResult.success) {
        if (purchaseResult.reason === 'cancelled') {
          // ユーザーキャンセル: 静かに終了
          return;
        }
        dispatch({ type: 'SET_NOTICE', notice: '購入処理に失敗しました。' });
        return;
      }

      // 2. セッションがなければ匿名ユーザーを作成
      let { session } = getState();
      if (!session?.authToken) {
        try {
          const reg = await registerAnonymous();
          session = reg.session;
          dispatch({ type: 'SET_SESSION', session });
          const { pets, messagesByPetId } = getState();
          if (pets.length > 0) {
            await syncUpload({ pets, messagesByPetId }, session.authToken);
          }
        } catch {
          // サーバー接続失敗: ローカルでプラン反映、次回起動時にレシート復元
          dispatch({ type: 'SET_SESSION', session: { id: 'local', authToken: '', plan: 'plus' } });
          dispatch({ type: 'SET_NOTICE', notice: 'Plus にアップグレードしました！（次回起動時にサーバーに反映されます）' });
          return;
        }
      }

      // 3. サーバーでレシート検証
      try {
        const result = await verifyReceipt(
          purchaseResult.productId,
          purchaseResult.receipt,
          getPlatformOS(),
          session!.authToken,
        );
        dispatch({ type: 'SET_SESSION', session: result.session });
        dispatch({ type: 'SET_NOTICE', notice: 'Plus にアップグレードしました！' });
        dispatch({ type: 'SET_API_STATUS', status: 'online' });
      } catch {
        // サーバー検証失敗: 購入は成功しているので次回起動時に復元される
        dispatch({ type: 'SET_NOTICE', notice: 'プランの反映に失敗しました。次回起動時に自動で反映されます。' });
      }
    } catch (error) {
      dispatch({ type: 'SET_NOTICE', notice: `購入処理に失敗しました。${error instanceof Error ? error.message : ''}` });
    } finally {
      dispatch({ type: 'SET_IS_PLAN_UPDATING', value: false });
    }
  }

  function handleLogout() {
    dispatch({ type: 'SET_SESSION', session: null });
    dispatch({ type: 'SET_ISSUED_TRANSFER_CODE', code: null });
    dispatch({ type: 'SET_NOTICE', notice: '引き継ぎを解除しました。' });
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
    dispatch({ type: 'SET_NOTICE', notice: `${petName}とおわかれしました。` });
  }

  function applyItemUse(itemType: ItemType) {
    const state = getState();
    const { bonusDate, bonusMessages } = state;
    const today = getTodayString();
    dispatch({ type: 'USE_INVENTORY_ITEM', itemType });

    const newBonus = bonusDate !== today
      ? ITEM_BONUS[itemType]
      : bonusMessages + ITEM_BONUS[itemType];
    dispatch({ type: 'SET_BONUS', bonus: newBonus, date: today });

    const plan = state.session?.plan ?? 'free';
    const baseLimit = DAILY_BASE_LIMIT[plan];
    const newRemaining = Math.max(0, baseLimit + newBonus - state.dailySentCount);

    const labels: Record<ItemType, string> = { snack: 'おやつ', meal: 'ごはん', feast: 'ごちそう' };
    dispatch({ type: 'SET_NOTICE', notice: `${labels[itemType]}を使いました！あと${newRemaining}回おはなしできるよ` });
  }

  function handleUseItem(itemType: ItemType) {
    const { inventory } = getState();
    if (inventory[itemType] <= 0) return;

    if (itemType === 'snack') {
      applyItemUse(itemType);
    } else {
      dispatch({ type: 'SET_USE_ITEM_CONFIRM', itemType });
    }
  }

  function confirmUseItem() {
    const { useItemConfirm } = getState();
    if (!useItemConfirm) return;

    applyItemUse(useItemConfirm);
    dispatch({ type: 'SET_USE_ITEM_CONFIRM', itemType: null });
  }

  async function handleAdReward() {
    const state = getState();
    if (state.isAdLoading) return;

    const today = getTodayString();
    const current = state.adReward.date === today ? state.adReward : { date: today, viewCount: 0 };
    if (current.viewCount >= AD_VIEW_LIMIT) return;

    const isPlusUser = (state.session?.plan ?? 'free') === 'plus';

    if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('[Ad] start', { viewCount: current.viewCount, snack: state.inventory.snack, isPlusUser });

    dispatch({ type: 'SET_IS_AD_LOADING', value: true });

    try {
      if (isPlusUser) {
        // Plus: 広告スキップ — ワンタップでアイテム付与
        const item = rollAdRewardItem();
        dispatch({ type: 'SET_AD_REWARD', adReward: { date: today, viewCount: current.viewCount + 1 } });
        dispatch({ type: 'ADD_INVENTORY_ITEM', itemType: item, amount: 1 });
        dispatch({ type: 'SET_NOTICE', notice: `${ITEM_LABEL[item]}を1つもらったよ！使うとまたおはなしできます` });
      } else {
        // Free: 動画広告を視聴してアイテム付与
        const result = await showRewardedAd();

        if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('[Ad] result', result);

        if (result.success) {
          const item = rollAdRewardItem();
          dispatch({ type: 'SET_AD_REWARD', adReward: { date: today, viewCount: current.viewCount + 1 } });
          dispatch({ type: 'ADD_INVENTORY_ITEM', itemType: item, amount: 1 });
          dispatch({ type: 'SET_NOTICE', notice: `${ITEM_LABEL[item]}を1つもらったよ！使うとまたおはなしできます` });
        } else if (result.reason !== 'not_completed') {
          dispatch({ type: 'SET_NOTICE', notice: '動画を読み込めませんでした' });
        }
        // not_completed = ユーザーキャンセル。notice不要
      }
    } finally {
      dispatch({ type: 'SET_IS_AD_LOADING', value: false });
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        const after = getState();
        console.log('[Ad] done', { isAdLoading: false, viewCount: after.adReward.viewCount, snack: after.inventory.snack });
      }
    }
  }

  async function restoreSubscription() {
    const { checkSubscriptionStatus } = await import('../lib/iapService');
    const status = await checkSubscriptionStatus();
    const state = getState();
    const currentPlan = state.session?.plan ?? 'free';

    if (status.active && status.receipt && currentPlan !== 'plus') {
      // ストアでは有効だがサーバーに反映されていない → レシート検証で復元
      const { session } = state;
      if (session?.authToken) {
        try {
          const result = await verifyReceipt(
            'plus_monthly',
            status.receipt,
            getPlatformOS(),
            session.authToken,
          );
          dispatch({ type: 'SET_SESSION', session: result.session });
        } catch {
          // 復元失敗: 次回再試行
        }
      }
    } else if (!status.active && currentPlan === 'plus') {
      // ストアでは期限切れだがサーバーではPlusのまま → ダウングレード
      const { session } = state;
      if (session?.authToken) {
        try {
          const result = await subscribePlan('free', session.authToken);
          dispatch({ type: 'SET_SESSION', session: result.session });
          dispatch({ type: 'SET_NOTICE', notice: 'Plusプランの期限が切れました。Freeプランに戻りました。' });
        } catch {
          // ダウングレード失敗: 次回再試行
        }
      } else {
        // ログインなしでローカルplus → ダウングレード
        dispatch({ type: 'SET_SESSION', session: null });
        dispatch({ type: 'SET_NOTICE', notice: 'Plusプランの期限が切れました。Freeプランに戻りました。' });
      }
    }
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
    handleIssueTransferCode,
    handleRedeemTransferCode,
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
    restoreSubscription,
    retryConnection,
    retrySendMessage,
    triggerDebugReply,
  };
}
