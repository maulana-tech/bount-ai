import { CAPABILITIES, type Capability } from "./shared.js";

/**
 * Logika pemilihan kapabilitas. Data registry bawaan ada di `@concierge/shared`;
 * agent custom buatan user dikirim per-permintaan dan digabung ke `pool`.
 */

/**
 * Pilih kapabilitas yang relevan untuk sebuah permintaan dari `pool` (bawaan +
 * custom). Heuristik berbasis kata kunci (dinamis — menangani permintaan apa
 * pun). Fase 3: ganti dengan reasoning Venice yang memilih + mengalokasi budget.
 */
export function selectCapabilities(
  request: string,
  pool: Capability[] = CAPABILITIES,
): Capability[] {
  const q = request.toLowerCase();
  const scored = pool.map((c) => ({
    c,
    score: c.keywords.reduce(
      (s, k) => (k && q.includes(k.toLowerCase()) ? s + 1 : s),
      0,
    ),
  }));

  let picked = scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.c);

  // Tidak ada kecocokan → default aman: riset + tulis ringkasan, atau dua
  // entri pertama pool bila pool custom-only.
  if (picked.length === 0) {
    picked = pool.filter((c) => c.id === "research" || c.id === "writing");
    if (picked.length === 0) picked = pool.slice(0, 2);
  }

  return picked.slice(0, 4);
}
