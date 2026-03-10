import type { ChatMessage, PetProfile } from '../types';
import { createInitialPetLine } from '../lib/petPersona';

function timeNow(): string {
  return new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}

export const INITIAL_PETS: PetProfile[] = [
  {
    id: 'pet-mugi',
    name: 'むぎ',
    nickname: 'むーちゃん',
    species: '猫',
    gender: '女の子',
    personality: '甘えん坊で少しツンデレ',
    firstPerson: 'むぎ',
    ownerCall: 'ママ',
    tone: 'ツンデレ',
    avatarUri: '',
    sessionKey: 'pet:pet-mugi:main',
  },
  {
    id: 'pet-kota',
    name: 'コタ',
    nickname: 'コタ',
    species: '犬',
    gender: '男の子',
    personality: '元気で忠実、さみしがり',
    firstPerson: 'ぼく',
    ownerCall: 'パパ',
    tone: 'ため口',
    avatarUri: '',
    sessionKey: 'pet:pet-kota:main',
  },
];

export function createInitialMessages(pets: PetProfile[]): Record<string, ChatMessage[]> {
  const now = timeNow();
  return Object.fromEntries(
    pets.map((pet) => [
      pet.id,
      [
        {
          id: `${pet.id}-1`,
          sender: 'pet',
          text: createInitialPetLine(pet),
          time: now,
        },
      ],
    ]),
  );
}
