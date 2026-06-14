import app from "../src/app.js";

export default async function handler(req: any, res: any) {
  try {
    const url = new URL(req.url || "/", `https://${req.headers.host || "localhost"}`);
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers || {})) {
      if (v) headers.set(k, Array.isArray(v) ? v.join(", ") : String(v));
    }
    const request = new Request(url.toString(), {
      method: req.method || "GET",
      headers,
    });
    const response = await app.fetch(request);
    res.statusCode = response.status;
    response.headers.forEach((v, k) => res.setHeader(k, v));
    res.end(await response.text());
  } catch (e: any) {
    res.statusCode = 500;
    res.setHeader("content-type", "text/plain");
    res.end(`Error: ${e?.message || e}\n${e?.stack || ""}`);
  }
}
