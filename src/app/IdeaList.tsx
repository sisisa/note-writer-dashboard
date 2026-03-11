"use client";

import { useState, useTransition } from "react";
import { toggleIdeaAction, generateAndDraftArticleAction, updateIdeaAction } from "./actions";
import { Idea } from "@/lib/data";

function IdeaItem({ idea }: { idea: Idea }) {
  // Parsing prompt
  let parsedDetail = "";
  let parsedInsight = "";
  try {
    const parsed = JSON.parse(idea.prompt);
    parsedDetail = parsed.detail || "";
    parsedInsight = parsed.insight || "";
  } catch {
    // 過去の一次元データ互換用
    parsedInsight = idea.prompt || "";
  }

  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(idea.title);
  const [editDetail, setEditDetail] = useState(parsedDetail);
  const [editInsight, setEditInsight] = useState(parsedInsight);
  const [editUrl, setEditUrl] = useState(idea.url || "");
  const [editDraftUrl, setEditDraftUrl] = useState(idea.draftUrl || "");

  const handleGenerate = () => {
    if (!window.confirm("AIによる自動執筆を開始し、Google Docsを下書き作成しますか？(APIキー等が設定されている必要があります)")) return;
    
    startTransition(async () => {
      const res = await generateAndDraftArticleAction(idea.id);
      if (res?.success && res.url) {
        window.open(res.url, "_blank");
      } else {
        alert("エラー: " + (res?.message || "不明なエラー"));
      }
    });
  };

  const handleSaveEdit = async () => {
    startTransition(async () => {
      await updateIdeaAction(idea.id, editTitle, editDetail, editInsight, editUrl, editDraftUrl);
      setIsEditing(false);
    });
  };
  
  const updatedDate = new Date(idea.updatedAt || idea.createdAt).toLocaleString('ja-JP', { 
    month: 'numeric', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  if (isEditing) {
    return (
      <div className="p-4 rounded-xl border border-blue-500/50 bg-white/10 flex flex-col gap-3">
        <input 
          type="text" 
          value={editTitle} 
          onChange={e => setEditTitle(e.target.value)} 
          placeholder="【必須】テーマ"
          className="w-full px-3 py-2 bg-black/40 border border-white/20 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
        />
        <textarea 
          value={editDetail} 
          onChange={e => setEditDetail(e.target.value)} 
          placeholder="【任意】詳細（背景、状況など）"
          rows={2}
          className="w-full px-3 py-2 bg-black/40 border border-white/20 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm custom-scrollbar"
        />
        <textarea 
          value={editInsight} 
          onChange={e => setEditInsight(e.target.value)} 
          placeholder="【必須】気付き（教訓、考察事項）"
          rows={3}
          className="w-full px-3 py-2 bg-black/40 border border-white/20 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm custom-scrollbar"
        />
        <input 
          type="text" 
          value={editDraftUrl} 
          onChange={e => setEditDraftUrl(e.target.value)} 
          placeholder="下書き用Docs URL（自動設定）"
          className="w-full px-3 py-2 bg-black/40 border border-white/20 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
        />
        <input 
          type="text" 
          value={editUrl} 
          onChange={e => setEditUrl(e.target.value)} 
          placeholder="投稿完了後のnote記事URL（任意）"
          className="w-full px-3 py-2 bg-black/40 border border-white/20 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
        />
        <div className="flex gap-2 justify-end mt-2">
          <button 
            onClick={() => setIsEditing(false)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/70 hover:bg-white/10"
          >
            キャンセル
          </button>
          <button 
            onClick={handleSaveEdit}
            disabled={isPending}
            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {isPending ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`p-4 rounded-xl border transition-all duration-200 group relative ${
        idea.isUsed 
          ? "bg-white/5 border-white/5 opacity-60" 
          : "bg-white/10 border-white/10 hover:border-blue-500/30 hover:bg-white/15"
      }`}
    >
      <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-white/40">
              更新: {updatedDate}
            </span>
          </div>
          <p className={`text-sm md:text-base mb-2 sm:mb-0 ${idea.isUsed ? "line-through text-white/50" : "text-white/90"}`}>
            {idea.title}
          </p>
          <div className="flex flex-col gap-1 mt-2">
            {parsedDetail && (
               <p className="text-xs text-white/40 line-clamp-2">詳細: {parsedDetail}</p>
            )}
            {parsedInsight && (
               <p className="text-xs text-white/60 line-clamp-3">気付き: {parsedInsight}</p>
            )}
          </div>
        </div>
        
        <div className="shrink-0 flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 custom-scrollbar mt-2 sm:mt-0">
          {!idea.isUsed && (
            <button
              onClick={handleGenerate}
              disabled={isPending}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/40 disabled:opacity-50 whitespace-nowrap"
            >
              {isPending ? "執筆中..." : "AI執筆 & Docs作成"}
            </button>
          )}
          
          <button
            onClick={() => toggleIdeaAction(idea.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              idea.isUsed 
                ? "bg-white/10 text-white/60 hover:bg-white/20" 
                : "bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30"
            }`}
          >
            {idea.isUsed ? "戻す" : "使った！"}
          </button>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-3">
        <div className="flex gap-4">
          {idea.draftUrl && (
            <a href={idea.draftUrl} target="_blank" rel="noreferrer" className="text-purple-400 text-xs inline-block hover:underline">
              下書きを確認 &rarr;
            </a>
          )}
          {idea.url && (
            <a href={idea.url} target="_blank" rel="noreferrer" className="text-blue-400 text-xs inline-block hover:underline">
              記事を見る &rarr;
            </a>
          )}
        </div>
        <button 
          onClick={() => setIsEditing(true)}
          className="text-white/40 hover:text-white transition-colors p-1"
          title="編集"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function IdeaList({ initialIdeas }: { initialIdeas: Idea[] }) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"unused" | "used">("unused");

  const filtered = initialIdeas.filter(idea => {
    if (filterType === "unused" && idea.isUsed) return false;
    if (filterType === "used" && !idea.isUsed) return false;
    if (search && !idea.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.createdAt).getTime();
    const dateB = new Date(b.updatedAt || b.createdAt).getTime();
    return dateB - dateA;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="mb-4 flex flex-col sm:flex-row gap-3 shrink-0">
        <input
          type="text"
          placeholder="アイデアを検索..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-white/50"
        />
        <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 shrink-0">
          <button
            onClick={() => setFilterType("unused")}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${filterType === "unused" ? "bg-white/10 text-white shadow-sm" : "text-white/50 hover:text-white/80"}`}
          >
            未使用
          </button>
          <button
            onClick={() => setFilterType("used")}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${filterType === "used" ? "bg-white/10 text-white shadow-sm" : "text-white/50 hover:text-white/80"}`}
          >
            使用済み
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar min-h-0">
        {filtered.length === 0 ? (
          <p className="text-white/40 text-center py-8">アイデアが見つかりません</p>
        ) : (
          filtered.map(idea => <IdeaItem key={idea.id} idea={idea} />)
        )}
      </div>
    </div>
  );
}
