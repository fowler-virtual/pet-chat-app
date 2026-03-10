# System Architecture

## 1. 全体構成

### 技術スタック

| レイヤー | 技術 |
|---------|------|
| フレームワーク | Expo ~54 / React Native 0.81.4 / React 19.1.0 |
| ナビゲーション | React Navigation 7 (native-stack + bottom-tabs) |
| アイコン | @expo/vector-icons (Feather, MaterialCommunityIcons) |
| クライアント保存 | AsyncStorage (`pet-chat-app-state`) |
| サーバー | Express 5.1.0 (Node.js) |
| データベース | JSON ファイル DB (`server/db.js`) |
| AI | OpenAI gpt-4.1-mini / ローカル mock フォールバック |
| テスト | Vitest 4 |
| 言語 | TypeScript 5.9 (クライアント) / JavaScript (サーバー) |

### Mobile App

- ペット作成 (Welcome Wizard)
- チャット UI
- アイテム / 広告報酬システム
- ログイン任意のローカルファースト設計

### API / Backend

- ユーザー管理 (デモユーザー自動作成)
- ペットプロフィール管理
- 会話履歴管理
- プラン別制限の適用
- AI ルーティング

### Storage

- Users
- Pets
- Conversations
- Messages

## 2. ログイン任意アーキテクチャ

ペット作成と会話はログイン不要で、すべてローカル (AsyncStorage) に保存される。

- ログインしていない場合: ペット作成、会話はクライアント側のみで完結する。mock プロバイダが応答を生成する。
- ログインした場合: サーバー API を経由して OpenAI による応答を取得し、会話履歴をサーバーにも保存する。ログインはデータバックアップとして機能する。

`chatService.ts` の処理フロー:

1. `authToken` がある場合、サーバー API を呼び出す
2. サーバーが 429/403 を返した場合はエラーを再 throw (制限超過の UI 表示用)
3. サーバーが利用不可の場合、またはログインしていない場合はローカル mock にフォールバックする

## 3. 主要エンティティ

### UserSession

- `id`: string
- `email`: string
- `authToken`: string
- `plan`: SubscriptionPlan (`'free'` | `'plus'`)

### PetProfile

- `id`: string
- `name`: string
- `nickname`: string
- `species`: PetSpecies (string)
- `gender`: PetGender (`'男の子'` | `'女の子'` | `'その他'`)
- `personality`: string
- `firstPerson`: string -- 一人称
- `ownerCall`: string -- 飼い主の呼び方
- `tone`: PetTone (string) -- 口調 (敬語 / やさしい / ツンデレ / あまえんぼ / ため口)
- `avatarUri`: string
- `sessionKey`: string

### PetDraft

PetProfile から `id` と `sessionKey` を除いたもの。Welcome Wizard での入力値をまとめる。

### ChatMessage

- `id`: string
- `sender`: `'pet'` | `'owner'`
- `text`: string
- `time`: string

### Conversation (サーバー側)

- `id`: string
- `userId`: string
- `petId`: string
- `sessionKey`: string
- `lastMessageAt`: string (ISO 8601)

### PersistedAppState (クライアント側ローカル保存)

- `session`: UserSession | null
- `pets`: PetProfile[]
- `selectedPetId`: string
- `messagesByPetId`: Record<string, ChatMessage[]>
- `unreadCounts`: Record<string, number>
- `userStats?`: UserStats
- `inventory?`: ItemInventory
- `adReward?`: AdRewardState
- `bonusMessages?`: number -- 今日のアイテム追加回数
- `bonusDate?`: string -- bonusMessages の対象日

## 4. クライアント側ストレージ

AsyncStorage を使用し、キー `pet-chat-app-state` に `PersistedAppState` を JSON シリアライズして保存する。

- `loadPersistedAppState()`: 起動時にローカル状態を復元する
- `savePersistedAppState(state)`: 状態変更のたびに永続化する

## 5. Welcome Wizard フロー

初回起動時 (ペットが 0 匹の場合)、ユーザーは以下の順序でペットを作成する。

1. 名前、ニックネームの入力
2. 種族の選択
3. 性別の選択
4. 性格の入力
5. 一人称 (`firstPerson`) の設定
6. 飼い主の呼び方 (`ownerCall`) の設定
7. 口調 (`tone`) の選択
8. アバター画像の選択 (expo-image-picker)

作成完了後、`PetDraft` に `id` と `sessionKey` を付与して `PetProfile` としてローカルに保存する。

## 6. 会話設計

セッションキーの形式:

```txt
pet:{petId}:main
```

これにより以下が簡単になる。

- ペット単位の履歴取得
- 複数ペットの並行管理

## 7. ペルソナ生成

サーバー側 (`ai-router.js`) でペット設定値からシステムプロンプトを動的に構築する。

構築に使用するフィールド:

- `name`, `nickname` -- 名前とあだ名
- `species` -- 種族ごとの振る舞い指示 (猫: 気まぐれ / 犬: 素直 / 鳥: 軽やか)
- `personality` -- 性格に基づく応答パターン
- `firstPerson` -- 一人称の強制
- `ownerCall` -- 飼い主呼称の強制
- `tone` -- 口調指示 (敬語 / やさしい / ツンデレ / あまえんぼ / ため口)

時間帯 (朝 / 昼 / 夜) も自動検出してプロンプトに反映する。

PersonaPreview (クライアント用):

- `summary`: ペットの基本情報の要約
- `speakingStyle`: 種族と口調に基づく話し方の説明
- `ownerAlias`: 飼い主の呼び方

## 8. AI ルーティング

### プロバイダ

```ts
type AiProvider = 'openai' | 'mock';
```

### ルーティング方針

全プラン共通で OpenAI `gpt-4.1-mini` を使用する。API キーがない場合、またはエラー発生時はローカル mock にフォールバックする。

```
generatePetReply()
  -> maybeCallOpenAi() (gpt-4.1-mini)
     -> 成功: { provider: 'openai', text }
     -> 失敗/キーなし: { provider: 'mock', text: createMockReply() }
```

### 履歴制限 (コンテキストウィンドウ)

```js
HISTORY_LIMITS = { free: 5, plus: 20 }
```

プランに応じて直近 N ターンのみを AI に送信する。

### mock プロバイダ

API が利用不可の場合にフォールバックとして使用する。時間帯、種族、性格、口調に基づいたテンプレート応答を組み合わせて生成する。

## 9. プラン別制限

### プラン

```ts
type SubscriptionPlan = 'free' | 'plus';
```

### 制限値

| 制限 | free | plus |
|------|------|------|
| ペット数 (`PET_LIMITS`) | 1 | 3 |
| 1日のメッセージ数 (`DAILY_MESSAGE_LIMITS`) | 5 | 50 |
| AI 履歴ターン数 (`HISTORY_LIMITS`) | 5 | 20 |

## 10. アイテム / 報酬システム

### アイテム

```ts
type ItemType = 'snack' | 'meal' | 'feast';

ITEM_BONUS = { snack: 3, meal: 5, feast: 10 }
```

| アイテム | 種類 | 追加メッセージ数 |
|---------|------|-----------------|
| おやつ | snack | +3 |
| ごはん | meal | +5 |
| ごちそう | feast | +10 |

アイテムを使用すると、その日のメッセージ上限に `ITEM_BONUS` 分が加算される。`bonusMessages` と `bonusDate` で日付単位の追加回数を管理する。

### 広告報酬

```ts
AD_VIEW_LIMIT = 3  // 1日あたりの視聴上限
```

`AdRewardState` で日付 (`date`) と視聴回数 (`viewCount`) を追跡する。

### アイテム所持数

`ItemInventory` で `snack`, `meal`, `feast` の個数を管理する。PersistedAppState の一部としてローカルに保存される。

## 11. 安全性

- 「本当に気持ちを翻訳しています」とは言わない
- 医療判断、しつけ判断は注意書きを返す
- 常にペットのキャラクターを維持し、メタ的な発言はしない

## 12. 開発フェーズ

### Phase 1 (ほぼ完了)

- Welcome Wizard によるペット作成
- チャット UI (複数ペット対応)
- ローカル mock による擬似会話
- AsyncStorage によるローカル永続化
- アイテム / 広告報酬システムの型定義
- プラン別制限の定義
- サーバー API (Express + JSON DB)
- OpenAI gpt-4.1-mini 接続
- ペルソナに基づくシステムプロンプト生成

### Phase 2

- 認証 (ログインによるデータバックアップ)
- 画像アップロード (署名 URL 方式)
- アイテム購入 / 広告報酬の実装
- 課金 (free -> plus アップグレード)

### Phase 3

- 分析基盤
- パフォーマンス最適化
- 追加コンテンツ (新しい種族、口調パターン等)
