import { getIdeas } from "@/lib/data";
import IdeaList from "./IdeaList";
import InsightForm from "./InsightForm";

export default async function Home() {
  // サーバーコンポーネント: 初期表示時にデータを取得し、SSG/SSRでレンダリング
  // ※ポートフォリオ用に、実際のバックエンドやDBの代わりにローカルJSONまたは外部APIからアイデアを取得する想定の構成です
  const ideas = await getIdeas();

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-200 selection:bg-purple-500/30 font-sans">
      {/* Dynamic Background Pattern */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #3b0764 0%, transparent 50%)' }} />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 flex flex-col gap-8 h-screen">

        {/* Header / Hero */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              Note Writer Dashboard
            </h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <a href="https://notebooklm.google.com/" target="_blank" rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span> NotebookLM
            </a>
            <a href="https://www.perplexity.ai/" target="_blank" rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span> Perplexity
            </a>
            <a href="https://note.com/" target="_blank" rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> note
            </a>
          </div>
        </header>

        {/* Two Column Layout container spanning remaining vertical space */}
        <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-8 min-h-0">

          {/* Left Column: Quick Entry */}
          <div className="lg:col-span-5 flex flex-col lg:h-full lg:overflow-hidden order-1 lg:order-1">
            <section className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-3xl shrink-0">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                新しいアイデア・気づきを登録
              </h2>
              <p className="text-xs text-white/50 mb-4">ここで入力した内容は右側の「アイデアストック」に新しいアイデアとして追加されます。</p>
              <InsightForm />
            </section>
          </div>

          {/* Right Column: Ideas */}
          <div className="lg:col-span-7 h-full flex flex-col min-h-0 order-1 lg:order-2">
            <section className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-3xl flex-1 flex flex-col">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                アイデアストック
              </h2>
              <div className="flex-1 min-h-0">
                <IdeaList initialIdeas={ideas} />
              </div>
            </section>
          </div>

        </div>
      </main>
    </div>
  );
}
