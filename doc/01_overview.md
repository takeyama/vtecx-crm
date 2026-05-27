# 01. システム概要

## 目的

営業チームが顧客・商談・対応履歴を一元管理するための簡易CRMシステム。  
管理者・営業担当者・閲覧者の3ロールで利用する。

---

## 技術スタック

| 層 | 技術 |
|---|---|
| フロントエンド | Next.js 14 (App Router) + TypeScript |
| UI コンポーネント | Material UI (MUI) v5 |
| バックエンド | vte.cx BaaS (`@vtecx/vtecxnext`) |
| 認証 | vte.cx 組み込み認証 + WSSE |
| reCAPTCHA | next-recaptcha-v3 |
| 状態管理 | Jotai (useLoader) |

---

## プロジェクト構成

```
vtecxnextblank/
├── doc/                        ← 仕様ドキュメント（本ファイル群）
├── setup/
│   └── _settings/
│       ├── template.xml        ← vte.cx エンティティスキーマ定義
│       └── folderacls.json     ← データパス ACL 設定
└── src/
    ├── app/
    │   ├── page.tsx            ← ダッシュボード (/)
    │   ├── layout.tsx          ← ルートレイアウト
    │   ├── (page)/             ← ページコンポーネント群
    │   │   ├── customer/       ← 顧客関連画面
    │   │   ├── deal/           ← 商談関連画面
    │   │   ├── settings/       ← ユーザー設定画面
    │   │   ├── admin/users/    ← ユーザー管理画面（管理者用）
    │   │   ├── setup/          ← 初回表示名設定画面
    │   │   ├── pending/        ← 権限付与待ち画面
    │   │   └── login/          ← ログイン画面
    │   └── api/(vtecx)/        ← Next.js API Routes (BFF)
    │       ├── crm/customer/   ← 顧客 API
    │       ├── crm/deal/       ← 商談 API
    │       ├── crm/user/       ← ユーザープロフィール API
    │       └── admin/groups/   ← グループ管理 API
    ├── components/
    │   └── MainLayout.tsx      ← 共通ナビゲーションレイアウト（AuthContext プロバイダ）
    ├── contexts/
    │   └── AuthContext.tsx     ← ログインユーザー情報の React Context
    ├── hooks/
    │   └── useAuthGuard.ts     ← 認証・セットアップガード
    └── typings/
        └── crm.ts              ← CRM エンティティ型定義
```

---

## ロール定義

| ロール | vte.cx グループ | 権限概要 |
|---|---|---|
| 管理者 | `/_group/$admin` | 全データの作成・更新・参照・削除、ユーザー管理 |
| 営業担当者 | `/_group/sales` | 全データの参照、自分が担当の顧客・商談の作成・更新 |
| 閲覧者 | `/_group/viewer` | 全データの参照のみ |
| 未割り当て | （なし） | ログイン後に権限付与待ち画面に誘導 |

### 権限コード

| コード | 意味 |
|---|---|
| C | 作成（Create） |
| U | 更新（Update） |
| R | 参照（Read） |
| D | 削除（Delete） |
| E | API経由での操作（vtecxnext SDK 経由） |

---

## セットアップコマンド

```bash
# スキーマをvte.cxにアップロード
pnpm upload:template

# TypeScript型定義を自動生成してダウンロード
pnpm download:typings

# ACL設定をアップロード
pnpm upload:folderacls

# 開発サーバー起動
pnpm dev
```

> **注意**: `download:typings` を実行すると `src/typings/index.d.ts` が自動生成される。  
> 現在は手動で定義した `src/typings/crm.ts` を使用中。
