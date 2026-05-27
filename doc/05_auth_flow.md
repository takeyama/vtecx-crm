# 05. 認証・権限フロー

## ログインから利用開始までのフロー

```
[ログイン画面 /login]
        │ WSSE認証 + reCAPTCHA
        ▼
[ダッシュボード /]
        │ MainLayout が useAuthGuard を実行
        │ → GET /api/crm/user/me
        │
        ├─ display_name 未設定
        │       ↓
        │   [初回セットアップ /setup]
        │       │ 表示名を入力・保存
        │       │ → PUT /api/crm/user/me
        │       │
        │       ├─ 権限あり → / (ダッシュボード)
        │       └─ 権限なし → /pending
        │
        ├─ display_name 設定済み・権限なし
        │       ↓
        │   [権限付与待ち /pending]
        │       │ 10秒ごとに GET /api/crm/user/me をポーリング
        │       └─ 権限が付与されたら → / (ダッシュボード)
        │
        └─ display_name 設定済み・権限あり
                ↓
            [通常のアプリ利用]
```

---

## useAuthGuard フック

`src/hooks/useAuthGuard.ts`

すべてのメイン画面を包む `MainLayout` に組み込まれており、ページ遷移のたびにチェックが実行される。

```typescript
const { state, info } = useAuthGuard()
// state: 'checking' | 'ok' | 'redirecting'
```

| state | 意味 |
|---|---|
| `checking` | API呼び出し中（スピナー表示） |
| `ok` | 通過、コンテンツを表示 |
| `redirecting` | /setup または /pending へリダイレクト中 |

`MainLayout` は `state !== 'ok'` の間は children を**描画しない**。  
これにより、children 内のデータ取得 `useEffect` も発火しない。

---

## ページコンポーネントの構造パターン（重要）

### 問題: useEffect とガードのレースコンディション

`browserutil.handleError` は **403 を受け取るとログイン画面へ強制遷移する**。  
権限のないユーザーがメイン画面にアクセスすると、`useAuthGuard` がリダイレクトする前に  
データ取得の `useEffect` が発火して 403 → ログイン遷移が起きる恐れがある。

```
// 問題のあったパターン（修正前）
export default function SomePage() {
  useEffect(() => {
    fetchData()   // ← SomePage マウント時に即発火
                  //   useAuthGuard より先に 403 が返ると /login へ飛ばされる
  }, [])

  if (loading) return <Spinner />  // MainLayout がレンダリングされない期間がある

  return (
    <MainLayout>   // ← useAuthGuard はここで初めて動く
      ...
    </MainLayout>
  )
}
```

### 解決: 外側/内側コンポーネント分離

データ取得ロジックを `MainLayout` の**子コンポーネント**に移動する。  
`MainLayout` が `state !== 'ok'` の間は children を描画しないため、  
子の `useEffect` も発火せず、レースコンディションが発生しない。

```typescript
// すべてのメイン画面で採用しているパターン（修正後）

function PageContent() {
  useEffect(() => {
    fetchData()   // MainLayout が state === 'ok' にしてから
                  // このコンポーネントをマウントするため安全
  }, [])
  return <Box>...</Box>
}

export default function SomePage() {
  return (
    <MainLayout>      // 常に即座にレンダリング → useAuthGuard が即座に動く
      <PageContent /> // state === 'ok' になって初めてマウントされる
    </MainLayout>
  )
}
```

**このパターンを適用しているファイル:**

| ファイル | 外側コンポーネント | 内側コンポーネント |
|---|---|---|
| `src/app/page.tsx` | `DashboardPage` | `DashboardContent` |
| `src/app/(page)/customer/index.tsx` | `CustomerListPage` | `CustomerListContent` |
| `src/app/(page)/deal/index.tsx` | `DealListPage` | `DealListContent` |
| `src/app/(page)/settings/index.tsx` | `SettingsPage` | `SettingsContent` |
| `src/app/(page)/admin/users/index.tsx` | `AdminUsersPage` | `AdminUsersContent` |

> **新しいメイン画面を追加する際も同じパターンに従うこと。**

---

## AuthContext によるログインユーザー情報の共有

`MainLayout` は `useAuthGuard` で取得した `info`（ログインユーザーのプロフィール・ロール）を  
`AuthContext` 経由で子コンポーネントへ提供する。

```
MainLayout
  └── AuthProvider value={{ info }}
        └── 子コンポーネント（例: AdminUsersContent）
              └── const { info } = useAuthContext()
```

`src/contexts/AuthContext.tsx` が提供するもの:

| エクスポート | 用途 |
|---|---|
| `AuthProvider` | `MainLayout` が children をラップするために使用 |
| `useAuthContext()` | 子コンポーネントが `info` を取得するために使用 |

### 管理者専用画面の保護

`/admin/users` は二重にアクセスを制限している:

1. **サイドバー非表示**: `info.isAdmin` が false の場合、「ユーザー管理」リンクをサイドバーに表示しない
2. **コンポーネントレベルのリダイレクト**: `AdminUsersContent` が `useAuthContext()` で `info.isAdmin` を確認し、false なら `/` へリダイレクト

```typescript
// AdminUsersContent 内
const { info } = useAuthContext()
useEffect(() => {
  if (info && !info.isAdmin) {
    router.replace('/')
  }
}, [info])
```

> URL を直接入力してアクセスしても `/` へ戻される。

---

## vte.cx 認証の仕組み

```
クライアント
  └─ browserutil.requestApi('GET', 'crm/user/me', '')
       └─ fetch('/api/crm/user/me', { headers: { 'X-Requested-With': 'XMLHttpRequest' } })

サーバー（Next.js Route Handler）
  └─ new VtecxNext(req)
       └─ vtecxnext.checkXRequestedWith()  // CSRF対策
           └─ vtecxnext.uid()              // セッションからUID取得
```

- セッションは vte.cx が管理（Cookie ベース）
- `X-Requested-With: XMLHttpRequest` ヘッダーが必須（CSRF 対策）
- 未認証の場合 `vtecxnext.uid()` が 401 を返す

---

## グループ管理

### 管理者によるロール付与

```
管理者 → /admin/users 画面
  └─ POST /api/admin/groups
       body: { uid: "yamada", group: "/_group/sales", action: "add" }
         └─ vtecxnext.addGroupByAdmin(["yamada"], "/_group/sales")
```

### ロール確認

```
GET /api/crm/user/me
  └─ Promise.all([
       vtecxnext.isGroupMember('/_group/$admin'),
       vtecxnext.isGroupMember('/_group/sales'),
       vtecxnext.isGroupMember('/_group/viewer'),
     ])
     → rights: { uid, isAdmin, isSales, isViewer }
```

---

## /setup・/pending 画面のガード外し

`/setup` と `/pending` は `MainLayout` を使わないため、`useAuthGuard` が動作しない。  
これによりリダイレクトループを防いでいる。

各ページ内で独自の「既に完了している場合のリダイレクト」を実装している：

```
/setup   → 表示名が既にある場合は / または /pending へ
/pending → 既に権限がある場合は / へ
```

---

## 権限チェックのタイミング

| タイミング | チェック場所 | 内容 |
|---|---|---|
| ページ遷移時 | `useAuthGuard`（MainLayout内） | display_name・ロールの存在確認 |
| API 呼び出し時 | vte.cx サーバー側 | ACL による自動チェック |

> フロントエンドの権限チェックはUX目的（適切な画面へ誘導）。  
> 実際のデータアクセス制御は vte.cx の ACL が担保する。

---

## エラーハンドリング

`browserutil.handleError(e)` がすべての API エラーを統一的に処理する。

| ステータス | 動作 |
|---|---|
| 403 Forbidden | **ログイン画面へ強制遷移**（`location.href = '/login'`） |
| 401 Unauthorized | 「ログインに失敗しました」メッセージを返す |
| 409 Conflict | 「更新競合が発生しています」メッセージを返す |
| 204 No Content | 「対象データが存在しません」メッセージを返す |
| その他 | エラーメッセージをそのまま返す |

> 403 はセッション切れとして扱われる。権限不足（ACL違反）も 403 で返るため、  
> **権限のないユーザーがデータ API を呼ぶ前に必ず useAuthGuard が先行して /pending へ誘導する**  
> コンポーネント構造（外側/内側パターン）が必須となる。
