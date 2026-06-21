"use client";

import { useState, useEffect } from "react";
import { CornerFrame } from "./CornerFrame";

const AGENT_URL = (process.env.NEXT_PUBLIC_AGENT_URL ?? "http://localhost:8787").replace(/\/$/, "");

export function T3nSecretsManager() {
  const [tail, setTail] = useState("secrets");
  const [key, setKey] = useState("VENICE_API_KEY");
  const [value, setValue] = useState("");
  const [enclaveAddress, setEnclaveAddress] = useState("0x9a506280aae6c867f2e8631ade675fa7e76d20d5");
  const [apiKey, setApiKey] = useState("");
  
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("bountai.session");
      if (raw) {
        const session = JSON.parse(raw);
        if (session.apiKey) {
          setApiKey(session.apiKey);
        }
      }
    } catch {}
  }, []);

  async function handleWriteSecret() {
    if (!value.trim()) {
      setStatus("error");
      setMessage("Please enter a secret value.");
      return;
    }

    setStatus("loading");
    setMessage(null);

    try {
      // 1. Create the Map
      console.log(`[T3N Web UI] Creating map tail "${tail}"...`);
      const createRes = await fetch(`${AGENT_URL}/auth/kv/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          tail: tail.trim(),
          enclaveAddress: enclaveAddress.trim(),
        }),
      });

      if (!createRes.ok) {
        const errData = await createRes.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to create T3N map");
      }

      // 2. Set the Map Entry
      console.log(`[T3N Web UI] Seeding key "${key}" into map...`);
      const setRes = await fetch(`${AGENT_URL}/auth/kv/set`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          tail: tail.trim(),
          key: key.trim(),
          value: value.trim(),
        }),
      });

      if (!setRes.ok) {
        const errData = await setRes.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to seed secret into T3N map");
      }

      setStatus("success");
      setMessage(`Successfully created map "z-namespace:secrets" and seeded ${key}!`);
      setValue(""); // clear value
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setMessage(err.message || "Failed to manage T3N secrets");
    }
  }

  return (
    <CornerFrame label="T3N Confidential Storage (KV Vault)">
      <div className="space-y-4">
        <p className="text-xs text-ink-muted leading-relaxed">
          Create encrypted z-namespace maps and seed sensitive APIs (e.g. <code>VENICE_API_KEY</code>) directly on T3N. Secrets are only accessible inside TEE enclaves and are never exposed.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-wide text-ink-faint">Map Tail</span>
            <input
              type="text"
              value={tail}
              onChange={(e) => setTail(e.target.value)}
              className="w-full border border-line bg-panel px-3 py-1.5 font-mono text-xs outline-none focus:border-gold text-ink"
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-wide text-ink-faint">Secret Key</span>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full border border-line bg-panel px-3 py-1.5 font-mono text-xs outline-none focus:border-gold text-ink"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-wide text-ink-faint">Secret Value (API Key)</span>
            <input
              type="password"
              placeholder="••••••••••••••••"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full border border-line bg-panel px-3 py-1.5 font-mono text-xs outline-none focus:border-gold text-ink"
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-wide text-ink-faint">Authorized Enclave Address</span>
            <input
              type="text"
              value={enclaveAddress}
              onChange={(e) => setEnclaveAddress(e.target.value)}
              className="w-full border border-line bg-panel px-3 py-1.5 font-mono text-[10px] outline-none focus:border-gold text-ink"
            />
          </label>
        </div>

        {message && (
          <div
            className={`border p-2.5 rounded text-xs font-mono leading-relaxed ${
              status === "success"
                ? "border-success/40 bg-success/5 text-success"
                : "border-danger/40 bg-danger-tint text-danger"
            }`}
          >
            {message}
          </div>
        )}

        <button
          onClick={handleWriteSecret}
          disabled={status === "loading"}
          className="rounded bg-gold px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gold-hover disabled:opacity-50"
        >
          {status === "loading" ? "Writing to T3N Vault..." : "Save Secret to T3N KV Map"}
        </button>
      </div>
    </CornerFrame>
  );
}
