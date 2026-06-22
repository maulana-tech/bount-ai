# Laporan Progress — Tugas Catur (Rust, WASM & T3N Enclave)

> **Untuk:** tim yang melanjutkan (Catur masih belum paham bagian Rust/WASM).
> **Acuan:** `task.md` bagian "Tugas: Catur".
> **Update terakhir:** 2026-06-22.
> **Inti kabar baik:** contract Rust **sudah ke-build jadi `.wasm` component asli** dan
> **sudah cocok dengan spec WIT T3N resmi** (bukan tebakan lagi). Build dilakukan lewat
> **WSL** (bukan native Windows). Detail di bawah.

---

## TL;DR (ringkasan cepat)

| # | Tugas | Status | Catatan |
|---|-------|--------|---------|
| 1 | Setup Rust + `wasm32-wasip2` | ✅ **Selesai** | toolchain di WSL |
| 2 | WIT guest export | ✅ **Selesai** | export `chat(generic-input)->list<u8>` (model T3N asli) |
| 3 | Confidential HTTP ke Venice AI | ✅ **Selesai & ke-build** | pakai `host:interfaces/http@2.1.0` |
| 4 | Baca API key dari KV `z:<tid>:secrets` | ✅ **Selesai & ke-build** | `host:interfaces/kv-store` + `host:tenant/tenant-context` |
| 5 | CLI version automation | ✅ **Selesai & teruji** (typecheck OK) | siap dipakai |
| — | Build CLI compile Rust beneran | ✅ **Kode siap** | jalan di WSL/Linux/CI (native Windows tetap perlu linker) |
| — | Integrasi E2E di T3N testnet | ❌ **Belum** | butuh node T3N + kolaborasi frontend |

---

## ✅ Yang SUDAH selesai

### Build nyata + WIT T3N resmi (update 2026-06-22)

Sebelumnya kode pakai WIT **tebakan** (`t3n:host/kv`, `t3n:host/http`, `execute(string)->string`)
dan **belum pernah benar-benar ke-compile**. Sekarang sudah diganti ke **spec T3N resmi** yang
diambil dari contoh resmi `github.com/Terminal-3/z-tenant-flight`:

- **Vendored host WIT asli** ke `packages/enclaves/wit/deps/`:
  - `host-interfaces-2.1.0/package.wit` (berisi `http`, `kv-store`, `logging`, dll.)
  - `host-tenant-1.0.0/package.wit` (`tenant-context`)
- **`wit/world.wit`** — package `z:bount-ai@0.1.1`, world `bount-ai`, import
  `host:tenant/tenant-context`, `host:interfaces/{logging,kv-store,http}`, export interface
  `contracts` dengan record `generic-input` + fungsi `chat(req) -> result<list<u8>, string>`
  (konvensi T3N: **named function, bukan `execute`/`dispatch`**).
- **`src/lib.rs`** — implementasi `chat`:
  1. baca `tenant_did()` dari `tenant-context` → rakit nama map `z:<hex(tid)>:secrets`,
  2. ambil `venice_api_key` dari `kv-store` (fail-closed kalau kosong),
  3. panggil Venice via `http::call` (POST chat/completions), parse jawaban,
  4. balikin JSON `{status, model, output}`. **API key tidak pernah keluar enclave.**
- **`Cargo.toml`** — `crate-type = ["cdylib","lib"]`, `wit-bindgen 0.49`, serde/serde_json/hex
  (no_std friendly), `[profile.release]` opt-level="s" + lto + strip.
- **Hasil build:** `target/wasm32-wasip2/release/enclaves.wasm` (~197 KB) — **component WASM valid**
  (`wasm-tools validate` lolos), export `z:bount-ai/contracts@0.1.1` dengan `chat`, import host
  asli. Disalin ke `dist/index.wasm` untuk `skill publish`.
- **Sisi agent** (`apps/agent/src/integrations/t3n.ts`) — invoke diganti dari `functionName:"execute"`
  jadi `"chat"`, input dibungkus `{ prompt }`.
- **Verifikasi:** `pnpm -r typecheck` lolos semua; clean rebuild di WSL reproducible.

**Cara build ulang (di WSL):**
```bash
# sekali setup:
curl https://sh.rustup.rs | sh -s -- -y --profile minimal && rustup target add wasm32-wasip2
# build:
cd packages/enclaves && cargo build --release --target wasm32-wasip2
```

### Tugas 5 — CLI version automation (TUNTAS, sudah ditest typecheck)
Dulu versi kontrak di-*hardcode* `"0.1.0"`, jadi tiap publish ulang error `version is not higher than current version`. Sekarang sudah otomatis.
- `packages/cli/src/publish.ts` — baca versi dari `Cargo.toml`, sarankan naik 1 (mis. `0.1.0 → 0.1.1`), tanya konfirmasi, tulis balik ke `Cargo.toml`, lalu kirim versinya ke server.
- `apps/agent/src/app.ts` (endpoint `/publish-skill`) & `apps/agent/src/integrations/t3n.ts` — terima versi dinamis, bukan `"0.1.0"` lagi.

### Build pipeline — CLI sekarang masak Rust beneran (kode siap)
- `packages/cli/src/compile.ts` — kalau ada `Cargo.toml`, jalankan `cargo build --release --target wasm32-wasip2` lalu salin `.wasm` asli ke `dist/index.wasm`. (Jalur lama TypeScript/mock 8-byte tetap ada sebagai cadangan.)

### Housekeeping
- `.gitignore` — abaikan `packages/enclaves/target/` & `dist/`.

---

## ⛔ BLOCKER (status terkini)

### 1. Build native Windows — masih perlu linker (SUDAH DI-BYPASS via WSL)
`cargo build` native di laptop ini tetap gagal karena **tidak ada MSVC C++ linker** (`link.exe`).
**Tapi sudah tidak memblok** — build dilakukan di **WSL Ubuntu** (punya `gcc`, tidak butuh MSVC).
Kalau mau build native Windows: install **VS Build Tools 2022 (Desktop C++)** atau toolchain GNU + MinGW.
Untuk CI: pakai runner Linux (paling gampang).

### 2. Signature WIT host — SUDAH RESMI (bukan tebakan lagi)
WIT host (`host:interfaces@2.1.0`, `host:tenant@1.0.0`) sekarang di-*vendor* dari contoh resmi
Terminal-3. Sudah dipakai untuk build yang sukses. ⚠️ Catatan kecil: KV map `secrets` harus
di-seed dengan key **`venice_api_key`** oleh tenant SDK sebelum contract dipakai — kalau tidak,
contract berhenti aman (fail-closed).

---

## ❌ Yang BELUM dikerjakan

### A. Tracking versi aktif saat eksekusi
`executeT3nContract` masih default `"0.1.0"` kalau pemanggil tidak meneruskan versi. `spike.ts`
sudah baca versi dari meta file publish, tapi mekanisme "versi aktif per skill" masih sederhana.

### B. Integrasi E2E di T3N testnet (bagian "Integrasi Bersama" di `task.md`)
Belum dijalankan, butuh kolaborasi tim Frontend ("Aku"):
1. Login MetaMask → DID `did:t3n` (handshake + SIWE).
2. Register `.wasm` asli (`dist/index.wasm`) ke node T3N testnet.
3. Seed KV `z:<tid>:secrets` → key `venice_api_key` = `VENICE_API_KEY`.
4. Panggil `/spike` → invoke fungsi `chat` → eksekusi TEE asli di node T3N.
5. Buktikan secret/PII tidak pernah keluar dari enclave.

---

## 🔜 Urutan langkah yang disarankan untuk tim lanjutan
1. (Opsional) Setup build native Windows / CI Linux supaya `skill build` jalan tanpa WSL manual.
2. Test CLI end-to-end: `skill build` (compile Rust di WSL/Linux) → `skill publish` (cek versi auto-naik, publish 2x tanpa error).
3. Benerin tracking versi `execute` (item A).
4. Jalankan E2E di testnet bareng tim Frontend (item B) — seed `venice_api_key` dulu.

## File yang disentuh (sesi 2026-06-22)
- `packages/enclaves/wit/world.wit` (rewrite ke spec asli)
- `packages/enclaves/wit/deps/host-interfaces-2.1.0/package.wit` (baru, WIT resmi)
- `packages/enclaves/wit/deps/host-tenant-1.0.0/package.wit` (baru, WIT resmi)
- `packages/enclaves/wit/host.wit` (dihapus — WIT tebakan lama)
- `packages/enclaves/src/lib.rs` (rewrite implementasi `chat`)
- `packages/enclaves/Cargo.toml` (wit-bindgen 0.49 + deps + profile)
- `apps/agent/src/integrations/t3n.ts` (invoke `chat`, input `{prompt}`)
