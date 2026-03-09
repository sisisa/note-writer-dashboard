"use server";

import { addIdea as dbAddIdea, toggleIdeaUsed as dbToggleIdeaUsed, getIdeas } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';

export async function addInsightAction(formData: FormData) {
  const content = formData.get('content') as string;
  if (!content || !content.trim()) return;
  
  // ユーザーの要望により、気づきはそのまま「アイデアストック」へ登録する
  await dbAddIdea(content, "");
  revalidatePath('/');
}

export async function toggleIdeaAction(id: number) {
  await dbToggleIdeaUsed(id);
  revalidatePath('/');
}

export async function updateIdeaAction(id: number, title: string, prompt: string, url: string, draftUrl: string) {
  const gasUrl = process.env.NEXT_PUBLIC_GAS_WEB_APP_URL;
  if (!gasUrl) return;

  try {
    const res = await fetch(gasUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_idea", id, title, prompt, url, draftUrl }),
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
      // ポートフォリオ用に汎用的なプロンプトに変更しています。
      // 実際には、別ファイルの指示書（instructions.md等）や環境変数から読み込む設計にするとさらに柔軟になります。
      const promptText = `
# Role & Persona
あなたは、技術や日々の学びを発信する読者想いのテック系ブロガーです。
専門用語をなるべく分かりやすく噛み砕き、読者の悩み（学習の壁や業務効率化など）に寄り添った、静かで丁寧な「ですます調」のトーンを維持してください。
感情的な表現や過激な言葉は避け、検証した独自の経験（一次情報）を基に論理的に記述してください。

# Input Data
- 【テーマ/アイデア】: ${idea.title}
- 【プロンプト/メモ】: ${idea.prompt}

# Step 1: タイトル設計
読者が「この記事を読めば、著者がどう検証し、どんな結果を得たのか」が一目で分かるタイトルを作成してください。煽りや誇張は一切不要ですが、検証の対象（具体的な技術やツール名など）は含めてください。

# Step 2: 記事設計の原則
1. 導入部（背景と課題）: なぜその検証を行おうと思ったのか、どのような課題があったのかを丁寧に説明し、記事を読む理由を提示する。
2. 検証のプロセス（思考の公開）: 単に結果を書くのではなく、「なぜその手段を選んだのか」というプログラミングやシステム保守の経験に基づく思考過程を書く。
3. 独自の経験・一次情報の統合: 独自のエピソードやデータを、論理的かつ説得力のある形で記述する。
4. 丁寧な言葉選び: 独自の造語や荒い言葉は使わず、読者が日常や学習に役立てられる形にする。
5. まとめと今後の課題: 検証の結果分かったことと、読者へ向けた提案（今日から試せることなど）で締めくくる。

# Step 3: 文体・フォーマット
- 一人称は「私」。静かで丁寧な「ですます調」。絵文字や太字（**）は過度に使用しない。
- 見出し（大見出し）は3〜5個作成し、必ず行の先頭に \`## \` を付けて出力する。
- 記事の本文は、見出し以外の箇所で適度に改行し、空白を設けて読みやすい構成を徹底する。

# Output Format（以下の定型で出力してください）

【生成タイトル】

【画像用短縮タイトル】（15文字以内）

【タグ】（#付き5個）

【記事本文】（約1500文字〜2000文字）
※「無料部」などの区切り文字は出力せず、見出し（##）を使って一続きの自然な記事として出力してください。
- 導入部（検証の背景と課題）
- ## （検証の内容と思考プロセス）
- ## （実際の手順や独自データ）
- ## （結果とまとめ・読者への提案）

【今後の検証課題】（今回の検証を通して残った疑問や、次に調べたいこと）

【SNS案】
- X（100字以内。検証の目的と結果の要約からnoteへ誘導）
- Threads（150字以内。日常の気づきや学習過程での壁から、今回の検証内容へ繋ぐ）
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
