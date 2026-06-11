import type { TaskPlan } from "@concierge/shared";
import { veniceChat } from "../integrations/venice.js";
import { selectCapabilities } from "../capabilities.js";

/**
 * Concierge — otak orkestrator. Mengubah permintaan natural language jadi
 * rencana sub-tugas dinamis dari registry kapabilitas (bukan tugas hardcoded),
 * lalu (Fase 3) mendelegasi sub-budget ke specialist agent.
 *
 * Sekarang: pemilihan heuristik atas registry — sudah menangani permintaan
 * apa pun. Fase 3: VENICE_API_KEY → Venice memilih kapabilitas + alokasi budget.
 */
export async function planRequest(request: string): Promise<TaskPlan> {
  // Jejak reasoning (stub sampai Venice nyata dipasang di Fase 3).
  await veniceChat(`Decompose this request into capabilities: ${request}`);

  const caps = selectCapabilities(request);

  return {
    request,
    subtasks: caps.map((c) => ({
      agent: c.id,
      description: c.description,
      estimatedCost: c.unitCostUsd,
    })),
  };
}
