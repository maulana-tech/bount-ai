# AGENTS.md — ven-AI monorepo

## TL;DR

```
pnpm install          # install all workspaces
pnpm dev              # web (3000) + agent (8787) in parallel
pnpm build            # build web (validates SSR + types)
pnpm -r typecheck     # typecheck every workspace
pnpm --filter @concierge/web lint
```

No test runner, no CI, no pre-commit hooks. No env vars needed for build/typecheck.

## Monorepo boundaries

- **`apps/web/`** — Next.js 15 App Router, React 19, Tailwind 3. RainbowKit + wagmi + viem. Entrypoint: `src/app/layout.tsx`.
- **`apps/agent/`** — Hono service, dev via `tsx watch`. Entrypoint: `src/index.ts`. Endpoints: `GET /health`, `POST /plan`, `POST /spike`, `GET /spike/capabilities`, `GET /seller/data`, `GET /seller/buy`, `POST /webhook/oneshot`.
- **`packages/shared/`** — TS domain types, published as source (no build step). Web consumes via `next.config.ts` `transpilePackages`. Change a type here → both sides update.
- All commands from repo root. Use `--filter` for per-package commands.

## Agent architecture (not obvious from files)

Agent is **general, not task-specific**. The capability registry lives in `@concierge/shared` (`capabilities.ts`). Extend by adding a `Capability` entry — both the agent and the web Agents page pick it up. Users can create custom agents on `/app/agents` (localStorage) sent to `/spike` body.

Modular by directory under `apps/agent/src/`:
- `concierge/` — planner
- `agents/` — research, media (specialist implementations)
- `integrations/` — `delegation` (real ERC-7710 via `@metamask/delegation-toolkit`), `x402` (real 402→pay→retry, settlement simulated), `oneshot` (gated by `ONESHOT_RELAYER_URL`), `venice` (stub)
- `routes/` — plan, webhook, seller (local mock x402 seller), spike (orchestrator)
- `spike.ts` — the Fase 2 orchestrator

## Current state (Fase 2 vertical slice)

- Delegation construction + caveats + redelegation + signing + hashes: **real** (via `@metamask/delegation-toolkit`)
- x402 payment loop (402→pay→retry→200) vs local mock seller: **real**
- Settlement on-chain & 1Shot relay: **simulated/gated** (needs funds + API keys)
- Dashboard PromptBar calls `POST /spike` and renders real trace

## Design system hard rules

Read `UI_GUIDE.md` before any visual change. Source of truth: `apps/web/tailwind.config.ts` (warm paper + bronze accent, NOT shadcn zinc).

- **No color gradients, no emoji/emote glyphs** — marks are CSS-drawn (see `components/Logo.tsx`)
- **`<CornerFrame>`** wraps every panel — reuse it, never re-implement
- Fonts: Manrope (sans) + JetBrains Mono (all numbers/money/hashes use `font-mono` + `.tnum`)
- Components split one-per-file under `src/components/`. `page.tsx` files are composition only. Routes: `/` (landing), `/app` (dashboard), `/app/agents` (specialist registry).
- Dashboard renders dummy data from `src/lib/mock.ts` (shaped to shared contract). Real state = Fase 3–4.

## Environment

```bash
cp apps/web/.env.example   apps/web/.env.local
cp apps/agent/.env.example apps/agent/.env.local
```

- `NEXT_PUBLIC_WC_PROJECT_ID` — WalletConnect/Reown (real wallet connect)
- `NEXT_PUBLIC_AGENT_URL` — points to agent (default `http://localhost:8787`)
- `VENICE_API_KEY` / `ONESHOT_*` — agent only, gated behind key presence

## Operational gotchas

- Target chain: **Base** (Base Sepolia 84532 default for dev in `config.ts`). Using ERC-7710 Smart Account delegation (NOT ERC-7715 — 7715 is Sepolia-only and avoided).
- Mock x402 seller at `GET /seller/buy` — serves as "paid service" for all capabilities until real Venice x402 endpoint is wired.
- `@metamask/delegation-toolkit` (^0.13.0) handles delegation build, caveat builder, signing. Caveats: `erc20TransferAmount` (spending limit) + `allowedTargets` (whitelist).
- Known harmless build warning: `@react-native-async-storage/async-storage` not found — optional RN dep from MetaMask SDK, irrelevant on web.

## Deploy to Vercel

Two separate Vercel projects (monorepo). Dashboard settings needed:

**1. Web (`apps/web`)**
- Framework preset: Next.js (auto-detected)
- Root Directory: `apps/web`
- Environment: `NEXT_PUBLIC_WC_PROJECT_ID`, `NEXT_PUBLIC_AGENT_URL`

**2. Agent (`apps/agent`)**
- Framework preset: Other
- Root Directory: `apps/agent`
- Build Command: leave default (Vercel detects `api/` directory)
- Environment: `AGENT_PUBLIC_URL` (set to the deployed agent URL), `VENICE_API_KEY`, `ONESHOT_*`
- `vercel.json` at `apps/agent/vercel.json` rewrites all routes to `api/[[...route]].ts` (Hono Vercel adapter via `hono/vercel`)

After deploying the agent, set the web's `NEXT_PUBLIC_AGENT_URL` to the agent's Vercel URL.

## Instruction files (read first for product decisions)

- `CONTEXT.md` — hackathon brief + prize eligibility criteria
- `PROJECT.md` — full product + technical spec
- `UI_GUIDE.md` — design system rationale + anti-slop rules
- `CLAUDE.md` — legacy guidance (may be stale)
