import type { ActivityEvent } from "@concierge/shared";
import { CornerFrame } from "./CornerFrame";
import { StatusDot } from "./ui/StatusDot";
import { usd } from "@/lib/utils";

/**
 * Daftar aksi agent real-time. Tiap baris = "witness block" (UI_GUIDE §6):
 * aksi + jumlah + status dari webhook 1Shot. (Expand tx hash menyusul Fase 4.)
 */
export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  return (
    <CornerFrame label="Activity">
      <ul className="divide-y divide-line">
        {events.map((e) => (
          <li key={e.id} className="flex items-center gap-3 py-2.5">
            <StatusDot status={e.status} />
            <span className="w-20 font-mono text-[11px] uppercase tracking-wide text-ink-faint">
              {e.agent}
            </span>
            <span className="flex-1 text-sm text-ink">{e.action}</span>
            <span className="font-mono text-sm tnum text-ink">-${usd(e.amount)}</span>
            <span
              className={
                "w-20 text-right font-mono text-[11px] uppercase " +
                (e.status === "confirmed"
                  ? "text-success"
                  : e.status === "failed"
                    ? "text-danger"
                    : "text-gold")
              }
            >
              {e.status}
            </span>
          </li>
        ))}
      </ul>
    </CornerFrame>
  );
}
