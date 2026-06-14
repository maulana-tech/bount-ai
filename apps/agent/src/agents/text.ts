import { veniceChat } from "../integrations/venice.js";

/**
 * TextAgent — generic text generation untuk writing, translate, dll.
 * System prompt disesuaikan per capability.
 */
export async function runText(
  request: string,
  system: string,
): Promise<{ text: string }> {
  const { text } = await veniceChat(request, system);
  return { text };
}
