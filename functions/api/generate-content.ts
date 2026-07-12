// ===== Cloudflare Pages Function: POST /api/generate-content =====
//
// Proxies an LLM prompt to DeepSeek. The client sends only the
// promptType + params; the server reads the API key from its own
// environment (`DEEPSEEK_API_KEY` configured in the Cloudflare
// project's Settings → Variables). The key is never returned to the
// client.

interface EventContext<Env = unknown> {
  request: Request;
  env: Env;
  params: Record<string, string>;
  waitUntil: (promise: Promise<unknown>) => void;
  passThroughOnException: () => void;
  data: Record<string, unknown>;
}

function jsonResponse(body: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      ...extraHeaders,
    },
  });
}

export const onRequestPost = async (context: EventContext): Promise<Response> => {
  // Dynamic import keeps the LLM gateway out of any static analysis
  // edge cases — and lets the dev-mode .env loader take effect at
  // module init.
  const { getAiConfig, callLLM } = await import("../../server/llm");
  const { buildPrompt } = await import("../../server/prompts");

  let body: { promptType?: unknown; params?: unknown } = {};
  try {
    body = (await context.request.json()) as typeof body;
  } catch {
    return jsonResponse({ error: "Bad request: body must be JSON" }, 400);
  }

  const { promptType, params } = body;
  if (typeof promptType !== "string" || !params || typeof params !== "object") {
    return jsonResponse({ error: "Bad request: missing promptType or params" }, 400);
  }

  const cfg = getAiConfig(context.env as Record<string, string | undefined>);
  if (!cfg.enabled) {
    return jsonResponse(
      {
        error: "ai_disabled",
        fallback: true,
        message: "No DEEPSEEK_API_KEY configured on the server.",
      },
      503
    );
  }

  try {
    const prompt = buildPrompt(promptType, params as Record<string, string>);
    console.log(`[generate-content] type=${promptType} model=${cfg.model}`);

    const p = params as Record<string, unknown>;
    const messages: Array<{ role: string; content: unknown }> = [
      { role: "user", content: prompt },
    ];

    if (typeof p.photoData === "string" && p.photoData.startsWith("data:image")) {
      messages[0].content = [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: p.photoData } },
      ];
    }

    if (typeof p.drawingData === "string" && p.drawingData.startsWith("data:image")) {
      messages[0].content = [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: p.drawingData } },
      ];
    }

    const content = await callLLM(messages, cfg);
    return jsonResponse({ content });
  } catch (err) {
    console.error("[generate-content] upstream error:", err);
    return jsonResponse({ error: "upstream_error", fallback: true }, 502);
  }
};

export const onRequestOptions = async (): Promise<Response> => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};
