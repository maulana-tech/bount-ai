"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAccount, useSignMessage } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { CornerFrame } from "@/components/CornerFrame";
import { Navbar } from "@/components/Navbar";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get("redirect") || "/app";

  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [status, setStatus] = useState<"idle" | "signing" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-redirect if they already have an active matching session
  useEffect(() => {
    const raw = localStorage.getItem("bountai.session");
    if (raw && address) {
      try {
        const session = JSON.parse(raw);
        if (session.address.toLowerCase() === address.toLowerCase() && session.role) {
          router.push(redirect);
        }
      } catch {
        // Clear corrupt session
        localStorage.removeItem("bountai.session");
      }
    }
  }, [address, router, redirect]);

  async function handleLogin() {
    if (!address) return;
    setStatus("signing");
    setErrorMsg(null);

    try {
      const timestamp = new Date().toISOString();
      const message = `Sign in to bount-AI\n\nAddress: ${address}\nRole: ${role}\nTimestamp: ${timestamp}`;
      const signature = await signMessageAsync({ message });

      const session = {
        address,
        role,
        signature,
        timestamp,
      };

      localStorage.setItem("bountai.session", JSON.stringify(session));
      setStatus("success");
      
      // Navigate to destination
      router.push(redirect);
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMsg(err?.message || "User rejected signature request.");
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center py-20">
      <div className="mb-8 flex justify-center">
        <Logo />
      </div>

      <CornerFrame label="Access Control">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-lg font-semibold tracking-tight">Authentication Required</h1>
            <p className="mt-1 text-xs text-ink-muted leading-relaxed">
              Connect your Web3 wallet and authorize a session to enter.
            </p>
          </div>

          {!isConnected ? (
            <div className="flex flex-col items-center justify-center py-6 border border-line bg-panel/30 rounded space-y-4">
              <span className="font-mono text-xs text-ink-faint">Wallet not connected</span>
              <ConnectButton showBalance={false} />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Connected Wallet indicator */}
              <div className="border border-line bg-panel p-3.5 rounded flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">Wallet</span>
                <span className="font-mono text-xs text-ink">
                  {address?.slice(0, 6)}…{address?.slice(-4)}
                </span>
              </div>

              {/* Role Selection */}
              <div className="space-y-3">
                <span className="block font-mono text-[10px] uppercase tracking-wide text-ink-faint">Select Account Role</span>
                
                <button
                  onClick={() => setRole("buyer")}
                  disabled={status === "signing"}
                  className={cn(
                    "w-full text-left p-4 border rounded transition-colors block",
                    role === "buyer"
                      ? "border-gold bg-gold-tint animate-none"
                      : "border-line bg-panel hover:border-line-strong"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold tracking-tight text-ink">Buyer (Consumer)</span>
                    {role === "buyer" && <span className="font-mono text-[10px] text-gold uppercase tracking-wide font-bold">Active</span>}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                    Delegate tasks, grant ERC-7710 budgets, and use AI agents.
                  </p>
                </button>

                <button
                  onClick={() => setRole("seller")}
                  disabled={status === "signing"}
                  className={cn(
                    "w-full text-left p-4 border rounded transition-colors block",
                    role === "seller"
                      ? "border-gold bg-gold-tint animate-none"
                      : "border-line bg-panel hover:border-line-strong"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold tracking-tight text-ink">Seller (Developer)</span>
                    {role === "seller" && <span className="font-mono text-[10px] text-gold uppercase tracking-wide font-bold">Active</span>}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                    Publish TEE custom agents and earn stablecoins.
                  </p>
                </button>
              </div>

              {/* Error warning */}
              {status === "error" && errorMsg && (
                <div className="border border-danger/40 bg-danger-tint p-3 rounded text-xs font-mono text-danger leading-relaxed">
                  {errorMsg}
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleLogin}
                disabled={status === "signing"}
                className={cn(
                  "w-full py-2.5 rounded font-medium text-sm transition-colors text-white",
                  status === "signing"
                    ? "bg-gold/60 cursor-not-allowed"
                    : "bg-gold hover:bg-gold-hover"
                )}
              >
                {status === "signing" ? "Authenticating..." : `Sign In as ${role === "buyer" ? "Buyer" : "Seller"}`}
              </button>
            </div>
          )}
        </div>
      </CornerFrame>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <Navbar variant="landing" />
      <main className="mx-auto min-h-screen max-w-7xl px-4">
        <Suspense fallback={
          <div className="flex min-h-screen items-center justify-center bg-paper">
            <div className="text-center font-mono text-sm text-ink-muted animate-pulse">
              Loading login module...
            </div>
          </div>
        }>
          <LoginContent />
        </Suspense>
      </main>
    </>
  );
}
