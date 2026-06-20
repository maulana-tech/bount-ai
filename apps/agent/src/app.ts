import { Hono } from "hono";
import { cors } from "hono/cors";
import { planRoute } from "./routes/plan.js";
import { sellerRoute } from "./routes/seller.js";
import { spikeRoute } from "./routes/spike.js";
import { registerT3nContract, getT3nClients } from "./integrations/t3n.js";
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
app.route("/seller", sellerRoute);
app.route("/spike", spikeRoute);

app.post("/auth/session", async (c) => {
  try {
    const { apiKey } = await c.req.json().catch(() => ({}));
    const clients = await getT3nClients(apiKey || undefined);
    if (!clients) {
      return c.json({ error: "Failed to initialize T3N client. Please check your T3N API Key." }, 400);
    }
    const did = clients.tenantDid;
    const address = did.replace("did:t3n:", "");
    return c.json({ status: "ok", did, address });
  } catch (err: any) {
    return c.json({ error: err.message || "Failed to authenticate session" }, 500);
  }
});

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

  // Call real T3N registration if credentials available
  let t3nContractId: string | null = null;
  try {
    const reg = await registerT3nContract(name, wasmBuffer);
    if (reg) {
      t3nContractId = reg.contractId;
      console.log(`[T3N TEE] Real enclave contract registered with ID ${t3nContractId}`);
    }
  } catch (err) {
    console.warn(`[T3N TEE] Real T3N registration failed, proceeding with mock:`, err);
  }

  return c.json({
    status: "ok",
    enclaveAddress,
    did: `did:t3n:${name.toLowerCase()}`,
    ...(t3nContractId ? { t3nContractId } : {})
  });
});

export default app;
