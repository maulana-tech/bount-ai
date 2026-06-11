import { CornerFrame } from "./CornerFrame";
import { usd, cn } from "@/lib/utils";

/**
 * Elemen paling menonjol di layar (UI_GUIDE §6). Saldo besar mono + bronze,
 * progress tipis, "$X / $Y", tombol Revoke. Angka = bintangnya.
 */
export function BudgetMeter({
  spent,
  cap,
  onRevoke,
}: {
  spent: number;
  cap: number;
  onRevoke?: () => void;
}) {
  const remaining = Math.max(cap - spent, 0);
  const pct = cap > 0 ? Math.min((spent / cap) * 100, 100) : 0;

  return (
    <CornerFrame label="Budget">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
            Remaining
          </div>
          <div className="font-mono text-3xl font-medium tnum text-gold">
            ${usd(remaining)}
          </div>
          <div className="mt-1 font-mono text-xs tnum text-ink-muted">
            ${usd(spent)} spent / ${usd(cap)} cap
          </div>
        </div>
        {onRevoke && (
          <button
            onClick={onRevoke}
            className="rounded border border-danger/40 px-3 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger-tint"
          >
            Revoke
          </button>
        )}
      </div>

      {/* progress bar tipis */}
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-panel-2">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            pct > 90 ? "bg-danger" : "bg-gold",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </CornerFrame>
  );
}
