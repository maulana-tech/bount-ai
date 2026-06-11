import type { TaskPlan } from "@concierge/shared";
import { veniceChat } from "../integrations/venice.js";

/**
 * Concierge — otak orkestrator. Mengubah permintaan natural language jadi
 * rencana sub-tugas + estimasi biaya (pakai Venice), lalu (Fase 3) mendelegasi
 * sub-budget ke specialist agent.
 *
 * Sekarang: rencana dummy deterministik agar web punya bentuk data yang benar.
 * ⚠️ Fase 3: ganti dengan reasoning Venice nyata.
 */
export async function planRequest(request: string): Promise<TaskPlan> {
  await veniceChat(`Pecah permintaan ini jadi sub-tugas: ${request}`);

  return {
    request,
    subtasks: [
      { agent: "research", description: "Research competitors", estimatedCost: 6 },
      { agent: "media", description: "Make summary poster", estimatedCost: 5 },
    ],
  };
}
