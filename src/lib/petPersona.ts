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
  const name = pet.name;

  if (bucket === 'morning') {
    return [
      `おはよ。${name}、もう起きてたよ。`,
      '朝いちばんに来てくれた！',
      'おはようって先に言いたかったのに。',
      'ふぁ〜、まだちょっとねむい…。',
      '今日も会えてうれしい！',
    ];
  }

  if (bucket === 'day') {
    return [
      'あ、来てくれた！',
      'ちょうどひまだったんだ。',
      'さっきからちょっと会いたかった。',
      '今日はいい天気だね。',
      'なにして遊ぶ？',
      'おひるねしてたところ。',
    ];
  }

  return [
    'もう来ないかと思った…。',
    '夜は静かでちょっとさみしかった。',
    'おかえり！待ってたよ。',
    'そろそろ声が聞きたかった。',
    '今日もおつかれさま。',
    'ねむくない？無理しないでね。',
  ];
}

function getToneTail(pet: PetProfile): string[] {
  switch (pet.tone) {
    case '敬語':
      return ['お話できてうれしいです。', 'よろしくお願いしますね。', 'そばにいてくださるとうれしいです。'];
    case 'やさしい':
      return ['ゆっくりしていってね。', '来てくれるだけでうれしいよ。', '無理しないでね。'];
    case 'ツンデレ':
      return ['べつに待ってたわけじゃないけど。', 'ふん、来たの。', '…まあ、いてもいいけど。'];
    case 'あまえんぼ':
      return ['なでなでしてー！', 'かまってかまって！', 'もっとそばにいて！'];
    case 'ため口':
      return ['ひまだったんだよね。', 'なんか話そうよ。', 'よっ！'];
    case '関西弁':
      return ['ほな話そか！', 'ひまやったんよ〜。', 'おっ、来たやん！'];
    default:
      return ['話したい気分！', '来てくれてうれしい。'];
  }
}

function getPersonalityTail(pet: PetProfile): string[] {
  const tails: string[] = [];

  if (pet.personality.includes('ツン')) {
    tails.push('…別にうれしくなんかないけど。', '気が向いたから相手してあげる。');
  }
  if (pet.personality.includes('甘え')) {
    tails.push('いっぱいかまって！', 'ずっとそばにいてほしいな。');
  }
  if (pet.personality.includes('元気')) {
    tails.push('今日も元気いっぱい！', 'いっぱい遊ぼう！');
  }
  if (pet.personality.includes('おっとり') || pet.personality.includes('のんびり')) {
    tails.push('今日ものんびりいこうね。', 'ゆっくりでいいよ。');
  }
  if (pet.personality.includes('人見知り') || pet.personality.includes('さみし')) {
    tails.push('来てくれてほっとした。', 'ひとりはちょっとさみしかった。');
  }
  if (pet.personality.includes('好奇心') || pet.personality.includes('いたずら')) {
    tails.push('なにかおもしろいことない？', '今日はなにして遊ぶ？');
  }
  if (pet.personality.includes('食いしん坊') || pet.personality.includes('くいしんぼ')) {
    tails.push('おやつまだかな？', 'おなかすいちゃった。');
  }

  if (tails.length === 0) {
    tails.push('お話しようよ！', '今日はどんな日？');
  }

  return tails;
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
