import { Hono } from "hono";
import type { Capability } from "../shared.js";
import { runSpike } from "../spike.js";
import { getCapabilities } from "../integrations/oneshot.js";

/** Sanitasi agent custom yang dikirim klien (jangan percaya input mentah). */
function sanitizeAgents(raw: unknown): Capability[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((x): Capability[] => {
    if (!x || typeof x !== "object") return [];
    const o = x as Record<string, unknown>;
    const id = String(o.id ?? "").trim().slice(0, 48);
    const label = String(o.label ?? "").trim().slice(0, 48);
    if (!id || !label) return [];
    const cost = Number(o.unitCostUsd);
    return [
      {
        id,
        label,
        description: String(o.description ?? "").slice(0, 240),
        keywords: Array.isArray(o.keywords)
          ? o.keywords.map((k) => String(k)).slice(0, 24)
          : [],
        unitCostUsd: Number.isFinite(cost)
          ? Math.min(Math.max(cost, 0.1), 100)
          : 1,
        product: String(o.product ?? "custom").slice(0, 32),
      },
    ];
  });
}

/** POST /spike { request, capabilities? } → SpikeResult. Vertical-slice Fase 2. */
export const spikeRoute = new Hono()
  .post("/", async (c) => {
    const body = await c.req
      .json<{ request?: string; capabilities?: unknown }>()
      .catch(() => ({}) as { request?: string; capabilities?: unknown });
    const request =
      body.request?.trim() || "research 3 competitors, then make a poster";
    const result = await runSpike(request, sanitizeAgents(body.capabilities));
    return c.json(result);
  })
  // GET /spike/capabilities — probe 1Shot relayer (null bila belum dikonfigurasi).
  .get("/capabilities", async (c) => {
    const caps = await getCapabilities();
    return c.json({ configured: caps !== null, capabilities: caps });
  });
