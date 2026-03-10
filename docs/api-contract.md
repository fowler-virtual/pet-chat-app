# API Contract

## Base URL

ローカル開発では:

```txt
http://localhost:3001
```

Expo 実機では `EXPO_PUBLIC_API_BASE_URL` を明示する。

## Endpoints

### `GET /health`

疎通確認。

```json
{
  "ok": true
}
```

### `POST /api/auth/demo-login`

デモ用ログイン。

Request:

```json
{
  "email": "demo@example.com"
}
```

### `GET /api/auth/me`

`Authorization: Bearer <token>` で現在セッションを返す。

### `GET /api/bootstrap`

認証済みユーザーのセッション、ペット一覧、メッセージ一覧をまとめて返す。

### `POST /api/persona/preview`

入力したペット設定から内部人格の要約を返す。

Request:

```json
{
  "pet": {
    "id": "pet-mugi",
    "name": "むぎ",
    "species": "猫",
    "gender": "女の子",
    "personality": "甘えん坊で少しツンデレ",
    "avatarUri": "",
    "sessionKey": "pet:pet-mugi:main"
  }
}
```

### `POST /api/chat/reply`

会話返信 API。

Request:

```json
{
  "pet": {
    "id": "pet-mugi",
    "name": "むぎ",
    "species": "猫",
    "gender": "女の子",
    "personality": "甘えん坊で少しツンデレ",
    "avatarUri": "",
    "sessionKey": "pet:pet-mugi:main"
  },
  "message": "ただいま",
  "plan": "free"
}
```

Response:

```json
{
  "provider": "mock",
  "text": "おかえりって気分で返すよ。",
  "sessionKey": "pet:pet-mugi:main"
}
```

### `POST /api/pets`

認証済みユーザーにペットを追加する。

### `POST /api/billing/subscribe`

モック課金 API。`free` / `plus` / `family` にプランを変更する。
