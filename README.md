# ven-AI

**Give an AI a budget — not your wallet.**

ven-AI is an autonomous spending agent built for the MetaMask Smart Accounts Kit × 1Shot API hackathon. You grant it a capped, revocable spending permission by **signing an ERC-7710 delegation with your wallet**; it plans a task, **redelegates sub-budgets** to specialist agents, and each agent **pays for the services it uses** via x402 — within limits that can only narrow as authority flows down.

The core idea: today, giving an AI agent the ability to pay means handing over a private key. ven-AI replaces that with **programmable, bounded permission** — the agent transacts on its own, but the limits stay in your hands.

> See `CONTEXT.md` for the hackathon brief, `PROJECT.md` for the full product spec, `UI_GUIDE.md` for the design system, and `CLAUDE.md` for the working architecture notes.

---

## How it works

1. **Grant a budget.** Connect a wallet (Base Sepolia) and click **Grant budget**. You sign an **ERC-7710 spending-limit delegation** (caveat `erc20TransferAmount`) to ven-AI's delegate address — off-chain, no gas. The signed root is the real grant. *(For zero-friction demos, the app also ships a **$5 free credit** that works without a wallet.)*
2. **Write a request.** One sentence in the **Chat** page, e.g. *"research the coffee market and write a short summary."* The concierge breaks it into sub-tasks and allocates the budget.
3. **Agents delegate and work.** ven-AI **redelegates** narrowed sub-budgets to the specialist agents the request needs, then each pays for what it uses via an x402 `402 → pay → retry` loop.
4. **Result + proof.** You get the output (text / images) plus a trace: delegation hashes, who paid what, and how much budget is left.

Permissions only ever **narrow** as they flow down (user → ven-AI → specialists); the sum of all sub-agent spend can never exceed your cap.

---

## The agents

ven-AI is **general, not task-specific**. The capability registry lives in `packages/shared/src/capabilities.ts` and is shared by both the web Agents page (display) and the agent service (selection + pricing). The concierge dynamically picks a subset per request (keyword heuristic today; Venice reasoning planned).

| Agent | Does | Price / use | Pays for |
| --- | --- | --- | --- |
| **Research** | Gather & summarize data, sources, competitors | $0.50 | `dataset` |
| **Copywriting** | Copy, summaries, posts, emails | $0.20 | `text` |
| **Image** | Posters, logos, graphics | $0.80 | `image` |
| **Video** | Short clips & animations | $1.00 | `video` |
| **Audio** | Voiceover, music, sound | $0.50 | `audio` |
| **Translation** | Translate & localize between languages | $0.20 | `text` |

**Custom agents (hybrid model).** Users can create their own specialists on `/app/agents` — stored client-side (`lib/customAgents.ts`, localStorage), sent in the `/spike` request body, sanitized by the agent, and merged into the selection pool. They pay their declared cost through the mock seller. Adding a built-in agent = one entry in `capabilities.ts`.

Specialist generation runs through **Venice AI** (OpenAI-compatible) when `VENICE_API_KEY` is set, and falls back to a `[venice-stub]` placeholder otherwise.

---

## Hackathon tracks

One app, designed to qualify across multiple tracks:

| Track | How ven-AI addresses it | Status |
| --- | --- | --- |
| **Best Agent** | Acts autonomously on the user's behalf under a wallet-signed Smart Accounts delegation. | ✅ working |
| **Best A2A Coordination** | **Redelegates** (ERC-7710) narrowed sub-budgets to specialist agents. | ✅ working |
| **Best x402 + ERC-7710** | Specialists settle service payments via an x402 loop using delegated authority. | ⚠️ x402 loop + redelegation real; on-chain settlement gated (see Status) |
| **Best use of Venice AI** | Venice generates specialist outputs (text + image). | ✅ when keyed |
| **Best use of 1Shot Relayer** | Relay 7710 txs / gas in stablecoins / 7702 upgrade / webhooks. | ⏳ scaffolded, gated |

> The permission mechanism is **ERC-7710 delegation** (user signs a root spending limit, agent redelegates), not ERC-7715 Advanced Permissions — chosen to match the agent-to-agent redelegation flow. See `CONTEXT.md` for full qualification criteria.

---

## Architecture

A pnpm monorepo with three workspaces:

```
apps/web/         Next.js 15 frontend — landing, dashboard, chat, agents
apps/agent/       Hono service — concierge orchestration + integrations
packages/shared/  TypeScript domain types shared by web and agent
```

### `apps/web` — React 19, Tailwind 3, RainbowKit + wagmi + viem

| Route | Purpose |
| --- | --- |
| `/` | Landing page (Lenis smooth scroll, reveal sections) |
| `/app` | Dashboard — budget meter, **Grant budget** modal, capabilities grid, preview demos, activity feed |
| `/app/chat` | Live agent flow — calls `/spike`, renders real outputs + budget; 3-column layout (previews · chat · output/history) |
| `/app/agents` | Specialist registry + custom-agent creation |

Client budget state is a single source of truth: `lib/budget.tsx` (React context + localStorage) holds cap / spent / the signed root delegation, shared between dashboard and chat. `lib/grant.ts` builds + signs the ERC-7710 grant via the wallet; `lib/agent.ts` calls the agent.

### `apps/agent` — Hono service, organized by responsibility

```
concierge/      request planner (selects capabilities)
agents/         research, media, text specialist runners
integrations/   delegation (ERC-7710 build/caveats/redelegation/sign)
                x402 (402 → pay → retry loop)
                settlement (gated on-chain redeem + simulated fallback)
                venice (OpenAI-compatible client)
                oneshot (1Shot relayer probe, gated)
routes/         plan, spike, seller (mock x402 seller), webhook
spike.ts        the orchestrator
```

**Endpoints:** `GET /health` · `POST /plan` · `POST /spike` · `GET /spike/agent` (delegate identity for grant) · `GET /spike/capabilities` (1Shot probe) · `GET /seller/buy` (mock x402 seller) · `POST /webhook/oneshot`.

### `packages/shared`

The contract (`ActivityEvent`, `DelegationNode`, `TaskPlan`, `SpikeResult`, `Capability`, …) consumed by both sides via `transpilePackages`, so the UI and agent never drift.

> ⚠️ The agent currently keeps its **own copy** of the `CAPABILITIES` array in `apps/agent/src/shared.ts`. When changing a capability's cost/keywords, edit **both** that file and `packages/shared/src/capabilities.ts`.

### Chain

Defaults to **Base Sepolia** (`84532`) via `CHAIN_ID`; the MetaMask delegation toolkit supports all major EVM chains (Ethereum, Base, OP, Arbitrum, Polygon, Linea, Gnosis, BSC + testnets). The web client reads the active chain, USDC, and DelegationManager from `GET /spike/agent`, so switching chains is config-only (`CHAIN_ID` / `USDC_ADDRESS` + wagmi `chains`).

---

## Tech stack

- **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS 3, TypeScript
- **Wallet / chain:** RainbowKit, wagmi, viem (signer-agnostic), Base Sepolia
- **Smart accounts / permissions:** `@metamask/delegation-toolkit` (ERC-7710 / ERC-7702)
- **Smooth scroll / motion:** Lenis, Framer Motion
- **Agent service:** Hono, tsx
- **AI:** Venice AI (OpenAI-compatible — text + image)
- **Payments / relayer:** x402, 1Shot Permissionless Relayer (gated)

---

## Getting started

**Prerequisites:** Node 20+ and pnpm 9+.

```bash
pnpm install
```

Set up environment variables (each app has its own example):

```bash
cp apps/web/.env.example   apps/web/.env.local
cp apps/agent/.env.example apps/agent/.env.local
```

**`apps/web`**
- `NEXT_PUBLIC_WC_PROJECT_ID` — WalletConnect / Reown id for real wallet connect.
- `NEXT_PUBLIC_AGENT_URL` — agent base URL (defaults to `http://localhost:8787`).

**`apps/agent`**
- `AGENT_DELEGATE_PRIVATE_KEY` — stable delegate key (the address users delegate to). Without it the address regenerates per restart and stored grants stop matching.
- `VENICE_API_KEY` — enables live Venice generation (stub otherwise).
- `CHAIN_ID` / `CHAIN_NAME` / `USDC_ADDRESS` — target chain (default Base Sepolia).
- `ENABLE_ONCHAIN_SETTLEMENT` + `SETTLEMENT_PRIVATE_KEY` + `RPC_URL` — opt into real on-chain settlement (default off → simulated).
- `ONESHOT_API_KEY` / `ONESHOT_WEBHOOK_SECRET` / `ONESHOT_RELAYER_URL` — 1Shot relayer.

Everything builds and type-checks without any keys set; they are only needed for live integrations.

Run it:

```bash
pnpm dev          # web + agent together
pnpm dev:web      # web only  -> http://localhost:3000
pnpm dev:agent    # agent only -> http://localhost:8787
```

---

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Run web and agent in parallel |
| `pnpm dev:web` / `pnpm dev:agent` | Run a single app |
| `pnpm build` | Production build of the web app (validates SSR + types) |
| `pnpm -r typecheck` | Type-check every workspace |
| `pnpm --filter @concierge/web lint` | Lint the web app |

---

## Project structure

```
.
├─ apps/
│  ├─ web/
│  │  └─ src/
│  │     ├─ app/            # routes: / · /app · /app/chat · /app/agents
│  │     ├─ components/     # one concern per file (+ landing/, ui/)
│  │     └─ lib/            # budget store, grant, agent client, wagmi, utils
│  └─ agent/
│     └─ src/
│        ├─ concierge/      # planner
│        ├─ agents/         # research, media, text
│        ├─ integrations/   # delegation, x402, settlement, venice, oneshot
│        ├─ routes/         # plan, spike, seller, webhook
│        └─ spike.ts        # orchestrator
├─ packages/shared/         # shared domain types + capability registry
├─ CONTEXT.md               # hackathon brief
├─ PROJECT.md               # product + technical spec
├─ UI_GUIDE.md              # design system + anti-slop rules
└─ CLAUDE.md                # guidance for AI coding agents
```

---

## Design system

Deliberately not a default template. Warm-paper light theme with a single bronze accent, monospace for all numbers, hairline borders, and a signature corner-frame motif on every panel. **No gradients, no emoji** — marks are CSS-drawn or use the project logo. The rationale and full token set live in `UI_GUIDE.md`; the tokens are in `apps/web/tailwind.config.ts`.

---

## Status

The **Phase 2 vertical slice works** end-to-end:

- ✅ **Wallet-signed grant** — user signs an ERC-7710 spending-limit delegation in MetaMask; the agent uses it as the root and redelegates to specialists.
- ✅ **Real budget** — dashboard + chat read live cap/spent from `SpikeResult` (no more mock numbers); $5 free-credit fallback for keyless demos.
- ✅ **x402 loop** — `402 → pay → retry` against a local mock seller, with delegation hashes as proof.
- ✅ **Venice generation** — specialist outputs (text + image) when keyed.
- ⚠️ **On-chain settlement** — dual-mode: simulated by default; a gated path (`ENABLE_ONCHAIN_SETTLEMENT`) attempts a real `redeemDelegations` and safely falls back. The redeem call itself is a wired **seam** — it still needs a Smart Account (or EOA + 7702) delegator, redemption-consistent caveats, and a funded testnet delegate.
- ⏳ **1Shot relayer** — capability probe gated by `ONESHOT_RELAYER_URL`; relay still stubbed.

---

## License

Hackathon project. Not yet licensed for reuse.
