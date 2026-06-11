import { CornerFrame } from "./CornerFrame";

/** Hasil akhir: preview media + ringkasan teks. Placeholder sampai Fase 3. */
export function ResultPanel() {
  return (
    <CornerFrame label="Result">
      <div className="flex aspect-video items-center justify-center border border-dashed border-line text-xs text-ink-faint">
        poster preview
      </div>
      <div className="mt-4">
        <div className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
          Research summary
        </div>
        <ul className="mt-2 space-y-1.5 text-sm text-ink-muted">
          <li>Competitor A — awaiting result</li>
          <li>Competitor B — awaiting result</li>
          <li>Competitor C — awaiting result</li>
        </ul>
      </div>
    </CornerFrame>
  );
}
