import { describe, it, expect } from 'vitest';
import { appReducer, createInitialState } from '../src/context/appReducer';
import type { AppState } from '../src/context/types';
import type { PetProfile, ChatMessage } from '../src/types';

function makeState(overrides: Partial<AppState> = {}): AppState {
  return { ...createInitialState(), ...overrides };
}

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

const mockPet2: PetProfile = { ...mockPet, id: 'pet-2', name: 'コタ' };

const mockMessage: ChatMessage = {
  id: 'msg-1',
  sender: 'owner',
  text: 'おはよう',
  time: '10:00',
};

// ── createInitialState ──
describe('createInitialState', () => {
  it('returns valid initial state', () => {
    const state = createInitialState();
    expect(state.session).toBeNull();
    expect(state.pets).toEqual([]);
    expect(state.isHydrating).toBe(true);
    expect(state.apiStatus).toBe('checking');
    expect(state.inventory).toEqual({ snack: 0, meal: 0, feast: 0 });
    expect(state.dailySentCount).toBe(0);
    expect(state.farewellTarget).toBeNull();
  });
});

// ── Auth ──
describe('Auth actions', () => {
  it('SET_SESSION updates session', () => {
    const session = { authToken: 'tok', email: 'a@b.com', plan: 'free' as const };
    const next = appReducer(makeState(), { type: 'SET_SESSION', session });
    expect(next.session).toEqual(session);
  });

  it('SET_SESSION can clear session', () => {
    const state = makeState({ session: { authToken: 'tok', email: 'a@b.com', plan: 'free' } });
    const next = appReducer(state, { type: 'SET_SESSION', session: null });
    expect(next.session).toBeNull();
  });

  it('SET_EMAIL_INPUT updates emailInput', () => {
    const next = appReducer(makeState(), { type: 'SET_EMAIL_INPUT', value: 'test@test.com' });
    expect(next.emailInput).toBe('test@test.com');
  });

  it('SET_IS_AUTHENTICATING updates flag', () => {
    const next = appReducer(makeState(), { type: 'SET_IS_AUTHENTICATING', value: true });
    expect(next.isAuthenticating).toBe(true);
  });
});

// ── Pets ──
describe('Pet actions', () => {
  it('SET_PETS replaces pets array', () => {
    const next = appReducer(makeState(), { type: 'SET_PETS', pets: [mockPet] });
    expect(next.pets).toHaveLength(1);
    expect(next.pets[0].name).toBe('むぎ');
  });

  it('ADD_PET appends pet and selects it', () => {
    const state = makeState({ pets: [mockPet], selectedPetId: 'pet-1' });
    const next = appReducer(state, { type: 'ADD_PET', pet: mockPet2 });
    expect(next.pets).toHaveLength(2);
    expect(next.selectedPetId).toBe('pet-2');
  });

  it('ADD_PET with messages stores them', () => {
    const msgs = [mockMessage];
    const next = appReducer(makeState(), { type: 'ADD_PET', pet: mockPet, messages: msgs });
    expect(next.messagesByPetId['pet-1']).toEqual(msgs);
  });

  it('ADD_PET without messages preserves existing messagesByPetId', () => {
    const state = makeState({ messagesByPetId: { 'pet-1': [mockMessage] } });
    const next = appReducer(state, { type: 'ADD_PET', pet: mockPet2 });
    expect(next.messagesByPetId['pet-1']).toEqual([mockMessage]);
    expect(next.messagesByPetId['pet-2']).toBeUndefined();
  });

  it('UPDATE_PET replaces matching pet', () => {
    const state = makeState({ pets: [mockPet] });
    const updated = { ...mockPet, name: 'むぎ改' };
    const next = appReducer(state, { type: 'UPDATE_PET', pet: updated });
    expect(next.pets[0].name).toBe('むぎ改');
  });

  it('REMOVE_PET removes pet, messages, unread, and resets farewellTarget', () => {
    const state = makeState({
      pets: [mockPet, mockPet2],
      selectedPetId: 'pet-1',
      messagesByPetId: { 'pet-1': [mockMessage], 'pet-2': [] },
      unreadCounts: { 'pet-1': 3, 'pet-2': 1 },
      farewellTarget: mockPet,
    });
    const next = appReducer(state, { type: 'REMOVE_PET', petId: 'pet-1' });
    expect(next.pets).toHaveLength(1);
    expect(next.pets[0].id).toBe('pet-2');
    expect(next.messagesByPetId['pet-1']).toBeUndefined();
    expect(next.unreadCounts['pet-1']).toBeUndefined();
    expect(next.selectedPetId).toBe('pet-2');
    expect(next.farewellTarget).toBeNull();
  });

  it('REMOVE_PET selects first remaining pet when selected pet is removed', () => {
    const state = makeState({ pets: [mockPet, mockPet2], selectedPetId: 'pet-1' });
    const next = appReducer(state, { type: 'REMOVE_PET', petId: 'pet-1' });
    expect(next.selectedPetId).toBe('pet-2');
  });

  it('REMOVE_PET keeps selectedPetId when different pet is removed', () => {
    const state = makeState({ pets: [mockPet, mockPet2], selectedPetId: 'pet-1' });
    const next = appReducer(state, { type: 'REMOVE_PET', petId: 'pet-2' });
    expect(next.selectedPetId).toBe('pet-1');
  });

  it('SET_SELECTED_PET_ID updates selection', () => {
    const next = appReducer(makeState(), { type: 'SET_SELECTED_PET_ID', petId: 'pet-1' });
    expect(next.selectedPetId).toBe('pet-1');
  });
});

// ── Chat ──
describe('Chat actions', () => {
  it('APPEND_MESSAGE adds to existing messages', () => {
    const state = makeState({ messagesByPetId: { 'pet-1': [mockMessage] } });
    const newMsg: ChatMessage = { id: 'msg-2', sender: 'pet', text: 'おはよー', time: '10:01' };
    const next = appReducer(state, { type: 'APPEND_MESSAGE', petId: 'pet-1', message: newMsg });
    expect(next.messagesByPetId['pet-1']).toHaveLength(2);
    expect(next.messagesByPetId['pet-1'][1].text).toBe('おはよー');
  });

  it('APPEND_MESSAGE creates array for new pet', () => {
    const state = makeState();
    const next = appReducer(state, { type: 'APPEND_MESSAGE', petId: 'pet-1', message: mockMessage });
    expect(next.messagesByPetId['pet-1']).toHaveLength(1);
  });

  it('DELETE_MESSAGE removes specific message', () => {
    const msg2: ChatMessage = { id: 'msg-2', sender: 'pet', text: 'にゃー', time: '10:01' };
    const state = makeState({ messagesByPetId: { 'pet-1': [mockMessage, msg2] } });
    const next = appReducer(state, { type: 'DELETE_MESSAGE', petId: 'pet-1', messageId: 'msg-1' });
    expect(next.messagesByPetId['pet-1']).toHaveLength(1);
    expect(next.messagesByPetId['pet-1'][0].id).toBe('msg-2');
  });

  it('SET_INPUT updates input', () => {
    const next = appReducer(makeState(), { type: 'SET_INPUT', value: 'こんにちは' });
    expect(next.input).toBe('こんにちは');
  });

  it('CLEAR_UNREAD sets count to 0', () => {
    const state = makeState({ unreadCounts: { 'pet-1': 5 } });
    const next = appReducer(state, { type: 'CLEAR_UNREAD', petId: 'pet-1' });
    expect(next.unreadCounts['pet-1']).toBe(0);
  });

  it('CLEAR_UNREAD returns same state if already 0', () => {
    const state = makeState({ unreadCounts: {} });
    const next = appReducer(state, { type: 'CLEAR_UNREAD', petId: 'pet-1' });
    expect(next).toBe(state);
  });
});

// ── Economy ──
describe('Economy actions', () => {
  it('USE_INVENTORY_ITEM decrements item count', () => {
    const state = makeState({ inventory: { snack: 3, meal: 1, feast: 0 } });
    const next = appReducer(state, { type: 'USE_INVENTORY_ITEM', itemType: 'snack' });
    expect(next.inventory.snack).toBe(2);
  });

  it('USE_INVENTORY_ITEM does not go below 0', () => {
    const state = makeState({ inventory: { snack: 0, meal: 0, feast: 0 } });
    const next = appReducer(state, { type: 'USE_INVENTORY_ITEM', itemType: 'snack' });
    expect(next.inventory.snack).toBe(0);
  });

  it('ADD_INVENTORY_ITEM increases item count', () => {
    const state = makeState({ inventory: { snack: 1, meal: 0, feast: 0 } });
    const next = appReducer(state, { type: 'ADD_INVENTORY_ITEM', itemType: 'snack', amount: 2 });
    expect(next.inventory.snack).toBe(3);
  });

  it('SET_BONUS updates bonus and date', () => {
    const next = appReducer(makeState(), { type: 'SET_BONUS', bonus: 5, date: '2026-01-01' });
    expect(next.bonusMessages).toBe(5);
    expect(next.bonusDate).toBe('2026-01-01');
  });

  it('INCREMENT_DAILY_SENT increments count', () => {
    const state = makeState({ dailySentCount: 3 });
    const next = appReducer(state, { type: 'INCREMENT_DAILY_SENT' });
    expect(next.dailySentCount).toBe(4);
  });

  it('RESET_DAILY_SENT resets count and updates date', () => {
    const state = makeState({ dailySentCount: 10, dailySentDate: '2025-12-31' });
    const next = appReducer(state, { type: 'RESET_DAILY_SENT', date: '2026-01-01' });
    expect(next.dailySentCount).toBe(0);
    expect(next.dailySentDate).toBe('2026-01-01');
  });
});

// ── UI ──
describe('UI actions', () => {
  it('SET_API_STATUS updates status', () => {
    const next = appReducer(makeState(), { type: 'SET_API_STATUS', status: 'online' });
    expect(next.apiStatus).toBe('online');
  });

  it('SET_NOTICE updates notice', () => {
    const next = appReducer(makeState(), { type: 'SET_NOTICE', notice: 'テスト通知' });
    expect(next.notice).toBe('テスト通知');
  });

  it('SET_ACTIVE_TAB updates tab', () => {
    const next = appReducer(makeState(), { type: 'SET_ACTIVE_TAB', tab: 'Talk' });
    expect(next.activeTab).toBe('Talk');
  });

  it('SET_SHOW_LIMIT_MODAL updates flag', () => {
    const next = appReducer(makeState(), { type: 'SET_SHOW_LIMIT_MODAL', value: true });
    expect(next.showLimitModal).toBe(true);
  });
});

// ── Modals ──
describe('Modal actions', () => {
  it('SET_FAREWELL_TARGET sets target and resets step to 1', () => {
    const state = makeState({ farewellStep: 2 });
    const next = appReducer(state, { type: 'SET_FAREWELL_TARGET', pet: mockPet });
    expect(next.farewellTarget).toEqual(mockPet);
    expect(next.farewellStep).toBe(1);
  });

  it('SET_FAREWELL_STEP updates step', () => {
    const next = appReducer(makeState(), { type: 'SET_FAREWELL_STEP', step: 2 });
    expect(next.farewellStep).toBe(2);
  });

  it('SET_USE_ITEM_CONFIRM sets item type', () => {
    const next = appReducer(makeState(), { type: 'SET_USE_ITEM_CONFIRM', itemType: 'meal' });
    expect(next.useItemConfirm).toBe('meal');
  });

  it('SET_MESSAGE_ACTION_STATE sets state', () => {
    const actionState = { petId: 'pet-1', message: mockMessage };
    const next = appReducer(makeState(), { type: 'SET_MESSAGE_ACTION_STATE', state: actionState });
    expect(next.messageActionState).toEqual(actionState);
  });
});

// ── Bulk ──
describe('Bulk actions', () => {
  it('HYDRATE merges payload into state', () => {
    const next = appReducer(makeState(), {
      type: 'HYDRATE',
      payload: { notice: 'ログインボーナス', bonusMessages: 3 },
    });
    expect(next.notice).toBe('ログインボーナス');
    expect(next.bonusMessages).toBe(3);
  });

  it('SIGN_IN_COMPLETE sets session, pets, and status', () => {
    const session = { authToken: 'tok', email: 'a@b.com', plan: 'plus' as const };
    const next = appReducer(makeState({ isAuthenticating: true }), {
      type: 'SIGN_IN_COMPLETE',
      session,
      pets: [mockPet],
      selectedPetId: 'pet-1',
      messagesByPetId: { 'pet-1': [mockMessage] },
    });
    expect(next.session).toEqual(session);
    expect(next.pets).toHaveLength(1);
    expect(next.selectedPetId).toBe('pet-1');
    expect(next.emailInput).toBe('a@b.com');
    expect(next.apiStatus).toBe('online');
    expect(next.isAuthenticating).toBe(false);
  });

  it('default case returns state unchanged', () => {
    const state = makeState();
    const next = appReducer(state, { type: 'UNKNOWN_ACTION' } as any);
    expect(next).toBe(state);
  });
});
