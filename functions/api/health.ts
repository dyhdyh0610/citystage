// ===== Cloudflare Pages Function: GET /api/health =====
//
// Pages Functions use the `onRequest(context)` signature, where
// `context.request` is a standard `Request` and `context.env` holds
// the project's secret bindings + plain env vars. We return a
// standard `Response` object directly.

interface EventContext<Env = unknown> {
  request: Request;
  env: Env;
  params: Record<string, string>;
  waitUntil: (promise: Promise<unknown>) => void;
  passThroughOnException: () => void;
  data: Record<string, unknown>;
}

export const onRequestGet = async (context: EventContext): Promise<Response> => {
  const { getAiConfig } = await import("../../server/llm");
  const cfg = getAiConfig(context.env as Record<string, string | undefined>);
  return new Response(
    JSON.stringify({
      status: "ok",
      aiEnabled: cfg.enabled,
      model: cfg.model,
      baseUrl: cfg.baseUrl,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
    }
  );
};

// Handle CORS preflight for cross-origin browser hits.
export const onRequestOptions = async (): Promise<Response> => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};
