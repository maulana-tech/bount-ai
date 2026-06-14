"use client";

import { useState, useRef, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { MarkdownText } from "@/components/MarkdownText";
import { runSpike } from "@/lib/agent";
import { getCustomAgents } from "@/lib/customAgents";
import type { AgentOutput } from "@concierge/shared";

interface Message {
  role: "user" | "assistant";
  text: string;
  outputs?: AgentOutput[];
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const userMsg: Message = { role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const result = await runSpike(text, getCustomAgents());
      const combined =
        result.outputs?.map((o) => o.text ?? "").filter(Boolean).join("\n\n") ??
        "no output";
      const assistantMsg: Message = {
        role: "assistant",
        text: combined,
        outputs: result.outputs,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errMsg: Message = {
        role: "assistant",
        text: "agent error — is the agent running?",
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar variant="app" />
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-tight">Chat</h1>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="font-mono text-[11px] uppercase tracking-wide text-ink-faint transition-colors hover:text-ink"
            >
              clear
            </button>
          )}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto pb-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center py-16">
              <p className="text-xs text-ink-faint">send a message to start</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
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
                  <div className="prose-custom text-sm leading-relaxed text-ink-muted">
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
            <div className="flex justify-start">
              <div className="rounded border border-line bg-panel p-4">
                <p className="text-sm text-ink-faint">thinking…</p>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-line pt-4">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder="ask the agent anything…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink-faint disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded bg-gold px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-gold-hover disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
