# note ダッシュボード

> 個人の技術ブログやアイデア出しを効率化する、AI自動執筆・Google Docs連携機能を持ったNext.js製ダッシュボード（ポートフォリオ作品）です。

## プロジェクトの概要

散在しがちな「日々の気づき」や「ブログ・note記事のアイデア」を一つの画面（ハブ）で一元管理し、Gemini APIを用いて下書きを自動生成。さらにGoogle Apps Script（GAS）と連携することで、生成した執筆データをGoogleドキュメントへ自動保存するシステムです。

- **アイデアの構造化と管理**: 気づきやアイデアを「テーマ」「詳細」「気付き」の3要素に分けてストックし、状態（使用済み・未使用）を管理。
- **記事画像テンプレート集**: 投稿時に多用するCanva画像テンプレート等へ即座にアクセスできるリンク集機能（環境変数での安全なURL管理）。
- **AI自動生成**: 登録した構造化データを元に、Gemini APIが細かなペルソナ（sisisa_lab等）に従って記事のドラフトを自動で記述。
- **Google Docs連携**: GASのWeb API（Webhook）機能を通して、生成されたマークダウンテキストをGoogleドキュメントとして直接書き出し。

---

## セットアップ手順（本番・ローカル共通）

このシステムはVercelの様なサーバーレス環境でも動作するように、**Google スプレッドシートをデータベースとして利用**します。

### 1. Google スプレッドシート（データベース）の準備
1. 新しいGoogleスプレッドシートを作成します。
2. 1行目のA列〜H列に以下のヘッダー（列名）を正確に入力します。
   - `id`, `title`, `prompt`, `isUsed`, `url`, `draftUrl`, `createdAt`, `updatedAt`
3. スプレッドシートのURLから「スプレッドシートID」をコピーします。
   - `https://docs.google.com/spreadsheets/d/【この部分の長い文字列】/edit`

### 2. Google Apps Script (GAS) API の構築
AI執筆とデータベース通信を担うバックエンドAPI（Webhook）を作成します。

1. スプレッドシートのメニューから「拡張機能」>「Apps Script」を選択します。
2. 開いたエディタに、`gas/CreateDoc.js` の中身をすべてコピーして貼り付けます。
3. コード上部にある `const SPREADSHEET_ID = '...';` の部分に、先ほどコピーしたスプレッドシートIDを貼り付けます。
4. 右上の「デプロイ」>「新しいデプロイ」を選択します。
5. 歯車アイコンから「ウェブアプリ」を選択します。
6. **実行するユーザー**: 「自分」
7. **アクセスできるユーザー**: 「全員」
8. 「デプロイ」ボタンを押して、表示された「ウェブアプリのURL」をコピーします。（※初回はGoogleのアクセス承認画面が出ますので、詳細設定から許可してください）

### 3. 環境変数の設定
`note-writer-dashboard` フォルダ内に `.env.local` という新規ファイルを作成し、以下の2行を書き込みます。
（Vercel等の外部サービスにデプロイする際も、この2つの環境変数をダッシュボード設定に入力してください）

```env
# Gemini APIキー（AI執筆に使用）
GEMINI_API_KEY=あなたのGemini_APIキーをここに入力

# GASのWebバックエンドURL（先ほどコピーしたURL）
NEXT_PUBLIC_GAS_WEB_APP_URL=https://script.google.com/macros/s/.../exec

# Canva画像テンプレートのURL（任意: NEXT_PUBLIC_プレフィックスが必要です）
NEXT_PUBLIC_CANVA_PATTERN1_URL=...
NEXT_PUBLIC_CANVA_PATTERN2_URL=...
NEXT_PUBLIC_CANVA_PATTERN3_URL=...
NEXT_PUBLIC_CANVA_PATTERN4_URL=...
NEXT_PUBLIC_CANVA_PATTERN5_URL=...
```

---

### 4. スプレッドシートの構造アップグレード
カテゴリ機能を使用するために、既存のGoogleスプレッドシートに1列追加する必要があります。

1. スプレッドシートを開きます。
2. **I列（9列目）** の1行目に `category` と入力します。
3. （推奨）既存のデータのI列に「AI系」や「日常系」と入力しておくと一覧で正しく分類されます。

※GAS側のスクリプト（`gas/CreateDoc.js`）は、列が増えても自動的に対応する設計になっていますが、もしエラーが出る場合はスプレッドシートのヘッダー名が正確か確認してください。

### 3. ダッシュボードの起動

WindowsのPowerShell等で以下のコマンドを実行します。

```bash
cd C:\Users\user\note_writer\note-writer-dashboard
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスするとダッシュボードが表示されます。

---

## デプロイ手順（Vercel対応）

本プロジェクトは Vercel にデプロイして外部公開することが可能です。

### 1. GitHubリポジトリの準備
1. この `note_writer` フォルダを、ご自身のGitHubリポジトリとしてプッシュします。（※ APIキー等が含まれる `.env.local` は必ず除外(`.gitignore`)されていることを確認してください）
   - Gitが未設定の場合は、VS Code等のGit機能から「Publish to GitHub」を選ぶだけで簡単に作成できます。

### 2. Vercelのセットアップ
1. [Vercel](https://vercel.com/) にアクセスし、GitHubアカウントでログイン（Sign Up / Log In）します。
2. ダッシュボード右上の「Add New...」>「Project」をクリックします。
3. 「Import Git Repository」の一覧から、先ほど作成した `note_writer` リポジトリの「Import」ボタンを押します。
4. **「Framework Preset」**: `Next.js` が自動選択されていることを確認します。
5. **「Root Directory」**: `Edit` ボタンを押し、`note-writer-dashboard` フォルダを選択して保存します。（※最上位ではなく、Next.jsのアプリが入っているこのディレクトリを指定します）
6. **「Environment Variables」**: ここにローカルの `.env.local` に書いてある内容を登録します。
   - `GEMINI_API_KEY` とその値
   - `NEXT_PUBLIC_GAS_WEB_APP_URL` とその値
7. **「Deploy」** ボタンをクリックします。

### 3. デプロイ完了
数分待つと「Congratulations!」と表示され、あなた専用のURL（例: `https://note-writer-xxx.vercel.app`）が発行されます。
このURLをスマホのブラウザでブックマークしたり、ホーム画面に追加したりして利用してください。
