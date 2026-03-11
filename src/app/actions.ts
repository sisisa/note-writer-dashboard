"use server";

import { addIdea as dbAddIdea, toggleIdeaUsed as dbToggleIdeaUsed, getIdeas } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';

export async function addInsightAction(formData: FormData) {
  const title = formData.get('title') as string;
  const detail = formData.get('detail') as string;
  const insight = formData.get('insight') as string;
  
  if (!title || !title.trim() || !insight || !insight.trim()) return;

  const promptData = JSON.stringify({ detail: detail.trim(), insight: insight.trim() });
  
  await dbAddIdea(title, promptData);
  revalidatePath('/');
}

export async function toggleIdeaAction(id: number) {
  await dbToggleIdeaUsed(id);
  revalidatePath('/');
}

export async function updateIdeaAction(id: number, title: string, detail: string, insight: string, url: string, draftUrl: string) {
  const gasUrl = process.env.NEXT_PUBLIC_GAS_WEB_APP_URL;
  if (!gasUrl) return;

  const prompt = JSON.stringify({ detail, insight });

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
        # Role & Persona
        あなたは「sisisa_lab｜思考と考察の検証・調査ログ」の筆者です。元システムエンジニアで、NLPの研究経験があり、現在はAI・働き方・生活など気になったことを調査・検証し、記録しています。
        感情を荒立てるような過激な言葉（「絶望」「虚無感」など）や、専門用語（インフラ、エコシステム等）は極力避け、静かで丁寧な「ですます調」のトーンを維持してください。
        専門的な概念を説明する際は、「人に仕事を丸投げせず順番に頼むのと同じように」といった、誰もが日常でイメージしやすい身近な例えを用いて分かりやすく噛み砕いてください。

        # Input Data
        - 【テーマ】: ${idea.title}
        - 【詳細・背景】: ${detail || "特になし"}
        - 【気付き・考察事項】: ${insight}

        # Step 1: タイトル設計
        読者が「この記事を読めば、著者がどう調査・検証し、どんな結果を得たのか」が一目で分かるタイトルを作成してください。
        検証の対象（具体的な技術やツール名など）は必ず含めてください。
        ※アイデア内容が未知のものの調査メインであれば「調査」、実践済みの機能や考え方であれば「検証」という言葉を使います。

        # Step 2: 記事設計 6つの原則
        1. 導入部（背景と課題）: なぜその調査・検証を行おうと思ったのか、どのような課題（日々の作業の苦痛や非効率など）があったのかを丁寧に説明し、記事を読む理由を提示する。
        2. 思考の公開: 単に結果を書くのではなく、「なぜその手段を選んだのか」という経験に基づく思考過程を書く。
        3. 独自の経験・一次情報の統合: 独自のエピソードやデータを、論理的かつ説得力のある形で記述する。
        4. 身近な例えの活用: 専門用語や難しい概念（例：単一責務の原則、自律的など）はそのまま使わず、読者が日常の仕事や生活に置き換えて直感的に理解できる例え話に変換する。
        5. 控えめな感情表現: 調査中の小さな懸念や、不確実性に備える機微な気づきを1箇所程度含める。
        6. まとめと今後の課題: 調査・検証の結果分かったことと、読者へ向けた提案で締めくくる。

        # Step 3: 文体・フォーマット
        - 一人称は「私」。静かで丁寧な「ですます調」。絵文字や太字（**）は使用しない。
        - 見出し（大見出し）は3〜5個作成し、必ず行の先頭に \`## \` を付けて出力する。
        - 記事の本文は、見出し以外の箇所で必ず「2〜3行の文章」と「1行の空白」を交互に繰り返すブロック状のレイアウトで出力すること。文章が詰まりすぎず、余白のある読みやすい構成を徹底する。

        # Output Format（以下の定型で出力してください）

        【生成タイトル】

        【画像用短縮タイトル】（15文字以内）

        【タグ】（#付き5個）

        【記事本文】（約1500文字〜2000文字）
        ※区切り文字は出力せず、見出し（##）を使って一続きの自然な記事として出力してください。
        - 導入部（調査・検証の背景と課題）
        - ## （内容と思考プロセス）
        - ## （具体的手順や身近な例えを用いた説明）
        - ## （結果とまとめ・読者への提案）

        【今後の検証・調査課題】（今回の経験を通して残った疑問や、次に調べたいこと）

        【SNS案】
        - X（100字以内。目的と結果の要約からnoteへ誘導）
        - Threads（150字以内。日常の気づきや学習過程での壁から、今回の内容へ繋ぐ）
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
