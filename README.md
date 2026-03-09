# Note Writer Dashboard

> 個人の技術ブログやアイデア出しを効率化する、AI自動執筆・Google Docs連携機能を持ったNext.js製ダッシュボード（ポートフォリオ作品）です。

## プロジェクトの概要

散在しがちな「日々の気づき」や「ブログ・note記事のアイデア」を一つの画面（ハブ）で一元管理し、Gemini APIを用いて下書きを自動生成。さらにGoogle Apps Script（GAS）と連携することで、生成した執筆データをGoogleドキュメントへ自動保存するシステムです。

- **アイデア管理**: 気づきやアイデアをストックし、状態（使用済み・未使用）を管理。
- **AI自動生成**: 登録したアイデアを元に、Gemini APIが指定されたペルソナ（テックブロガー等）に従って記事のドラフトを自動で記述。
- **Google Docs連携**: GASのWeb API（Webhook）機能を通して、生成されたマークダウンテキストをGoogleドキュメントとして直接書き出し。

---

## セットアップ手順（ローカル開発・試験用）

このシステムはローカル環境（Next.js）で動作させることができます。以下の手順に従って環境変数を設定してください。

### 1. Google Apps Script (GAS) の設定
AIが自動執筆した記事をGoogleドキュメントに保存するエンドポイント（Webhook API）を作成します。

1. Google Driveを開き、「新規」>「その他」>「Google Apps Script」を選択します。
2. 開いたエディタに、`note_writer/gas/CreateDoc.js` の中身をコピーして貼り付け、保存します。
3. 右上の「デプロイ」>「新しいデプロイ」を選択します。
4. 歯車アイコンから「ウェブアプリ」を選択します。
5. **実行するユーザー**: 「自分」
6. **アクセスできるユーザー**: 「全員」
7. 「デプロイ」ボタンを押して、表示された「ウェブアプリのURL」をコピーします。（※初回はGoogleのアクセス承認画面が出ますので、詳細設定から許可してください）

### 2. 環境変数の設定
`note_writer/note-writer-dashboard` フォルダに `.env.local` という新しいファイルを作成し、以下の2行を書き込みます。

```env
# Gemini APIキー（AI執筆に使用）
GEMINI_API_KEY=あなたのGemini_APIキーをここに入力

# GASのWebバックエンドURL（先ほどコピーしたURL）
NEXT_PUBLIC_GAS_WEB_APP_URL=https://script.google.com/macros/s/.../exec
```

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
