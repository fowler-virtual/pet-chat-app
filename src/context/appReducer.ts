import { getTodayString } from '../lib/dateUtils';
import { updateLoginStreak } from '../lib/dateUtils';
import type { AppState, AppAction } from './types';

export function createInitialState(): AppState {
  const today = getTodayString();
  return {
    session: null,
    transferCodeInput: '',
    issuedTransferCode: null,
    isAuthenticating: false,
    pets: [],
    selectedPetId: '',
    isSavingPet: false,
    messagesByPetId: {},
    input: '',
    isSending: false,
    unreadCounts: {},
    isHydrating: true,
    apiStatus: 'checking',
    notice: null,
    activeTab: 'Today',
    showLimitModal: false,
    showWelcome: true,
    themeKey: 'beige',
    isPlanUpdating: false,
    isAdLoading: false,
    userStats: updateLoginStreak(undefined),
    inventory: { snack: 0, meal: 0, feast: 0 },
    adReward: { date: today, viewCount: 0 },
    bonusMessages: 0,
    bonusDate: today,
    dailySentCount: 0,
    dailySentDate: today,
    failedMessage: null,
    farewellTarget: null,
    farewellStep: 1,
    useItemConfirm: null,
    messageActionState: null,
  };
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    // Auth
    case 'SET_SESSION':
      return { ...state, session: action.session };
    case 'SET_TRANSFER_CODE_INPUT':
      return { ...state, transferCodeInput: action.value };
    case 'SET_ISSUED_TRANSFER_CODE':
      return { ...state, issuedTransferCode: action.code };
    case 'SET_IS_AUTHENTICATING':
      return { ...state, isAuthenticating: action.value };

    // Pets
    case 'SET_PETS':
      return { ...state, pets: action.pets };
    case 'ADD_PET': {
      const msgs = action.messages
        ? { ...state.messagesByPetId, [action.pet.id]: action.messages }
        : state.messagesByPetId;
      return { ...state, pets: [...state.pets, action.pet], messagesByPetId: msgs, selectedPetId: action.pet.id };
    }
    case 'UPDATE_PET':
      return { ...state, pets: state.pets.map((p) => (p.id === action.pet.id ? action.pet : p)) };
    case 'REMOVE_PET': {
      const newPets = state.pets.filter((p) => p.id !== action.petId);
      const { [action.petId]: _msgs, ...restMessages } = state.messagesByPetId;
      const { [action.petId]: _unread, ...restUnread } = state.unreadCounts;
      const newSelectedId = state.selectedPetId === action.petId
        ? (newPets[0]?.id ?? '')
        : state.selectedPetId;
      return {
        ...state,
        pets: newPets,
        messagesByPetId: restMessages,
        unreadCounts: restUnread,
        selectedPetId: newSelectedId,
        farewellTarget: null,
        showWelcome: newPets.length === 0 ? true : state.showWelcome,
      };
    }
    case 'SET_SELECTED_PET_ID':
      return { ...state, selectedPetId: action.petId };
    case 'SET_IS_SAVING_PET':
      return { ...state, isSavingPet: action.value };

    // Chat
    case 'SET_MESSAGES_BY_PET_ID':
      return { ...state, messagesByPetId: action.messagesByPetId };
    case 'APPEND_MESSAGE': {
      const existing = state.messagesByPetId[action.petId] ?? [];
      return {
        ...state,
        messagesByPetId: { ...state.messagesByPetId, [action.petId]: [...existing, action.message] },
      };
    }
    case 'DELETE_MESSAGE': {
      const msgs = (state.messagesByPetId[action.petId] ?? []).filter((m) => m.id !== action.messageId);
      return { ...state, messagesByPetId: { ...state.messagesByPetId, [action.petId]: msgs } };
    }
    case 'SET_INPUT':
      return { ...state, input: action.value };
    case 'SET_IS_SENDING':
      return { ...state, isSending: action.value };
    case 'SET_UNREAD_COUNTS':
      return { ...state, unreadCounts: action.counts };
    case 'CLEAR_UNREAD': {
      if (!state.unreadCounts[action.petId]) return state;
      return { ...state, unreadCounts: { ...state.unreadCounts, [action.petId]: 0 } };
    }

    // UI
    case 'SET_IS_HYDRATING':
      return { ...state, isHydrating: action.value };
    case 'SET_API_STATUS':
      return { ...state, apiStatus: action.status };
    case 'SET_NOTICE':
      return { ...state, notice: action.notice };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.tab };
    case 'SET_SHOW_LIMIT_MODAL':
      return { ...state, showLimitModal: action.value };
    case 'SET_SHOW_WELCOME':
      return { ...state, showWelcome: action.value };
    case 'SET_THEME':
      return { ...state, themeKey: action.key };

    // Plan
    case 'SET_IS_PLAN_UPDATING':
      return { ...state, isPlanUpdating: action.value };
    case 'SET_IS_AD_LOADING':
      return { ...state, isAdLoading: action.value };

    // Stats & economy
    case 'SET_USER_STATS':
      return { ...state, userStats: action.stats };
    case 'SET_INVENTORY':
      return { ...state, inventory: action.inventory };
    case 'USE_INVENTORY_ITEM':
      return {
        ...state,
        inventory: { ...state.inventory, [action.itemType]: Math.max(0, state.inventory[action.itemType] - 1) },
      };
    case 'ADD_INVENTORY_ITEM':
      return {
        ...state,
        inventory: { ...state.inventory, [action.itemType]: state.inventory[action.itemType] + action.amount },
      };
    case 'SET_AD_REWARD':
      return { ...state, adReward: action.adReward };
    case 'SET_BONUS':
      return { ...state, bonusMessages: action.bonus, bonusDate: action.date };
    case 'INCREMENT_DAILY_SENT':
      return { ...state, dailySentCount: state.dailySentCount + 1 };
    case 'RESET_DAILY_SENT':
      return { ...state, dailySentCount: 0, dailySentDate: action.date };

    // Error recovery
    case 'SET_FAILED_MESSAGE':
      return { ...state, failedMessage: action.failedMessage };

    // Modals
    case 'SET_FAREWELL_TARGET':
      return { ...state, farewellTarget: action.pet, farewellStep: 1 };
    case 'SET_FAREWELL_STEP':
      return { ...state, farewellStep: action.step };
    case 'SET_USE_ITEM_CONFIRM':
      return { ...state, useItemConfirm: action.itemType };
    case 'SET_MESSAGE_ACTION_STATE':
      return { ...state, messageActionState: action.state };

    // Bulk
    case 'HYDRATE': {
      const hydrated = { ...state, ...action.payload };
      if (hydrated.pets.length === 0) {
        hydrated.showWelcome = true;
      }
      return hydrated;
    }
    case 'SIGN_IN_COMPLETE':
      return {
        ...state,
        session: action.session,
        pets: action.pets,
        selectedPetId: action.selectedPetId,
        messagesByPetId: action.messagesByPetId,
        transferCodeInput: '',
        issuedTransferCode: null,
        apiStatus: 'online',
        isAuthenticating: false,
      };

    default:
      return state;
  }
}
