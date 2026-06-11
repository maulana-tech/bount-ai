import type { Capability } from "@concierge/shared";
import { usd } from "@/lib/utils";

/** Kartu satu specialist agent (kapabilitas) di halaman Agents. */
export function AgentCard({ agent }: { agent: Capability }) {
  return (
    <div className="flex h-full flex-col border border-line bg-panel p-5 transition-colors hover:border-line-strong">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold tracking-tight">{agent.label}</h3>
        <span className="shrink-0 font-mono text-xs tnum text-gold">
          ${usd(agent.unitCostUsd)} / use
        </span>
      </div>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
        {agent.description}
      </p>
      <div className="mt-4 flex items-center gap-2 border-t border-line pt-3">
        <span className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
          pays for
        </span>
        <span className="font-mono text-[11px] text-ink-muted">{agent.product}</span>
      </div>
    </div>
  );
}
