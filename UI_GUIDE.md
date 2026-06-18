# UI_GUIDE.md — Panduan Desain "Concierge"

> Arah visual & sistem desain untuk app hackathon (lihat `PROJECT.md` untuk produk, `CONTEXT.md` untuk brief).
> Disintesis dari 2 referensi: **Pantheon Trades** (gravitas, bukti on-chain, tema opinionated) + **iNMerge** (stack bersih, motif corner-frame, pola Lottie per-state).
> Status: draft. Token konkret di bawah = titik awal, boleh disetel.

---

## 0. Filosofi: "Instrumen, bukan chatbot"

App ini bukan AI chat — ini **panel kontrol keuangan** yang dijalankan AI. Maka UI harus berasa seperti **instrumen finansial yang presisi**: angka jadi bintang, tiap elemen punya fungsi, dekorasi minimum.

Tiga prinsip:
1. **Bukti, bukan klaim.** Tiap aksi agent muncul sebagai transaksi nyata (jumlah, tx hash, status, sisa budget). Curi pola "witness block" Pantheon.
2. **Angka itu sakral.** Semua uang / saldo / tx pakai **monospace**, rata kanan, presisi. Ini yang membedakan dari SaaS biasa.
3. **Disiplin > dekorasi.** Satu font, satu aksen, hairline rules, sudut tegas. Tahan godaan efek.

---

## 1. Anti-slop checklist (BACA SEBELUM NGODE)

Slop = UI yang keliatan di-generate. Hindari mati-matian:

- ❌ Gradient ungu/biru, glassmorphism, glow norak
- ❌ Palet default shadcn zinc tanpa identitas (inilah titik lemah iNMerge)
- ❌ Tumpukan efek Aceternity (sparkles, particles, glowing-stars, shimmer) — buang semua
- ❌ Emoji sebagai ikon UI
- ❌ Card rounded-2xl generik dengan drop-shadow lembut di mana-mana
- ❌ Warna biru sebagai primary (laut dApp — semua sama)

Sebaliknya:
- ✅ Satu aksen opinionated (di sini: **amber/gold**) + grayscale disiplin
- ✅ Motif **corner-frame** sebagai ciri khas (dari iNMerge)
- ✅ Monospace untuk semua angka
- ✅ Sudut tegas / radius kecil
- ✅ Hairline borders (1px) ketimbang shadow

---

## 2. Tema & warna

**Mode: Light** (default). Tapi BUKAN putih-stark generik (itu titik slop shadcn). Pakai **warm paper** — off-white hangat seperti kertas dokumen finansial/instrumen. Bersih, terpercaya, tenang. Dark mode opsional (stretch).

Palet: **netral hangat + satu aksen gold**. Di latar terang, gold dipertua jadi **bronze/amber pekat** biar kontras cukup untuk teks & tombol. Gold = brand & interaktif (echo gravitas Pantheon, sekaligus kabur dari laut biru dApp). Hijau/merah **hanya** untuk makna status, tidak pernah dekoratif.

```css
/* ---- Surfaces (warm paper ramp) ---- */
--bg:            #FFFFFF;   /* page background — white     */
--surface:       #F7F5F1;   /* panel (warm paper)          */
--surface-2:     #F0EDE7;   /* elevated / row hover        */
--border:        #E4E0D8;   /* hairline 1px (warm gray)    */
--border-strong: #C8C3B8;   /* corner brackets, dividers   */

/* ---- Text (warm near-black) ---- */
--text:          #1A1815;   /* primary                     */
--text-muted:    #6B675F;   /* secondary                   */
--text-faint:    #9A958A;   /* labels, captions            */

/* ---- Accent: GOLD/BRONZE (brand + interactive) ---- */
--accent:        #A86B1A;   /* buttons, links, focus, key numbers — pekat utk kontras */
--accent-hover:  #8A560F;
--accent-tint:   rgba(168,107,26,0.10);  /* subtle bg fill */

/* ---- Semantic status (RESERVED, jangan dipakai dekoratif) ---- */
--success:       #16A34A;   /* tx confirmed                */
--success-tint:  rgba(22,163,74,0.10);
--pending:       #A86B1A;   /* in-flight = gold/amber      */
--danger:        #DC2626;   /* error, limit reached, revoke */
--danger-tint:   rgba(220,38,38,0.08);
```

Aturan pakai warna:
- **Gold/bronze** = apa pun yang bisa diklik atau angka kunci (saldo utama). Hemat — kalau semua gold, nggak ada yang gold.
- **Hijau** = HANYA transaksi confirmed / sukses.
- **Merah** = HANYA error, limit kena, revoke.
- Sisanya: grayscale hangat.
- **Wajib:** latar = putih (`--bg`). Panel menggunakan warm paper (`--surface`) agar terlihat kontras dan memiliki karakter hangat seperti lembaran dokumen di atas meja putih.

---

## 3. Tipografi

- **Sans (teks/heading):** `Manrope` (sama seperti iNMerge — geometris, modern).
- **Mono (SEMUA angka, uang, address, tx hash, label teknis):** `Geist Mono` atau `JetBrains Mono`. Wajib untuk: saldo, jumlah pembayaran, gas, %, alamat wallet, hash.

```
Display   Manrope  32/40  600   -0.02em   (hero, judul besar)
H1        Manrope  24/32  600   -0.01em
H2        Manrope  18/26  600
Body      Manrope  14/22  400
Label     Manrope  12/16  500   0.02em  uppercase (caption/meta)
Mono-lg   Mono     20/28  500   tabular-nums  (saldo utama)
Mono      Mono     13/20  450   tabular-nums  (angka di feed/tabel)
Mono-sm   Mono     11/16  450   (tx hash, address truncated)
```

Selalu `font-variant-numeric: tabular-nums` untuk angka biar rata kolom.

---

## 4. Bentuk, jarak, density

- **Radius:** kecil & tegas. `--radius: 6px` untuk tombol/input. **Panel utama pakai sudut tegas (0px) + corner brackets** (lihat §5). Sudut tajam = berasa instrumen, bukan SaaS bulat.
- **Border:** hairline `1px solid var(--border)`. Hindari shadow; kalau perlu kedalaman, naikkan ke `--surface-2`.
- **Spacing:** skala 4px (4/8/12/16/24/32). Feed transaksi **padat** (row 40–44px). Hero/empty state **lega**.
- **Grid:** `max-w-7xl` center (sama iNMerge), padding luar 12–24px.

---

## 5. Motif signature: CornerFrame

Diadaptasi dari `CornerLayout` iNMerge — **ciri khas visual kita**. Tiap panel penting (budget, feed, delegasi) dibingkai garis rambut + kurung sudut L.

```
┌─                                              ─┐   ← bracket sudut (border-strong)
   BUDGET                          $39.00 / $50
   ▓▓▓▓▓▓▓▓░░░░░░  78% tersisa
└─                                              ─┘
```

Spesifikasi: garis vertikal kiri/kanan `1px var(--border)`; 4 kurung sudut `2px var(--border-strong)`, panjang ~24px. Konten di dalam. Bikin satu komponen `<CornerFrame>` lalu pakai ulang — JANGAN ulang markup-nya.

---

## 6. Komponen inti (yang harus dibikin)

Tiap komponen di-bungkus estetika §2–5.

1. **`<CornerFrame>`** — pembungkus panel bermotif sudut. Fondasi semua.
2. **BudgetMeter** — saldo besar (mono-lg, gold) + progress bar tipis + "$X / $Y" + tombol Revoke (danger, ghost). Ini elemen paling menonjol di layar.
3. **DelegationChain** — visual aliran budget `User → Concierge → [Agent]`. Node = chip mono dengan sub-cap. Garis penghubung tipis. Saat aktif, node menyala gold.
4. **ActivityFeed** — daftar langkah agent real-time. Tiap row:
   `● [agent]  aksi singkat ........  −$2.00  [status]`
   - dot status (gold pending → hijau confirmed)
   - jumlah mono rata kanan
   - status dari webhook 1Shot
   - expand → tx hash (mono-sm) + link explorer + gas USDC. **Ini "witness block" kita** (curi dari Pantheon).
5. **PromptBar** — input request, KECIL, di bawah. Satu baris + tombol Kirim (gold). Bukan bubble chat.
6. **ResultPanel** — hasil akhir (ringkasan teks + preview gambar/poster). Dibingkai CornerFrame.
7. **WalletConnect / GrantPermission** — pakai **RainbowKit** (dari iNMerge), tapi re-theme ke gold + warm paper. Modal grant: set cap, kategori, expiry.
8. **Badge / Chip** — status & kategori. Hairline border + tint, mono kecil, sudut tegas.
9. **Button** — primary (bg gold, teks gelap), ghost (border hairline), danger (border merah). Tanpa gradient/shadow.

---

## 7. Layout utama (dashboard)

Satu halaman. Chat kecil, on-chain dominan (lihat §0).

```
┌───────────────────────────────────────────────────────────────┐
│  ◆ Concierge        [BudgetMeter $39/$50 ▓▓▓░]      [Wallet ▾]  │
├──────────────────────────────────┬────────────────────────────┤
│  DelegationChain                 │  ResultPanel                │
│  User→Concierge→Research,Media   │  ┌───────────────────────┐  │
│                                  │  │  [poster preview]     │  │
│  ActivityFeed (live)             │  └───────────────────────┘  │
│  ● Research #1   −$2.00  ✓       │  Ringkasan riset:           │
│  ● Research #2   −$2.00  ✓       │  • Kompetitor A …           │
│  ● Build poster  −$5.00  ⋯       │  • Kompetitor B …           │
├──────────────────────────────────┴────────────────────────────┤
│  ▸ ketik permintaan…                                  [Kirim]  │
└───────────────────────────────────────────────────────────────┘
```

---

## 8. Motion (hemat, fungsional)

- **Lottie** (pola dari iNMerge) HANYA 2 momen: (a) "agent bekerja / generating", (b) "pembayaran confirmed". Jangan lebih.
- Transisi: fade/slide halus 150–200ms untuk row feed yang masuk. `framer-motion`.
- Status dot pending: pulse lembut. Itu saja.
- ❌ Tanpa parallax, particles, auto-marquee, sparkles.

---

## 9. Mapping ke kode

- **Stack** (ikut iNMerge, terbukti): Next.js 15 + Tailwind 3 + **shadcn/ui** + **RainbowKit + wagmi + viem** + framer-motion + lottie-react + sonner.
- **Reskin shadcn:** override CSS vars di `globals.css` dengan palet §2 (ganti zinc default → warm paper + gold). Set `--radius`. Ini satu file, dampak besar.
- **Font:** load `Manrope` + `Geist Mono` via `next/font`.
- **Komponen custom** (bukan dari shadcn): `CornerFrame`, `BudgetMeter`, `DelegationChain`, `ActivityFeed` row, witness-block expand.
- **Buang dari iNMerge:** semua efek Aceternity/Magic UI (sparkles, glowing-stars, shine-border, shimmer-button, tsparticles), palet zinc default.

---

## 10. Kredit referensi (apa yang diambil/dibuang)

| Sumber | Diambil ✅ | Dibuang ❌ |
|---|---|---|
| **Pantheon** | Gravitas, aksen gold, "witness block" tx, density lega, bukti on-chain | Tema kuil/Yunani harfiah (terlalu spesifik) |
| **iNMerge** | Stack (Next+shadcn+RainbowKit), motif `CornerFrame`, pola Lottie per-state, font Manrope | Palet zinc default, tumpukan efek Aceternity, layout light generik |

**Intinya:** secepat iNMerge buat dibangun, sekarakter Pantheon buat dilihat.
