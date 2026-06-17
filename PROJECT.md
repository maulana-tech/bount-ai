# PROJECT.md — AI Concierge dengan Agent Delegation Chain

> Spec produk & teknis untuk submission hackathon MetaMask Smart Accounts Kit × 1Shot API.
> Brief mentah hackathon ada di `CONTEXT.md`. Dokumen ini = rencana detail.
> Status: **draft / pre-build**. Tanda ⚠️ = asumsi yang HARUS diverifikasi ke docs sebelum dibangun.

---

## 1. Ringkasan

**Nama kerja:** Concierge (ganti nanti).

**Satu kalimat:** User memberi satu AI Concierge sebuah budget dan izin terbatas; Concierge memakai Venice AI untuk merencanakan tugas, lalu **mendelegasikan ulang (redelegate) sub-budget ke agent-agent spesialis** yang membayar layanan sendiri lewat x402 — seluruh gas dibayar stablecoin via 1Shot relayer.

**Masalah yang dijawab:** Hari ini, memberi AI agent kemampuan membayar = memberi private key / wallet penuh (bahaya). Stack ini memungkinkan **izin terprogram & terbatas**: agent bisa transaksi otonom, tapi user tetap pegang kontrol (limit, kategori, durasi, bisa dicabut).

**Kenapa "delegation chain" itu inti, bukan tempelan:** Alur Concierge → sub-agent → bayar layanan adalah satu rangkaian natural. Redelegation bukan fitur tambahan — itu mekanisme bagaimana budget mengalir dari user ke eksekusi.

---

## 2. Strategi track (kenapa satu app, banyak hadiah)

Tiap track dinilai terpisah, jadi satu project bisa di-submit ke beberapa track. Target:

| Track | Hadiah | Bagaimana app ini memenuhinya |
|---|---|---|
| **Best Agent** (main) | $3k | Concierge bertindak otonom atas nama user via Advanced Permissions |
| **Best A2A Coordination** (main) | $3k | Concierge **redelegate** sub-budget ke ResearchAgent & MediaAgent |
| **Best x402 + ERC-7710** (main) | $3k | Sub-agent membayar layanan via x402 menggunakan delegasi 7710 |
| **Best use of Venice AI** (bonus) | $3k | Venice = otak perencanaan + generator output (teks/gambar) |
| **Best Use of 1Shot Relayer** (bonus) | $1k | Relay 7710 via 1Shot, gas USDC, 7702 upgrade, status via webhook |

> Catatan eligibility: bonus track (Venice, 1Shot) **wajib** juga qualify salah satu main track — app ini qualify ketiganya, jadi aman. ⚠️ Konfirmasi apakah satu submission boleh masuk >1 main track sekaligus; kalau hanya boleh 1, pilih **Best A2A** sebagai primary (paling unik & sulit ditiru).

---

## 3. Aktor & komponen

### 3.1 Aktor
- **User** — manusia pemilik dana. Pegang MetaMask, set budget & izin, lihat hasil.
- **Concierge Agent** — agent utama (orchestrator). Punya izin dari user. Tidak menyimpan dana; ia memegang *delegasi*.
- **Specialist Agents** — sub-agent yang menerima redelegasi:
  - `ResearchAgent` — beli/akses data berbayar via x402, rangkum pakai Venice text.
  - `MediaAgent` — generate gambar/poster pakai Venice image (berbayar via x402).
  - (stretch) `ext.` agent lain sesuai kebutuhan.

### 3.2 Komponen sistem
```
┌────────────┐   grant ERC-7715    ┌──────────────────┐
│   User     │ ──────────────────► │ Concierge (orch.)│
│ (MetaMask) │   budget + scope    │  + Venice (plan) │
└────────────┘                     └────────┬─────────┘
                                            │ redelegate ERC-7710
                            ┌───────────────┴───────────────┐
                            ▼                               ▼
                    ┌───────────────┐               ┌───────────────┐
                    │ ResearchAgent │               │  MediaAgent   │
                    │ x402 + Venice │               │ x402 + Venice │
                    └───────┬───────┘               └───────┬───────┘
                            │  semua on-chain tx            │
                            └──────────────┬───────────────┘
                                           ▼
                              ┌──────────────────────────┐
                              │  1Shot Permissionless     │
                              │  Relayer (gas in USDC,    │
                              │  7702 upgrade, webhooks)  │
                              └──────────────────────────┘
```

---

## 4. Konsep teknis yang dipakai (dengan definisi)

- **ERC-7715 (Advanced Permissions):** dApp meminta izin terbatas dari user lewat MetaMask (`wallet_grantPermissions` ⚠️). User approve sekali; app dapat "permission context" untuk eksekusi atas nama user dalam batas yang disetujui (limit jumlah, kategori, kadaluarsa).
- **ERC-7710 (Delegation/Redelegation):** mekanisme on-chain agar pemegang delegasi bisa mengeksekusi atas nama akun lain — dan **meneruskan (redelegate)** sebagian wewenang ke pihak lain dengan caveat/limit lebih ketat. Inti dari A2A.
- **ERC-7702:** otorisasi agar EOA biasa "di-upgrade" jadi smart account. Dipakai 1Shot saat pertama kali agar akun bisa pakai fitur smart-account.
- **x402:** protokol pembayaran berbasis HTTP 402 — layanan balas `402 Payment Required`, klien bayar (micropayment stablecoin) lalu request diulang & dilayani. Cocok untuk agent bayar-per-pakai.
- **1Shot Permissionless Relayer:** meneruskan transaksi 7710 ke mainnet, gas dibayar stablecoin (USDC/USDT/dll), handle 7702 upgrade, kirim **webhook** untuk status tx.
- **Venice AI:** API OpenAI-compatible, multimodal (teks/gambar/audio/video), privasi-first. Dipakai untuk reasoning + generasi output.

---

## 5. Alur utama (end-to-end) — ini juga skrip demo

**Skenario contoh:** User minta *"Riset 3 kompetitor produk X, lalu buat 1 poster ringkasannya."*

1. **Connect & grant.** User connect MetaMask. App minta Advanced Permission (ERC-7715): plafon `$50 USDC`, kategori `riset+media`, kadaluarsa `24 jam`. User approve sekali.
   - *(Pertama kali: 1Shot melakukan 7702 upgrade akun user/agent.)* ⚠️ konfirmasi siapa yang di-upgrade.
2. **Plan (Venice).** Concierge kirim prompt ke Venice → dapat rencana terstruktur: `[research: 3 sumber], [media: 1 poster]`, plus estimasi biaya per sub-tugas.
3. **Redelegate (ERC-7710).** Concierge redelegate: `ResearchAgent` dapat plafon `$30`, `MediaAgent` dapat `$20`, masing-masing dengan caveat (hanya boleh bayar endpoint x402 tertentu). ⚠️ verifikasi cara set caveat di Delegation Toolkit.
4. **Eksekusi ResearchAgent.** Untuk tiap sumber data: panggil endpoint → terima `402` → bayar via x402 (relay 1Shot, gas USDC) → terima data → Venice text merangkum.
5. **Eksekusi MediaAgent.** Panggil Venice image-gen (berbayar via x402) → terima poster.
6. **Status real-time.** UI dengar **webhook 1Shot** → tampilkan tiap tx: pending → confirmed, dengan biaya gas USDC.
7. **Hasil.** User lihat: ringkasan riset + poster + jejak audit lengkap (siapa membayar apa, berapa, sisa budget). User bisa **revoke** izin kapan saja.

**Yang harus terlihat jelas di video demo:** (a) approval permission di MetaMask, (b) redelegation terjadi, (c) pembayaran x402 nyata on-chain, (d) penggunaan Venice di alur utama, (e) status via 1Shot webhook.

---

## 6. Permission & delegation model (detail)

- **Tingkat 1 — User → Concierge (ERC-7715):** scope paling luas tapi dibatasi: total cap, kategori, expiry. Disetujui manusia di MetaMask.
- **Tingkat 2 — Concierge → Specialist (ERC-7710 redelegation):** subset dari Tingkat 1. Caveat lebih ketat: sub-cap per agent, whitelist endpoint/penerima, single-purpose. Tidak butuh klik manusia (Concierge mengeksekusi otomatis dalam batas Tingkat 1).
- **Prinsip keamanan:** tiap turun level, wewenang hanya boleh **menyempit**, tak pernah melebar. Total pengeluaran semua sub-agent ≤ cap user. Sisa budget & revoke selalu di tangan user.
- ⚠️ **Verifikasi:** apakah redelegation di Delegation Toolkit mendukung caveat granular (spending limit + target whitelist) secara native, atau perlu enforcer custom.

---

## 7. Arsitektur teknis (rencana)

> Belum dibangun — ini proposal. Final stack ditentukan di langkah berikut.

- **Frontend:** Next.js (App Router) + React + Tailwind. Satu halaman utama: grant permission, input request, live status, hasil.
- **Wallet/chain lib:** `viem` + MetaMask **Delegation Toolkit** (Smart Accounts Kit). Signer: MetaMask extension (signer-agnostic, bisa diganti Privy/Dynamic kalau perlu).
- **Agent orchestration:** server-side (Next.js route handlers / Node worker). Concierge & specialist sebagai modul logika, bukan harus proses terpisah (MVP: satu service, peran berbeda).
- **AI:** Venice API (OpenAI-compatible SDK) — endpoint text untuk planning+summary, endpoint image untuk poster.
- **Payments:** klien x402 (HTTP 402 handler) untuk memanggil layanan berbayar. ⚠️ cek apakah ada lib x402 resmi / contoh facilitator 7710.
- **Relayer:** 1Shot API untuk submit tx + 7702 upgrade. Webhook receiver (route handler) → push ke UI via SSE/websocket.
- **Chain:** ⚠️ tentukan — 1Shot relayer "mainnet" disebut di brief; cek testnet yang didukung untuk dev.

**Komponen yang perlu diputuskan / diverifikasi sebelum coding:**
1. ⚠️ Endpoint x402 mana yang dipakai untuk "data berbayar" di ResearchAgent — apakah Venice sendiri punya endpoint x402, atau perlu mock seller sendiri.
2. ⚠️ Apakah perlu deploy smart contract sendiri (delegation enforcer) atau cukup yang sudah ada di Delegation Toolkit.
3. ⚠️ Chain + RPC + faucet untuk testing.

---

## 8. Scope MVP vs stretch

### MVP (versi paling minimal yang TETAP nge-cover semua track)
- 1 Concierge + **2** specialist agent (Research + Media).
- 1 skenario hardcoded-ish (request bebas, tapi rencana sederhana).
- Redelegation 1 tingkat (user→concierge→specialist).
- Venice: 1 text call (plan+summary) + 1 image call.
- x402: minimal 1 pembayaran nyata per agent.
- 1Shot: relay + 1 webhook status di UI.
- UI: satu halaman, jejak audit budget sederhana.

### Stretch (kalau waktu sisa)
- Agent ke-3+ dinamis (Concierge putuskan butuh agent apa).
- Multi-level redelegation (specialist redelegate lagi).
- Recurring/streaming payment (x402 recurring).
- Multimodal lebih (Venice audio/video).
- Dashboard analitik pengeluaran.

---

## 9. Risiko & mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Redelegation toolkit belum support caveat granular | Tinggi | Verifikasi paling awal (hari 1); fallback: enforcer custom sederhana atau cap di level app |
| x402 seller untuk "data" tak tersedia | Sedang | Bikin mock seller endpoint sendiri yang balas 402 |
| Integrasi 1Shot mainnet butuh dana nyata | Sedang | Cek mode testnet; siapkan stablecoin kecil; ⚠️ konfirmasi |
| Scope kebesaran untuk waktu hackathon | Tinggi | Pegang MVP §8; semua di luar itu = stretch |
| Demo video harus tunjukkan semua integrasi | Sedang | Tulis skrip demo dari §5 lebih awal, rekam alur happy-path |

---

## 10. Temuan Fase 0 (riset docs — sudah dijawab)

Hasil riset docs resmi MetaMask / 1Shot / Venice. Confidence dari sumber yang dibaca.

- **Redelegation + caveat granular — DIDUKUNG (risiko #1 hilang).** Redelegation lewat argumen `parentDelegation` di `createDelegation()`; child delegation `from` = delegate sebelumnya, dan **hanya bisa menyempit** wewenang (caveat menumpuk, tak bisa dihapus). Enforcer yang ada:
  - Spending limit: `nativeTokenTransferAmount` (`NativeTokenTransferAmountEnforcer`), `erc20TransferAmount` (`ERC20TransferAmountEnforcer`), plus varian periodic/streaming.
  - Whitelist: `allowedTargets` (`AllowedTargetsEnforcer`), `allowedMethods`, `allowedCalldata`.
  - Dipasang via `createCaveatBuilder()` → `.addCaveat("allowedTargets", [...])`; berlaku juga pada redelegation.
  - ⚠️ Verifikasi ejaan string builder ke types `@metamask/delegation-toolkit` saat coding.
  - **Fallback** kalau redelegation rewel: 1 *direct delegation* per agent dari EOA root (paling terdokumentasi); escape hatch terakhir: custom caveat enforcer.
- **7702 upgrade kena EOA USER.** Di flow browser ERC-7715, **wallet** yang melakukan 7702 — JANGAN tambahkan `authorizationList` ke payload relayer. Agent = delegate/redeemer, bukan akun yang di-upgrade.
- **Venice = x402-native + OpenAI-compatible.** Base URL `https://api.venice.ai/api/v1`; chat `POST /chat/completions`; image `POST /image/generate`. x402: bayar per-request **USDC di Base** (header SIWX → `POST /x402/top-up` balas 402 → retry dgn `X-402-Payment`). Model id ambil dari `GET /api/v1/models` (jangan hardcode).
- **ERC-7715 grant** = RPC `wallet_grantPermissions`; tipe izin: `native-token-stream`, `native-token-periodic`, `erc20-token-stream`, `erc20-token-periodic`, `erc20-token-allowance`, `erc20-revocation`. **Snaps ERC-7715 hanya jalan di Sepolia.**
- **Chain:** Toolkit support banyak EVM (Base, Optimism, Arbitrum, Linea, Polygon + testnet Sepolia/Base Sepolia). 1Shot: **jangan hardcode — panggil `relayer_getCapabilities`** (mainnet terlihat: Ethereum/Optimism/Polygon/Base/Arbitrum/Celo; gas token: USDC/USDT/USDG/MUSD). Mantle TIDAK terkonfirmasi.

### Keputusan arsitektur (dari temuan)

**Target chain = Base; jalur izin = ERC-7710 Smart Account delegation (BUKAN ERC-7715).**
Alasan: (a) memenuhi syarat MetaMask via *Smart Accounts*, (b) menghindari kurungan Sepolia-only milik 7715, (c) menyatukan chain — Venice x402 (USDC/Base) dan 1Shot (Base) hidup di tempat yang sama, (d) main track kita (x402+7710, Best Agent, A2A) tidak butuh 7715. Dev pakai **Base Sepolia** (Venice x402 di-mock di testnet); demo "real" di **Base mainnet** dengan USDC kecil (1Shot memang relayer mainnet).

### Risiko tersisa (verifikasi live)
1. **1Shot coverage di Base** — konfirmasi via `relayer_getCapabilities` sebelum commit (paling mungkin bikin demo patah).
2. **Pendanaan USDC** kecil di Base untuk x402 + gas.
3. **Ejaan enforcer & path image Venice** — cek ke types/SDK live (murah).
4. (Non-teknis) Boleh >1 main track? & solo/tim — tanya panitia / tentukan scope.

---

## 11. Langkah berikutnya
1. ~~Riset docs (Fase 0)~~ — selesai, lihat §10.
2. ~~Spike Fase 2~~ — **selesai & terverifikasi.** `POST /spike` di agent: plan → delegasi root (user→bount-AI) → redelegasi ke specialist dgn caveat (scope `erc20TransferAmount` + `allowedTargets`) → loop x402 (mock seller). Konstruksi+caveat+redelegasi+tanda tangan+hash **nyata** (toolkit); settlement on-chain & relay 1Shot masih disimulasi/gated. Dashboard memanggilnya dan merender jejak nyata.
3. **Sisa Fase 2 (butuh kredensial/dana):**
   - Konfirmasi `relayer_getCapabilities` 1Shot untuk Base (set `ONESHOT_RELAYER_URL`).
   - Tukar EOA spike → MetaMask Smart Account (`toMetaMaskSmartAccount`, 7702 via wallet) dan eksekusi settlement x402 + relay 1Shot di Base (testnet→mainnet).
4. Fase 3: Venice nyata (planner + image) menggantikan stub; seller x402 nyata / endpoint Venice x402.
