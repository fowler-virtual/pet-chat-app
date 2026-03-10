import type {
  AdRewardState,
  ChatMessage,
  ItemInventory,
  ItemType,
  PetProfile,
  SubscriptionPlan,
  UserSession,
  UserStats,
} from '../types';

export type AppTab = 'Today' | 'Talk' | 'Settings';

export interface AppState {
  // Auth
  session: UserSession | null;
  emailInput: string;
  isAuthenticating: boolean;

  // Pets
  pets: PetProfile[];
  selectedPetId: string;
  isSavingPet: boolean;

  // Chat
  messagesByPetId: Record<string, ChatMessage[]>;
  input: string;
  isSending: boolean;
  unreadCounts: Record<string, number>;

  // UI
  isHydrating: boolean;
  apiStatus: 'checking' | 'online' | 'offline';
  notice: string | null;
  activeTab: AppTab;
  showLimitModal: boolean;
  showWelcome: boolean;

  // Plan
  isPlanUpdating: boolean;

  // Stats & economy
  userStats: UserStats;
  inventory: ItemInventory;
  adReward: AdRewardState;
  bonusMessages: number;
  bonusDate: string;
  dailySentCount: number;
  dailySentDate: string;

  // Error recovery
  failedMessage: { petId: string; text: string } | null;

  // Modals
  farewellTarget: PetProfile | null;
  farewellStep: 1 | 2;
  useItemConfirm: ItemType | null;
  messageActionState: { petId: string; message: ChatMessage } | null;
}

export type AppAction =
  // Auth
  | { type: 'SET_SESSION'; session: UserSession | null }
  | { type: 'SET_EMAIL_INPUT'; value: string }
  | { type: 'SET_IS_AUTHENTICATING'; value: boolean }

  // Pets
  | { type: 'SET_PETS'; pets: PetProfile[] }
  | { type: 'ADD_PET'; pet: PetProfile; messages?: ChatMessage[] }
  | { type: 'UPDATE_PET'; pet: PetProfile }
  | { type: 'REMOVE_PET'; petId: string }
  | { type: 'SET_SELECTED_PET_ID'; petId: string }
  | { type: 'SET_IS_SAVING_PET'; value: boolean }

  // Chat
  | { type: 'SET_MESSAGES_BY_PET_ID'; messagesByPetId: Record<string, ChatMessage[]> }
  | { type: 'APPEND_MESSAGE'; petId: string; message: ChatMessage }
  | { type: 'DELETE_MESSAGE'; petId: string; messageId: string }
  | { type: 'SET_INPUT'; value: string }
  | { type: 'SET_IS_SENDING'; value: boolean }
  | { type: 'SET_UNREAD_COUNTS'; counts: Record<string, number> }
  | { type: 'CLEAR_UNREAD'; petId: string }

  // UI
  | { type: 'SET_IS_HYDRATING'; value: boolean }
  | { type: 'SET_API_STATUS'; status: 'checking' | 'online' | 'offline' }
  | { type: 'SET_NOTICE'; notice: string | null }
  | { type: 'SET_ACTIVE_TAB'; tab: AppTab }
  | { type: 'SET_SHOW_LIMIT_MODAL'; value: boolean }
  | { type: 'SET_SHOW_WELCOME'; value: boolean }

  // Plan
  | { type: 'SET_IS_PLAN_UPDATING'; value: boolean }

  // Stats & economy
  | { type: 'SET_USER_STATS'; stats: UserStats }
  | { type: 'SET_INVENTORY'; inventory: ItemInventory }
  | { type: 'USE_INVENTORY_ITEM'; itemType: ItemType }
  | { type: 'ADD_INVENTORY_ITEM'; itemType: ItemType; amount: number }
  | { type: 'SET_AD_REWARD'; adReward: AdRewardState }
  | { type: 'SET_BONUS'; bonus: number; date: string }
  | { type: 'INCREMENT_DAILY_SENT' }
  | { type: 'RESET_DAILY_SENT'; date: string }

  // Error recovery
  | { type: 'SET_FAILED_MESSAGE'; failedMessage: { petId: string; text: string } | null }

  // Modals
  | { type: 'SET_FAREWELL_TARGET'; pet: PetProfile | null }
  | { type: 'SET_FAREWELL_STEP'; step: 1 | 2 }
  | { type: 'SET_USE_ITEM_CONFIRM'; itemType: ItemType | null }
  | { type: 'SET_MESSAGE_ACTION_STATE'; state: { petId: string; message: ChatMessage } | null }

  // Bulk
  | { type: 'HYDRATE'; payload: Partial<AppState> }
  | { type: 'SIGN_IN_COMPLETE'; session: UserSession; pets: PetProfile[]; selectedPetId: string; messagesByPetId: Record<string, ChatMessage[]> };
