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
| `all` | string | | `1` を指定すると全件取得（ページングなし）。商談フォームの顧客 Select 向け。 |
| `q` | string | | フリーワード（全文検索）。指定時は `status` は無効 |
| `status` | string | | ステータスで絞り込み（`customer.status-eq-`） |

**レスポンス**（ページングあり）:
```json
{
  "entries": [ { "id": "...", "customer": { ... } } ],
  "lastPageNumber": 5,
  "hasNext": false,
  "currentPage": 1
}
```

> `lastPageNumber` は `n=1` のときのみ返る（`n>1` のときは `0`）。クライアントは `n=1` のレスポンスで取得した値を保持し続ける。  
> `hasNext === true` のときは 50 ページ以上存在する（ページ範囲 `1,50` で作成したカーソルを超えるデータがある）。  
> `all=1` 指定時はページングなしで `Entry[]`（直接配列）を返す。

---

### GET `/api/crm/customer/{cid}`

顧客詳細を取得。

**レスポンス**: `Entry`（単一オブジェクト）

---

### POST `/api/crm/customer`

顧客を新規登録。登録と同時に子パス（`/contact`・`/activity`）を `Promise.all` で並行登録する。

**リクエストボディ**:
```json
{ "customer": { "name": "株式会社テスト", "status": "prospect" } }
```

**レスポンス**: `{ "feed": { "title": "/crm/customer/1748345678901" } }`

---

### POST `/api/crm/customer/bulk`

顧客を一括登録（1トランザクション）。全エントリ（顧客本体 + `/contact`・`/activity` 子パス）を1回の `put()` でまとめて登録する。CSV インポートで使用。

**リクエストボディ**:
```json
{ "customers": [ { "name": "株式会社A", "status": "prospect" }, ... ] }
```

**レスポンス**: `{ "feed": { "title": "100" } }`（登録件数）

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
親パス `/crm/customer/{cid}/contact` が未登録の場合（既存顧客等）、自動登録してからリトライする。

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

## 担当営業 API

### GET `/api/crm/customer/{cid}/member`

その顧客の担当営業一覧を取得。顧客エントリの `link` 配列から `rel="alternate"` のパスを抽出して返す。

**レスポンス**: `[{ "member": { "uid": "user123" } }, ...]`

---

### POST `/api/crm/customer/{cid}/member`

担当営業を追加。エイリアス親パス `/crm/member/{uid}` の登録と顧客エントリへの `rel="alternate"` 付与を**1トランザクション**で実行する。

**リクエストボディ**:
```json
{ "uid": "user123" }
```

---

### DELETE `/api/crm/customer/{cid}/member/{uid}`

顧客エントリの `link` 配列から該当の `alternate` リンクを除去して PUT する（物理的に除去）。

---

### GET `/api/crm/member/{uid}`

エイリアスパス経由で、指定ユーザーが担当する顧客一覧を取得。  
顧客エントリに `rel="alternate"` が付与されているため、`getFeed` で顧客エントリが直接返る（N+1 なし）。  
権限を持つ全ロール（admin / sales / viewer）が利用可能。  
フィルタ・ページングも通常どおり使用可能（インデックス設定が必要）。

| パラメータ | 型 | 説明 |
|---|---|---|
| `n` | number | ページ番号（デフォルト: 1） |
| `status` | string | ステータスフィルタ（`customer.status-eq-`）。インデックス要 |
| `q` | string | 顧客名フリーワード検索（`customer.name-ft-`）。インデックス要 |

**レスポンス**（ページングあり）:
```json
{
  "entries": [ { "id": "/crm/customer/{cid},1", "link": [...], "customer": { ... } } ],
  "lastPageNumber": 3,
  "hasNext": false,
  "currentPage": 1
}
```

> レスポンスは通常の顧客エントリと同じ形式。`n=1` のときのみ `lastPageNumber` が返る。

---

## 対応履歴 API

### GET `/api/crm/customer/{cid}/activity`

対応履歴一覧を取得（商談前も含む全件）。

**レスポンス**: `Entry[]`

---

### POST `/api/crm/customer/{cid}/activity`

対応履歴を登録。`created_uid` はサーバー側でログインユーザーの UID を自動セット。  
親パス `/crm/customer/{cid}/activity` が未登録の場合、自動登録してからリトライする。

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

商談一覧を取得。

| パラメータ | 型 | 必須 | 説明 |
|---|---|:---:|---|
| `n` | number | | ページ番号（デフォルト: 1）、1ページ50件。`customer` 未指定時のみ有効 |
| `customer` | string | | 顧客 cid を指定すると `customer_uri` でフィルタして全件返す（`getFeed` 使用）。顧客詳細の商談タブ向け。インデックス要 |
| `q` | string | | フリーワード（全文検索）。指定時は他フィルタは無効 |
| `stage` | string | | フェーズで絞り込み（`deal.stage-eq-`） |
| `date_from` | string | | クローズ予定日 From（`deal.expected_close_date-ge-`） |
| `date_to` | string | | クローズ予定日 To（`deal.expected_close_date-le-`） |

**レスポンス**（ページングあり）:
```json
{
  "entries": [ { "id": "...", "deal": { ... } } ],
  "lastPageNumber": 3,
  "hasNext": false,
  "currentPage": 1
}
```

> `customer=` 指定時はページングなしで `Entry[]`（直接配列）を返す。

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
保存時に `email`（ログインメールアドレス）も自動付加して永続化する。

**リクエストボディ**:
```json
{
  "userprofile": {
    "display_name": "山田太郎",
    "family_name": "山田",
    "given_name": "太郎",
    "family_name_kana": "ヤマダ",
    "given_name_kana": "タロウ",
    "department": "営業部",
    "title": "課長",
    "phone": "03-1234-5678",
    "mobile": "090-1234-5678",
    "email": "yamada@example.com"
  }
}
```

---

### GET `/api/crm/user`

全ユーザープロフィール一覧を取得（担当者選択 Select 向け）。  
各ユーザーの `email` は `/_user/{uid}` の `contributor[0].email` から `Promise.all` で並行取得して付加する。

**レスポンス**: `Entry[]`（`userprofile.email` 含む）

---

## インデックス再適用 API（管理者専用）

### POST `/api/admin/reindex`

インデックス設定前に登録された既存データに対してインデックスを再適用する。  
全エントリ（顧客・商談・ユーザー・担当者・対応履歴）を取得して PUT し直す。

**レスポンス**: `{ "feed": { "title": "再インデックス完了: N 件処理" } }`

> ユーザー管理画面の「インデックス再適用」ボタンから実行できる。

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

> グループメンバーが 0 人の場合は `null` を返す。フロントエンドでは `Array.isArray(data) ? data : []` で正規化する。

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
| GET 一覧 | `/crm/customer`, `/crm/deal`（ページング） | `getPageWithPagination` |
| GET 全件 | `/crm/customer?all=1`, `/crm/deal?customer=...` | `getFeed` |
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

フロントエンドでは `Array.isArray(data) ? data : []` で null・非配列を安全に処理する。
