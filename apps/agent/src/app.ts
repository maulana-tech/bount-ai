import { Hono } from "hono";
import { cors } from "hono/cors";
import { planRoute } from "./routes/plan.js";
import { webhookRoute } from "./routes/webhook.js";
import { sellerRoute } from "./routes/seller.js";
import { spikeRoute } from "./routes/spike.js";

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

export default app;
