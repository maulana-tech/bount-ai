import { CAPABILITIES, type Capability } from "./shared.js";
import { config } from "./config.js";

/**
 * Logika pemilihan kapabilitas. Data registry bawaan ada di `@concierge/shared`;
 * agent custom buatan user dikirim per-permintaan dan digabung ke `pool`.
 */

/**
 * Pilih kapabilitas yang relevan untuk sebuah permintaan dari `pool` (bawaan +
 * custom). Kalau VENICE_API_KEY tersedia, pakai Venice AI untuk milih; fallback
 * ke heuristik keyword.
 */
export async function selectCapabilities(
  request: string,
  pool: Capability[] = CAPABILITIES,
): Promise<Capability[]> {
  if (config.venice.apiKey) {
    try {
      return await veniceSelect(request, pool);
    } catch (err) {
      console.warn("[selectCapabilities] Venice selection failed, falling back to heuristics:", err);
    }
  }
  return heuristicSelect(request, pool);
}

/** Pilih kapabilitas via Venice AI — paham konteks, bisa milih yang relevan */
async function veniceSelect(
  request: string,
  pool: Capability[],
): Promise<Capability[]> {
  const catalog = pool
    .map((c) => `- ${c.id}: ${c.description} (keywords: ${c.keywords.join(", ")})`)
    .join("\n");

  const system = `Kamu adalah planner AI. Dari daftar kapabilitas berikut, pilih 1-4 yang PALING relevan untuk permintaan user. Balas hanya dengan JSON array of ids, misal: ["research","writing"]\n\nDaftar kapabilitas:\n${catalog}`;

  const res = await fetch(`${config.venice.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.venice.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.venice.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: request },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Venice select ${res.status}`);

  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  const text = data.choices?.[0]?.message?.content ?? "";
  console.log("[Venice Select] Raw response:", text);

  const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
  const ids: string[] = JSON.parse(cleanedText);
  const byId = new Map(pool.map((c) => [c.id, c]));
  return ids.map((id) => byId.get(id)).filter(Boolean) as Capability[];
}

/** Heuristik keyword — fallback kalau Venice gak tersedia / error */
function heuristicSelect(
  request: string,
  pool: Capability[],
): Capability[] {
  const q = request.toLowerCase();
  const scored = pool.map((c) => {
    let score = 0;
    if (c.id && q.includes(c.id.toLowerCase())) score += 2;
    if (c.label && q.includes(c.label.toLowerCase())) score += 2;

    score += c.keywords.reduce(
      (s, k) => (k && q.includes(k.toLowerCase()) ? s + 1 : s),
      0,
    );
    return { c, score };
  });

  let picked = scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.c);

  if (picked.length === 0) {
    const generalAgent = pool.find((c) => c.id === "writing") || pool[0];
    picked = generalAgent ? [generalAgent] : [];
  }

  return picked.slice(0, 4);
}
