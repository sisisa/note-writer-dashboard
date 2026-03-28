"use server";

import { addIdea as dbAddIdea, toggleIdeaUsed as dbToggleIdeaUsed, getIdeas } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';

export async function addInsightAction(formData: FormData) {
  const title = formData.get('title') as string;
  const detail = formData.get('detail') as string;
  const insight = formData.get('insight') as string;
  const category = formData.get('category') as string || "未分類";

  if (!title || !title.trim() || !insight || !insight.trim()) return;

  const promptData = JSON.stringify({ detail: detail.trim(), insight: insight.trim() });

  await dbAddIdea(title, promptData, category);
  revalidatePath('/');
}

export async function toggleIdeaAction(id: number) {
  await dbToggleIdeaUsed(id);
  revalidatePath('/');
}

export async function updateIdeaAction(id: number, title: string, detail: string, insight: string, category: string, url: string, draftUrl: string) {
  const gasUrl = process.env.NEXT_PUBLIC_GAS_WEB_APP_URL;
  if (!gasUrl) return;

  const prompt = JSON.stringify({ detail, insight });

  try {
    const res = await fetch(gasUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_idea", id, title, prompt, category, url, draftUrl }),
      cache: 'no-store'
    });
    const json = await res.json();
    if (!json.success) {
      console.error('GAS POST (update) Error:', json.error);
    }
  } catch (err) {
    console.error('Error updating idea in GAS:', err);
  }
  revalidatePath('/');
}

// 記事自動生成 & Google Docs連携用アクション
export async function generateAndDraftArticleAction(ideaId: number) {
  const ideas = await getIdeas();
  const idea = ideas.find(i => i.id === ideaId);
  if (!idea) return { success: false, message: "Idea not found" };

  try {
    // 命令プロンプトを読み込む
    const instructionsPath = path.join(process.cwd(), '.agent/instructions.md');
    let systemPrompt = "あなたはプロのライターです。";
    if (fs.existsSync(instructionsPath)) {
      systemPrompt = await fs.promises.readFile(instructionsPath, 'utf8');
    }

    // 環境変数からAPIキーを取得
    const geminiKey = process.env.GEMINI_API_KEY;
    const gasUrl = process.env.NEXT_PUBLIC_GAS_WEB_APP_URL;

    let articleContent = `(AIによる生成が失敗または未設定です。設定を追加して実行してください)\n\nテーマ: ${idea.title}\nプロンプト: ${idea.prompt}`;

    // 2. LLMで記事を生成 (Gemini APIを想定)
    if (geminiKey) {
      let detail = "";
      let insight = "";
      try {
        const parsed = JSON.parse(idea.prompt);
        detail = parsed.detail || "";
        insight = parsed.insight || "";
      } catch {
        insight = idea.prompt || "";
      }

      // ポートフォリオ用に汎用的なプロンプトに変更しています。
      // 実際には、別ファイルの指示書（instructions.md等）や環境変数から読み込む設計にするとさらに柔軟になります。
      const promptText = `        
        # Input Data
        - 【カテゴリ】: ${idea.category || "未分類"}
        - 【テーマ】: ${idea.title}
        - 【詳細・背景】: ${detail || "特になし"}
        - 【気付き・考察事項】: ${insight}

        【役割】
        あなたはプロのnoteライターです。
        読者の思考を整理するような、
        静かで論理的な記事を書くことを目的とします。

        文章生成ではなく
        「書き手の思考プロセスを言語化すること」
        を最優先にしてください。

        【書き手の人物設定】
        あなたは次の人物の文章を代筆します。
        ・20代
        ・Webエンジニア経験あり
        ・現在は新しい企業に所属しながらAI活用を研究
        ・AIを「思考を拡張する外付けの脳」として使っている
        特徴
        ・静かで論理的
        ・精神論や過度な励ましを好まない
        ・迷いや試行錯誤を隠さない
        文章スタンス

        AIを使うこと自体が目的ではない。
        「考えるためにAIを使う」

        という視点を重視する。

        【記事の対象読者】
        次のような読者に向けて書く。

        ・20代エンジニア
        ・AIを使いたいが使いこなせていない人
        ・思考整理や学習効率に悩んでいる人
        記事の目的は

        「AIツール紹介」ではなく

        「AIを使った思考プロセス」

        を伝えること。

        【記事構造】

        記事は次の流れで構成する。

        導入

        ↓

        問題提起

        ↓

        仮説

        ↓

        調査

        ↓

        気づき

        ↓

        具体例

        ↓

        行動提案（CTA）

        【体験ベースのルール】

        AIツールを紹介する場合は

        必ず次を含める。

        ・使った場面
        ・驚いた点
        ・迷った点
        単なる機能紹介は禁止。

        【文体ルール】

        ・一人称は「私」
        ・ですます調
        ・静かで論理的なトーン
        以下を文章に自然に含める

        ・迷い
        ・気づき
        ・小さな発見
        重要

        読者に対して断定的な教え方は避ける。

        「私はこう考えている」

        という形で語る。

        【読みやすさのルール】
        ・句点（。）の後は必ず改行
        ・スマホで読みやすい段落構成にする
        Googleドキュメント / note貼り付け対策

        ・句点の後は2回改行
        ・見出しの前後は1行空ける
        【見出しルール】

        H2
        記事の大きな区切り（3〜5個）
        H3
        具体例や手順

        条件
        ・誇張しない
        ・静かなタイトル
        ・SEOを意識

        【Googleドキュメント改善ルール】

        下書きを受け取った場合

        まず文章の意図を分析する。

        次の3点を整理する。
        ・文章の主張
        ・読者の悩み
        ・書き手の核心メッセージ

        その後「意図確認メモ」を作成する。

        例

        この文章は

        AIを思考整理ツールとして使う価値

        を伝える記事だと理解しました。

        主張

        AIは検索ツールではなく思考ツール

        読者の悩み

        AIを使っても思考が深まらない

        核心

        AIとの対話で思考を整理する方法

        もしズレていれば修正してください。

        確認後

        改善を行う。

        改善の優先順位

        1 構造
        2 読みやすさ
        3 説得力
        4 具体性

        元の主張は絶対に変更しない。

        【ファクトチェック】

        次を確認する
        ・AIツール名
        ・機能
        ・存在しない機能

        不確実な場合は
        「検証中」
        と記載する。
        【出力形式】
        【生成タイトル】
        【画像用短縮タイトル】
        15文字以内
        【タグ】
        SEOタグ5個（#付き）
        【本文】
        【検証事項】：記事の精度を高めるために必要な追加情報
        【SNS案】
        X（100文字）
        Threads（150文字）
      `;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{
            parts: [{
              text: promptText
            }]
          }]
        })
      });
      const aiData = await response.json();
      if (aiData.candidates && aiData.candidates.length > 0 && aiData.candidates[0].content?.parts?.length > 0) {
        articleContent = aiData.candidates[0].content.parts[0].text;
      } else {
        console.error("Gemini API Error Response:", aiData);
        articleContent = `※AI記事の生成に失敗しました。\n\nGemini API Response: ${JSON.stringify(aiData)}\n\n---\nアイデア: ${idea.title}`;
      }
    }

    // 3. GAS経由でGoogle Docsに保存
    if (!gasUrl) {
      return { success: false, message: "GAS_WEB_APP_URLが設定されていません。記事は生成されましたが保存されませんでした。" };
    }

    const gasRes = await fetch(gasUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_doc",
        id: idea.id, // GAS側でdraftUrlもスプレッドシートに保存させるためIDを渡す
        title: idea.title,
        content: articleContent
      }),
      // Next.jsキャッシュ無効化
      cache: 'no-store'
    });

    const gasText = await gasRes.text();
    let gasData;
    try {
      gasData = JSON.parse(gasText);
    } catch {
      console.error("GAS Error Response HTML:", gasText.substring(0, 500));
      return {
        success: false,
        message: "GASからHTMLが返されました。GASのデプロイ設定で「アクセスできるユーザー」が「全員」になっていないか、またはURLが誤っている可能性があります。再デプロイして確認してください。"
      };
    }

    // 生成・更新成功時にキャッシュを破棄し、画面に反映させる
    revalidatePath('/');

    return { success: true, url: gasData.url };

  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: errorMessage };
  }
}
