"use client";

import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { CornerFrame } from "@/components/CornerFrame";
import { useState, Suspense } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect } from "react";

function CliAuthContent() {
  const searchParams = useSearchParams();
  const port = searchParams?.get("port") || "12345";
  const { address: wagmiAddress, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [status, setStatus] = useState<"idle" | "signing" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sessionApiKey, setSessionApiKey] = useState("");
  const [sessionAddress, setSessionAddress] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("bountai.session");
      if (raw) {
        const session = JSON.parse(raw);
        setSessionApiKey(session.apiKey || "");
        setSessionAddress(session.address || "");
      }
    } catch {}
  }, []);

  const activeAddress = wagmiAddress || sessionAddress || "";
  const hasSessionKey = !!sessionApiKey;

  async function handleAuthorize() {
    if (!activeAddress) return;
    setStatus("signing");
    setErrorMsg(null);
    try {
      const challenge = `bount-AI: Authorize local CLI session\nAddress: ${activeAddress}\nTimestamp: ${Date.now()}`;
      
      let signature = "";
      if (sessionApiKey) {
        const { privateKeyToAccount } = await import("viem/accounts");
        const account = privateKeyToAccount(sessionApiKey as `0x${string}`);
        signature = await account.signMessage({ message: challenge });
      } else {
        signature = await signMessageAsync({ message: challenge });
      }

      setStatus("sending");
      
      const payload = {
        did: `did:t3n:${activeAddress.toLowerCase().replace(/^0x/, "")}`,
        authToken: `mock_jwt_token_preauth_${sessionApiKey || "demo"}`
      };

      const res = await fetch(`http://localhost:${port}/callback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`CLI callback failed with status ${res.status}`);
      }

      setStatus("success");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Authorization failed");
    }
  }

  return (
    <CornerFrame label="CLI Auth Gateway">
      <div className="space-y-6 p-2">
        <p className="text-sm leading-relaxed text-ink-muted">
          A local terminal session is requesting authorization to connect with your bount-AI identity (did:t3n).
        </p>

        <div className="rounded border border-line bg-panel-2/30 p-4 font-mono text-xs text-ink-muted">
          <div className="flex justify-between">
            <span>Request Port:</span>
            <span className="text-ink">{port}</span>
          </div>
          <div className="mt-1 flex justify-between">
            <span>Identity:</span>
            <span className="text-ink">
              {activeAddress
                ? `did:t3n:${activeAddress.toLowerCase().replace(/^0x/, "")}`
                : "Disconnected"}
            </span>
          </div>
        </div>

        {status === "success" ? (
          <div className="rounded border border-success/30 bg-success/5 p-4 text-center">
            <p className="text-sm font-medium text-success">✔ Authorization Successful!</p>
            <p className="mt-1.5 text-xs text-ink-muted">You can close this browser tab and return to your terminal.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full">
            {!isConnected && !hasSessionKey ? (
              <div className="flex flex-col items-center gap-3 w-full">
                <ConnectButton />
                <span className="text-[10px] font-mono text-ink-faint uppercase">Or</span>
                <p className="text-xs text-ink-muted text-center">Log in to bount-AI web app via T3N DID first.</p>
              </div>
            ) : (
              <button
                onClick={handleAuthorize}
                disabled={status === "signing" || status === "sending"}
                className="w-full rounded bg-gold py-2.5 text-sm font-medium text-white transition-colors hover:bg-gold-hover disabled:opacity-50"
              >
                {status === "signing" && "Signing Message..."}
                {status === "sending" && "Connecting CLI..."}
                {status === "idle" && "Authorize CLI Login"}
                {status === "error" && "Retry Authorization"}
              </button>
            )}

            {errorMsg && (
              <p className="text-xs text-danger">{errorMsg}</p>
            )}
          </div>
        )}
      </div>
    </CornerFrame>
  );
}

export default function CliAuthPage() {
  return (
    <>
      <Navbar variant="app" />
      <main className="mx-auto flex min-h-[80vh] max-w-xl flex-col justify-center px-4 py-8">
        <Suspense fallback={<div>Loading authorization gateway...</div>}>
          <CliAuthContent />
        </Suspense>
      </main>
    </>
  );
}
