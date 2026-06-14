import app from "../src/app.js";

export default async function handler(req: Request) {
  return await app.fetch(req);
}
