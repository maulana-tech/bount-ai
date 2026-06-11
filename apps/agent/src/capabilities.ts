/**
 * Registry kapabilitas — palet hal yang bisa dilakukan ven-AI, tiap satu
 * didukung layanan berbayar (via x402). Concierge memilih subset yang relevan
 * untuk tiap permintaan, jadi agent ini UMUM, bukan terbatas research+poster.
 *
 * Menambah kapabilitas = menambah satu entri di sini (plus harga di mock seller
 * / endpoint x402 nyata). Tidak ada logika yang di-hardcode ke tugas tertentu.
 */
export interface Capability {
  /** id stabil (dipakai sebagai AgentRole) */
  id: string;
  label: string;
  description: string;
  /** kata kunci untuk pemilihan heuristik (sampai Venice dipasang) */
  keywords: string[];
  /** estimasi biaya per pemakaian (USD) */
  unitCostUsd: number;
  /** produk yang dibeli dari seller x402 */
  product: string;
}

export const CAPABILITIES: Capability[] = [
  {
    id: "research",
    label: "Research",
    description: "Gather and summarize data, sources, and competitors",
    keywords: ["research", "competitor", "market", "analyze", "analysis", "find", "data", "compare", "audit", "investigate"],
    unitCostUsd: 2,
    product: "dataset",
  },
  {
    id: "writing",
    label: "Copywriting",
    description: "Write copy, summaries, posts, and emails",
    keywords: ["write", "copy", "summary", "summarize", "article", "post", "caption", "email", "blog", "pitch", "draft"],
    unitCostUsd: 1,
    product: "text",
  },
  {
    id: "image",
    label: "Image",
    description: "Generate images, posters, logos, and graphics",
    keywords: ["poster", "image", "picture", "logo", "graphic", "design", "illustration", "banner", "thumbnail", "art"],
    unitCostUsd: 5,
    product: "image",
  },
  {
    id: "video",
    label: "Video",
    description: "Generate short video clips and animations",
    keywords: ["video", "clip", "animation", "reel", "trailer", "motion"],
    unitCostUsd: 8,
    product: "video",
  },
  {
    id: "audio",
    label: "Audio",
    description: "Generate voiceover, music, and audio",
    keywords: ["audio", "voice", "voiceover", "music", "sound", "podcast", "narration", "song"],
    unitCostUsd: 3,
    product: "audio",
  },
  {
    id: "translate",
    label: "Translation",
    description: "Translate and localize text between languages",
    keywords: ["translate", "translation", "localize", "localization", "language", "multilingual"],
    unitCostUsd: 1,
    product: "text",
  },
];

export const CAP_BY_ID: Record<string, Capability> = Object.fromEntries(
  CAPABILITIES.map((c) => [c.id, c]),
);

/**
 * Pilih kapabilitas yang relevan untuk sebuah permintaan. Heuristik berbasis
 * kata kunci (dinamis — menangani permintaan apa pun). Fase 3: ganti dengan
 * reasoning Venice yang memilih + mengalokasikan budget.
 */
export function selectCapabilities(request: string): Capability[] {
  const q = request.toLowerCase();
  const scored = CAPABILITIES.map((c) => ({
    c,
    score: c.keywords.reduce((s, k) => (q.includes(k) ? s + 1 : s), 0),
  }));

  let picked = scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.c);

  // Tidak ada kecocokan → default aman: riset lalu tulis ringkasan.
  if (picked.length === 0) {
    picked = CAPABILITIES.filter((c) => c.id === "research" || c.id === "writing");
  }

  return picked.slice(0, 4);
}
