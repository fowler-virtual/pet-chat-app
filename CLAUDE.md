# CLAUDE.md - ペットとおはなし

ペット会話アプリ。ペットのプロフィールを登録し、AIがペットになりきって会話する。
Expo (React Native Web) + Express backend.

## Key Commands

```bash
npm install              # 依存インストール
npx expo start --web     # フロントエンド起動
node server/index.js     # バックエンド起動
npx vitest run           # テスト実行 (198 tests, 8 files)
```

### Android ローカルビルド

```bash
# prebuild (環境変数を渡す)
EXPO_PUBLIC_IAP_ENABLED=true EXPO_PUBLIC_API_BASE_URL=https://pet-chat-app.onrender.com npx expo prebuild --platform android --clean

# prebuild 後に build.gradle の versionCode・署名設定を手動修正する必要あり
# 署名鍵: android/app/upload-keystore.jks (EAS からダウンロード)

# AAB ビルド (Play Console アップロード用)
cd android && ./gradlew bundleRelease

# APK ビルド (直接インストール用)
cd android && ./gradlew assembleRelease
```

## Environment Variables (本番用)

| 変数 | 用途 |
|---|---|
| `DB_DRIVER` | DB切替 (`json` / `postgres`) |
| `STORAGE_DRIVER` | 画像ストレージ切替 (`local` / `s3`) |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Google Play レシート検証用サービスアカウント JSON キーのパス (ローカル用) |
| `GOOGLE_SERVICE_ACCOUNT_KEY_JSON` | 同上の JSON 文字列 (Render 等ホスティング用、どちらか一方でOK) |
| `GOOGLE_PLAY_PACKAGE_NAME` | Android パッケージ名 (`com.yuta.petchatapp`) |
| `EXPO_PUBLIC_IAP_ENABLED` | クライアント側 IAP 有効化 (`true` で実課金) |
| `EXPO_PUBLIC_API_BASE_URL` | API ベース URL |
| `CORS_ORIGINS` | 許可オリジン (カンマ区切り) |

未設定の変数は開発用デフォルト（モック/ローカル）で動作する。

## Architecture

- **App.tsx** はナビゲーション・モーダル・タブのみ (~365行)
- 画面は `src/screens/` に分割済み (各画面が `useAppContext()` で直接状態アクセス)
- 状態管理は `src/context/` に集約 (Context + useReducer パターン)
- UIコンポーネントは `src/components/` に分割済み
- プランは **free / plus** の2種類のみ (family plan なし)
- AI: 全プランで **OpenAI gpt-4.1-mini** を使用、fallback として mock レスポンス
- ログインは任意。コア機能はログインなしで動作する
- ログイン時にローカルデータをサーバーに自動同期 (`POST /api/sync/upload`)
- フロントエンドのデータは **AsyncStorage** に保存 (key: `pet-chat-app-state`)
- サーバーDB: 開発は **JSON file** (`DB_DRIVER=json`)、本番は **PostgreSQL** (`DB_DRIVER=postgres`)
- 画像ストレージ: 開発は **ローカルファイル** (`STORAGE_DRIVER=local`)、本番は **S3** (`STORAGE_DRIVER=s3`)
- 課金: Google Play レシート検証は `googleapis` で実装済み。`GOOGLE_SERVICE_ACCOUNT_KEY` 未設定時はモックモード
- クライアント IAP: **react-native-iap v14** を使用（purchaseUpdatedListener ベース）
- Android ネイティブプロジェクトは `android/` に配置（EAS Build / ローカルビルド用）

## Code Style

- フロントエンド: TypeScript / サーバー: JavaScript
- テスト: Vitest
- アイコン: `@expo/vector-icons` (Feather, MaterialCommunityIcons) を使用。OS絵文字は使わない
- カラーパレット: warm beige系。`src/theme.ts` の `palette` を参照
- UIテキストは全て日本語

## Important Conventions

- UIに絵文字を追加しない (明示的に指示がない限り)
- シニアユーザー向けにシンプルなUIを維持する
- ペット削除は「削除」ではなく **「お別れする」** と表現する
- アイテム名: **おやつ** (snack) / **ごはん** (meal) / **ごちそう** (feast)。抽象的な名前にしない
- ログイン機能の表現: 「ログイン必須」ではなく **「データの引き継ぎ」** とする

## File Structure

```
App.tsx                     # ナビゲーション・モーダル・タブ (~365行)
app.json                    # Expo設定 (ストア提出用)
eas.json                    # EAS Build設定
src/
  types.ts                  # 型定義
  theme.ts                  # カラーパレット・shadow定義
  context/
    AppContext.tsx           # AppProvider + useAppContext (effects, derived values)
    appReducer.ts           # 純粋reducer + createInitialState
    appActions.ts           # 非同期アクション (handleSendMessage等)
    types.ts                # AppState, AppAction 型定義
  screens/
    TodayScreen.tsx         # ホーム画面
    TalkScreen.tsx          # チャット画面
    SettingsScreen.tsx       # 設定画面
    PetDetailScreen.tsx     # ペット詳細/登録画面
    WelcomeWizard.tsx       # 初回ウィザード
    MemoryScreen.tsx        # 思い出画面
  components/
    PetAvatar.tsx            # ペットアバター (icon/photo/fallback)
    ScreenHeader.tsx         # 画面ヘッダー
    NoticeBanner.tsx         # 通知バナー
    FormField.tsx            # FormField + FieldLabel
    PetHeaderSwitcher.tsx    # ペット切替タブ
    PetListCard.tsx          # ペット一覧カード
    MessageBubble.tsx        # メッセージバブル + タイピング
    LimitModal.tsx           # 回数制限モーダル
    MessageActionSheet.tsx   # メッセージ操作シート
    UseItemConfirmModal.tsx  # アイテム使用確認モーダル
    FarewellModal.tsx        # お別れ確認モーダル
    QuoteCard.tsx            # シェア用引用カード
  lib/
    api.ts                  # サーバーAPI呼び出し
    adService.ts            # AdMob リワード広告 (mock/real切替)
    iapService.ts           # アプリ内課金 (mock/real切替)
    chatService.ts          # チャットロジック
    dateUtils.ts            # 日付ユーティリティ
    petUtils.ts             # ペットデータ正規化
    petPersona.ts           # ペットペルソナ生成
    personaPrompt.ts        # AIプロンプト構築
    shareQuote.ts           # 会話シェア機能
    storage.ts              # AsyncStorage操作
  data/
    constants.ts            # 選択肢定数 (種類, 口調, アイコン等)
    mock.ts                 # モックデータ
android/                    # Android ネイティブプロジェクト (EAS Build用)
assets/
  bubble-icon.png           # アプリアイコン素材
scripts/
  screenshots.mjs           # ストア用スクリーンショット生成 (Playwright)
server/
  index.js                  # Express エントリーポイント
  ai-router.js              # AI API ルーティング
  auth.js                   # 認証
  google-play-verify.js     # Google Play レシート検証 (googleapis)
  db.js                     # DB抽象レイヤー (JSON/PostgreSQL切替)
  db-postgres.js            # PostgreSQLアダプター
  storage.js                # 画像ストレージ (local/S3切替)
  schema.sql                # PostgreSQLスキーマ
  migrate-json-to-pg.js     # JSON→PostgreSQL移行スクリプト
  data/db.json              # JSON DBファイル (開発用)
docs/
  privacy-policy.md         # プライバシーポリシー
  terms-of-service.md       # 利用規約
  product-strategy.md       # プロダクト戦略
  system-architecture.md    # システムアーキテクチャ
tests/
  plan-limits.test.js       # プラン制限テスト
  ai-router.test.js         # AIルーターテスト
  app-reducer.test.ts        # Reducerテスト
  app-actions.test.ts        # 非同期アクションテスト
  date-utils.test.ts         # 日付ユーティリティテスト
  pet-utils.test.ts          # ペットデータ正規化テスト
  constants.test.ts          # 定数テスト
  server-endpoints.test.js   # サーバーエンドポイントテスト
```

## Testing

- テストは `tests/` ディレクトリに配置
- Vitest を使用
- 現在 198 tests passing (8 test files)
- `npx vitest run` で全テスト実行、`npx vitest` でwatch mode
