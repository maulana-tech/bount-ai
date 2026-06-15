"use client";

import { useState, useRef, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { CornerFrame } from "@/components/CornerFrame";
import { MarkdownText } from "@/components/MarkdownText";
import { BudgetMeter } from "@/components/BudgetMeter";
import { runSpike } from "@/lib/agent";
import { getCustomAgents } from "@/lib/customAgents";
import { useBudget } from "@/lib/budget";
import type { AgentOutput } from "@concierge/shared";

interface Message {
  role: "user" | "assistant";
  text: string;
  outputs?: AgentOutput[];
  /** the request that produced this message — used as image caption */
  prompt?: string;
  ts: number;
}

const SUGGESTS = [
  "research the latest AI trends",
  "write a short product description for a coffee subscription service",
  "explain how smart accounts work",
  "create a poster concept for a music festival",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const budget = useBudget();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // auto-grow the textarea to fit its content (capped by max-h in CSS)
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [input]);

  async function handleSend(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    setError(null);

    const userMsg: Message = { role: "user", text: msg, ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const grant =
        budget.granted && budget.rootDelegation
          ? { rootDelegation: budget.rootDelegation, cap: budget.cap }
          : undefined;
      const result = await runSpike(msg, getCustomAgents(), grant);
      budget.applySpike(result);
      const combined =
        result.outputs?.map((o) => o.text ?? "").filter(Boolean).join("\n\n") ?? "";
      const hasImage = result.outputs?.some(
        (o) => o.type === "image" && o.imageUrl,
      );
      // Don't print "no output" when the result is image-only — show the image.
      const text = combined || (hasImage ? "" : "No text output for this request.");
      const assistantMsg: Message = {
        role: "assistant",
        text,
        outputs: result.outputs,
        prompt: msg,
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "request failed");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function retryLast() {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser) handleSend(lastUser.text);
  }

  // gather generated images across the conversation for the output panel
  const generatedImages = messages
    .flatMap((m) => m.outputs ?? [])
    .filter((o) => o.type === "image" && o.imageUrl);

  return (
    <div className="flex h-[100dvh] flex-col">
      <Navbar variant="app" />
      <main className="mx-auto grid w-full min-h-0 max-w-7xl flex-1 grid-cols-1 gap-4 px-4 py-6 xl:grid-cols-[14rem_minmax(0,1fr)_18rem]">
        {/* left — preview videos */}
        <aside className="hidden min-h-0 flex-col gap-4 overflow-y-auto pt-3 xl:flex">
          <PreviewVideo
            title="Agents"
            desc="Specialist capabilities the AI can delegate to."
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260429_115139_0fc6bd3d-3631-4d26-ab9b-28293887dcc9.mp4"
          />
          <PreviewVideo
            title="Delegation"
            desc="On-chain budget delegation via ERC-7710 + x402."
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260424_064411_9e9d7f84-9277-41f4-ab10-59172d89e6be.mp4"
          />
          <PreviewVideo
            title="Chat"
            desc="Real AI responses with markdown and image support."
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_171521_25968ba2-b594-4b32-aab7-f6b69398a6fa.mp4"
          />
        </aside>

        {/* center — chat */}
        <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-col">
        <CornerFrame
          label="Chat"
          className="flex min-h-0 flex-1 flex-col"
          bodyClassName="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex min-h-0 flex-1 flex-col">
            {/* header */}
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center font-mono text-xs text-gold">
                  [AI]
                </span>
                <span className="text-sm font-medium tracking-tight">Agent</span>
                <span className="h-1.5 w-1.5 rounded-full bg-green-500/60" />
              </div>
              {messages.length > 0 && (
                <button
                  onClick={() => { setMessages([]); setError(null); }}
                  className="font-mono text-[11px] uppercase tracking-wide text-ink-faint transition-colors hover:text-ink"
                >
                  clear
                </button>
              )}
            </div>

            {/* messages */}
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-4">
              {messages.length === 0 && !error && (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="mb-6 text-xs text-ink-faint">
                    send a message to start
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {SUGGESTS.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSend(s)}
                        disabled={loading}
                        className="rounded-full border border-line px-3 py-1.5 font-mono text-[11px] text-ink-muted transition-colors hover:border-line-strong hover:text-ink disabled:opacity-50"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex animate-fade-in flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
                >
                  <span className="mb-1 px-1 font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                    {m.role === "user" ? "you" : "agent"}
                  </span>
                  <div
                    className={`max-w-[80%] rounded border p-4 ${
                      m.role === "user"
                        ? "border-gold/40 bg-gold-tint"
                        : "border-line bg-panel"
                    }`}
                  >
                    {m.role === "user" ? (
                      <p className="text-sm leading-relaxed text-ink">{m.text}</p>
                    ) : (
                      <div className="text-sm leading-relaxed text-ink-muted">
                        {m.text && <MarkdownText text={m.text} />}
                        {m.outputs?.map((o, oi) =>
                          o.type === "image" && o.imageUrl ? (
                            <ImageCard
                              key={oi}
                              src={o.imageUrl}
                              caption={m.prompt ?? o.label}
                            />
                          ) : null,
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex animate-fade-in flex-col items-start">
                  <span className="mb-1 px-1 font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                    agent
                  </span>
                  <div className="rounded border border-line bg-panel p-4">
                    <span className="typing-dots text-sm text-ink-faint" />
                  </div>
                </div>
              )}

              {error && (
                <div className="flex animate-fade-in flex-col items-start">
                  <div className="rounded border border-danger/30 bg-danger/5 p-4">
                    <p className="mb-2 font-mono text-xs text-danger">{error}</p>
                    <button
                      onClick={retryLast}
                      className="font-mono text-[11px] uppercase tracking-wide text-ink-muted transition-colors hover:text-ink"
                    >
                      retry
                    </button>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* input */}
            <div className="border-t border-line pt-4">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex items-end gap-2 rounded-lg border border-line bg-panel p-2 transition-colors focus-within:border-gold/50"
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={1}
                  placeholder="ask the agent anything…"
                  className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2.5 text-sm leading-relaxed outline-none placeholder:text-ink-faint disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="h-11 shrink-0 rounded-md bg-gold px-5 text-sm font-medium text-white transition-colors hover:bg-gold-hover disabled:opacity-50"
                >
                  Send
                </button>
              </form>
              <p className="mt-2 px-1 font-mono text-[10px] text-ink-faint">
                Enter to send · Shift+Enter for new line
              </p>
            </div>
          </div>
        </CornerFrame>
        </div>

        {/* right — budget + generated output + history */}
        <aside className="hidden min-h-0 flex-col gap-4 overflow-y-auto pt-3 xl:flex">
          <BudgetMeter
            spent={budget.spent}
            cap={budget.cap}
            onRevoke={budget.revoke}
          />
          <OutputPanel images={generatedImages} />
          <HistoryPanel
            messages={messages}
            onPick={(t) => handleSend(t)}
            loading={loading}
          />
        </aside>
      </main>
    </div>
  );
}

function ImageCard({ src, caption }: { src: string; caption: string }) {
  const [busy, setBusy] = useState(false);
  const filename = `ven-ai-${caption.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "image"}.webp`;

  async function share() {
    setBusy(true);
    try {
      const blob = await (await fetch(src)).blob();
      const file = new File([blob], filename, { type: blob.type || "image/webp" });
      const nav = navigator as Navigator & {
        canShare?: (d: ShareData) => boolean;
      };
      if (nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: "ven-AI", text: caption });
      } else {
        window.open(src, "_blank");
      }
    } catch {
      window.open(src, "_blank");
    } finally {
      setBusy(false);
    }
  }

  return (
    <figure className="mt-3 overflow-hidden rounded border border-line bg-panel">
      <img src={src} alt={caption} className="block w-full" />
      <figcaption className="flex items-center justify-between gap-2 border-t border-line bg-panel-2/40 px-3 py-2">
        <span className="truncate text-[11px] italic text-ink-muted" title={caption}>
          {caption}
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={share}
            disabled={busy}
            className="rounded border border-line px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-ink-muted transition-colors hover:border-gold/50 hover:text-ink disabled:opacity-50"
          >
            Share
          </button>
          <a
            href={src}
            download={filename}
            className="rounded border border-line px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-ink-muted transition-colors hover:border-gold/50 hover:text-ink"
          >
            Download
          </a>
        </div>
      </figcaption>
    </figure>
  );
}

function PreviewVideo({
  title,
  desc,
  src,
}: {
  title: string;
  desc: string;
  src: string;
}) {
  return (
    <div className="flex flex-col border border-line bg-panel">
      <div className="relative border-b border-line bg-panel-2/50">
        <div className="aspect-[16/9] animate-pulse bg-line/30" />
        <video
          src={src}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
      <div className="p-3">
        <h3 className="text-xs font-semibold tracking-tight">{title}</h3>
        <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">{desc}</p>
      </div>
    </div>
  );
}

function OutputPanel({ images }: { images: AgentOutput[] }) {
  return (
    <CornerFrame label="Output">
      {images.length === 0 ? (
        <p className="py-6 text-center text-[11px] leading-relaxed text-ink-faint">
          Generated images appear here.
        </p>
      ) : (
        <div className="grid gap-2">
          {images.map((o, i) => (
            <a
              key={i}
              href={o.imageUrl}
              target="_blank"
              rel="noreferrer"
              className="group block overflow-hidden rounded border border-line"
            >
              <img
                src={o.imageUrl}
                alt={o.label}
                className="w-full object-cover transition-transform group-hover:scale-[1.02]"
              />
            </a>
          ))}
        </div>
      )}
    </CornerFrame>
  );
}

function HistoryPanel({
  messages,
  onPick,
  loading,
}: {
  messages: Message[];
  onPick: (text: string) => void;
  loading: boolean;
}) {
  const prompts = messages.filter((m) => m.role === "user");
  if (prompts.length === 0) return null;
  return (
    <CornerFrame label="History">
      <ul className="space-y-1.5">
        {prompts
          .slice()
          .reverse()
          .map((m, i) => (
            <li key={i}>
              <button
                onClick={() => onPick(m.text)}
                disabled={loading}
                title={m.text}
                className="block w-full truncate text-left font-mono text-[11px] text-ink-muted transition-colors hover:text-ink disabled:opacity-50"
              >
                {m.text}
              </button>
            </li>
          ))}
      </ul>
    </CornerFrame>
  );
}
