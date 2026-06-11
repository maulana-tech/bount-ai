# ven-AI

**Give an AI a budget — not your wallet.**

ven-AI is an autonomous spending agent built for the MetaMask Smart Accounts Kit × 1Shot API hackathon. You grant it a capped, time-limited, revocable permission; it plans a task with Venice AI, **redelegates sub-budgets** to specialist agents, and each agent **pays for the services it uses** via x402 — with gas paid in stablecoins through the 1Shot relayer. Every payment is provable on-chain.

The core idea: today, giving an AI agent the ability to pay means handing over a private key. ven-AI replaces that with **programmable, bounded permission** — the agent transacts on its own, but the limits stay in your hands.

> See `CONTEXT.md` for the hackathon brief, `PROJECT.md` for the full product spec, and `UI_GUIDE.md` for the design system.

---

## How it works

1. **Grant a budget.** Connect a wallet and approve once: a cap (e.g. $50), categories, and an expiry. Not full access — an envelope holding $50, revocable anytime.
2. **Write a request.** One sentence, e.g. *"research 3 competitors, then make a poster."* The ven-AI breaks it into sub-tasks and allocates the budget.
3. **Agents delegate and work.** The ven-AI **redelegates** sub-budgets to specialist agents (Research, Media). Each pays for what it uses (paid data, model calls, image generation) via x402.
4. **Result + proof.** You get the output plus an audit trail: who paid what, how much, and how much is left. Unspent budget stays yours.

Permissions only ever **narrow** as they flow down (user → ven-AI → specialists); the sum of all sub-agent spend can never exceed your cap.

---

## Hackathon tracks

One app, designed to qualify across multiple tracks:

| Track | How ven-AI addresses it |
| --- | --- |
| **Best Agent** | The ven-AI acts autonomously on the user's behalf under an ERC-7715 Advanced Permission. |
| **Best A2A Coordination** | The ven-AI **redelegates** (ERC-7710) sub-budgets to specialist agents. |
| **Best x402 + ERC-7710** | Specialist agents settle service payments via x402 using delegated authority. |
| **Best use of Venice AI** | Venice is the planning brain and the output generator (text + image). |
| **Best use of 1Shot Relayer** | Transactions relayed via 1Shot; gas paid in stablecoins; 7702 account upgrade; webhooks as the source of truth for status. |

See `CONTEXT.md` for the full qualification criteria.

---

## Architecture

A pnpm monorepo with three workspaces:

```
apps/web/         Next.js 15 frontend — landing page + dashboard
apps/agent/       Hono service — ven-AI orchestration + integrations
packages/shared/  TypeScript domain types shared by web and agent
```

- **`apps/web`** — React 19, Tailwind 3, RainbowKit + wagmi + viem. Landing page (`/`) with Lenis smooth scroll; control-panel dashboard (`/app`) showing the budget meter, delegation chain, live activity feed, and result panel.
- **`apps/agent`** — a small HTTP service organized by responsibility:
  - `concierge/` — request planner (Venice-driven)
  - `agents/` — `research`, `media` specialist agents
  - `integrations/` — `venice`, `x402`, `oneshot` clients
  - `routes/` — `plan`, `webhook`
- **`packages/shared`** — the contract (`ActivityEvent`, `DelegationNode`, `TaskPlan`, `Grant`, …) consumed by both sides, so the UI and the agent never drift.

---

## Tech stack

- **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS 3, TypeScript
- **Wallet / chain:** RainbowKit, wagmi, viem (signer-agnostic)
- **Smooth scroll / motion:** Lenis, Framer Motion
- **Agent service:** Hono, tsx
- **AI:** Venice AI (OpenAI-compatible — text + image)
- **Payments / relayer:** x402, 1Shot Permissionless Relayer
- **Permissions:** MetaMask Smart Accounts Kit (ERC-7715 / ERC-7710 / ERC-7702)

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

- `apps/web` — `NEXT_PUBLIC_WC_PROJECT_ID` (WalletConnect / Reown) for real wallet connect.
- `apps/agent` — `VENICE_API_KEY`, `ONESHOT_API_KEY`, `ONESHOT_WEBHOOK_SECRET`.

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
│  │     ├─ app/            # routes: / (landing), /app (dashboard)
│  │     ├─ components/     # one concern per file
│  │     │  ├─ landing/     # nav, hero, sections, smooth-scroll, reveal
│  │     │  └─ ui/          # small primitives
│  │     └─ lib/            # wagmi config, utils, mock data
│  └─ agent/
│     └─ src/
│        ├─ concierge/      # planner
│        ├─ agents/         # research, media
│        ├─ integrations/   # venice, x402, oneshot
│        └─ routes/         # plan, webhook
├─ packages/shared/         # shared domain types
├─ CONTEXT.md               # hackathon brief
├─ PROJECT.md               # product + technical spec
├─ UI_GUIDE.md              # design system + anti-slop rules
└─ CLAUDE.md                # guidance for AI coding agents
```

---

## Design system

Deliberately not a default template. Warm-paper light theme with a single bronze accent, monospace for all numbers, hairline borders, and a signature corner-frame motif on every panel. **No gradients, no emoji** — marks are CSS-drawn. The rationale and full token set live in `UI_GUIDE.md`; the tokens themselves are in `apps/web/tailwind.config.ts`.

---

## Status

Early build. The frontend (landing + dashboard shell) and the monorepo skeleton are in place; the dashboard currently renders representative data shaped to the shared contract. The on-chain spine — ERC-7715 permission grant, ERC-7710 redelegation, x402 settlement, and 1Shot relaying — is scaffolded as typed, clearly-marked stubs and is the next milestone.

Roadmap (by dependency, not date):

1. De-risk the unknowns (redelegation caveats, x402 seller, 1Shot chain/7702 target).
2. Foundation + visual identity. *(done)*
3. On-chain vertical slice: grant → one redelegation → one x402 payment → relayed → status via webhook.
4. Agent layer: Venice planning + Research/Media agents.
5. Orchestration: budget accounting + live feed from webhooks.
6. Full UI per `UI_GUIDE.md`, then demo hardening.

---

## License

Hackathon project. Not yet licensed for reuse.
