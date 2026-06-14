import { veniceChat } from "../integrations/venice.js";

/**
 * ResearchAgent — riset topik menggunakan Venice AI.
 */
export async function runResearch(topic: string): Promise<{ summary: string }> {
  const { text } = await veniceChat(topic, "You are a research assistant. Summarize findings clearly and concisely in Indonesian.");
  return { summary: text };
}
