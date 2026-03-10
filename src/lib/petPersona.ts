import type { PetProfile } from '../types';

function getTimeBucket(date = new Date()): 'morning' | 'day' | 'night' {
  const hour = date.getHours();

  if (hour < 11) {
    return 'morning';
  }

  if (hour < 18) {
    return 'day';
  }

  return 'night';
}

function getSpeciesVoice(pet: PetProfile): string[] {
  if (pet.species === '猫') {
    return ['ちょっとすました顔してたけど', 'べつに待ってないみたいな顔でいたけど', 'ちゃんと気づいてたよみたいな顔で'];
  }

  if (pet.species === '犬') {
    return ['しっぽぶんぶんの気持ちで', 'まっすぐ駆け寄るみたいに', 'うれしくてそわそわしながら'];
  }

  return ['その子らしい気分で', 'いつもの調子で', 'なんだかうれしそうに'];
}

function getTimeLead(pet: PetProfile): string[] {
  const bucket = getTimeBucket();

  if (bucket === 'morning') {
    return [`${pet.name}、もう起きてたよ。`, '朝いちばんに見つけてくれてうれしい。', 'おはようって先に言いたかった。'];
  }

  if (bucket === 'day') {
    return ['今ちょうど気にしてたところ。', 'さっきからちょっと会いたかった。', '今きてくれたの、うれしい。'];
  }

  return ['今日はもう来ないかと思った。', '夜に見つけてくれると安心する。', 'そろそろ声が聞きたいと思ってた。'];
}

function getToneTail(pet: PetProfile): string[] {
  switch (pet.tone) {
    case '敬語':
      return ['そばにいてくださるとうれしいです。', '見つけてくれてありがとうございます。'];
    case 'やさしい':
      return ['無理しないで、ゆっくり話してね。', '来てくれるだけで安心するよ。'];
    case 'ツンデレ':
      return ['べつに待ってたわけじゃないけど、そのままいて。', 'さみしくなんかなかったけど、来てくれてよかった。'];
    case 'あまえんぼ':
      return ['もっとかまってくれたら、すごくうれしい。', 'このままずっとそばにいてほしいな。'];
    default:
      return ['このまま話したい気分。', '来てくれてうれしい。'];
  }
}

function getPersonalityTail(pet: PetProfile): string[] {
  if (pet.personality.includes('ツン')) {
    return ['べつにさみしくなんかなかったけど、来てくれてよかった。', '待ってたわけじゃないけど、そのままいて。'];
  }

  if (pet.personality.includes('甘え')) {
    return ['もう少しかまってくれたら、すごくうれしい。', 'このままそばにいてくれたら安心する。'];
  }

  if (pet.personality.includes('元気')) {
    return ['このままいっぱい話したい気分。', 'まだまだ遊べそうなくらい元気。'];
  }

  if (pet.personality.includes('さみし')) {
    return ['来てくれたから、ちょっとほっとした。', 'ひとりじゃなくなった感じがして安心した。'];
  }

  return ['そのまま話してくれたらうれしい。', '少しだけでも声をかけてもらえると満たされる。'];
}

function choose<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function normalizeOwnerMessage(ownerMessage: string): string {
  return ownerMessage.replace(/[。！？!?]+$/u, '').trim();
}

export function createInitialPetLine(pet: PetProfile): string {
  const lead = choose(getTimeLead(pet));
  const tail = choose([...getToneTail(pet), ...getPersonalityTail(pet)]);
  return `${lead} ${tail}`;
}

export function createMockReply(pet: PetProfile, ownerMessage: string): string {
  const lead = choose(getTimeLead(pet));
  const speciesVoice = choose(getSpeciesVoice(pet));
  const tail = choose([...getToneTail(pet), ...getPersonalityTail(pet)]);
  const normalizedMessage = normalizeOwnerMessage(ownerMessage);
  const speaker = pet.firstPerson || pet.nickname || pet.name;
  const ownerCall = pet.ownerCall || '飼い主さん';

  if (!normalizedMessage) {
    return `${speaker}ね。${lead} ${ownerCall}に見つけてもらえて、${speciesVoice}${tail}`;
  }

  return `${speaker}ね。${lead} ${ownerCall}の「${normalizedMessage}」って聞いて、${speciesVoice}${tail}`;
}
