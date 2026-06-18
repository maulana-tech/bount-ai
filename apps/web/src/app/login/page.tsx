"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAccount, useSignMessage } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { CornerFrame } from "@/components/CornerFrame";
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
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left Pane: Login Card */}
      <div className="flex flex-col justify-between px-6 py-10 sm:px-10 lg:px-16 bg-paper">
        {/* Header Logo */}
        <div className="flex items-center gap-2">
          <Logo />
        </div>

        {/* Center Card */}
        <div className="mx-auto my-auto w-full max-w-sm">
          <CornerFrame label="Access Control">
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-ink">Authentication Required</h1>
                <p className="mt-1.5 text-xs text-ink-muted leading-relaxed">
                  Connect your Web3 wallet and authorize a session to enter the bount-AI marketplace.
                </p>
              </div>

              {!isConnected ? (
                <div className="flex flex-col items-center justify-center py-6 border border-line bg-panel/30 rounded space-y-4">
                  <span className="font-mono text-xs text-ink-faint">Wallet not connected</span>
                  <ConnectButton showBalance={false} />
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Connected Wallet indicator */}
                  <div className="border border-line bg-panel px-3.5 py-2.5 rounded flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">Wallet</span>
                    <span className="font-mono text-xs text-ink font-semibold">
                      {address?.slice(0, 6)}…{address?.slice(-4)}
                    </span>
                  </div>

                  {/* Role Selection */}
                  <div className="space-y-3.5">
                    <span className="block font-mono text-[10px] uppercase tracking-wide text-ink-faint">Select Account Role</span>
                    
                    <button
                      onClick={() => setRole("buyer")}
                      disabled={status === "signing"}
                      className={cn(
                        "w-full text-left p-4 border rounded transition-colors block",
                        role === "buyer"
                          ? "border-gold bg-gold-tint"
                          : "border-line bg-panel hover:border-line-strong"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold tracking-tight text-ink">Buyer (Consumer)</span>
                        {role === "buyer" && (
                          <span className="font-mono text-[10px] text-gold uppercase tracking-wide font-bold">Active</span>
                        )}
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
                          ? "border-gold bg-gold-tint"
                          : "border-line bg-panel hover:border-line-strong"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold tracking-tight text-ink">Seller (Developer)</span>
                        {role === "seller" && (
                          <span className="font-mono text-[10px] text-gold uppercase tracking-wide font-bold">Active</span>
                        )}
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

        {/* Footer info */}
        <div className="text-center font-mono text-[10px] text-ink-faint">
          bount-AI secured by ERC-7710 Smart Accounts & TEE Enclaves
        </div>
      </div>

      {/* Right Pane: Image Preview (visible on desktop) */}
      <div className="relative hidden lg:block bg-panel border-l border-line overflow-hidden">
        <div className="absolute inset-0 z-0 bg-panel-2/20" />
        <div className="relative z-10 flex h-full w-full flex-col justify-between p-12">
          {/* Subtle decoration rule */}
          <div className="flex items-center justify-between border-b border-line pb-4">
            <span className="font-mono text-xs uppercase tracking-wide text-ink-muted">System Blueprint</span>
            <span className="font-mono text-xs text-gold">TEE Node v0.2.0</span>
          </div>

          <div className="my-auto flex flex-col items-center justify-center">
            {/* The Preview Video */}
            <div className="relative aspect-[16/9] w-full max-w-sm overflow-hidden border border-line-strong bg-panel-2/50 rounded shadow-sm">
              <video
                src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260424_064411_9e9d7f84-9277-41f4-ab10-59172d89e6be.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                className="h-full w-full object-cover grayscale hover:grayscale-0 transition-all duration-700 ease-out"
              />
            </div>
            <p className="mt-4 text-center font-mono text-[11px] text-ink-muted">
              TEE Enclave Verification & x402 Micro-Stablecoin Settlement
            </p>
          </div>

          {/* Subtext info */}
          <div className="flex items-center justify-between border-t border-line pt-4 font-mono text-[10px] text-ink-faint">
            <span>METAMASK SA DELEGATION</span>
            <span>SECURE SANDBOX COMPILING</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-paper">
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
  );
}
