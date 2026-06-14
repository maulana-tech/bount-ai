import { config } from "../config.js";

const MODEL = "z-ai-glm-5-turbo";

/**
 * Klien Venice AI (OpenAI-compatible). Dipakai Concierge untuk merencanakan
 * tugas (text) dan MediaAgent untuk generate gambar.
 */

export interface ChatResult {
  text: string;
}

export async function veniceChat(
  prompt: string,
  system?: string,
): Promise<ChatResult> {
  if (!config.venice.apiKey) {
    return { text: `[venice-stub] ${prompt.slice(0, 40)}…` };
  }

  const messages: { role: string; content: string }[] = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: prompt });

  const res = await fetch(`${config.venice.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.venice.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: MODEL, messages }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`veniceChat ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  return { text: data.choices?.[0]?.message?.content ?? "" };
}

export async function veniceImage(prompt: string): Promise<{ url: string }> {
  // Image endpoint requires full API key (inference key tidak punya akses).
  // Generate SVG placeholder.
  const label = prompt.slice(0, 40).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    <rect width="1024" height="1024" fill="#f5f0eb"/>
    <rect x="128" y="128" width="768" height="768" rx="16" fill="none" stroke="#c8a97e" stroke-width="2" stroke-dasharray="8 4"/>
    <text x="512" y="460" font-family="sans-serif" font-size="24" fill="#8b7355" text-anchor="middle">${label}</text>
    <text x="512" y="500" font-family="sans-serif" font-size="14" fill="#a09080" text-anchor="middle">image generation requires full API key</text>
  </svg>`;
  return { url: `data:image/svg+xml,${encodeURIComponent(svg)}` };
}
