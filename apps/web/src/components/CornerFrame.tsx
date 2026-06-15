import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Motif signature (UI_GUIDE §5) — diadaptasi dari `CornerLayout` iNMerge.
 * Membingkai panel dengan garis rambut + kurung sudut L. Ciri khas visual app.
 * Pakai ulang komponen ini, JANGAN duplikasi markup-nya.
 */
export function CornerFrame({
  children,
  label,
  className,
  bodyClassName,
}: {
  children: ReactNode;
  label?: string;
  className?: string;
  /** override the inner content wrapper (e.g. make it a flex-fill column) */
  bodyClassName?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      {/* hairline border */}
      <div className="absolute inset-0 border border-line" aria-hidden />

      {/* 4 kurung sudut */}
      <Corner className="left-0 top-0 border-l-2 border-t-2" />
      <Corner className="right-0 top-0 border-r-2 border-t-2" />
      <Corner className="left-0 bottom-0 border-l-2 border-b-2" />
      <Corner className="right-0 bottom-0 border-r-2 border-b-2" />

      {label && (
        <span className="absolute -top-2 left-4 bg-paper px-2 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
          {label}
        </span>
      )}

      <div className={cn("relative p-5", bodyClassName)}>{children}</div>
    </div>
  );
}

function Corner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("absolute h-3 w-3 border-line-strong", className)}
    />
  );
}
