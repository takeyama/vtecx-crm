# CONTEXT.md — AI向けプロジェクトコンテキスト

このファイルはAI（Claude Code / Gemini等）がこのリポジトリを正確に理解するための「地図」です。
実装時は必ずここに記載されたパターン・制約を優先してください。

---

## プロジェクト概要

**vte.cx BaaS + Next.js App Router で構築した簡易CRM。**

- 顧客・顧客担当者・商談・対応履歴を管理
- 管理者 / 営業担当者 / 閲覧者 の3ロール
- バックエンドはすべて vte.cx が担当（DB・認証・ACL）
- Next.js は BFF（API Routes）＋ フロントエンドのみ

### 仕様ドキュメント

| 参照先 | 内容 |
|---|---|
| `README.md` | **vte.cx フレームワーク仕様**（SDK・ACL・スキーマ定義） |
| `doc/01_overview.md` | システム概要・技術スタック・ロール定義 |
| `doc/02_data_model.md` | エンティティ定義・フィールド一覧 |
| `doc/03_api.md` | API エンドポイント仕様 |
| `doc/04_screens.md` | 画面一覧・ナビゲーション |
| `doc/05_auth_flow.md` | 認証・権限フロー・コンポーネントパターン |

> vte.cx の SDK 使い方・ACL・スキーマ定義などフレームワーク仕様は **`README.md` を参照**すること。

---

## vte.cx SDK — 実装上の重要な癖

### ⚠️ レスポンス形式（最重要）

`vtecxnext.response(200, data)` はデータを**そのままシリアライズ**する。

```typescript
// Entry[] を渡すと → JSON配列がそのままレスポンスになる（feedラッパーなし）
return vtecxnext.response(200, entries ?? null)
// クライアントが受け取るのは: [ { id: "...", customer: {...} }, ... ]
// ❌NG: data?.feed?.entry でアクセスしてはいけない
// ✅OK: Array.isArray(data) ? data : [] で安全に配列化する
```

`{ feed: { title: ... } }` 形式で返したい場合のみ明示的にラップする：

```typescript
return vtecxnext.response(200, { feed: { title: uri } })
```

### データ取得メソッドの戻り値

| メソッド | 戻り値の型 | データなし時（204相当） |
|---|---|---|
| `getPageWithPagination(uri, n)` | `Entry[]` | `undefined` |
| `getFeed(uri)` | `Entry[]` | `null` / `undefined` |
| `getEntry(uri)` | `Entry`（単一オブジェクト） | `null` / `undefined` |

> **`getFeed` / `getPageWithPagination` は常に `Entry[]` を返す**（件数による型変化なし）。  
> `vtecxnext.response(200, null)` は 204 でなく **200 + null ボディ**を返すため、フロントで null チェックが必要。

### フロントエンドでのリスト正規化パターン

```typescript
// ✅ 正しいパターン（null / 非配列を安全に空配列へ）
const data = await browserutil.requestApi('GET', 'crm/customer', `n=${n}`)
return Array.isArray(data) ? data as CrmEntry[] : []

// ✅ filter もセットで
return (Array.isArray(data) ? data as CrmEntry[] : []).filter((e) => !e.customer?.is_deleted)

// ❌ ?? [] だけでは不十分（オブジェクト {} が来たとき filter でエラー）
return (data as CrmEntry[]) ?? []

// ❌ normalizeEntries は削除済み（crm.ts から除去）
const entries = normalizeEntries(data)
```

### entry.id の形式

`entry.id` は `{パス},{リビジョン}` 形式。**楽観的ロック用なのでそのままPUTに渡す。**

```typescript
// パス部分だけ取り出す場合
const path = entry.id?.split(',')[0]   // "/crm/customer/1748345678901"

// 更新時: idをそのまま渡すことで楽観的ロックが機能する
const updatedEntry = {
  id: existing?.id,       // ✅ "{path},{revision}" をそのまま渡す
  link: [...],
  customer: { ...newData },
  contributor: existing?.contributor,  // ✅ contributorを必ず引き継ぐ
}
await vtecxnext.put({ feed: { entry: [updatedEntry] } })
```

### 全APIルートで必須の先頭処理

```typescript
export const GET = async (req: NextRequest): Promise<Response> => {
  const vtecxnext = new VtecxNext(req)
  const check = vtecxnext.checkXRequestedWith()  // ✅ 必須（CSRF対策）
  if (check) return check
  // ...
}
```

### URI・ID の自動採番

```typescript
const id = String(Date.now()).padStart(13, '0')  // "1748345678901"
const uri = `/crm/customer/${id}`
```

### ⚠️ 動的子パスの事前登録（必須）

`/crm/customer/{cid}/contact/{ctid}` へ PUT するには、**親パス `/crm/customer/{cid}/contact` が vte.cx に登録済みでなければならない**。

```typescript
// ✅ 顧客作成時に子パスを同時登録する
await vtecxnext.put({ feed: { entry: [customerEntry] } })
await Promise.all([
  vtecxnext.put({ feed: { entry: [{ link: [{ ___rel: 'self', ___href: `${uri}/contact` }], contributor }] } }),
  vtecxnext.put({ feed: { entry: [{ link: [{ ___rel: 'self', ___href: `${uri}/activity` }], contributor }] } }),
])
```

既存データ等で登録漏れが起きた場合は **"Parent path is required"** エラーになる。  
その場合は親パスを登録してからリトライする：

```typescript
try {
  await vtecxnext.put({ feed: { entry: [entry] } })
} catch (e) {
  if (isVtecxNextError(e) && e.message.includes('Parent path is required')) {
    await vtecxnext.put({ feed: { entry: [{ link: [{ ___rel: 'self', ___href: parentPath }], contributor }] } })
    await vtecxnext.put({ feed: { entry: [entry] } })
  } else {
    throw e
  }
}
```

### 論理削除パターン

```typescript
// DELETE = is_deleted:true をセットするPUT
const existing = await vtecxnext.getEntry(uri)
await vtecxnext.put({ feed: { entry: [{
  id: existing?.id,
  link: [{ ___rel: 'self', ___href: uri }],
  customer: { ...(existing as any)?.customer, is_deleted: true },
  contributor: existing?.contributor,
}] } })
```

フロントエンドでは `is_deleted !== true` のエントリのみ表示する。

---

## フロントエンドの重要パターン

### ⚠️ 外側/内側コンポーネント分離（必須）

**メイン画面は必ずこの構造にする。** 守らないと非権限ユーザーが 403 でログイン画面に飛ばされる。

```typescript
// ✅ 正しいパターン
function PageContent() {
  useEffect(() => {
    fetchData()  // MainLayout が state==='ok' を確認後にマウントされる → 安全
  }, [])
  return <Box>...</Box>
}

export default function SomePage() {
  return (
    <MainLayout>      // 即レンダリング → useAuthGuard が即動く
      <PageContent /> // state==='ok' になって初めてマウント
    </MainLayout>
  )
}

// ❌ 危険なパターン（useEffect が useAuthGuard より先に走る）
export default function SomePage() {
  useEffect(() => { fetchData() }, [])  // ← MainLayoutより先に発火して403になる
  if (loading) return <Spinner />       // ← この間MainLayoutがマウントされない
  return <MainLayout>...</MainLayout>
}
```

**理由**: `browserutil.handleError` は 403 を受け取ると `location.href = '/login'` で強制遷移する。`useAuthGuard` がリダイレクト前にデータ API が呼ばれると 403 → ログイン遷移になる。

### AuthContext でログインユーザー情報を取得

```typescript
import { useAuthContext } from '@/contexts/AuthContext'

function SomeContent() {
  const { info } = useAuthContext()
  // info.uid, info.isAdmin, info.isSales, info.isViewer
  // info.display_name, info.email
}
```

`info` は `MainLayout` の `useAuthGuard` が取得済みの値（追加APIコールなし）。

### 管理者専用ページのパターン

```typescript
function AdminContent() {
  const router = useRouter()
  const { info } = useAuthContext()

  useEffect(() => {
    if (info && !info.isAdmin) router.replace('/')
  }, [info])
  // ...
}
```

### エラーハンドリング

```typescript
// 403 → /login へ強制遷移（セッション切れ扱い）
// その他 → error.message を返す
const { error } = browserutil.handleError(e)
setError(error.message)
```

---

## ファイル構成の早見表

```
src/
├── app/
│   ├── page.tsx                        ダッシュボード（DashboardPage + DashboardContent）
│   ├── (page)/
│   │   ├── customer/                   顧客一覧・詳細・登録・編集
│   │   ├── deal/                       商談一覧・詳細・登録・編集
│   │   ├── settings/                   ユーザー設定（プロフィール編集・ロール確認）
│   │   ├── admin/users/                ユーザー管理（管理者専用）
│   │   ├── setup/                      初回表示名設定（未設定ユーザー用）
│   │   └── pending/                    権限付与待ち（未割り当てユーザー用）
│   └── api/(vtecx)/
│       ├── crm/customer/[cid]/...      顧客 CRUD
│       ├── crm/deal/[did]/...          商談 CRUD
│       ├── crm/user/me/route.ts        自分のプロフィール+ロール取得・保存
│       ├── crm/user/route.ts           全ユーザー一覧（管理者向け）
│       └── admin/groups/route.ts       グループ管理（権限付与・剥奪）
├── components/
│   └── MainLayout.tsx                  サイドバーナビ + useAuthGuard + AuthContext提供
├── contexts/
│   └── AuthContext.tsx                 ログインユーザー情報のReact Context
├── hooks/
│   └── useAuthGuard.ts                 認証ガード（display_name・ロールチェック）
└── typings/
    └── crm.ts                          CRMエンティティ型・定数・ユーティリティ関数
```

---

## ACL 設定パターン

```typescript
// エントリ登録時の contributor（作成者のみ編集可・他は読み取り）
contributor: [
  { uri: 'urn:vte.cx:acl:/_group/$admin,CURD' },
  { uri: `urn:vte.cx:acl:${uid},CURD` },   // 作成者
  { uri: 'urn:vte.cx:acl:/_group/sales,RE' },
  { uri: 'urn:vte.cx:acl:/_group/viewer,RE' },
]

// 権限コード: C=作成, U=更新, R=参照, D=削除, E=API経由操作
// /_group/$admin = vte.cx 管理者グループ
// + = 認証済み全ユーザー
// * = 未認証も含む全ユーザー
```

---

## データ URI 設計

```
/crm/customer/{cid}                      顧客
/crm/customer/{cid}/contact/{ctid}       顧客担当者
/crm/customer/{cid}/activity/{aid}       対応履歴
/crm/deal/{did}                          商談（フラット、customer_uriで顧客参照）
/crm/user/{uid}                          ユーザープロフィール
```

**1ディレクトリ = 1エンティティ種別**（異なるエンティティを混在させると `getFeed` で全部返ってくる）。

---

## よくある実装ミス

| ミス | 正しい実装 |
|---|---|
| `normalizeEntries(data)` を使う | `normalizeEntries` は削除済み。`Array.isArray(data) ? data : []` を使う |
| `(data as CrmEntry[]) ?? []` でリスト取得 | `?? []` は `{}` 等のオブジェクトを通過させる。`Array.isArray` チェックが必要 |
| `data?.feed?.entry` でエントリにアクセス | API Route は feed ラッパーなしで直接配列を返す |
| 顧客作成後に子パス（`/contact`・`/activity`）を登録しない | 顧客 POST と同時に `Promise.all` で子パスを登録する |
| contact/activity を PUT して "Parent path is required" が出たまま | 親パスを PUT で登録してからリトライする |
| `fetchCustomers` を外側コンポーネントの `useEffect` に書く | 内側コンポーネントに移動する |
| 更新時に `contributor` を省略する | `existing?.contributor` を必ず引き継ぐ |
| `entry.id` から `,` 以降を含めたままパス操作する | `entry.id.split(',')[0]` でパス部分のみ取り出す |
| `entry.title` / `entry.rights` / `entry.summary` をカスタムデータフィールドに使う | `template.xml` でスキーマ定義した専用エンティティのフィールドに入れる |
| `rights: JSON.stringify({...})` で構造データを文字列として詰め込む | スキーマ定義したフィールドに直接セットする |
| API ルートでロールチェックを実装する | ACL（contributor / folderacls）に任せる |

### ⚠️ スキーマ定義の原則（必須）

**保存するデータだけでなく、レスポンスとして返すフィールドも `template.xml` で定義する。**

```typescript
// ❌ NG: Atom標準フィールドに JSON 文字列を詰め込む
return vtecxnext.response(200, { rights: JSON.stringify({ uid, isAdmin }) })

// ✅ OK: template.xml に userprofile.uid / userprofile.is_admin を定義済み
return vtecxnext.response(200, { userprofile: { uid, is_admin: isAdmin } })
```
