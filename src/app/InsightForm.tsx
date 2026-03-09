"use client";

import { useTransition, useRef } from "react";
import { addInsightAction } from "./actions";

export default function InsightForm() {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      await addInsightAction(formData);
      formRef.current?.reset();
    });
  };

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-col gap-3">
      <textarea
        name="content"
        placeholder="新しいアイデアやストックしておきたい情報を入力..."
        rows={4}
        required
        className="w-full resize-none rounded-xl bg-white/5 border border-white/10 p-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all custom-scrollbar"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="group relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-purple-500/30 disabled:opacity-70 disabled:hover:scale-100"
        >
          {isPending ? "追加中..." : "+ アイデアに追加"}
          <svg
            className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${isPending ? "hidden" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </form>
  );
}
