"use client";

import { useState } from "react";
import type { Capability } from "@concierge/shared";
import { usd } from "@/lib/utils";
import { Modal } from "./Modal";

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
    <>
      <div
        onClick={() => setOpen(true)}
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
        <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
              pays for
            </span>
            <span className="font-mono text-[11px] text-ink-muted">{agent.product}</span>
          </div>
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

      <Modal open={open} onClose={() => setOpen(false)} title={agent.label}>
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-ink-muted">{agent.description}</p>
          <div className="space-y-1">
            <span className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
              keywords
            </span>
            <div className="flex flex-wrap gap-1.5">
              {agent.keywords.map((k) => (
                <span
                  key={k}
                  className="rounded bg-line/40 px-2 py-1 font-mono text-xs text-ink-muted"
                >
                  {k}
                </span>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <span className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
              product
            </span>
            <p className="font-mono text-sm text-ink-muted">{agent.product}</p>
          </div>
          <div className="space-y-1">
            <span className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
              id
            </span>
            <p className="font-mono text-sm text-ink-muted">{agent.id}</p>
          </div>
          <div className="space-y-1">
            <span className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
              cost per use
            </span>
            <p className="font-mono text-sm tnum text-gold">${usd(agent.unitCostUsd)}</p>
          </div>
        </div>
      </Modal>
    </>
  );
}
