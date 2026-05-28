# 02. データモデル

## エンティティ一覧

| エンティティ | 識別子 | URI パターン | 概要 |
|---|---|---|---|
| 顧客 | `customer` | `/crm/customer/{cid}` | 取引先企業・個人顧客 |
| 顧客担当者 | `contact` | `/crm/customer/{cid}/contact/{ctid}` | 顧客側の担当者（人物） |
| 商談 | `deal` | `/crm/deal/{did}` | 顧客との商談・案件 |
| 対応履歴 | `activity` | `/crm/customer/{cid}/activity/{aid}` | 顧客への対応記録 |
| ユーザープロフィール | `userprofile` | `/crm/user/{uid}` | CRM利用者のプロフィール・ロール情報 |
| グループメンバー | `groupmembers` | —（API レスポンスのみ） | ロール別UID一覧（管理画面向け集計） |

---

## URI 階層構造

```
/crm/customer/{cid}                         ← 顧客
/crm/customer/{cid}/contact/{ctid}          ← 顧客担当者（顧客に属する）
/crm/customer/{cid}/activity/{aid}          ← 対応履歴（顧客直下、deal_uri で商談に紐付け可）
/crm/deal/{did}                             ← 商談（フラット構造、customer_uri で顧客参照）
/crm/user/{uid}                             ← ユーザープロフィール
```

---

## エンティティ間の関連

```
customer (1) ──< contact  (N)    ← URI パス階層
customer (1) ──< activity (N)    ← URI パス階層
customer (1) ──< deal     (N)    ← deal.customer_uri フィールドで参照
deal     (1) ──< activity (N)    ← activity.deal_uri フィールドで参照（任意）
deal/activity ──> contact        ← contact_uri フィールドで参照（任意）
```

---

## フィールド定義

### customer（顧客）

| フィールド | 型 | 必須 | 最大 | 説明 |
|---|---|:---:|---:|---|
| `name` | string | ✓ | 255 | 顧客名（会社名） |
| `name_kana` | string | | 255 | 顧客名カナ |
| `industry` | string | | 100 | 業種 |
| `company_size` | string | | 50 | 企業規模（`large` / `medium` / `small` / `startup`） |
| `phone` | string | | 20 | 代表電話番号 |
| `fax` | string | | 20 | FAX番号 |
| `postal_code` | string | | 10 | 郵便番号 |
| `address` | string | | 500 | 住所 |
| `website` | string | | 500 | WebサイトURL |
| `status` | string | ✓ | 50 | ステータス（下記参照） |
| `source` | string | | 100 | 獲得経路（`web` / `referral` / `exhibition` / `cold` 等） |
| `annual_revenue` | long | | — | 年間売上（円） |
| `assigned_uid` | string | | 255 | 担当営業の vte.cx UID |
| `memo` | string | | 2000 | メモ・備考 |
| `is_deleted` | boolean | | — | 論理削除フラグ |

**status の選択肢**

| 値 | 表示名 |
|---|---|
| `prospect` | 見込み |
| `active` | 取引中 |
| `dormant` | 休眠 |
| `lost` | 失注 |

---

### contact（顧客担当者）

| フィールド | 型 | 必須 | 最大 | 説明 |
|---|---|:---:|---:|---|
| `family_name` | string | ✓ | 100 | 姓 |
| `given_name` | string | ✓ | 100 | 名 |
| `family_name_kana` | string | | 100 | 姓カナ |
| `given_name_kana` | string | | 100 | 名カナ |
| `department` | string | | 200 | 部署 |
| `title` | string | | 100 | 役職 |
| `email` | string | | 255 | メールアドレス |
| `phone` | string | | 20 | 電話番号（直通） |
| `mobile` | string | | 20 | 携帯番号 |
| `is_primary` | boolean | | — | メイン担当者フラグ |
| `memo` | string | | 2000 | メモ |
| `is_deleted` | boolean | | — | 論理削除フラグ |

---

### deal（商談）

| フィールド | 型 | 必須 | 最大 | 説明 |
|---|---|:---:|---:|---|
| `name` | string | ✓ | 255 | 商談名 |
| `customer_uri` | string | ✓ | 500 | 顧客URI（`/crm/customer/{cid}`） |
| `amount` | long | | — | 商談金額（円） |
| `probability` | int | | 100 | 受注確度（%） |
| `stage` | string | ✓ | 50 | 商談フェーズ（下記参照） |
| `expected_close_date` | date | | — | 予定クローズ日 |
| `actual_close_date` | date | | — | 実際のクローズ日 |
| `contact_uri` | string | | 500 | 主要コンタクト先URI |
| `assigned_uid` | string | | 255 | 担当営業の vte.cx UID |
| `memo` | string | | 2000 | メモ・備考 |
| `is_deleted` | boolean | | — | 論理削除フラグ |

**stage の選択肢**

| 値 | 表示名 |
|---|---|
| `lead` | リード |
| `qualified` | 商談化 |
| `proposal` | 提案中 |
| `negotiation` | 交渉中 |
| `closed_won` | 受注 |
| `closed_lost` | 失注 |

---

### activity（対応履歴）

| フィールド | 型 | 必須 | 最大 | 説明 |
|---|---|:---:|---:|---|
| `activity_type` | string | ✓ | 50 | 種別（下記参照） |
| `subject` | string | ✓ | 255 | 件名 |
| `activity_date` | date | ✓ | — | 実施日 |
| `deal_uri` | string | | 500 | 関連商談URI（空の場合は商談前の対応） |
| `description` | string | | 2000 | 内容詳細 |
| `outcome` | string | | 500 | 結果・成果 |
| `next_action` | string | | 500 | 次のアクション |
| `contact_uri` | string | | 500 | 対応した顧客担当者URI |
| `created_uid` | string | | 255 | 記録者の vte.cx UID（登録時に自動セット） |
| `is_deleted` | boolean | | — | 論理削除フラグ |

**activity_type の選択肢**

| 値 | 表示名 |
|---|---|
| `call` | 電話 |
| `email` | メール |
| `meeting` | 商談・訪問 |
| `demo` | デモ |
| `proposal` | 提案 |
| `other` | その他 |

---

### userprofile（ユーザープロフィール）

| フィールド | 型 | 必須 | 最大 | 説明 | 保存 |
|---|---|:---:|---:|---|:---:|
| `display_name` | string | ✓ | 100 | 表示名（顧客詳細・商談画面に表示） | ✓ |
| `uid` | string | | 255 | vte.cx UID（GETレスポンス時にセット） | — |
| `is_admin` | boolean | | — | 管理者ロールフラグ（GETレスポンス時にセット） | — |
| `is_sales` | boolean | | — | 営業担当者ロールフラグ（GETレスポンス時にセット） | — |
| `is_viewer` | boolean | | — | 閲覧者ロールフラグ（GETレスポンス時にセット） | — |
| `email` | string | | 255 | ログインメールアドレス（`/_user/{uid}` の `contributor[0].email` から取得） | — |

> **保存欄が — のフィールド**は `/api/crm/user/me` の GET レスポンス時にサーバーサイドで付加される計算値。  
> `/crm/user/{uid}` には保存されない。PUT 時は `display_name` のみ送信する。

---

### groupmembers（グループメンバー）

| フィールド | 型 | 必須 | 最大 | 説明 |
|---|---|:---:|---:|---|
| `group_name` | string | ✓ | 100 | グループ名（`sales` / `viewer`） |
| `uid` | string | ✓ | 255 | メンバーの vte.cx UID |

> `GET /api/admin/groups` のレスポンス専用エンティティ。`/_group/sales`・`/_group/viewer` のメンバーを集計した結果をエントリ配列として返す。データの永続化には使用しない。

---

## ID 生成方針

```typescript
const id = String(Date.now()).padStart(13, '0')
// 例: "1748345678901"
```

エポックミリ秒を13桁にゼロパディングして使用。  
URI: `/crm/customer/1748345678901` のような形式になる。

---

## 論理削除の方針

削除は物理削除ではなく `is_deleted: true` をセットするPUTで実現する。

```typescript
// 論理削除の実装例
const entry = {
  id: existing.id,       // 楽観的ロック用（{path},{revision} 形式）
  link: [{ ___rel: 'self', ___href: uri }],
  customer: { ...existing.customer, is_deleted: true },
  contributor: existing.contributor,
}
await vtecxnext.put({ feed: { entry: [entry] } })
```

一覧取得時はクライアント側で `is_deleted !== true` のエントリのみ表示する。

---

## 楽観的ロックの方針

更新時は `entry.id`（`{path},{revision}` 形式）を PUT リクエストに含める。  
フロントエンドは詳細取得時に `entry.id` を保持し、更新リクエストに含める。

---

## ACL 設定（folderacls.json）

| パス | 管理者 | 営業担当者 | 閲覧者 | 認証済み全員 |
|---|---|---|---|---|
| `/crm` | CURD | CURDE | RE | — |
| `/crm/customer` | CURD | CURDE | RE | — |
| `/crm/deal` | CURD | CURDE | RE | — |
| `/crm/user` | CURD | — | — | CURDE |
| `/_group/sales` | CURD | — | — | CURDE |
| `/_group/viewer` | CURD | — | — | CURDE |

> `/crm/customer` 以下（contact, activity）は親パス `/crm/customer` の ACL を継承する。

### エントリレベル contributor（登録時に設定）

顧客・商談の登録時に以下の contributor を付与する：

```json
[
  { "uri": "urn:vte.cx:acl:/_group/$admin,CURD" },
  { "uri": "urn:vte.cx:acl:{作成者UID},CURD" },
  { "uri": "urn:vte.cx:acl:/_group/sales,RE" },
  { "uri": "urn:vte.cx:acl:/_group/viewer,RE" }
]
```

作成者のみが更新・削除でき、他の営業担当者は参照のみ可能。  
担当者変更時は `assigned_uid` と contributor を同時に更新する。
