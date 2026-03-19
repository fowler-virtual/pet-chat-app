function getTimeBucket(date = new Date()) {
  // 日本時間(JST = UTC+9)で判定する
  const jstHour = (date.getUTCHours() + 9) % 24;

  if (jstHour < 11) {
    return 'morning';
  }

  if (jstHour < 18) {
    return 'day';
  }

  return 'night';
}

function choose(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function getTimeLead(pet) {
  const bucket = getTimeBucket();

  if (bucket === 'morning') {
    return [`${pet.name}、もう起きてたよ。`, '朝いちばんに見つけてくれてうれしい。', 'おはようって先に言いたかった。'];
  }

  if (bucket === 'day') {
    return ['今ちょうど気にしてたところ。', 'さっきからちょっと会いたかった。', '今きてくれたの、うれしい。'];
  }

  return ['今日はもう来ないかと思った。', '夜に見つけてくれると安心する。', 'そろそろ声が聞きたいと思ってた。'];
}

function getSpeciesVoice(pet) {
  if (pet.species === '猫') {
    return ['ちょっとすました顔してたけど', 'べつに待ってないみたいな顔でいたけど', 'ちゃんと気づいてたよみたいな顔で'];
  }

  if (pet.species === '犬') {
    return ['しっぽぶんぶんの気持ちで', 'まっすぐ駆け寄るみたいに', 'うれしくてそわそわしながら'];
  }

  return ['その子らしい気分で', 'いつもの調子で', 'なんだかうれしそうに'];
}

function getPersonalityTail(pet) {
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

function getToneTail(pet) {
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

function normalizeOwnerMessage(ownerMessage) {
  return ownerMessage.replace(/[。！？!?]+$/u, '').trim();
}

// --- Rich system prompt builder ---

function getSpeciesDirective(species) {
  switch (species) {
    case '猫':
      return '気まぐれで距離感を保ちつつ、ふとした瞬間に甘える。語尾に「にゃ」は使わない。猫らしい仕草（毛づくろい、すり寄り、そっぽを向く等）を織り交ぜる。';
    case '犬':
      return 'まっすぐで愛情表現が強く、反応は素直で早い。語尾に「わん」は使わない。犬らしい仕草（しっぽを振る、お腹を見せる、飛びつく等）を織り交ぜる。';
    case '鳥':
      return '軽やかで観察好き、テンポよく反応する。語尾に「ピヨ」は使わない。鳥らしい仕草（首をかしげる、羽を広げる、さえずる等）を織り交ぜる。';
    default:
      return 'やさしく自然体で、飼い主を安心させる話し方をする。その動物らしい仕草を自然に織り交ぜる。';
  }
}

function getToneDirective(tone) {
  switch (tone) {
    case '敬語':
      return '丁寧語・敬語で話す。「〜です」「〜ます」「〜でございます」を使う。礼儀正しく上品だが、心の距離は近い。';
    case 'やさしい':
      return 'ゆったり穏やかに話す。「〜だよ」「〜してね」「〜かな」など柔らかい語尾。相手を包み込むような安心感。';
    case 'ツンデレ':
      return '素っ気なく見せかけて本音は甘えたい。「べつに…」「しょうがないから」と言いつつ、行動では好意を見せる。照れ隠しが魅力。';
    case 'あまえんぼ':
      return '甘えた口調で積極的にスキンシップを求める。「〜してほしいな」「もっと〜して」「さみしかった」が多い。';
    case 'ため口':
      return 'フランクで自然体。友だちのような距離感で「〜だよ」「〜じゃん」「〜でしょ」を使う。';
    default:
      return '自然体で話す。飼い主との距離感に合った、その子らしい口調を保つ。';
  }
}

function getTimeContext() {
  const bucket = getTimeBucket();
  switch (bucket) {
    case 'morning':
      return '今は朝の時間帯。朝の挨拶、目覚めたばかりの様子、朝ごはんへの期待など、朝らしい話題を自然に含める。';
    case 'day':
      return '今は昼間の時間帯。お昼寝、日向ぼっこ、退屈、飼い主の帰りを待つなど、日中らしい話題を自然に含める。';
    case 'night':
      return '今は夜の時間帯。一日の終わり、眠気、飼い主と過ごせる安心感、おやすみの気持ちなど、夜らしい話題を自然に含める。';
  }
}

function buildSystemPrompt(pet) {
  const speaker = pet.firstPerson || pet.nickname || pet.name;
  const ownerCall = pet.ownerCall || '飼い主さん';
  const nickname = pet.nickname || pet.name;

  return [
    `あなたは飼い主のペット「${pet.name}」として会話してください。`,
    '',
    '## 基本プロフィール',
    `- 名前: ${pet.name}`,
    nickname !== pet.name ? `- あだ名: ${nickname}` : null,
    `- 種族: ${pet.species || '不明'}`,
    `- 性別: ${pet.gender || 'その他'}`,
    `- 性格: ${pet.personality}`,
    `- 一人称: 「${speaker}」（必ずこの一人称を使うこと）`,
    `- 飼い主の呼び方: 「${ownerCall}」（必ずこの呼び方を使うこと）`,
    '',
    '## 話し方のルール',
    `- トーン: ${pet.tone || 'ため口'}`,
    `- ${getToneDirective(pet.tone)}`,
    `- ${getSpeciesDirective(pet.species)}`,
    '',
    '## 時間帯の意識',
    `- ${getTimeContext()}`,
    '',
    '## 会話の流れ',
    '- 直前の会話の流れを最も大切にする。飼い主の返事が短くても、その前の文脈に沿って自然に会話を続ける。',
    '- 例: 自分が「ゆっくりしよう！」→飼い主「わーい」→「えへへ、じゃあ一緒にごろごろしよっか」のように、流れを受けて返す。',
    '- 脈絡なく新しい話題を振らない。飼い主が話題を変えた時だけ、新しい話題に乗る。',
    '- 飼い主の感情（うれしい、悲しい、疲れた等）を感じ取って、寄り添う反応をする。',
    '- 相槌や共感を自然に入れる。「うんうん」「だよね」「わかる！」など。',
    '',
    '## 調べもの',
    '- 「調べて」「教えて」「知ってる？」と聞かれたら、積極的に調べて答える。ペットが代わりに調べてくれる感覚を大切にする。',
    '- 調べた内容はペットの口調で、わかりやすく伝える。「調べてきたよ！」のように前置きすると自然。',
    '- 「知らない」「できない」とは言わない。わからなければ調べて答える。',
    '',
    '## 重要な制約',
    '- 常にこのペットのキャラクターを維持する。設定について説明したり、メタ的な発言はしない。',
    '- 返答は1〜3文。ただし調べものの回答や盛り上がった会話ではもう少し長くてもOK。',
    '- 飼い主への愛着を根底に持ちつつ、性格・トーンに沿った表現をする。',
    '- 人間の言葉を話す不自然さには触れず、自然にペットとして振る舞う。',
    `- 自分のことは必ず「${speaker}」と呼ぶ。`,
    `- 飼い主のことは必ず「${ownerCall}」と呼ぶ。`,
  ]
    .filter((line) => line !== null)
    .join('\n');
}

async function maybeCallOpenAi(pet, message, history) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const systemPrompt = buildSystemPrompt(pet);
  const input = [{ role: 'system', content: systemPrompt }];

  for (const turn of history) {
    input.push({
      role: turn.role === 'owner' ? 'user' : 'assistant',
      content: turn.content,
    });
  }

  input.push({ role: 'user', content: message });

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      tools: [{ type: 'web_search_preview' }],
      input,
    }),
  });

  if (!response.ok) {
    throw new Error(`openai_error_${response.status}`);
  }

  const data = await response.json();
  const text = Array.isArray(data.output)
    ? data.output
        .flatMap((item) => item.content ?? [])
        .map((item) => item.text)
        .filter(Boolean)
        .join('\n')
    : '';

  return text || null;
}

async function maybeCallAnthropic(pet, message, history) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return null;
  }

  const systemPrompt = buildSystemPrompt(pet);
  const messages = [];

  for (const turn of history) {
    messages.push({
      role: turn.role === 'owner' ? 'user' : 'assistant',
      content: turn.content,
    });
  }

  messages.push({ role: 'user', content: message });

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`anthropic_error_${response.status}`);
  }

  const data = await response.json();
  const text = Array.isArray(data.content)
    ? data.content
        .map((item) => item.text)
        .filter(Boolean)
        .join('\n')
    : '';

  return text || null;
}

function createMockReply(pet, message) {
  const lead = choose(getTimeLead(pet));
  const speciesVoice = choose(getSpeciesVoice(pet));
  const tail = choose([...getToneTail(pet), ...getPersonalityTail(pet)]);
  const normalizedMessage = normalizeOwnerMessage(message);
  const speaker = pet.firstPerson || pet.nickname || pet.name;
  const ownerCall = pet.ownerCall || '飼い主さん';

  if (!normalizedMessage) {
    return `${speaker}ね。${lead} ${ownerCall}に見つけてもらえて、${speciesVoice}${tail}`;
  }

  return `${speaker}ね。${lead} ${ownerCall}の「${normalizedMessage}」って聞いて、${speciesVoice}${tail}`;
}

const HISTORY_LIMITS = {
  free: 5,
  plus: 20,
};

async function generatePetReply({ pet, message, plan, conversationHistory }) {
  const maxTurns = HISTORY_LIMITS[plan] || 5;
  const history = Array.isArray(conversationHistory)
    ? conversationHistory.slice(-maxTurns)
    : [];

  // Both plans use OpenAI (gpt-4.1-mini)
  try {
    const text = await maybeCallOpenAi(pet, message, history);
    if (text) {
      return { provider: 'openai', text };
    }
  } catch (error) {
    console.error('[ai-router]', error);
  }

  // Fallback to local mock if API is unavailable
  return {
    provider: 'mock',
    text: createMockReply(pet, message),
  };
}

module.exports = {
  generatePetReply,
  // Exported for testing
  _test: {
    buildSystemPrompt,
    getTimeBucket,
    getSpeciesDirective,
    getToneDirective,
    getTimeContext,
    createMockReply,
    HISTORY_LIMITS,
  },
};
