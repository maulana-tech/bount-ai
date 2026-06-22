# Laporan Progress — Tugas Catur (Rust, WASM & T3N Enclave)

> **Untuk:** tim yang melanjutkan (Catur masih belum paham bagian Rust/WASM).
> **Acuan:** `task.md` bagian "Tugas: Catur".
> **Tanggal:** 2026-06-21.
> **Inti masalah:** kode sudah ditulis, tapi **belum bisa di-build jadi `.wasm` di laptop ini karena tidak ada "kompor"-nya** (MSVC C++ Build Tools belum terinstall). Detail di bawah.

---

## TL;DR (ringkasan cepat)

| # | Tugas | Status | Catatan |
|---|-------|--------|---------|
| 1 | Setup Rust + `wasm32-wasip2` | ✅ **Selesai** | scaffold sudah ada |
| 2 | WIT guest export | ✅ **Selesai** | `execute()` sudah ada |
| 3 | Confidential HTTP ke Venice AI | 🟡 **Kode siap, belum di-build** | signature host masih asumsi |
| 4 | Baca API key dari KV `z:<tid>:secrets` | 🟡 **Kode siap, belum di-build** | signature host masih asumsi |
| 5 | CLI version automation | ✅ **Selesai & teruji** (typecheck OK) | siap dipakai |
| — | Build CLI compile Rust beneran | ✅ **Kode siap** | butuh "kompor" buat dites |
| — | Integrasi E2E di T3N testnet | ❌ **Belum** | butuh node T3N + kolaborasi frontend |

---

## ✅ Yang SUDAH selesai

### Tugas 5 — CLI version automation (TUNTAS, sudah ditest typecheck)
Dulu versi kontrak di-*hardcode* `"0.1.0"`, jadi tiap publish ulang error `version is not higher than current version`. Sekarang sudah otomatis.
- `packages/cli/src/publish.ts` — baca versi dari `Cargo.toml`, sarankan naik 1 (mis. `0.1.0 → 0.1.1`), tanya konfirmasi, tulis balik ke `Cargo.toml`, lalu kirim versinya ke server.
- `apps/agent/src/app.ts` (endpoint `/publish-skill`) & `apps/agent/src/integrations/t3n.ts` — terima versi dinamis, bukan `"0.1.0"` lagi.
- **Sudah diverifikasi:** `pnpm --filter bount-ai-cli typecheck` & `--filter @concierge/agent typecheck` lolos. Logika baca+naik versi sudah dites (0.1.0 → 0.1.1).

### Build pipeline — CLI sekarang masak Rust beneran (kode siap)
- `packages/cli/src/compile.ts` — kalau ada `Cargo.toml`, jalankan `cargo build --release --target wasm32-wasip2` lalu salin `.wasm` asli ke `dist/index.wasm`. (Jalur lama TypeScript/mock 8-byte tetap ada sebagai cadangan.)

### Housekeeping
- `.gitignore` — abaikan `packages/enclaves/target/` & `dist/` (folder hasil build yang gak perlu masuk git).

---

## 🟡 Yang KODENYA SUDAH ADA tapi BELUM TERBUKTI JALAN

### Tugas 3 — Confidential HTTP & Tugas 4 — KV secret read
Logika robot enclave sudah ditulis lengkap:
- `packages/enclaves/wit/host.wit` — definisi fasilitas brankas: `t3n:host/kv` (ambil rahasia) & `t3n:host/http` (internet aman).
- `packages/enclaves/wit/world.wit` — robot meng-*import* kedua fasilitas itu.
- `packages/enclaves/src/lib.rs` — alur: ambil `VENICE_API_KEY` dari KV namespace `z:<tid>:secrets` → kalau gak ada, **berhenti aman (fail-closed)** → kalau ada, panggil Venice AI lewat HTTP aman → kembalikan jawabannya. **API key tidak pernah keluar dari enclave.**

**Kenapa belum terbukti?** Lihat blocker di bawah.

---

## ⛔ BLOCKER UTAMA (ini yang harus dibereskan tim lanjutan)

### 1. Laptop ini tidak punya "kompor" buat masak Rust
`cargo build` gagal **bukan karena kode salah**, tapi karena **MSVC C++ Build Tools (link.exe) belum terinstall**. Tanpa itu, Rust tidak bisa diselesaikan jadi `.wasm`.

**Cara benerin (pilih salah satu):**
- **(Disarankan)** Install **Visual Studio Build Tools 2022** → centang **"Desktop development with C++"**. Setelah itu `cargo build --release --target wasm32-wasip2` di folder `packages/enclaves` harusnya jalan.
- **Alternatif:** pakai toolchain GNU → `rustup toolchain install stable-x86_64-pc-windows-gnu` + MinGW.

Setelah "kompor" ada, build akan langsung memberi tahu apakah kode Tugas 3 & 4 sudah benar atau perlu sedikit penyesuaian.

### 2. Signature WIT host T3N masih ASUMSI (tebakan)
File `packages/enclaves/wit/host.wit` aku tulis berdasarkan tebakan, karena **spec asli `t3n:host/http` & `t3n:host/kv` belum ada** di repo maupun SDK.
- **TODO:** ambil definisi WIT resmi dari dokumentasi/SDK **T3N ADK**. Kalau ternyata T3N pakai `wasi:http` standar atau bentuk parameter beda, sesuaikan **hanya file `host.wit`** (sisanya ngikut otomatis).

---

## ❌ Yang BELUM dikerjakan sama sekali

### A. Tracking versi aktif saat eksekusi
Tugas 5 sudah benerin versi waktu **publish**. Tapi waktu **menjalankan** skill, `executeT3nContract` masih default `"0.1.0"` — `spike.ts` belum meneruskan versi terbaru. Perlu mekanisme menyimpan/mengambil "versi aktif per skill".

### B. Integrasi E2E di T3N testnet (bagian "Integrasi Bersama" di `task.md`)
Belum dijalankan, dan butuh kolaborasi dengan tim Frontend ("Aku"):
1. Login MetaMask → dapat DID `did:t3n`.
2. Register kontrak `.wasm` asli ke T3N.
3. Set KV `z:<tid>:secrets` berisi `VENICE_API_KEY`.
4. Panggil `/spike` → memicu eksekusi TEE asli di node T3N.
5. Buktikan PII tersamar (placeholder) tidak pernah keluar dari enclave.

---

## 🔜 Urutan langkah yang disarankan untuk tim lanjutan

1. **Install MSVC Build Tools** (buka blocker #1), lalu `cargo build` di `packages/enclaves` sampai hijau.
2. **Ambil WIT host asli dari T3N ADK** (blocker #2), samakan `host.wit`, build ulang.
3. Test CLI end-to-end: `skill build` (compile Rust) → `skill publish` (cek versi auto-naik, publish 2x berturut tanpa error).
4. Benerin tracking versi `execute` (item A).
5. Jalankan E2E di testnet bareng tim Frontend (item B).

## File yang disentuh di sesi ini
- `packages/enclaves/wit/host.wit` (baru)
- `packages/enclaves/wit/world.wit`
- `packages/enclaves/src/lib.rs`
- `packages/enclaves/Cargo.toml`
- `packages/cli/src/publish.ts`
- `packages/cli/src/compile.ts`
- `apps/agent/src/app.ts`
- `apps/agent/src/integrations/t3n.ts`
- `.gitignore`
