"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";

/**
 * Satu navbar, dua varian:
 * - "landing": tautan section + CTA "Open app".
 * - "app": jalur balik yang jelas ("Back to site") + wallet connect.
 * Logo selalu menautkan ke beranda, jadi kedua arah selalu punya navigasi.
 */
export function Navbar({ variant }: { variant: "landing" | "app" }) {
  return (
    <nav className="sticky top-0 z-50 border-b border-line bg-paper/85 backdrop-blur-sm">
      <div
        className={cn(
          "mx-auto flex items-center justify-between px-4 py-3.5",
          variant === "landing" ? "max-w-6xl" : "max-w-7xl",
        )}
      >
        <div className="flex items-center gap-3">
          <Logo />
          {variant === "app" && (
            <span className="hidden font-mono text-[11px] uppercase tracking-wide text-ink-faint sm:inline">
              / Dashboard
            </span>
          )}
        </div>

        {variant === "landing" ? (
          <div className="flex items-center gap-6">
            <NavLink href="#how">How it works</NavLink>
            <NavLink href="#features">Features</NavLink>
            <Link
              href="/app"
              className="rounded bg-gold px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-gold-hover"
            >
              Open app
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <NavLink href="/">Back to site</NavLink>
            <ConnectButton showBalance={false} />
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="hidden text-sm text-ink-muted transition-colors hover:text-ink sm:block"
    >
      {children}
    </Link>
  );
}
