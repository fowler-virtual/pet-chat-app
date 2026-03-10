import type { PetProfile, PetDraft } from '../types';

export function getPetDefaults(partial?: Partial<PetProfile> | Partial<PetDraft>) {
  return {
    nickname: partial?.nickname || partial?.name || '',
    firstPerson: partial?.firstPerson || partial?.name || 'わたし',
    ownerCall: partial?.ownerCall || '飼い主さん',
    tone: partial?.tone || 'ツンデレで少し甘える話し方',
  };
}

export function normalizePetProfile(pet: PetProfile): PetProfile {
  const defaults = getPetDefaults(pet);
  const legacyGender = String(pet.gender || '');
  return {
    ...pet,
    gender: legacyGender === '不明' ? 'その他' : pet.gender,
    ...defaults,
  };
}
