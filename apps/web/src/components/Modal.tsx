"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-lg border border-line bg-paper p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          {title && (
            <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          )}
          <button
            onClick={onClose}
            className="font-mono text-xs uppercase tracking-wide text-ink-faint transition-colors hover:text-ink"
          >
            close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
