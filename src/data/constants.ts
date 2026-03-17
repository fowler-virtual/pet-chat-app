import type { SubscriptionPlan } from '../types';

export const genderOptions = ['男の子', '女の子', 'その他'] as const;
export const planOptions: SubscriptionPlan[] = ['free', 'plus'];

export const SPECIES_OPTIONS = ['猫', '犬', 'うさぎ', '鳥', 'ハムスター', 'その他'];
export const OWNER_CALL_OPTIONS = ['ママ', 'パパ', 'おねえちゃん', 'おにいちゃん', 'ごしゅじん', 'かいぬし'];
export const FIRST_PERSON_OPTIONS = ['ぼく', 'わたし', 'おれ', 'あたし', 'うち'];
export const TONE_OPTIONS = ['やさしい', 'ツンデレ', 'あまえんぼ', 'ため口', '敬語', '関西弁'];

export const AVATAR_ICONS: { icon: string; label: string }[] = [
  { icon: 'cat', label: '猫' },
  { icon: 'dog', label: '犬' },
  { icon: 'rabbit', label: 'うさぎ' },
  { icon: 'bird', label: '鳥' },
  { icon: 'turtle', label: 'カメ' },
  { icon: 'fish', label: 'さかな' },
  { icon: 'paw', label: 'にくきゅう' },
];
