export const config = { runtime: "nodejs" };

export default async function handler() {
  return new Response(JSON.stringify({ ok: true, from: "test" }), {
    headers: { "content-type": "application/json" },
  });
}
