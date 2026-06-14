import { useState } from "react";
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
      <div className="space-y-5">
        {outputs.map((o, i) => (
          <OutputBlock key={i} output={o} />
        ))}
      </div>
    </CornerFrame>
  );
}

function OutputBlock({ output }: { output: AgentOutput }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!output.text) return;
    await navigator.clipboard.writeText(output.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
          {output.label}
        </span>
        {output.type === "text" && output.text && (
          <button
            onClick={handleCopy}
            className="font-mono text-[10px] uppercase tracking-wide text-ink-faint transition-colors hover:text-ink-muted"
          >
            {copied ? "copied" : "copy"}
          </button>
        )}
      </div>
      {output.type === "text" && output.text && (
        <div className="max-h-80 overflow-y-auto rounded border border-line bg-panel p-3">
          <p className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-ink-muted">
            {output.text}
          </p>
        </div>
      )}
      {output.type === "image" && output.imageUrl && (
        <img
          src={output.imageUrl}
          alt={output.label}
          className="w-full rounded border border-line"
        />
      )}
    </div>
  );
}
