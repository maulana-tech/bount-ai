"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";

import { useEffect, useState } from "react";

/**
 * Satu navbar, dua varian:
 * - "landing": tautan section + CTA "Open app".
 * - "app": navigasi antar halaman app (Dashboard, Agents) + jalur balik ke
 *   landing ("Back to site") + wallet connect.
 * Logo selalu menautkan ke beranda, jadi kedua arah selalu punya navigasi.
 */
export function Navbar({ variant }: { variant: "landing" | "app" }) {
  const pathname = usePathname();
  const [sessionAddress, setSessionAddress] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("bountai.session");
    if (raw) {
      try {
        const session = JSON.parse(raw);
        if (session.address) {
          setSessionAddress(session.address);
        }
      } catch {}
    }
  }, []);

  return (
    <nav className="sticky top-0 z-50 border-b border-line bg-paper/85 backdrop-blur-sm">
      <div
        className={cn(
          "mx-auto flex items-center justify-between px-4 py-3.5",
          variant === "landing" ? "max-w-6xl" : "max-w-7xl",
        )}
      >
        <div className="flex items-center gap-6">
          <Logo />
          {variant === "app" && (
            <div className="hidden items-center gap-1 sm:flex">
              <AppLink href="/app" active={pathname === "/app"}>
                Dashboard
              </AppLink>
              <AppLink href="/app/agents" active={pathname === "/app/agents"}>
                Agents
              </AppLink>
              <AppLink href="/app/chat" active={pathname === "/app/chat"}>
                Chat
              </AppLink>
            </div>
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
            {sessionAddress && (
              <span className="border border-gold/40 bg-gold-tint px-2.5 py-1.5 font-mono text-[11px] rounded text-gold leading-none select-none">
                T3N: {sessionAddress.slice(0, 6)}…{sessionAddress.slice(-4)}
              </span>
            )}
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

function AppLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded px-3 py-1.5 text-sm transition-colors",
        active
          ? "bg-gold-tint font-medium text-ink"
          : "text-ink-muted hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}
