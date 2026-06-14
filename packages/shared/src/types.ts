/**
 * Kontrak domain bersama web ⇄ agent.
 * Web menampilkan apa yang agent hasilkan, jadi tipe ini satu sumber kebenaran.
 * Lihat PROJECT.md untuk konteks alur.
 */

/**
 * Identitas aktor/kapabilitas. "user" & "concierge" direservasi; sisanya =
 * id kapabilitas dinamis dari registry agent (research, writing, image, video,
 * audio, translate, …). Sengaja string terbuka — agent ini umum, bukan terbatas
 * ke beberapa tugas.
 */
export type AgentRole = string;

/** Status pembayaran on-chain (sumber: webhook 1Shot). */
export type PaymentStatus = "pending" | "confirmed" | "failed";

/** Izin yang diberikan user (ERC-7715 Advanced Permission). */
export interface Grant {
  /** plafon total dalam USD */
  cap: number;
  /** kategori yang diizinkan, mis. ["riset", "media"] */
  category: string[];
  /** epoch ms kadaluarsa */
  expiresAt: number;
}

/** State budget agregat (level user). */
export interface BudgetState {
  cap: number;
  spent: number;
}

/** Satu node dalam rantai delegasi: user → concierge → specialist. */
export interface DelegationNode {
  id: string;
  role: AgentRole | "user";
  label: string;
  /** sub-plafon node ini (USD) */
  cap: number;
  spent: number;
  active: boolean;
}

/** Satu sub-tugas hasil perencanaan Concierge (via Venice). */
export interface SubTask {
  /** id kapabilitas yang dipilih (lihat registry agent) */
  agent: AgentRole;
  description: string;
  /** estimasi biaya USD */
  estimatedCost: number;
}

/** Rencana lengkap dari Concierge untuk satu permintaan user. */
export interface TaskPlan {
  request: string;
  subtasks: SubTask[];
}

/**
 * Bukti satu delegasi/redelegasi yang dibangun & ditandatangani (hash off-chain).
 * Dipakai untuk menampilkan rantai delegasi sebagai bukti, bukan klaim.
 */
export interface DelegationProof {
  /** label pihak pendelegasi (mis. "user", "ven-AI") */
  from: string;
  /** label penerima (mis. "ven-AI", "research") */
  to: string;
  /** hash delegasi (getDelegationHashOffchain) */
  hash: string;
  /** sub-plafon delegasi ini (USD) */
  capUsd: number;
}

/** Output dari satu specialist agent. */
export interface AgentOutput {
  agent: string;
  label: string;
  type: "text" | "image";
  text?: string;
  imageUrl?: string;
}

/**
 * Hasil satu putaran vertical-slice (Fase 2 spike): rencana → delegasi +
 * redelegasi (nyata) → pembayaran x402 → jejak. `settlement`/`relayed`
 * menandai mana yang masih disimulasi vs sudah on-chain.
 */
export interface SpikeResult {
  request: string;
  budget: BudgetState;
  delegation: DelegationNode[];
  activity: ActivityEvent[];
  proofs: DelegationProof[];
  outputs: AgentOutput[];
  settlement: "simulated" | "onchain";
  relayed: boolean;
}

/**
 * Satu entri di activity feed — sekaligus "witness block" (UI_GUIDE §6):
 * aksi agent + bukti transaksi on-chain.
 */
export interface ActivityEvent {
  id: string;
  agent: AgentRole;
  action: string;
  /** jumlah yang dibayar (USD) */
  amount: number;
  status: PaymentStatus;
  /** hash transaksi (terisi setelah relay 1Shot) */
  txHash?: string;
  /** gas yang dibayar dalam stablecoin (USD) */
  gasUsd?: number;
  /** epoch ms */
  at: number;
}
