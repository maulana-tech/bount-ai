import type { AgentOutput } from "@concierge/shared";
import { CornerFrame } from "./CornerFrame";

/** Hasil akhir: konten dari specialist agents. */
export function ResultPanel({ outputs }: { outputs: AgentOutput[] }) {
  if (outputs.length === 0) {
    return (
      <CornerFrame label="Result">
        <div className="flex aspect-video items-center justify-center border border-dashed border-line text-xs text-ink-faint">
          awaiting result
        </div>
        <div className="mt-4 text-center text-xs text-ink-faint">
          submit a request above
        </div>
      </CornerFrame>
    );
  }

  return (
    <CornerFrame label="Result">
      <div className="space-y-4">
        {outputs.map((o, i) => (
          <div key={i}>
            <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
              {o.label}
            </div>
            {o.type === "text" && o.text && (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-muted">
                {o.text.length > 500 ? o.text.slice(0, 500) + "…" : o.text}
              </p>
            )}
            {o.type === "image" && o.imageUrl && (
              <img
                src={o.imageUrl}
                alt={o.label}
                className="w-full rounded border border-line"
              />
            )}
          </div>
        ))}
      </div>
    </CornerFrame>
  );
}
