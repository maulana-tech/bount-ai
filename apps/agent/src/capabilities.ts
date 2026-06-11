import { CAPABILITIES, type Capability } from "@concierge/shared";

/**
 * Logika pemilihan kapabilitas. Data registry-nya tinggal di `@concierge/shared`
 * (dipakai bersama web). Di sini: index by id + pemilih heuristik.
 */

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
