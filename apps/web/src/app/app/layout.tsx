"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAccount } from "wagmi";

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const raw = localStorage.getItem("bountai.session");
      if (!raw) {
        router.push(`/login?redirect=${encodeURIComponent(pathname || "/app")}`);
        return;
      }
      try {
        const session = JSON.parse(raw);
        if (!session.address || !session.role) {
          localStorage.removeItem("bountai.session");
          router.push(`/login?redirect=${encodeURIComponent(pathname || "/app")}`);
          return;
        }

        // If wallet is connected, verify it matches the session address
        if (address && session.address.toLowerCase() !== address.toLowerCase()) {
          localStorage.removeItem("bountai.session");
          router.push(`/login?redirect=${encodeURIComponent(pathname || "/app")}`);
          return;
        }

        setAuthorized(true);
      } catch (err) {
        localStorage.removeItem("bountai.session");
        router.push(`/login?redirect=${encodeURIComponent(pathname || "/app")}`);
      }
    };

    checkAuth();
  }, [address, isConnected, router, pathname]);

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <div className="text-center font-mono text-sm text-ink-muted animate-pulse">
          Authenticating session...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
