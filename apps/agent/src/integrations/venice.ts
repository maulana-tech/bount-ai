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

const IMAGE_MODEL = process.env.VENICE_IMAGE_MODEL ?? "venice-sd35";

/**
 * Generate an image via Venice (`POST /image/generate` → base64). Returns a
 * data URL. Falls back to an SVG placeholder if no key, the call fails, or the
 * key lacks image access — so the flow never breaks.
 */
export async function veniceImage(prompt: string): Promise<{ url: string }> {
  if (!config.venice.apiKey) return { url: placeholderSvg(prompt) };

  try {
    const res = await fetch(`${config.venice.baseUrl}/image/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.venice.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: IMAGE_MODEL,
        prompt: prompt.slice(0, 1500),
        width: 1024,
        height: 1024,
        format: "webp",
        safe_mode: false,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`veniceImage ${res.status}: ${body.slice(0, 200)}`);
      return { url: placeholderSvg(prompt) };
    }

    const data = (await res.json()) as { images?: string[] };
    const b64 = data.images?.[0];
    if (!b64) return { url: placeholderSvg(prompt) };
    return { url: `data:image/webp;base64,${b64}` };
  } catch (err) {
    console.error("veniceImage failed:", err);
    return { url: placeholderSvg(prompt) };
  }
}

/** Fallback placeholder shown only when real generation is unavailable. */
function placeholderSvg(prompt: string): string {
  const label = prompt
    .slice(0, 40)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    <rect width="1024" height="1024" fill="#f5f0eb"/>
    <rect x="128" y="128" width="768" height="768" rx="16" fill="none" stroke="#c8a97e" stroke-width="2" stroke-dasharray="8 4"/>
    <text x="512" y="480" font-family="sans-serif" font-size="22" fill="#8b7355" text-anchor="middle">${label}</text>
    <text x="512" y="520" font-family="sans-serif" font-size="14" fill="#a09080" text-anchor="middle">image unavailable — check VENICE_API_KEY image access</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
