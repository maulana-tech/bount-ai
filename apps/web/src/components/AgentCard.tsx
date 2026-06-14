"use client";

import { useState } from "react";
import type { Capability } from "@concierge/shared";
import { usd } from "@/lib/utils";

/** Kartu satu specialist agent (kapabilitas) di halaman Agents — klik untuk detail. */
export function AgentCard({
  agent,
  custom,
  onRemove,
}: {
  agent: Capability;
  custom?: boolean;
  onRemove?: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      onClick={() => setOpen(!open)}
      className="flex h-full cursor-pointer flex-col border border-line bg-panel p-5 transition-colors hover:border-line-strong"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold tracking-tight">{agent.label}</h3>
          {custom && (
            <span className="border border-gold/40 bg-gold-tint px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-gold">
              custom
            </span>
          )}
        </div>
        <span className="shrink-0 font-mono text-xs tnum text-gold">
          ${usd(agent.unitCostUsd)} / use
        </span>
      </div>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
        {agent.description}
      </p>

      {open && (
        <div className="mt-3 space-y-2 rounded border border-line bg-panel/50 p-3 text-xs">
          <div>
            <span className="font-mono uppercase tracking-wide text-ink-faint">keywords</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {agent.keywords.map((k) => (
                <span
                  key={k}
                  className="rounded bg-line/30 px-1.5 py-0.5 font-mono text-[11px] text-ink-muted"
                >
                  {k}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono uppercase tracking-wide text-ink-faint">product</span>
            <span className="font-mono text-ink-muted">{agent.product}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono uppercase tracking-wide text-ink-faint">id</span>
            <span className="font-mono text-ink-muted">{agent.id}</span>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
        <span className="font-mono text-[11px] text-ink-faint transition-colors">
          {open ? "click to close" : "click for details"}
        </span>
        {custom && onRemove && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="font-mono text-[11px] uppercase tracking-wide text-ink-faint transition-colors hover:text-danger"
          >
            remove
          </button>
        )}
      </div>
    </div>
  );
}
