import { Hono } from "hono";
import { cors } from "hono/cors";
import { planRoute } from "./routes/plan.js";
import { webhookRoute } from "./routes/webhook.js";
import { sellerRoute } from "./routes/seller.js";
import { spikeRoute } from "./routes/spike.js";
import * as fs from "fs";
import * as path from "path";

const app = new Hono();

app.use("*", cors());
app.onError((err, c) => {
  console.error("Hono error:", err);
  return c.json({ error: err.message, stack: err.stack }, 500);
});
app.get("/health", (c) => c.json({ ok: true, service: "concierge-agent" }));
app.route("/plan", planRoute);
app.route("/webhook", webhookRoute);
app.route("/seller", sellerRoute);
app.route("/spike", spikeRoute);

app.post("/publish-skill", async (c) => {
  const body = await c.req.json();
  const { name, did, wasmBase64 } = body;
  
  if (!name || !did || !wasmBase64) {
    return c.json({ error: "Missing required fields: name, did, wasmBase64" }, 400);
  }

  const uploadDir = path.resolve("./published_skills");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const wasmBuffer = Buffer.from(wasmBase64, "base64");
  const wasmPath = path.join(uploadDir, `${name.toLowerCase()}.wasm`);
  fs.writeFileSync(wasmPath, wasmBuffer);

  const crypto = await import("crypto");
  const hash = crypto.createHash("sha256").update(wasmBuffer).digest("hex");
  const enclaveAddress = `0x${hash.slice(0, 40)}`;

  console.log(`[T3N TEE] Registered skill "${name}" for DID ${did} at enclave ${enclaveAddress}`);

  return c.json({
    status: "ok",
    enclaveAddress,
    did: `did:t3n:${name.toLowerCase()}`
  });
});

export default app;
