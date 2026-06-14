import { serve } from "@hono/node-server";
import { config } from "./config.js";
import app from "./app.js";

serve({ fetch: app.fetch, port: config.port }, ({ port }) => {
  console.log(`[agent] listening on http://localhost:${port}`);
});
