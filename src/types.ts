export type PetSpecies = string;
export type PetGender = '男の子' | '女の子' | 'その他';
export type AiProvider = 'openai' | 'mock';
export type SubscriptionPlan = 'free' | 'plus';
export type PetTone = string;

export type ItemType = 'snack' | 'meal' | 'feast';

export interface ItemInventory {
  snack: number;  // おやつ +3回
  meal: number;   // ごはん +5回
  feast: number;  // ごちそう +10回
}

export interface AdRewardState {
  date: string;       // 'YYYY-MM-DD'
  viewCount: number;  // 今日の視聴回数
}

export const ITEM_BONUS: Record<ItemType, number> = {
  snack: 3,
  meal: 5,
  feast: 10,
};

export const AD_VIEW_LIMIT = 3;
export const DAILY_BASE_LIMIT: Record<SubscriptionPlan, number> = {
  free: 5,
  plus: 50,
};

export interface PetProfile {
  id: string;
  name: string;
  nickname: string;
  species: PetSpecies;
  gender: PetGender;
  personality: string;
  firstPerson: string;
  ownerCall: string;
  tone: PetTone;
  avatarUri: string;
  sessionKey: string;
}

export interface PetDraft {
  name: string;
  nickname: string;
  species: PetSpecies;
  gender: PetGender;
  personality: string;
  firstPerson: string;
  ownerCall: string;
  tone: PetTone;
  avatarUri: string;
}

export interface ChatMessage {
  id: string;
  sender: 'pet' | 'owner';
  text: string;
  time: string;
}

export interface UserStats {
  lastOpenDate: string;      // 'YYYY-MM-DD'
  loginStreak: number;
  totalMessagesSent: number;
  firstOpenDate: string;     // 'YYYY-MM-DD'
}

export interface PersistedAppState {
  session: UserSession | null;
  pets: PetProfile[];
  selectedPetId: string;
  messagesByPetId: Record<string, ChatMessage[]>;
  unreadCounts: Record<string, number>;
  userStats?: UserStats;
  inventory?: ItemInventory;
  adReward?: AdRewardState;
  bonusMessages?: number;  // 今日のアイテム追加回数
  bonusDate?: string;      // bonusMessages の対象日
  themeKey?: string;
}

export interface ChatRequest {
  pet: PetProfile;
  message: string;
  plan: SubscriptionPlan;
  bonusMessages?: number;
}

export interface ChatResponse {
  provider: AiProvider;
  text: string;
  sessionKey?: string;
}

export interface PersonaPreview {
  summary: string;
  speakingStyle: string;
  ownerAlias: string;
}

export interface UserSession {
  id: string;
  authToken: string;
  plan: SubscriptionPlan;
}

export interface BootstrapResponse {
  session: UserSession;
  pets: PetProfile[];
  selectedPetId: string;
  messagesByPetId: Record<string, ChatMessage[]>;
}
