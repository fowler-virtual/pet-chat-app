# ペットとおはなし

ペットの性格や口調を登録して、AIがその子らしく返答してくれる会話アプリ。

## 技術スタック

- Expo ~54 / React Native / React 19
- Express 5 (バックエンド)
- OpenAI gpt-4.1-mini

## 必要な環境

- Node.js
- npm または yarn

## セットアップと起動

```bash
# 依存パッケージのインストール
npm install

# 環境変数の設定
cp .env.example .env
# .env を編集して OPENAI_API_KEY を設定する

# フロントエンド起動
npx expo start --web

# バックエンド起動（別ターミナルで実行）
node server/index.js
```

## テスト

```bash
npx vitest run
```

42件のテストが実行されます。

## プロジェクト構成

| パス | 説明 |
|------|------|
| `App.tsx` | メインアプリ |
| `src/types.ts` | 型定義 |
| `src/theme.ts` | デザインパレット |
| `src/lib/` | API, storage, chatService等 |
| `server/` | Express API + AIルーティング |
| `tests/` | Vitest テスト |
| `docs/` | 設計ドキュメント |

## プラン

| プラン | ペット登録数 | 1日の会話回数 | 料金 |
|--------|------------|-------------|------|
| Free | 1匹 | 5回 | 無料 |
| Plus | 3匹 | 50回 | 480円/月 |

## License

TBD
