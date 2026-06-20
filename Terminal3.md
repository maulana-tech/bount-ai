# Terminal 3 — Dokumentasi Lengkap

> Terminal 3 adalah **data freedom company** — membangun infrastruktur identitas dan kepercayaan untuk enterprise, government, dan Web3.

---

## Daftar Isi

- [1. Company & Vision](#1-company--vision)
- [2. Platform Overview](#2-platform-overview)
- [3. T3 Network (T3N)](#3-t3-network-t3n)
- [4. Agent Developer Kit (ADK)](#4-agent-developer-kit-adk)
- [5. TEE Contract Development](#5-tee-contract-development)
- [6. Use Cases](#6-use-cases)
- [7. T3N Sandbox — Quickstart](#7-t3n-sandbox--quickstart)
- [8. Referensi Cepat](#8-referensi-cepat)

---

## 1. Company & Vision

Terminal 3 ingin memberdayakan **digital future yang lebih adil**, di mana user dan enterprise memiliki hak dan perlindungan yang setara di semua platform. Teknologi mereka membuat **data pribadi dapat dikomposisikan secara bebas** tanpa mengorbankan privasi.

**Produk-produk Terminal 3:**

| Produk | Fungsi |
|--------|--------|
| **T3 Identity** | Verifiable identity management untuk human & AI agent — universal ID, cryptographic credentials, private data storage |
| **T3 Verify** | Reusable KYC/AML credentials — verifikasi sekali, bagikan proof-nya, bukan data mentahnya |
| **T3 Agent Developer Kit (ADK)** | SDK untuk membangun AI agent dengan identity, authorization, dan payment yang aman |
| **T3 Agent Command** | (Coming soon) — discovery, governance, dan audit untuk AI agent di organisasi |
| **T3 Network (T3N)** | Decentralized confidential compute network — fondasi semua produk di atas |

---

## 2. Platform Overview

### Arsitektur Berlapis

```
┌─────────────────────────────────────────────┐
│  T3 Identity  │  T3 Verify  │  ADK  │  Cmd  │  ← Produk
├─────────────────────────────────────────────┤
│  T3 Network (T3N)                            │  ← Lapisan komputasi
│  - TEE Clusters (Intel TDX)                  │
│  - WASM Runtime (Wasmtime)                   │
│  - Threshold encryption                      │
│  - Regional storage (CAS + Regulatory Vault) │
├─────────────────────────────────────────────┤
│  Blockchain (on-chain Issuer & Revocation)   │  ← Registry layer
└─────────────────────────────────────────────┘
```

### Human Identity & Privacy

- **Portable identity:** Satu DID (`did:t3n`) yang portable cross-platform, cross-jurisdiksi
- **Store & process tanpa PII:** Data diproses di dalam TEE — aplikasi hanya terima answers, bukan raw records
- **Smart Verifiable Credentials (VCs):** Anchor di on-chain Issuer & Revocation Registries

### AI Agent Security & Governance

- **Runtime policy enforcement:** Policy dievaluasi di request time — scope creep diblokir in-flight
- **Tamper-proof audit trail:** Setiap agent action di-sign dan di-log ke immutable Merkle-backed ledger
- **Hardware-secured payments:** Payment credentials tersimpan di T3N, di-resolve di dalam TEE — tidak pernah masuk agent memory/prompt

---

## 3. T3 Network (T3N)

### Apa itu T3N?

T3N adalah **decentralized confidential computing network**. Store, process, dan compute data sensitif di dalam hardware-secured **Trusted Execution Environments (TEEs)** — Intel TDX (Secure Encrypted Virtual Machines). Hanya hasil verifikasi yang diterima client; data mentah tidak pernah meninggalkan secure enclave.

### Arsitektur Multi-Region

```
REGION 1 (data residency required)        REGION 2 (no data residency)
┌──────────────────────────────┐          ┌──────────────────────┐
│  TEE Cluster 1               │◀────────▶│  TEE Cluster 2       │
│  [Node] ◀──▶ [Node]         │          │  [Node] ◀──▶ [Node]  │
└──────────┬───────────────────┘          └──────────┬───────────┘
           │                                        │
┌──────────▼───────────────────┐                    │
│  Regional Storage            │◀───────────────────┘
│  - Content-Addressable (CAS) │
│  - Regulatory Vault          │
└──────────────────────────────┘
```

- **TEE Cluster:** Beberapa TEE node secara geografis terdistribusi. Setiap node hold key share dari threshold key network.
- **CAS (Content-Addressable Storage):** Pluggable external storage untuk large data.
- **Regulatory Vault:** Secure centralized storage untuk KYC data (passport, liveness video) — untuk compliance & enforcement.

### Decentralized Identifiers (DIDs)

Format: `did:t3n:<40-hex>`

- Setiap entity (human atau AI agent) punya DID unik
- DID adalah **permanent address** di network
- Setiap DID bisa hold T3N token balance
- DID tidak di-derive dari wallet — wallet hanya authenticator

### Tokens

T3N tokens **meter** TEE contract execution & storage:

- WASM compute fuel
- Host-function calls (kv.put, cas.write)
- Storage deposit & rent
- Contract registration

> Tokens saat ini **non-transferable**. Transferability coming soon.

**Failure semantics:** charge-on-attempt — kalau contract mulai dan consume resources, caller tetap bayar meskipun contract return error. Writes di-rollback kalau gagal, tapi fuel tetap di-charge.

### Storage Namespaces (z-namespace)

Format: `z:<tid>:<tail>`

| Part | Contoh |
|------|--------|
| `z:` | Prefix tenant-owned resource |
| `<tid>` | `8f3a...c91d` (40-hex dari DID) |
| `<tail>` | `secrets`, `bookings` |

Contoh: `z:8f3a0123456789abcdef0123456789abcdefc91d:secrets`

**Aturan:**
- Private maps: `z:<tid>:<tail>` — default, untuk sensitive data
- Public maps: `z:<tid>:public:<tail>` — world-readable, jangan taruh PII
- `readers` WAJIB di-set — default deny
- Cross-tenant access: perlu explicit grant

### Host API — Semua Capability TEE Contract

TEE contract cuma bisa akses resources yang di-define di Host API. Tidak ada akses OS/network/filesystem/clocks tanpa melalui interface ini.

| Interface | Fungsi | Gating |
|-----------|--------|--------|
| `kv-store` | Read/write/delete di z-namespace maps | Namespace-bound; no cross-contract reads |
| `tenant` | Tenant lifecycle & metadata reads | Standard per-contract auth |
| `logging` | info/debug/error log | None |
| `http` | Outbound HTTP/HTTPS | Per-contract egress allowlist |
| `http-with-placeholders` | HTTP dengan `{{profile.*}}` substitution dari user profile di TEE | Egress allowlist + placeholder allowlist |
| `signing` | ECDSA sign, sign-with-wallet, sign-sd-jwt-vc | Per-contract allowlist |
| `outbox` | Enqueue HTTP after transaction commits (at-most-once) | Per-contract allowlist |
| `contracts-call` | Synchronously call contract lain | Per-pair allowlist + max_depth |
| `user-profile` | Encrypt & store user profile data | Standard auth |
| `agent-auth` | Update authorisasi agent | Standard auth |
| `time`/`clock` | Baca waktu | None |

> Jika capability tidak ada di Host API, contract **tidak bisa melakukannya**.

---

## 4. Agent Developer Kit (ADK)

### Overview

T3 ADK adalah **client SDK** untuk membangun agent tenant applications di atas T3N.

**Key Capabilities:**

| Capability | Fungsi |
|-----------|--------|
| Authenticated session | Sign in dengan Ethereum wallet + encrypted channel ke TEE node |
| `tenant.claim()` | Register DID sebagai tenant |
| `tenant.maps.*` | Create/update/delete key-value maps di `z:<tid>:*` |
| `tenant.contracts.*` | Publish → execute Rust→WASM contract |
| Cross-tenant calls | Invoke contract tenant lain dengan `executeBusinessContract()` |
| Hardware isolation | Setiap read/write di-check terhadap tenant prefix |

### Protocols yang Didukung

Satu SDK untuk semua protocol:
- **A2A** (Agent-to-Agent)
- **ERC-8004**
- **Entra Agent ID**
- **MCP** (Model Context Protocol)
- **Web Bot Auth**

### Dev Environment Setup

```bash
# 1. Claim test tokens di https://www.terminal3.io/claim-page
#    → Dapat API key + DID + 20,000 T3N test tokens

# 2. Install Rust + WASM toolchain
rustup target add wasm32-wasip2
cargo install wasm-tools

# 3. Install SDK (Node >= 18)
npm install @terminal3/t3n-sdk

# 4. Setup client
```

```typescript
import {
  T3nClient, TenantClient, setEnvironment,
  loadWasmComponent, eth_get_address, metamask_sign,
  createEthAuthInput, getNodeUrl,
} from "@terminal3/t3n-sdk";

setEnvironment("testnet");

const key = process.env.T3N_API_KEY!;
const address = eth_get_address(key);
const wasmComponent = await loadWasmComponent();

const t3n = new T3nClient({
  wasmComponent,
  handlers: {
    EthSign: metamask_sign(address, undefined, key),
  },
});

// Authenticate → baca DID dari session
await t3n.handshake();
const did = await t3n.authenticate(createEthAuthInput(address));
const tenantDid = did.value;  // baca dari session, JANGAN hardcode

// TenantClient = untuk manage contracts, maps, secrets
const tenant = new TenantClient({ t3n, baseUrl: getNodeUrl(), tenantDid });
```

### Alur Pengembangan Contract

```
1. Write TEE Contract   →  Rust crate → WASM component
2. Build                →  cargo build --target wasm32-wasip2 --release
3. Register             →  tenant.contracts.register({ tail, version, wasm })
4. Map + Secrets        →  tenant.maps.create() + tenant.executeControl("map-entry-set", ...)
5. Authorize Egress     →  userClient.execute("agent-auth-update", ...)
6. Invoke               →  agentClient.executeAndDecode({ script_name, function_name, input })
```

---

## 5. TEE Contract Development

### Struktur Repository

```
z-tenant-flight/
├── src/
│   ├── lib.rs            ← wit-bindgen entry + Guest impl
│   ├── search.rs         ← search-offers (no PII, http sync)
│   └── booking.rs        ← book-offer (PII via http-with-placeholders)
├── wit/
│   ├── world.wit         ← exports + imports
│   └── deps/             ← vendor host interfaces
└── Cargo.toml            ← crate-type = ["cdylib", "lib"]
```

### world.wit — Declare Interface + Imports

```wit
package z:tenant-flight@0.4.0;

world tenant-flight {
  import host:tenant/tenant-context@1.0.0;
  import host:interfaces/logging@2.1.0;
  import host:interfaces/kv-store@2.1.0;
  import host:interfaces/http@2.1.0;
  import host:interfaces/http-with-placeholders@2.1.0;

  export contracts;
}

interface contracts {
  record generic-input {
    input:        option<list<u8>>,
    user-profile: option<list<u8>>,
    context:      option<list<u8>>,
  }
  search-offers: func(req: generic-input) -> result<list<u8>, string>;
  book-offer:    func(req: generic-input) -> result<list<u8>, string>;
}
```

### Cargo.toml

```toml
[package]
name = "z-tenant-flight"
version = "0.4.1"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]

[dependencies]
wit-bindgen = { version = "0.49", default-features = false, features = ["macros", "realloc"] }
serde = { version = "1.0", default-features = false, features = ["derive", "alloc"] }
serde_json = { version = "1.0", default-features = false, features = ["alloc"] }
hex = { version = "0.4", default-features = false, features = ["alloc"] }

[profile.release]
opt-level = "s"
lto = true
codegen-units = 1
strip = true
```

### lib.rs — Entry Point

```rust
wit_bindgen::generate!({
    world: "tenant-flight",
    path: "wit",
    additional_derives: [serde::Deserialize, serde::Serialize],
    generate_all,
});

mod booking;
mod search;

struct Component;

#[cfg(target_arch = "wasm32")]
impl exports::z::tenant_flight::contracts::Guest for Component {
    fn search_offers(req: GenericInput) -> Result<Vec<u8>, String> {
        let input = req.input.ok_or("missing input")?;
        search::search_offers(&input)
    }
    fn book_offer(req: GenericInput) -> Result<Vec<u8>, String> {
        let input = req.input.ok_or("missing input")?;
        booking::book_offer(&input)
    }
}

#[cfg(target_arch = "wasm32")]
export!(Component);
```

### Key Design Rules

1. **Export functions** di interface `contracts`. Masing-masing pakai `generic-input` → `result<list<u8>, string>`. **Tidak ada `dispatch` function**.
2. **kv-store** panggil dengan **full** `z:<tid>:<map>` name. Build dari `tenant_context::tenant_did()` saat runtime.
3. **Import hanya interfaces yang dipakai** — itu entire capability set contract.
4. **http::call** synchronous — response available sebelum function return. Egress di-authorize per-call dari user's grant.
5. **PII → `http-with-placeholders`** — taruh `{{profile.<field>}}` marker di request body. Host resolve dari user profile di dalam enclave. PII **tidak pernah masuk WASM memory**.

### Placeholders — Detail

```rust
let body = json!({
    "passengers": [{
        "given_name":  "{{profile.first_name}}",
        "family_name": "{{profile.last_name}}",
        "born_on":     "{{profile.date_of_birth}}",
        "email":       "{{profile.verified_contacts.email.value}}",
    }]
});

let resp = hwp::call(&hwp::Request {
    method: "POST",
    url: "https://api.duffel.com/air/orders",
    headers: vec![("Authorization".to_string(), format!("Bearer {api_key}"))],
    payload: Some(serde_json::to_vec(&body)?),
})?;
```

Error types:
- `EgressDenied(host)` — host tidak di allowlist
- `PlaceholderDenied(marker)` — marker tidak di allowlist
- `PlaceholderUnknown(field)` — user profile tidak punya field tsb
- `PlaceholderNoUserContext` — tidak ada user context

### Register Contract

```typescript
import { readFile } from "fs/promises";

const wasmBytes = await readFile("target/wasm32-wasip2/release/z_tenant_flight.wasm");
const result = await tenant.contracts.register({
  tail: "travel-contracts",
  version: "0.1.0",
  wasm: wasmBytes,
});
const contractId = result.contract_id;
```

> Registration tidak menjalankan code, tidak create maps, tidak seed secrets. Hanya store component + record.

### Create Maps + Seed Secrets

```typescript
// 1. Create map
await tenant.maps.create({
  tail: "secrets",
  visibility: "private",
  writers: { only: [contractId] },
  readers: { only: [contractId] },  // WAJIB — default deny
});

// 2. Seed API key (control-plane write, bypass ACL)
await tenant.executeControl("map-entry-set", {
  map_name: tenant.canonicalName("secrets"),
  key: "duffel_api_key",
  value: process.env.DUFFEL_API_KEY!,
});
```

### Authorize Egress + Invoke

```typescript
// User sign: authorize agent
await userClient.execute({
  script_name: "tee:user/contracts",
  script_version: userContractVersion,
  function_name: "agent-auth-update",
  input: {
    agents: [{
      agentDid: agentDid,
      scripts: [{
        scriptName: TENANT_SCRIPT,   // z:<tid>:travel-contracts
        versionReq: scriptVersion,
        functions: ["search-offers", "book-offer"],
        allowedHosts: ["api.duffel.com"],
      }],
    }],
  },
});

// Agent invoke
const result = await agentClient.executeAndDecode({
  script_name: TENANT_SCRIPT,
  script_version: scriptVersion,
  function_name: "book-offer",
  input: { offer_id: "...", passenger_id: "...", total_amount: "...", total_currency: "..." },
});
```

### Build Command

```bash
cargo build --target wasm32-wasip2 --release
# → target/wasm32-wasip2/release/z_tenant_flight.wasm
```

---

## 6. Use Cases

### Payroll Agent (Flagship — Super AI Week 2026)

1. Enterprise simpan sensitive payroll data sekali di T3N (credentials, payment keys, policy)
2. Employees/HR simpan employee data (tax forms, direct deposit, compensation)
3. Enterprise authorize Payroll AI Agent dengan constraints (eligible groups, limits)
4. Agent retrieve non-sensitive inputs dari HRIS → calculate gross/net pay
5. Agent submit payroll run untuk approval
6. Setelah approved, agent validasi policy masih satisfied
7. Agent submit instruction ke T3N — **tidak akses langsung** bank details/credentials
8. T3N deliver sensitive data langsung ke payroll provider/bank
9. Payroll provider execute salary payments
10. T3N sanitize response — sensitive data tidak pernah exposed ke agent

### B2B Procurement

1. Buyer simpan payment info sekali di T3N
2. Authorize Buyer AI Agent dengan constraints (approved suppliers, SKU, pricing bands, spending limits)
3. Agent buat PO via ERP → kirim ke Supplier Agent via T3N
4. Supplier Agent validasi → confirm
5. Buyer Agent confirm receipt → Supplier Agent issue invoice
6. Sebelum payment: Buyer Agent verifikasi supplier masih approved
7. Agent submit payment instruction ke T3N — **tidak akses langsung** payment keys
8. T3N deliver payment info ke payment platform
9. Payment execute → T3N sanitize response

### Individual Use Cases

- Travel booking (flight + hotel) dengan agent yang booking pakai kartu user tanpa pernah lihat nomor kartu
- Online financial product applications
- Insurance claim management
- Patient registration
- E-commerce procurement

---

## 7. T3N Sandbox — Quickstart

### Claim Test Tokens

1. Buka https://www.terminal3.io/claim-page
2. Sign in dengan Google
3. (Opsional) masukkan campaign code
4. Dapatkan **20,000 T3N test tokens** — cukup untuk 25 agents + ~5,000 protected actions
5. **Copy API key** — hanya ditampilkan sekali, tidak bisa di-retrieve
6. DID dan tokens auto-linked ke API key

### From Signup to First Protected Action (5 menit)

```
1. Authenticate & claim   → dapat API key + DID + tokens
2. Install SDK            → npm install @terminal3/t3n-sdk
3. Init client            → T3nClient dengan API key
4. Handshake + Auth       → encrypted session ke TEE node
5. Call contract          → execute function di TEE
```

### SDK Methods

```typescript
// Setup
setEnvironment("testnet" | "production");
const client = new T3nClient({ wasmComponent, handlers: { EthSign } });

// Session
await client.handshake();                              // encrypted channel
await client.authenticate(createEthAuthInput(address)); // SIWE auth
const { balance } = await client.getUsage();            // cek token balance

// Tenant management (via TenantClient)
await tenant.me();                                       // get tenant record
await tenant.contracts.register({ tail, version, wasm }); // register contract
await tenant.contracts.list();                            // list contracts
await tenant.contracts.enable/disable/unregister();       // lifecycle
await tenant.maps.create({ tail, visibility, writers, readers });
await tenant.maps.get/set/delete();                       // KV operations

// Agent invoke
await agentClient.executeAndDecode({ script_name, script_version, function_name, input });
```

### Common Errors

| Error | Arti | Solusi |
|-------|------|--------|
| `ENOENT: no such file` | Path WASM salah | Re-build + verify path |
| `tenant not found` | DID tidak match | Baca DID dari session, jangan hardcode |
| `version not higher` | Sudah register versi sama | Bump version |
| `secrets` read fail | Map ACL tidak include contractId | Set `readers: { only: [contractId] }` |
| `egress_denied` | Host tidak di allowlist | Update `allowedHosts` di grant |
| `placeholder_denied` | Marker tidak diizinkan | Update placeholder allowlist |

---

## 8. Referensi Cepat

### Links

| Resource | URL |
|----------|-----|
| Docs | https://docs.terminal3.io |
| ADK SDK (npm) | `@terminal3/t3n-sdk` |
| GitHub | https://github.com/Terminal-3 |
| Claim test tokens | https://www.terminal3.io/claim-page |
| Dev Telegram | https://t.me/terminal3developer |
| Email support | devrel@terminal3.io |
| SOC2 Trust Center | https://trust.terminal3.io |
| Blog | https://blog.terminal3.io |

### Tech Stack

- **Rust** → WASM component (target `wasm32-wasip2`)
- **Wasmtime** — WASM runtime di TEE node
- **wit-bindgen 0.49** — generate bindings dari WIT
- **Intel TDX** — TEE hardware (Secure Encrypted VMs)
- **TypeScript/JavaScript** — SDK (Node >= 18, browser support coming)
- **SIWE** (Sign-In with Ethereum) — authentication
- **Raft** — consensus protocol untuk KV store replication
- **Merkle tree** — integrity proofs untuk storage
- **AES-256-GCM** — data encryption di CAS
- **Post-quantum encryption** — communication channels

### End-to-End Checklist

- [ ] Claim API key + DID + test tokens
- [ ] `setEnvironment("testnet")`
- [ ] Init `T3nClient` + handshake + authenticate
- [ ] Baca `tenantDid` dari session
- [ ] Build `TenantClient`
- [ ] Write Rust contract (`world.wit`, `lib.rs`, Cargo.toml)
- [ ] Build: `cargo build --target wasm32-wasip2 --release`
- [ ] Register contract: `tenant.contracts.register()`
- [ ] Create maps: `tenant.maps.create()`
- [ ] Seed secrets: `tenant.executeControl("map-entry-set")`
- [ ] Authorize egress: `agent-auth-update`
- [ ] Invoke: `agentClient.executeAndDecode()`
