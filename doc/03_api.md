# 03. API エンドポイント仕様

すべての API は `src/app/api/(vtecx)/` 以下に配置した Next.js Route Handler。  
クライアントからは `browserutil.requestApi()` 経由で呼び出す（`X-Requested-With` ヘッダーを自動付与）。

---

## 顧客 API

### GET `/api/crm/customer`

顧客一覧を取得（ページング付き）。

| パラメータ | 型 | 必須 | 説明 |
|---|---|:---:|---|
| `n` | number | | ページ番号（デフォルト: 1）、1ページ25件 |

**レスポンス**: `Entry[]`（直接配列）

```json
[
  {
    "id": "/crm/customer/1748345678901,1",
    "link": [{ "___href": "/crm/customer/1748345678901", "___rel": "self" }],
    "customer": { "name": "株式会社テスト", "status": "active", ... }
  }
]
```

---

### GET `/api/crm/customer/{cid}`

顧客詳細を取得。

**レスポンス**: `Entry`（単一オブジェクト）

---

### POST `/api/crm/customer`

顧客を新規登録。

**リクエストボディ**:
```json
{ "customer": { "name": "株式会社テスト", "status": "prospect" } }
```

**レスポンス**: `{ "feed": { "title": "/crm/customer/1748345678901" } }`

---

### PUT `/api/crm/customer/{cid}`

顧客情報を更新。サーバー側で楽観的ロック用 `id` を自動取得。

**リクエストボディ**:
```json
{ "customer": { "name": "株式会社テスト（変更後）", "status": "active" } }
```

**レスポンス**: `{ "feed": { "title": "Updated." } }`

---

### DELETE `/api/crm/customer/{cid}`

顧客を論理削除（`is_deleted: true`）。

**レスポンス**: `{ "feed": { "title": "Deleted." } }`

---

## 顧客担当者 API

### GET `/api/crm/customer/{cid}/contact`

担当者一覧を取得。

**レスポンス**: `Entry[]`

---

### POST `/api/crm/customer/{cid}/contact`

担当者を登録。URI は `Date.now()` で自動採番。

**リクエストボディ**:
```json
{ "contact": { "family_name": "山田", "given_name": "太郎" } }
```

---

### PUT `/api/crm/customer/{cid}/contact/{ctid}`

担当者情報を更新。

---

### DELETE `/api/crm/customer/{cid}/contact/{ctid}`

担当者を論理削除。

---

## 対応履歴 API

### GET `/api/crm/customer/{cid}/activity`

対応履歴一覧を取得（商談前も含む全件）。

**レスポンス**: `Entry[]`

---

### POST `/api/crm/customer/{cid}/activity`

対応履歴を登録。`created_uid` はサーバー側でログインユーザーの UID を自動セット。

**リクエストボディ**:
```json
{
  "activity": {
    "activity_type": "call",
    "subject": "初回電話",
    "activity_date": "2025-05-27",
    "deal_uri": "/crm/deal/1748345678902"
  }
}
```

---

### PUT `/api/crm/customer/{cid}/activity/{aid}`

対応履歴を更新。

---

### DELETE `/api/crm/customer/{cid}/activity/{aid}`

対応履歴を論理削除。

---

## 商談 API

### GET `/api/crm/deal`

全商談一覧を取得（ページング付き）。

| パラメータ | 型 | 必須 | 説明 |
|---|---|:---:|---|
| `n` | number | | ページ番号（デフォルト: 1）、1ページ50件 |

**レスポンス**: `Entry[]`

---

### GET `/api/crm/deal/{did}`

商談詳細を取得。

---

### POST `/api/crm/deal`

商談を新規登録。

**リクエストボディ**:
```json
{
  "deal": {
    "name": "2025年度基幹システム刷新",
    "customer_uri": "/crm/customer/1748345678901",
    "stage": "lead",
    "amount": 5000000
  }
}
```

---

### PUT `/api/crm/deal/{did}`

商談情報を更新。

---

### DELETE `/api/crm/deal/{did}`

商談を論理削除。

---

## ユーザープロフィール API

### GET `/api/crm/user/me`

ログインユーザー自身のプロフィールとロール情報を取得。

**レスポンス**:
```json
{
  "userprofile": {
    "display_name": "山田太郎",
    "uid": "66004",
    "is_admin": false,
    "is_sales": true,
    "is_viewer": false,
    "email": "yamada@example.com"
  },
  "id": "/crm/user/66004,1",
  "link": [{ "___href": "/crm/user/66004", "___rel": "self" }]
}
```

> `uid`・`is_admin`・`is_sales`・`is_viewer`・`email` はサーバー側で付加する計算値（`email` は `/_user/{uid}` の `contributor[0].email`、ロールフラグは `isGroupMember` から取得）。PUT では送信しない。

---

### PUT `/api/crm/user/me`

ログインユーザーのプロフィールを保存（初回は作成、以降は更新）。

**リクエストボディ**:
```json
{ "userprofile": { "display_name": "山田太郎" } }
```

---

### GET `/api/crm/user`

全ユーザープロフィール一覧を取得（管理者向け）。

**レスポンス**: `Entry[]`

---

## グループ管理 API（管理者専用）

### GET `/api/admin/groups`

sales・viewer グループのメンバー UID 一覧を取得。

**レスポンス**: `Entry[]`（`groupmembers` エンティティ、1 UID = 1 エントリ）
```json
[
  { "groupmembers": { "group_name": "sales", "uid": "uid1" } },
  { "groupmembers": { "group_name": "sales", "uid": "uid2" } },
  { "groupmembers": { "group_name": "viewer", "uid": "uid3" } }
]
```

> グループメンバーが 0 人の場合は `null` を返す。`normalizeEntries()` で正規化して使用する。

---

### POST `/api/admin/groups`

ユーザーをグループに追加または削除する。

**リクエストボディ**:
```json
{
  "uid": "yamada",
  "group": "/_group/sales",
  "action": "add"
}
```

| フィールド | 値 |
|---|---|
| `uid` | 対象ユーザーの vte.cx UID |
| `group` | `/_group/sales` または `/_group/viewer` |
| `action` | `add`（追加）または `remove`（削除） |

---

## vte.cx SDK 関数とのマッピング

| HTTP | エンドポイント | SDK 関数 |
|---|---|---|
| GET 一覧 | `/crm/customer`, `/crm/deal` | `getPageWithPagination` |
| GET 詳細 | `/crm/customer/{cid}` など | `getEntry` |
| GET 子リスト | `/crm/customer/{cid}/contact` など | `getFeed` |
| POST/PUT/DELETE | すべての書き込み | `put` |
| グループ追加 | `admin/groups` (add) | `addGroupByAdmin` |
| グループ削除 | `admin/groups` (remove) | `leaveGroupByAdmin` |
| ロール確認 | `crm/user/me` | `isGroupMember` |

---

## レスポンス形式の注意事項

`vtecxnext.response(200, data)` はデータをそのままシリアライズする。

| データ型 | レスポンス形式 |
|---|---|
| `Entry[]`（配列） | JSON 配列として返る（`feed` ラッパーなし） |
| `Entry`（単一） | JSON オブジェクトとして返る（`feed` ラッパーなし） |
| `{ feed: { title: ... } }` | 明示的にラップした場合のみ feed 構造になる |

フロントエンドで `normalizeEntries(data)` を使うと、配列/単一オブジェクトどちらでも `Entry[]` に正規化できる。
