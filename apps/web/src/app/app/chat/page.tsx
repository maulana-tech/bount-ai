"use client";

import { useState, useRef, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { CornerFrame } from "@/components/CornerFrame";
import { MarkdownText } from "@/components/MarkdownText";
import { runSpike } from "@/lib/agent";
import { getCustomAgents } from "@/lib/customAgents";
import type { AgentOutput } from "@concierge/shared";

interface Message {
  role: "user" | "assistant";
  text: string;
  outputs?: AgentOutput[];
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
      const result = await runSpike(msg, getCustomAgents());
      const combined =
        result.outputs?.map((o) => o.text ?? "").filter(Boolean).join("\n\n") ?? "";
      const assistantMsg: Message = {
        role: "assistant",
        text: combined || "no output",
        outputs: result.outputs,
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

  return (
    <div className="flex h-[100dvh] flex-col">
      <Navbar variant="app" />
      <main className="mx-auto flex w-full min-h-0 max-w-3xl flex-1 flex-col px-4 py-6">
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
                        <MarkdownText text={m.text} />
                        {m.outputs?.map(
                          (o) =>
                            o.type === "image" &&
                            o.imageUrl && (
                              <img
                                key={o.label}
                                src={o.imageUrl}
                                alt={o.label}
                                className="mt-3 w-full rounded border border-line"
                              />
                            ),
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
      </main>
    </div>
  );
}
