"use client";

import { CornerFrame } from "./CornerFrame";

/**
 * Input permintaan — sengaja KECIL & di bawah (UI_GUIDE §0: bukan chatbot).
 * Tanpa caret glyph/emote; placeholder yang memandu.
 */
export function PromptBar() {
  return (
    <CornerFrame>
      <div className="flex items-center gap-3">
        <input
          placeholder="type a request — e.g. research 3 competitors, then make a poster"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink-faint"
        />
        <button className="rounded bg-gold px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-gold-hover">
          Send
        </button>
      </div>
    </CornerFrame>
  );
}
