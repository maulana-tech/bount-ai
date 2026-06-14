export type AgentRole = string;
export type PaymentStatus = "pending" | "confirmed" | "failed";

export interface Grant {
  cap: number;
  category: string[];
  expiresAt: number;
}

export interface BudgetState {
  cap: number;
  spent: number;
}

export interface DelegationNode {
  id: string;
  role: AgentRole | "user";
  label: string;
  cap: number;
  spent: number;
  active: boolean;
}

export interface SubTask {
  agent: AgentRole;
  description: string;
  estimatedCost: number;
}

export interface TaskPlan {
  request: string;
  subtasks: SubTask[];
}

export interface DelegationProof {
  from: string;
  to: string;
  hash: string;
  capUsd: number;
}

export interface SpikeResult {
  request: string;
  budget: BudgetState;
  delegation: DelegationNode[];
  activity: ActivityEvent[];
  proofs: DelegationProof[];
  settlement: "simulated" | "onchain";
  relayed: boolean;
}

export interface ActivityEvent {
  id: string;
  agent: AgentRole;
  action: string;
  amount: number;
  status: PaymentStatus;
  txHash?: string;
  gasUsd?: number;
  at: number;
}

export interface Capability {
  id: string;
  label: string;
  description: string;
  keywords: string[];
  unitCostUsd: number;
  product: string;
}

export const CAPABILITIES: Capability[] = [
  {
    id: "research",
    label: "Research",
    description: "Gather and summarize data, sources, and competitors",
    keywords: ["research", "competitor", "market", "analyze", "analysis", "find", "data", "compare", "audit", "investigate"],
    unitCostUsd: 2,
    product: "dataset",
  },
  {
    id: "writing",
    label: "Copywriting",
    description: "Write copy, summaries, posts, and emails",
    keywords: ["write", "copy", "summary", "summarize", "article", "post", "caption", "email", "blog", "pitch", "draft"],
    unitCostUsd: 1,
    product: "text",
  },
  {
    id: "image",
    label: "Image",
    description: "Generate images, posters, logos, and graphics",
    keywords: ["poster", "image", "picture", "logo", "graphic", "design", "illustration", "banner", "thumbnail", "art"],
    unitCostUsd: 5,
    product: "image",
  },
  {
    id: "video",
    label: "Video",
    description: "Generate short video clips and animations",
    keywords: ["video", "clip", "animation", "reel", "trailer", "motion"],
    unitCostUsd: 8,
    product: "video",
  },
  {
    id: "audio",
    label: "Audio",
    description: "Generate voiceover, music, and audio",
    keywords: ["audio", "voice", "voiceover", "music", "sound", "podcast", "narration", "song"],
    unitCostUsd: 3,
    product: "audio",
  },
  {
    id: "translate",
    label: "Translation",
    description: "Translate and localize text between languages",
    keywords: ["translate", "translation", "localize", "localization", "language", "multilingual"],
    unitCostUsd: 1,
    product: "text",
  },
];
