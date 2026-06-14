import app from "../src/app.js";

export const config = { runtime: "nodejs" };

export default async function handler(req: Request) {
  return await app.fetch(req);
}
