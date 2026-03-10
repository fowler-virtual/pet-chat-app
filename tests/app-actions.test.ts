import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAppActions } from '../src/context/appActions';
import { createInitialState } from '../src/context/appReducer';
import type { AppState, AppAction } from '../src/context/types';
import type { PetProfile } from '../src/types';

// Mock external modules
vi.mock('../src/lib/api', () => ({
  ApiError: class ApiError extends Error {
    errorCode: string;
    detail: any;
    constructor(msg: string, code: string, detail: any = {}) {
      super(msg);
      this.errorCode = code;
      this.detail = detail;
    }
  },
  createPet: vi.fn(),
  deletePet: vi.fn(),
  fetchAuthMe: vi.fn(),
  fetchBootstrap: vi.fn(),
  fetchHealth: vi.fn(),
  signInDemo: vi.fn(),
  subscribePlan: vi.fn(),
  syncUpload: vi.fn(),
  updatePet: vi.fn(),
}));

vi.mock('../src/lib/chatService', () => ({
  sendPetChatMessage: vi.fn(),
}));

vi.mock('../src/lib/adService', () => ({
  showRewardedAd: vi.fn(),
}));

const mockPet: PetProfile = {
  id: 'pet-1',
  name: 'むぎ',
  nickname: 'むーちゃん',
  species: '猫',
  gender: '女の子',
  personality: '甘えん坊',
  firstPerson: 'わたし',
  ownerCall: 'ママ',
  tone: 'タメ口',
  avatarUri: '',
  sessionKey: 'pet:pet-1:main',
};

function createTestActions(stateOverrides: Partial<AppState> = {}) {
  const state: AppState = { ...createInitialState(), ...stateOverrides };
  const stateRef = { current: state };
  const dispatched: AppAction[] = [];
  const dispatch = (action: AppAction) => {
    dispatched.push(action);
  };
  const actions = createAppActions(stateRef, dispatch);
  return { actions, dispatched, stateRef };
}

describe('handleLogout', () => {
  it('dispatches SET_SESSION null and notice', () => {
    const { actions, dispatched } = createTestActions();
    actions.handleLogout();
    expect(dispatched).toHaveLength(2);
    expect(dispatched[0]).toEqual({ type: 'SET_SESSION', session: null });
    expect(dispatched[1]).toEqual({ type: 'SET_NOTICE', notice: 'ログアウトしました。' });
  });
});

describe('handleDeletePet', () => {
  it('sets farewell target when pet exists', () => {
    const { actions, dispatched } = createTestActions({ pets: [mockPet] });
    actions.handleDeletePet('pet-1');
    expect(dispatched).toHaveLength(1);
    expect(dispatched[0]).toEqual({ type: 'SET_FAREWELL_TARGET', pet: mockPet });
  });

  it('does nothing when pet not found', () => {
    const { actions, dispatched } = createTestActions({ pets: [] });
    actions.handleDeletePet('nonexistent');
    expect(dispatched).toHaveLength(0);
  });
});

describe('handleUseItem', () => {
  it('dispatches SET_USE_ITEM_CONFIRM when inventory > 0', () => {
    const { actions, dispatched } = createTestActions({
      inventory: { snack: 2, meal: 0, feast: 0 },
    });
    actions.handleUseItem('snack');
    expect(dispatched).toHaveLength(1);
    expect(dispatched[0]).toEqual({ type: 'SET_USE_ITEM_CONFIRM', itemType: 'snack' });
  });

  it('does nothing when inventory is 0', () => {
    const { actions, dispatched } = createTestActions({
      inventory: { snack: 0, meal: 0, feast: 0 },
    });
    actions.handleUseItem('snack');
    expect(dispatched).toHaveLength(0);
  });
});

describe('confirmUseItem', () => {
  it('dispatches USE_INVENTORY_ITEM, SET_BONUS, clear confirm, and notice', () => {
    const today = new Date().toISOString().slice(0, 10);
    const { actions, dispatched } = createTestActions({
      useItemConfirm: 'snack',
      bonusDate: today,
      bonusMessages: 0,
    });
    actions.confirmUseItem();
    expect(dispatched.some((a) => a.type === 'USE_INVENTORY_ITEM')).toBe(true);
    expect(dispatched.some((a) => a.type === 'SET_BONUS')).toBe(true);
    expect(dispatched.some((a) => a.type === 'SET_USE_ITEM_CONFIRM')).toBe(true);
    expect(dispatched.some((a) => a.type === 'SET_NOTICE')).toBe(true);
  });

  it('does nothing when no useItemConfirm', () => {
    const { actions, dispatched } = createTestActions({ useItemConfirm: null });
    actions.confirmUseItem();
    expect(dispatched).toHaveLength(0);
  });

  it('adds correct bonus for meal (+5)', () => {
    const today = new Date().toISOString().slice(0, 10);
    const { actions, dispatched } = createTestActions({
      useItemConfirm: 'meal',
      bonusDate: today,
      bonusMessages: 3,
    });
    actions.confirmUseItem();
    const bonusAction = dispatched.find((a) => a.type === 'SET_BONUS') as any;
    expect(bonusAction.bonus).toBe(8); // 3 + 5
  });

  it('resets bonus when date changes', () => {
    const { actions, dispatched } = createTestActions({
      useItemConfirm: 'feast',
      bonusDate: '2020-01-01',
      bonusMessages: 99,
    });
    actions.confirmUseItem();
    const bonusAction = dispatched.find((a) => a.type === 'SET_BONUS') as any;
    expect(bonusAction.bonus).toBe(10); // reset to feast bonus only
  });
});

describe('triggerDebugReply', () => {
  it('appends debug message for selected pet', () => {
    const { actions, dispatched } = createTestActions({
      pets: [mockPet],
      selectedPetId: 'pet-1',
      activeTab: 'Settings',
    });
    actions.triggerDebugReply();
    const appendAction = dispatched.find((a) => a.type === 'APPEND_MESSAGE') as any;
    expect(appendAction).toBeDefined();
    expect(appendAction.petId).toBe('pet-1');
    expect(appendAction.message.sender).toBe('pet');
  });

  it('increments unread when not on Talk tab for that pet', () => {
    const { actions, dispatched } = createTestActions({
      pets: [mockPet],
      selectedPetId: 'pet-1',
      activeTab: 'Settings',
      unreadCounts: {},
    });
    actions.triggerDebugReply();
    const unreadAction = dispatched.find((a) => a.type === 'SET_UNREAD_COUNTS') as any;
    expect(unreadAction).toBeDefined();
    expect(unreadAction.counts['pet-1']).toBe(1);
  });

  it('does not increment unread when on Talk tab for that pet', () => {
    const { actions, dispatched } = createTestActions({
      pets: [mockPet],
      selectedPetId: 'pet-1',
      activeTab: 'Talk',
      unreadCounts: {},
    });
    actions.triggerDebugReply();
    const unreadAction = dispatched.find((a) => a.type === 'SET_UNREAD_COUNTS');
    expect(unreadAction).toBeUndefined();
  });

  it('does nothing when pet not found', () => {
    const { actions, dispatched } = createTestActions({ pets: [], selectedPetId: '' });
    actions.triggerDebugReply();
    expect(dispatched).toHaveLength(0);
  });

  it('can target a specific pet by id', () => {
    const pet2 = { ...mockPet, id: 'pet-2', name: 'コタ' };
    const { actions, dispatched } = createTestActions({
      pets: [mockPet, pet2],
      selectedPetId: 'pet-1',
      activeTab: 'Talk',
    });
    actions.triggerDebugReply('pet-2');
    const appendAction = dispatched.find((a) => a.type === 'APPEND_MESSAGE') as any;
    expect(appendAction.petId).toBe('pet-2');
  });
});

describe('handleSendMessage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('does nothing when no pet selected', async () => {
    const { actions, dispatched } = createTestActions({ pets: [], selectedPetId: '' });
    await actions.handleSendMessage();
    expect(dispatched).toHaveLength(0);
  });

  it('does nothing when input is empty', async () => {
    const { actions, dispatched } = createTestActions({
      pets: [mockPet],
      selectedPetId: 'pet-1',
      input: '   ',
    });
    await actions.handleSendMessage();
    expect(dispatched).toHaveLength(0);
  });

  it('dispatches owner message and calls chatService', async () => {
    const { sendPetChatMessage } = await import('../src/lib/chatService');
    (sendPetChatMessage as any).mockResolvedValue({ text: 'にゃー', provider: 'mock' });

    const { actions, dispatched } = createTestActions({
      pets: [mockPet],
      selectedPetId: 'pet-1',
      input: 'おはよう',
      userStats: { lastOpenDate: '2026-01-01', loginStreak: 1, totalMessagesSent: 5, firstOpenDate: '2026-01-01' },
    });
    await actions.handleSendMessage();

    // Should dispatch: APPEND_MESSAGE (owner), SET_USER_STATS, RESET_DAILY_SENT or not, INCREMENT_DAILY_SENT, SET_INPUT, SET_IS_SENDING(true), SET_NOTICE(null), APPEND_MESSAGE (pet), SET_IS_SENDING(false)
    const appendActions = dispatched.filter((a) => a.type === 'APPEND_MESSAGE');
    expect(appendActions).toHaveLength(2); // owner + pet
    expect((appendActions[0] as any).message.sender).toBe('owner');
    expect((appendActions[1] as any).message.sender).toBe('pet');
    expect((appendActions[1] as any).message.text).toBe('にゃー');

    const sendingActions = dispatched.filter((a) => a.type === 'SET_IS_SENDING');
    expect(sendingActions).toHaveLength(2); // true then false

    expect(dispatched.some((a) => a.type === 'SET_INPUT')).toBe(true);
  });

  it('uses overrideText when provided', async () => {
    const { sendPetChatMessage } = await import('../src/lib/chatService');
    (sendPetChatMessage as any).mockResolvedValue({ text: 'おかえりー', provider: 'mock' });

    const { actions, dispatched } = createTestActions({
      pets: [mockPet],
      selectedPetId: 'pet-1',
      input: '',
      userStats: { lastOpenDate: '2026-01-01', loginStreak: 1, totalMessagesSent: 0, firstOpenDate: '2026-01-01' },
    });
    await actions.handleSendMessage('ただいま');

    const appendAction = dispatched.find((a) => a.type === 'APPEND_MESSAGE') as any;
    expect(appendAction.message.text).toBe('ただいま');
  });
});

describe('handleSignIn', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('does nothing when email is empty', async () => {
    const { actions, dispatched } = createTestActions({ emailInput: '   ' });
    await actions.handleSignIn();
    expect(dispatched).toHaveLength(0);
  });

  it('dispatches SIGN_IN_COMPLETE on success', async () => {
    const { signInDemo, fetchBootstrap } = await import('../src/lib/api');
    (signInDemo as any).mockResolvedValue({
      session: { authToken: 'tok', email: 'a@b.com', plan: 'free' },
    });
    (fetchBootstrap as any).mockResolvedValue({
      pets: [mockPet],
      selectedPetId: 'pet-1',
      messagesByPetId: {},
    });

    const { actions, dispatched } = createTestActions({ emailInput: 'a@b.com' });
    await actions.handleSignIn();

    expect(dispatched.some((a) => a.type === 'SET_IS_AUTHENTICATING')).toBe(true);
    expect(dispatched.some((a) => a.type === 'SIGN_IN_COMPLETE')).toBe(true);
    expect(dispatched.some((a) => a.type === 'SET_NOTICE')).toBe(true);
  });

  it('handles sign-in failure', async () => {
    const { signInDemo } = await import('../src/lib/api');
    (signInDemo as any).mockRejectedValue(new Error('network error'));

    const { actions, dispatched } = createTestActions({ emailInput: 'a@b.com' });
    await actions.handleSignIn();

    const noticeAction = dispatched.find(
      (a) => a.type === 'SET_NOTICE' && (a as any).notice?.includes('ログインに失敗'),
    );
    expect(noticeAction).toBeDefined();
    expect(dispatched.some((a) => a.type === 'SET_API_STATUS')).toBe(true);
  });
});

describe('handleAdReward', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('does nothing when ad view limit reached', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const { actions, dispatched } = createTestActions({
      adReward: { date: today, viewCount: 3 },
    });
    await actions.handleAdReward();
    expect(dispatched).toHaveLength(0);
  });

  it('adds snack on successful ad view', async () => {
    const { showRewardedAd } = await import('../src/lib/adService');
    (showRewardedAd as any).mockResolvedValue({ success: true });

    const today = new Date().toISOString().slice(0, 10);
    const { actions, dispatched } = createTestActions({
      adReward: { date: today, viewCount: 0 },
    });
    await actions.handleAdReward();

    expect(dispatched.some((a) => a.type === 'SET_AD_REWARD')).toBe(true);
    expect(dispatched.some((a) => a.type === 'ADD_INVENTORY_ITEM')).toBe(true);
    const itemAction = dispatched.find((a) => a.type === 'ADD_INVENTORY_ITEM') as any;
    expect(itemAction.itemType).toBe('snack');
    expect(itemAction.amount).toBe(1);
  });

  it('does nothing when ad is not watched', async () => {
    const { showRewardedAd } = await import('../src/lib/adService');
    (showRewardedAd as any).mockResolvedValue({ success: false });

    const today = new Date().toISOString().slice(0, 10);
    const { actions, dispatched } = createTestActions({
      adReward: { date: today, viewCount: 0 },
    });
    await actions.handleAdReward();
    expect(dispatched).toHaveLength(0);
  });
});

describe('confirmFarewell', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('does nothing when no farewellTarget', async () => {
    const { actions, dispatched } = createTestActions({ farewellTarget: null });
    await actions.confirmFarewell();
    expect(dispatched).toHaveLength(0);
  });

  it('removes pet and shows notice (offline)', async () => {
    const { actions, dispatched } = createTestActions({
      farewellTarget: mockPet,
      session: null,
    });
    await actions.confirmFarewell();
    expect(dispatched.some((a) => a.type === 'REMOVE_PET')).toBe(true);
    const noticeAction = dispatched.find((a) => a.type === 'SET_NOTICE') as any;
    expect(noticeAction.notice).toContain('むぎ');
  });

  it('calls server deletePet when authenticated', async () => {
    const { deletePet } = await import('../src/lib/api');
    (deletePet as any).mockResolvedValue({ ok: true });

    const { actions, dispatched } = createTestActions({
      farewellTarget: mockPet,
      session: { authToken: 'tok', email: 'a@b.com', plan: 'free' },
    });
    await actions.confirmFarewell();
    expect(deletePet).toHaveBeenCalledWith('pet-1', 'tok');
    expect(dispatched.some((a) => a.type === 'REMOVE_PET')).toBe(true);
  });
});

// ── handleAddPet ──

describe('handleAddPet', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns false when name is empty', async () => {
    const emptyNamePet = { ...mockPet, name: '  ' };
    const { actions, dispatched } = createTestActions();
    const result = await actions.handleAddPet(emptyNamePet);
    expect(result).toBe(false);
    expect(dispatched).toHaveLength(0);
  });

  it('returns false when personality is empty', async () => {
    const emptyPersonalityPet = { ...mockPet, personality: '' };
    const { actions, dispatched } = createTestActions();
    const result = await actions.handleAddPet(emptyPersonalityPet);
    expect(result).toBe(false);
    expect(dispatched).toHaveLength(0);
  });

  it('adds pet locally when not authenticated', async () => {
    const { actions, dispatched } = createTestActions({ session: null });
    const result = await actions.handleAddPet(mockPet);
    expect(result).toBe(true);

    const addAction = dispatched.find((a) => a.type === 'ADD_PET') as any;
    expect(addAction).toBeDefined();
    expect(addAction.pet.name).toBe('むぎ');
    expect(addAction.messages).toHaveLength(1);
    expect(addAction.messages[0].sender).toBe('pet');

    const noticeAction = dispatched.find((a) => a.type === 'SET_NOTICE' && (a as any).notice?.includes('登録しました')) as any;
    expect(noticeAction).toBeDefined();
  });

  it('calls createPet API when authenticated', async () => {
    const { createPet } = await import('../src/lib/api');
    (createPet as any).mockResolvedValue({ pet: mockPet });

    const { actions, dispatched } = createTestActions({
      session: { authToken: 'tok', email: 'a@b.com', plan: 'free' },
    });
    const result = await actions.handleAddPet(mockPet);
    expect(result).toBe(true);
    expect(createPet).toHaveBeenCalledWith({ pet: mockPet }, 'tok');
    expect(dispatched.some((a) => a.type === 'ADD_PET')).toBe(true);
    expect(dispatched.some((a) => a.type === 'SET_API_STATUS')).toBe(true);
  });

  it('shows pet limit notice on pet_limit_reached error', async () => {
    const { createPet, ApiError } = await import('../src/lib/api');
    const err = new (ApiError as any)('limit', 'pet_limit_reached', { limit: 1 });
    (createPet as any).mockRejectedValue(err);

    const { actions, dispatched } = createTestActions({
      session: { authToken: 'tok', email: 'a@b.com', plan: 'free' },
    });
    const result = await actions.handleAddPet(mockPet);
    expect(result).toBe(false);

    const noticeAction = dispatched.find(
      (a) => a.type === 'SET_NOTICE' && (a as any).notice?.includes('1匹まで'),
    ) as any;
    expect(noticeAction).toBeDefined();
  });

  it('shows generic error notice on API failure', async () => {
    const { createPet } = await import('../src/lib/api');
    (createPet as any).mockRejectedValue(new Error('server down'));

    const { actions, dispatched } = createTestActions({
      session: { authToken: 'tok', email: 'a@b.com', plan: 'free' },
    });
    const result = await actions.handleAddPet(mockPet);
    expect(result).toBe(false);

    const noticeAction = dispatched.find(
      (a) => a.type === 'SET_NOTICE' && (a as any).notice?.includes('ペット登録に失敗'),
    ) as any;
    expect(noticeAction).toBeDefined();
  });
});

// ── handleSavePet ──

describe('handleSavePet', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('updates pet locally when not authenticated', async () => {
    const updatedPet = { ...mockPet, name: 'むぎ改' };
    const { actions, dispatched } = createTestActions({ session: null });
    const result = await actions.handleSavePet(updatedPet);
    expect(result).toBe(true);

    const updateAction = dispatched.find((a) => a.type === 'UPDATE_PET') as any;
    expect(updateAction).toBeDefined();
    expect(updateAction.pet.name).toBe('むぎ改');

    expect(dispatched.some((a) => a.type === 'SET_SELECTED_PET_ID')).toBe(true);
    expect(dispatched.some((a) => a.type === 'SET_IS_SAVING_PET')).toBe(true);

    const noticeAction = dispatched.find(
      (a) => a.type === 'SET_NOTICE' && (a as any).notice?.includes('更新しました'),
    ) as any;
    expect(noticeAction).toBeDefined();
  });

  it('sets isSavingPet true then false', async () => {
    const { actions, dispatched } = createTestActions({ session: null });
    await actions.handleSavePet(mockPet);

    const savingActions = dispatched.filter((a) => a.type === 'SET_IS_SAVING_PET') as any[];
    expect(savingActions).toHaveLength(2);
    expect(savingActions[0].value).toBe(true);
    expect(savingActions[1].value).toBe(false);
  });

  it('calls updatePet API when authenticated', async () => {
    const { updatePet } = await import('../src/lib/api');
    (updatePet as any).mockResolvedValue({ pet: { ...mockPet, name: 'むぎ改' } });

    const { actions, dispatched } = createTestActions({
      session: { authToken: 'tok', email: 'a@b.com', plan: 'free' },
    });
    const result = await actions.handleSavePet(mockPet);
    expect(result).toBe(true);
    expect(updatePet).toHaveBeenCalledWith({ petId: 'pet-1', pet: mockPet }, 'tok');

    const updateAction = dispatched.find((a) => a.type === 'UPDATE_PET') as any;
    expect(updateAction).toBeDefined();
  });

  it('shows error notice on API failure', async () => {
    const { updatePet } = await import('../src/lib/api');
    (updatePet as any).mockRejectedValue(new Error('network error'));

    const { actions, dispatched } = createTestActions({
      session: { authToken: 'tok', email: 'a@b.com', plan: 'free' },
    });
    const result = await actions.handleSavePet(mockPet);
    expect(result).toBe(false);

    const noticeAction = dispatched.find(
      (a) => a.type === 'SET_NOTICE' && (a as any).notice?.includes('ペット更新に失敗'),
    ) as any;
    expect(noticeAction).toBeDefined();
  });

  it('always resets isSavingPet on API failure', async () => {
    const { updatePet } = await import('../src/lib/api');
    (updatePet as any).mockRejectedValue(new Error('fail'));

    const { actions, dispatched } = createTestActions({
      session: { authToken: 'tok', email: 'a@b.com', plan: 'free' },
    });
    await actions.handleSavePet(mockPet);

    const lastSaving = [...dispatched].reverse().find((a) => a.type === 'SET_IS_SAVING_PET') as any;
    expect(lastSaving.value).toBe(false);
  });
});

// ── handlePlanUpgrade ──

describe('handlePlanUpgrade', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('does nothing when not authenticated', async () => {
    const { actions, dispatched } = createTestActions({ session: null });
    await actions.handlePlanUpgrade('plus');
    expect(dispatched).toHaveLength(0);
  });

  it('upgrades plan successfully', async () => {
    const { subscribePlan } = await import('../src/lib/api');
    const newSession = { authToken: 'tok', email: 'a@b.com', plan: 'plus' as const };
    (subscribePlan as any).mockResolvedValue({ session: newSession });

    const { actions, dispatched } = createTestActions({
      session: { authToken: 'tok', email: 'a@b.com', plan: 'free' },
    });
    await actions.handlePlanUpgrade('plus');

    expect(subscribePlan).toHaveBeenCalledWith('plus', 'tok');

    const sessionAction = dispatched.find((a) => a.type === 'SET_SESSION') as any;
    expect(sessionAction.session.plan).toBe('plus');

    const noticeAction = dispatched.find(
      (a) => a.type === 'SET_NOTICE' && (a as any).notice?.includes('PLUS'),
    ) as any;
    expect(noticeAction).toBeDefined();

    expect(dispatched.some((a) => a.type === 'SET_API_STATUS')).toBe(true);
  });

  it('sets isPlanUpdating true then false on success', async () => {
    const { subscribePlan } = await import('../src/lib/api');
    (subscribePlan as any).mockResolvedValue({
      session: { authToken: 'tok', email: 'a@b.com', plan: 'plus' },
    });

    const { actions, dispatched } = createTestActions({
      session: { authToken: 'tok', email: 'a@b.com', plan: 'free' },
    });
    await actions.handlePlanUpgrade('plus');

    const updatingActions = dispatched.filter((a) => a.type === 'SET_IS_PLAN_UPDATING') as any[];
    expect(updatingActions).toHaveLength(2);
    expect(updatingActions[0].value).toBe(true);
    expect(updatingActions[1].value).toBe(false);
  });

  it('shows error notice on failure', async () => {
    const { subscribePlan } = await import('../src/lib/api');
    (subscribePlan as any).mockRejectedValue(new Error('payment failed'));

    const { actions, dispatched } = createTestActions({
      session: { authToken: 'tok', email: 'a@b.com', plan: 'free' },
    });
    await actions.handlePlanUpgrade('plus');

    const noticeAction = dispatched.find(
      (a) => a.type === 'SET_NOTICE' && (a as any).notice?.includes('プラン更新に失敗'),
    ) as any;
    expect(noticeAction).toBeDefined();
  });

  it('resets isPlanUpdating on failure', async () => {
    const { subscribePlan } = await import('../src/lib/api');
    (subscribePlan as any).mockRejectedValue(new Error('fail'));

    const { actions, dispatched } = createTestActions({
      session: { authToken: 'tok', email: 'a@b.com', plan: 'free' },
    });
    await actions.handlePlanUpgrade('plus');

    const lastUpdating = [...dispatched].reverse().find((a) => a.type === 'SET_IS_PLAN_UPDATING') as any;
    expect(lastUpdating.value).toBe(false);
  });
});

// ── handleSendMessage (additional edge cases) ──

describe('handleSendMessage (edge cases)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows limit modal on daily_limit_reached error', async () => {
    const { sendPetChatMessage } = await import('../src/lib/chatService');
    const { ApiError } = await import('../src/lib/api');
    const err = new (ApiError as any)('limit', 'daily_limit_reached');
    (sendPetChatMessage as any).mockRejectedValue(err);

    const { actions, dispatched } = createTestActions({
      pets: [mockPet],
      selectedPetId: 'pet-1',
      input: 'テスト',
      userStats: { lastOpenDate: '2026-01-01', loginStreak: 1, totalMessagesSent: 0, firstOpenDate: '2026-01-01' },
    });
    await actions.handleSendMessage();

    expect(dispatched.some((a) => a.type === 'SET_SHOW_LIMIT_MODAL' && (a as any).value === true)).toBe(true);
  });

  it('shows error notice on generic send failure', async () => {
    const { sendPetChatMessage } = await import('../src/lib/chatService');
    (sendPetChatMessage as any).mockRejectedValue(new Error('timeout'));

    const { actions, dispatched } = createTestActions({
      pets: [mockPet],
      selectedPetId: 'pet-1',
      input: 'テスト',
      userStats: { lastOpenDate: '2026-01-01', loginStreak: 1, totalMessagesSent: 0, firstOpenDate: '2026-01-01' },
    });
    await actions.handleSendMessage();

    const noticeAction = dispatched.find(
      (a) => a.type === 'SET_NOTICE' && (a as any).notice?.includes('メッセージを送れませんでした'),
    ) as any;
    expect(noticeAction).toBeDefined();
  });

  it('increments unread when pet reply arrives on different tab', async () => {
    const { sendPetChatMessage } = await import('../src/lib/chatService');
    (sendPetChatMessage as any).mockResolvedValue({ text: 'にゃー', provider: 'mock' });

    const { actions, dispatched, stateRef } = createTestActions({
      pets: [mockPet],
      selectedPetId: 'pet-1',
      input: 'おはよう',
      activeTab: 'Settings',
      unreadCounts: {},
      userStats: { lastOpenDate: '2026-01-01', loginStreak: 1, totalMessagesSent: 0, firstOpenDate: '2026-01-01' },
    });
    // stateRef needs to reflect activeTab for the post-send check
    stateRef.current = { ...stateRef.current, activeTab: 'Settings' };
    await actions.handleSendMessage();

    const unreadAction = dispatched.find((a) => a.type === 'SET_UNREAD_COUNTS') as any;
    expect(unreadAction).toBeDefined();
    expect(unreadAction.counts['pet-1']).toBe(1);
  });

  it('sets API status online when response is not mock', async () => {
    const { sendPetChatMessage } = await import('../src/lib/chatService');
    (sendPetChatMessage as any).mockResolvedValue({ text: 'にゃー', provider: 'openai' });

    const { actions, dispatched } = createTestActions({
      pets: [mockPet],
      selectedPetId: 'pet-1',
      input: 'おはよう',
      activeTab: 'Talk',
      userStats: { lastOpenDate: '2026-01-01', loginStreak: 1, totalMessagesSent: 0, firstOpenDate: '2026-01-01' },
    });
    await actions.handleSendMessage();

    const statusAction = dispatched.find(
      (a) => a.type === 'SET_API_STATUS' && (a as any).status === 'online',
    );
    expect(statusAction).toBeDefined();
  });
});

// ── handleSignIn (sync upload) ──

describe('handleSignIn (sync)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('uploads local pets before bootstrap when pets exist', async () => {
    const { signInDemo, fetchBootstrap, syncUpload } = await import('../src/lib/api');
    (signInDemo as any).mockResolvedValue({
      session: { authToken: 'tok', email: 'a@b.com', plan: 'free' },
    });
    (fetchBootstrap as any).mockResolvedValue({
      pets: [mockPet],
      selectedPetId: 'pet-1',
      messagesByPetId: {},
    });
    (syncUpload as any).mockResolvedValue({ ok: true, uploadedCount: 1 });

    const { actions } = createTestActions({
      emailInput: 'a@b.com',
      pets: [mockPet],
      messagesByPetId: { 'pet-1': [] },
    });
    await actions.handleSignIn();

    expect(syncUpload).toHaveBeenCalledWith(
      { pets: [mockPet], messagesByPetId: { 'pet-1': [] } },
      'tok',
    );
  });

  it('continues login even when sync upload fails', async () => {
    const { signInDemo, fetchBootstrap, syncUpload } = await import('../src/lib/api');
    (signInDemo as any).mockResolvedValue({
      session: { authToken: 'tok', email: 'a@b.com', plan: 'free' },
    });
    (fetchBootstrap as any).mockResolvedValue({
      pets: [],
      selectedPetId: '',
      messagesByPetId: {},
    });
    (syncUpload as any).mockRejectedValue(new Error('sync failed'));

    const { actions, dispatched } = createTestActions({
      emailInput: 'a@b.com',
      pets: [mockPet],
      messagesByPetId: {},
    });
    await actions.handleSignIn();

    // Login should still complete
    expect(dispatched.some((a) => a.type === 'SIGN_IN_COMPLETE')).toBe(true);
  });
});

describe('retryConnection', () => {
  it('sets online on success', async () => {
    const { fetchHealth } = await import('../src/lib/api');
    (fetchHealth as any).mockResolvedValue({ status: 'ok' });

    const { actions, dispatched } = createTestActions();
    await actions.retryConnection();

    expect(dispatched).toContainEqual({ type: 'SET_API_STATUS', status: 'checking' });
    expect(dispatched).toContainEqual({ type: 'SET_API_STATUS', status: 'online' });
    expect(dispatched.find((a) => a.type === 'SET_NOTICE' && (a as any).notice?.includes('再接続'))).toBeDefined();
  });

  it('sets offline on failure', async () => {
    const { fetchHealth } = await import('../src/lib/api');
    (fetchHealth as any).mockRejectedValue(new Error('network error'));

    const { actions, dispatched } = createTestActions();
    await actions.retryConnection();

    expect(dispatched).toContainEqual({ type: 'SET_API_STATUS', status: 'checking' });
    expect(dispatched).toContainEqual({ type: 'SET_API_STATUS', status: 'offline' });
    expect(dispatched.find((a) => a.type === 'SET_NOTICE' && (a as any).notice?.includes('接続できません'))).toBeDefined();
  });
});

describe('retrySendMessage', () => {
  it('does nothing when no failedMessage', async () => {
    const { actions, dispatched } = createTestActions({ failedMessage: null });
    await actions.retrySendMessage();
    expect(dispatched.length).toBe(0);
  });

  it('resends the failed message', async () => {
    const { sendPetChatMessage } = await import('../src/lib/chatService');
    (sendPetChatMessage as any).mockResolvedValue({ text: 'にゃー', provider: 'mock' });

    const { actions, dispatched } = createTestActions({
      pets: [mockPet],
      selectedPetId: 'pet-1',
      failedMessage: { petId: 'pet-1', text: 'リトライテスト' },
      userStats: { lastOpenDate: '2026-01-01', loginStreak: 1, totalMessagesSent: 0, firstOpenDate: '2026-01-01' },
    });
    await actions.retrySendMessage();

    expect(dispatched).toContainEqual({ type: 'SET_SELECTED_PET_ID', petId: 'pet-1' });
    const ownerMsg = dispatched.find((a) => a.type === 'APPEND_MESSAGE' && (a as any).message?.text === 'リトライテスト');
    expect(ownerMsg).toBeDefined();
  });
});

describe('handleSendMessage failedMessage', () => {
  it('saves failedMessage on generic error', async () => {
    const { sendPetChatMessage } = await import('../src/lib/chatService');
    (sendPetChatMessage as any).mockRejectedValue(new Error('timeout'));

    const { actions, dispatched } = createTestActions({
      pets: [mockPet],
      selectedPetId: 'pet-1',
      input: 'テスト',
      userStats: { lastOpenDate: '2026-01-01', loginStreak: 1, totalMessagesSent: 0, firstOpenDate: '2026-01-01' },
    });
    await actions.handleSendMessage();

    const failedAction = dispatched.find(
      (a) => a.type === 'SET_FAILED_MESSAGE' && (a as any).failedMessage?.text === 'テスト',
    );
    expect(failedAction).toBeDefined();
  });

  it('clears failedMessage on send start', async () => {
    const { sendPetChatMessage } = await import('../src/lib/chatService');
    (sendPetChatMessage as any).mockResolvedValue({ text: 'にゃー', provider: 'mock' });

    const { actions, dispatched } = createTestActions({
      pets: [mockPet],
      selectedPetId: 'pet-1',
      input: 'テスト',
      failedMessage: { petId: 'pet-1', text: '前回の失敗' },
      userStats: { lastOpenDate: '2026-01-01', loginStreak: 1, totalMessagesSent: 0, firstOpenDate: '2026-01-01' },
    });
    await actions.handleSendMessage();

    const clearAction = dispatched.find(
      (a) => a.type === 'SET_FAILED_MESSAGE' && (a as any).failedMessage === null,
    );
    expect(clearAction).toBeDefined();
  });
});
