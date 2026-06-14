import { type Capability, type TaskPlan, CAPABILITIES } from "../shared.js";
import { selectCapabilities } from "../capabilities.js";

/**
 * Concierge — otak orkestrator. Mengubah permintaan natural language jadi
 * rencana sub-tugas dinamis dari `pool` kapabilitas (bawaan + custom user),
 * bukan tugas hardcoded.
 *
 * Sekarang: pemilihan heuristik. Fase 3: VENICE_API_KEY → Venice memilih
 * kapabilitas + alokasi budget.
 */
export async function planRequest(
  request: string,
  pool: Capability[] = CAPABILITIES,
): Promise<TaskPlan> {
  const caps = await selectCapabilities(request, pool);

  return {
    request,
    subtasks: caps.map((c) => ({
      agent: c.id,
      description: c.description,
      estimatedCost: c.unitCostUsd,
    })),
  };
}
