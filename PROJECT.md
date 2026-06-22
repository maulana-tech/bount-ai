# PROJECT.md — bount-AI (Spesifikasi Platform T3N ADK Bounty)

Dokumen ini berisi spesifikasi produk dan teknis akhir bount-AI untuk pengiriman proyek **Terminal 3 Agent Dev Kit (ADK) Bounty Challenge**.

---

## 1. Ringkasan Proyek

**bount-AI** adalah Web3 Platform dan Developer CLI yang memungkinkan pengguna membuat, mendaftarkan, dan mengeksekusi AI Agent secara konfidensial di dalam **Secure TEE Enclaves (Terminal 3 Network)**. 

### Alur Utama
1. **Identitas Terverifikasi:** Pengguna login dengan wallet MetaMask di frontend web, memicu T3N handshake untuk menghasilkan identitas portabel **`did:t3n`**.
2. **TEE Enclave (WASM):** Developer memaketkan logika kustom mereka menjadi WebAssembly guest component (`wasm32-wasip2`) menggunakan Rust/TypeScript.
3. **Penyimpanan Rahasia (KV Maps):** Kunci API sensitif (seperti `VENICE_API_KEY`) disimpan di private KV store milik T3N (`z:<tenant_id>:secrets`) dan di-resolve di dalam memori enklave tertutup saat runtime.
4. **Pencegahan Kebocoran PII (Placeholders):** Data pribadi disamarkan dengan placeholder. Panggilan HTTP keluar diproses melalui gateway T3N untuk menggantikan placeholder secara aman tanpa mengekspos PII ke host luar.
5. **Verifikasi & Audit:** Setiap eksekusi diverifikasi secara kriptografis dan dicatat ke dalam log audit T3N yang tahan manipulasi.

---

## 2. Peta Trek Hadiah (Bounty Tracks)

Proyek ini dirancang secara khusus untuk memenuhi kriteria penilaian utama **Terminal 3 ADK Bounty**:

| Kriteria Penilaian | Bobot | Bagaimana bount-AI Memenuhinya |
| --- | --- | --- |
| **SDK Integration** | **40%** | Mengintegrasikan SDK `@terminal3/t3n-sdk` secara menyeluruh: T3nClient handshake, TenantClient contract registration, KV map creation, dan API execute. |
| **Completeness of Solution** | **30%** | Menyediakan solusi end-to-end yang terdiri dari Frontend Dashboard (Web), Agent Backend (Hono), dan Developer CLI tool (`bount-ai-cli`). |
| **Creativity** | **30%** | Memadukan secure enclaves dengan model AI konfidensial dari Venice AI untuk melindungi PII pengguna di setiap pemanggilan LLM. |

---

## 3. Komponen Sistem

### 3.1 Aktor Utama
* **Pengguna (User)** — Pemilik identitas did:t3n. Mengelola KV maps dan data profil privat di Dashboard.
* **Developer (Seller)** — Membuat, mengompilasi, dan mempublikasikan TEE enclaves kustom menggunakan `bount-ai-cli`.
* **Orchestrator Backend** — Mengoordinasikan input pengguna, memanggil T3N contracts, dan menyajikan hasil eksekusi TEE secara visual.

### 3.2 Diagram Integrasi
```
┌────────────┐   T3N Auth & KV Maps    ┌──────────────────┐
│   User     │ ──────────────────────► │ Web Dashboard    │
│ (MetaMask) │   did:t3n session       │ (apps/web)       │
└────────────┘                         └────────┬─────────┘
                                                │ fetch /spike
                                       ┌────────▼─────────┐
                                       │ Agent Backend    │
                                       │ (apps/agent)     │
                                       └────────┬─────────┘
                                                │ execute contract
                                       ┌────────▼─────────┐
                                       │  T3N TEE Cluster │
                                       │  (WASM Sandbox)  │
                                       └──────────────────┘
```

---

## 4. Implementasi Teknis & Lokasi Kode

* **T3N SDK Integrations & Handshake**:
  * **[apps/agent/src/integrations/t3n.ts](file:///Users/em/web/bount-ai/apps/agent/src/integrations/t3n.ts)**: Penanganan `T3nClient` handshake, pembuatan `TenantClient`, pendaftaran kontrak WASM, dan eksekusi TEE contract.
* **Rust Guest Contract Enclave**:
  * **[packages/enclaves/src/lib.rs](file:///Users/em/web/bount-ai/packages/enclaves/src/lib.rs)**: Logika Rust enklave yang memanfaatkan `t3n:host/kv` untuk membaca secrets Venice AI dan memicu pemanggilan HTTP aman lewat `t3n:host/http`.
* **Developer CLI Suite (`skill` / `bount-ai-cli`)**:
  * **[packages/cli/src/compile.ts](file:///Users/em/web/bount-ai/packages/cli/src/compile.ts)**: Proses kompilasi kode lokal menjadi WASM preview 2 component.
  * **[packages/cli/src/publish.ts](file:///Users/em/web/bount-ai/packages/cli/src/publish.ts)**: Pendaftaran biner ke node T3N dengan tracking versi otomatis.

---

## 5. Alur Kerja CLI Developer

Developer dapat berinteraksi dengan T3N secara langsung dari terminal dengan perintah runut berikut:
1. **Login:** `skill login` — Mengautentikasi terminal dengan identitas `did:t3n` MetaMask pengguna.
2. **Init:** `skill init <name>` — Membuat template TypeScript/Rust TEE component baru.
3. **Build:** `skill build` — Mengompilasi kode guest menjadi target `wasm32-wasip2` menggunakan compiler cargo.
4. **Publish:** `skill publish` — Mendaftarkan versi baru WASM component ke node T3N.
5. **Run:** `skill run <name> <prompt>` — Menjalankan enklave secara otonom di TEE sandbox.

---

## 6. Skenario Keamanan (Threat Model)

* **Perlindungan Terhadap Kebocoran Kunci:** API key Venice AI tidak pernah disimpan di disk atau dikirim dalam payload eksekusi biasa; ia ditarik langsung secara privat di dalam TEE menggunakan `t3n:host/kv`.
* **Perlindungan Data Profil (PII):** Data profil sensitif (seperti email atau nama) disamarkan di browser menggunakan placeholders, didekripsi secara aman di dalam T3N outbound gateway, dan tidak pernah menyentuh memori WASM non-konfidensial.
