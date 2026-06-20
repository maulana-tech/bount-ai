"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CornerFrame } from "@/components/CornerFrame";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL ?? "http://localhost:8787";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get("redirect") || "/app";

  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState<"idle" | "signing" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-redirect if they already have an active matching session
  useEffect(() => {
    const raw = localStorage.getItem("bountai.session");
    if (raw) {
      try {
        const session = JSON.parse(raw);
        if (session.address && session.role) {
          router.push(redirect);
        }
      } catch {
        localStorage.removeItem("bountai.session");
      }
    }
  }, [router, redirect]);

  async function handleLogin(useDemo: boolean) {
    setStatus("signing");
    setErrorMsg(null);

    const keyToSubmit = useDemo ? "" : apiKey.trim();
    if (!useDemo && !keyToSubmit) {
      setStatus("error");
      setErrorMsg("Please enter your T3N API Key or select Demo Credentials.");
      return;
    }

    try {
      const res = await fetch(`${AGENT_URL}/auth/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: keyToSubmit }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to authenticate session");
      }

      const sessionData = await res.json();
      const session = {
        address: sessionData.address,
        did: sessionData.did,
        role,
        apiKey: keyToSubmit || undefined,
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem("bountai.session", JSON.stringify(session));
      setStatus("success");
      router.push(redirect);
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMsg(err?.message || "Authentication failed. Make sure the agent server is running.");
    }
  }

  async function handleGenerateSession() {
    setStatus("signing");
    setErrorMsg(null);
    try {
      const privateKey = generatePrivateKey();
      const account = privateKeyToAccount(privateKey);
      const address = account.address;

      const res = await fetch(`${AGENT_URL}/auth/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: privateKey }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to initialize T3N session with generated key");
      }

      const sessionData = await res.json();
      const session = {
        address: sessionData.address,
        did: sessionData.did,
        role,
        apiKey: privateKey,
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem("bountai.session", JSON.stringify(session));
      setStatus("success");
      router.push(redirect);
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMsg(err?.message || "Failed to generate session.");
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
          <CornerFrame label="T3N Access Control">
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-ink">TEE Identity Login</h1>
                <p className="mt-1.5 text-xs text-ink-muted leading-relaxed">
                  Authenticate your bount-AI session with a Terminal 3 Network DID. No browser wallet required.
                </p>
              </div>

              <div className="space-y-5">
                {/* Role Selection */}
                <div className="space-y-3">
                  <span className="block font-mono text-[10px] uppercase tracking-wide text-ink-faint">Select Account Role</span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setRole("buyer")}
                      disabled={status === "signing"}
                      className={cn(
                        "py-2 px-3 border text-xs font-semibold rounded transition-colors text-center",
                        role === "buyer"
                          ? "border-gold bg-gold-tint text-gold"
                          : "border-line bg-panel text-ink-muted hover:border-line-strong"
                      )}
                    >
                      Buyer (Consumer)
                    </button>

                    <button
                      onClick={() => setRole("seller")}
                      disabled={status === "signing"}
                      className={cn(
                        "py-2 px-3 border text-xs font-semibold rounded transition-colors text-center",
                        role === "seller"
                          ? "border-gold bg-gold-tint text-gold"
                          : "border-line bg-panel text-ink-muted hover:border-line-strong"
                      )}
                    >
                      Seller (Developer)
                    </button>
                  </div>
                </div>

                {/* API Key Input */}
                <div className="space-y-1.5">
                  <label className="block">
                    <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                      T3N API Key (optional)
                    </span>
                    <input
                      type="password"
                      placeholder="0x..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      disabled={status === "signing"}
                      className="w-full border border-line bg-panel px-3 py-2 font-mono text-xs outline-none focus:border-gold placeholder:text-ink-faint text-ink"
                    />
                  </label>
                  <p className="font-mono text-[9px] text-ink-faint leading-normal">
                    Enter your T3N Developer API key to log in using your personal DID.
                  </p>
                </div>

                {/* Error warning */}
                {status === "error" && errorMsg && (
                  <div className="border border-danger/40 bg-danger-tint p-3 rounded text-xs font-mono text-danger leading-relaxed">
                    {errorMsg}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => handleLogin(false)}
                    disabled={status === "signing" || !apiKey.trim()}
                    className={cn(
                      "w-full py-2 rounded font-medium text-xs transition-colors text-white",
                      status === "signing" || !apiKey.trim()
                        ? "bg-gold/40 cursor-not-allowed"
                        : "bg-gold hover:bg-gold-hover"
                    )}
                  >
                    {status === "signing" ? "Verifying..." : "Sign In with API Key"}
                  </button>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-line"></div>
                    <span className="flex-shrink mx-3 font-mono text-[9px] text-ink-faint uppercase">or</span>
                    <div className="flex-grow border-t border-line"></div>
                  </div>

                  <button
                    onClick={handleGenerateSession}
                    disabled={status === "signing"}
                    className={cn(
                      "w-full py-2 rounded border font-medium text-xs transition-colors bg-panel text-gold hover:border-gold hover:bg-gold-tint border-gold/40",
                      status === "signing" ? "cursor-not-allowed opacity-50" : ""
                    )}
                  >
                    Generate New T3N Identity (DID)
                  </button>

                  <button
                    onClick={() => handleLogin(true)}
                    disabled={status === "signing"}
                    className={cn(
                      "w-full py-2 rounded border font-medium text-xs transition-colors bg-panel text-ink-muted hover:border-line-strong hover:bg-panel-2 border-line",
                      status === "signing" ? "cursor-not-allowed opacity-50" : ""
                    )}
                  >
                    Use Demo Credentials
                  </button>
                </div>
              </div>
            </div>
          </CornerFrame>
        </div>

        {/* Footer info */}
        <div className="text-center font-mono text-[10px] text-ink-faint">
          bount-AI secured by Terminal 3 Confidential Computing & TEE Enclaves
        </div>
      </div>

      {/* Right Pane: Video Preview (visible on desktop) */}
      <div className="relative hidden lg:block bg-panel border-l border-line overflow-hidden">
        <video
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260424_064411_9e9d7f84-9277-41f4-ab10-59172d89e6be.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover grayscale hover:grayscale-0 transition-all duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-ink/5 mix-blend-multiply pointer-events-none" />
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
