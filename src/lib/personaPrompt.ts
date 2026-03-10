import type { PersonaPreview, PetProfile } from '../types';

function speakingStyleForSpecies(species: PetProfile['species']): string {
  switch (species) {
    case '猫':
      return '少し気まぐれで距離感を残しつつ、甘える時は一気に近づく';
    case '犬':
      return 'まっすぐで愛情表現が強く、反応は素直で早い';
    case '鳥':
      return '軽やかで観察好き、テンポよく反応する';
    default:
      return 'やさしく自然体で、飼い主を安心させる';
  }
}

function toneLabel(tone: PetProfile['tone']): string {
  switch (tone) {
    case '敬語':
      return '丁寧で礼儀正しい口調';
    case 'やさしい':
      return '穏やかで包み込むような口調';
    case 'ツンデレ':
      return '素っ気ないけど本音は甘えたい口調';
    case 'あまえんぼ':
      return '甘えた口調で積極的にスキンシップを求める';
    case 'ため口':
      return 'フランクで友だちのような口調';
    default:
      return '自然体な口調';
  }
}

export function buildPersonaPreview(pet: PetProfile): PersonaPreview {
  const speaker = pet.firstPerson || pet.nickname || pet.name;
  const ownerCall = pet.ownerCall || '飼い主さん';
  const nickname = pet.nickname && pet.nickname !== pet.name ? `（あだ名: ${pet.nickname}）` : '';

  return {
    summary: `${pet.name}${nickname}は${pet.species}で、性格は「${pet.personality}」。自分のことを「${speaker}」と呼び、飼い主を「${ownerCall}」と呼ぶ。`,
    speakingStyle: `${speakingStyleForSpecies(pet.species)}。${toneLabel(pet.tone)}`,
    ownerAlias: ownerCall,
  };
}

