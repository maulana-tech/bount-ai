/**
 * Registry specialist agent (kapabilitas) — palet hal yang bisa dilakukan
 * bount-AI, tiap satu didukung layanan berbayar (via x402). Concierge memilih
 * subset yang relevan untuk tiap permintaan, jadi agent ini UMUM.
 *
 * Dipakai bersama: web (halaman Agents) menampilkannya; agent memilih + memberi
 * harga. Menambah agent = menambah satu entri di sini.
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
  /** wallet pembuat (agent custom) — pembayaran x402 mengalir ke sini */
  creator?: string;
}

export const CAPABILITIES: Capability[] = [
  {
    id: "research",
    label: "Research",
    description: "Gather and summarize data, sources, and competitors",
    keywords: ["research", "competitor", "market", "analyze", "analysis", "find", "data", "compare", "audit", "investigate"],
    unitCostUsd: 0.5,
    product: "dataset",
  },
  {
    id: "writing",
    label: "Copywriting",
    description: "Write copy, summaries, posts, and emails",
    keywords: ["write", "copy", "summary", "summarize", "article", "post", "caption", "email", "blog", "pitch", "draft"],
    unitCostUsd: 0.2,
    product: "text",
  },
  {
    id: "image",
    label: "Image",
    description: "Generate images, posters, logos, and graphics",
    keywords: ["poster", "image", "picture", "logo", "graphic", "design", "illustration", "banner", "thumbnail", "art"],
    unitCostUsd: 0.8,
    product: "image",
  },
  {
    id: "video",
    label: "Video",
    description: "Generate short video clips and animations",
    keywords: ["video", "clip", "animation", "reel", "trailer", "motion"],
    unitCostUsd: 1,
    product: "video",
  },
  {
    id: "audio",
    label: "Audio",
    description: "Generate voiceover, music, and audio",
    keywords: ["audio", "voice", "voiceover", "music", "sound", "podcast", "narration", "song"],
    unitCostUsd: 0.5,
    product: "audio",
  },
  {
    id: "translate",
    label: "Translation",
    description: "Translate and localize text between languages",
    keywords: ["translate", "translation", "localize", "localization", "language", "multilingual"],
    unitCostUsd: 0.2,
    product: "text",
  },
];
