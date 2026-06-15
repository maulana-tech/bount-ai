"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import type { Capability } from "@concierge/shared";
import { CornerFrame } from "./CornerFrame";
import { addCustomAgent, makeAgentId } from "@/lib/customAgents";

/**
 * Form pendaftaran specialist agent custom. "Form → masuk katalog": agent baru
 * langsung tersimpan (localStorage) dan bisa dipilih AI pada permintaan
 * berikutnya. Pembayaran tetap via mock seller (settlement disimulasi).
 */
export function CreateAgentForm({
  onCreated,
  onCancel,
}: {
  onCreated: (list: Capability[]) => void;
  onCancel: () => void;
}) {
  const { address } = useAccount();
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [cost, setCost] = useState("0.5");
  const [product, setProduct] = useState("dataset");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    const agent: Capability = {
      id: makeAgentId(label),
      label: label.trim(),
      description: description.trim() || "Custom agent",
      keywords: keywords
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean),
      unitCostUsd: Math.min(Math.max(Number(cost) || 1, 0.1), 100),
      product: product.trim() || "custom",
      ...(address ? { creator: address } : {}),
    };
    onCreated(addCustomAgent(agent));
  }

  return (
    <CornerFrame label="New agent">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. SEO Auditor"
              className={inputCls}
              autoFocus
            />
          </Field>
          <Field label="Cost per use (USD)">
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className={`${inputCls} font-mono tnum`}
            />
          </Field>
        </div>

        <Field label="Description">
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What this agent does"
            className={inputCls}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Keywords (comma-separated)">
            <input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="seo, audit, ranking"
              className={inputCls}
            />
          </Field>
          <Field label="Pays for (service)">
            <input
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="dataset"
              className={`${inputCls} font-mono`}
            />
          </Field>
        </div>

        <p className="font-mono text-[11px] text-ink-faint">
          {address ? (
            <>
              earnings go to{" "}
              <span className="text-ink-muted">
                {address.slice(0, 6)}…{address.slice(-4)}
              </span>{" "}
              — others pay this wallet when they use your agent
            </>
          ) : (
            "connect a wallet to earn when others use this agent (optional)"
          )}
        </p>
        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            className="rounded bg-gold px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-gold-hover"
          >
            Add agent
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-line px-4 py-1.5 text-sm text-ink-muted transition-colors hover:bg-panel-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </CornerFrame>
  );
}

const inputCls =
  "w-full border border-line bg-panel px-3 py-2 text-sm outline-none transition-colors focus:border-gold placeholder:text-ink-faint";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-ink-faint">
        {label}
      </span>
      {children}
    </label>
  );
}
