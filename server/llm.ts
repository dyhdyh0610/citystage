// ===== Shared LLM gateway for CityStage =====
//
// This module is consumed by three runtimes:
//   1. Local Express server (server/index.ts) — for `npm run dev`.
//   2. Vercel Serverless Functions (api/*.ts) — Vercel production.
//   3. Cloudflare Pages Functions (functions/api/*.ts) — CF production.
//
// In dev, env vars come from a local `.env` file (loaded by a tiny
// `node:fs` block guarded by a `typeof process !== "undefined"` runtime
// check). In Vercel and Cloudflare, env vars are injected by the
// platform, so the .env loader is a no-op there.
//
// We avoid `node:fs` / `node:path` at module top level so the same
// file can be bundled by Cloudflare's esbuild (Workers runtime).

type EnvLike = Record<string, string | undefined>;

interface ProcessLike {
  env?: EnvLike;
  cwd?: () => string;
  versions?: { node?: string };
}

// ===== Local-only .env loader =====
//
// Cloudflare and Vercel inject env vars directly, so this block is a
// no-op in production. We only need it for `npm run dev`, where the
// operator may have put their DEEPSEEK_API_KEY into a local .env
// file. We guard on `process.versions.node` (true in Node, undefined
// in Workers) so the module is safe to import from either runtime.
const proc: ProcessLike | undefined =
  typeof process !== "undefined" && (process as unknown as ProcessLike).versions?.node
    ? (process as unknown as ProcessLike)
    : undefined;

if (proc?.env && typeof (globalThis as { __cs_dotenv_loaded__?: boolean }).__cs_dotenv_loaded__ === "undefined") {
  (globalThis as { __cs_dotenv_loaded__?: boolean }).__cs_dotenv_loaded__ = true;
  // We deliberately use a sync, in-place string parser instead of
  // pulling in `dotenv` (which is a Node-only dependency). Reading
  // happens at module init; the only file we look for is `.env`
  // sitting in the current working directory.
  try {
    // Dynamic require keeps the import out of the Workers bundle.
    // `eval` is the canonical escape hatch for esbuild's static
    // analysis — it would not be safe to `import` this from a CF
    // context, but here we only run it when `proc` is set (i.e. real
    // Node).
    const fs = (0, eval)("require")("node:fs") as typeof import("node:fs");
    const path = (0, eval)("require")("node:path") as typeof import("node:path");
    const cwd = proc.cwd?.() ?? ".";
    const envPath = path.resolve(cwd, ".env");
    if (fs.existsSync(envPath)) {
      const raw = fs.readFileSync(envPath, "utf8");
      for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq < 0) continue;
        const key = trimmed.slice(0, eq).trim();
        let value = trimmed.slice(eq + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        if (proc.env![key] === undefined) {
          proc.env![key] = value;
        }
      }
    }
  } catch {
    // .env is best-effort; if anything fails (read-only FS, missing
    // file, etc.) we just continue with whatever env is set already.
  }
}

export interface AiConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  enabled: boolean;
}

let cachedConfig: AiConfig | null = null;

/**
 * Read AI configuration from the environment. Result is cached for the
 * lifetime of the process / function instance because env vars don't
 * change at runtime. Accepts an optional `env` parameter (the
 * Cloudflare Pages Functions `context.env`) so we can read the right
 * per-environment vars there; in Node-only runtimes you can leave it
 * undefined and we fall back to `process.env`.
 */
export function getAiConfig(env?: EnvLike): AiConfig {
  if (cachedConfig && !env) return cachedConfig;
  const source: EnvLike = env ?? proc?.env ?? {};
  const apiKey = (source.DEEPSEEK_API_KEY ?? "").trim();
  const baseUrl = (source.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com").replace(/\/$/, "");
  const model = (source.DEEPSEEK_MODEL ?? "deepseek-chat").trim();
  // Real DeepSeek keys are 35+ chars. Shorter = placeholder / test value.
  const enabled = apiKey.length >= 30;
  const cfg: AiConfig = { apiKey, baseUrl, model, enabled };
  if (!env) cachedConfig = cfg;
  return cfg;
}

/**
 * Build the LLM request body for a list of messages.
 */
export function buildRequestBody(model: string, messages: unknown[], temperature = 0.8) {
  return {
    model,
    messages,
    temperature,
    max_tokens: 1500,
  };
}

/**
 * Call the upstream chat completions API and return the assistant's
 * text content. Throws on any non-2xx or network failure so callers
 * can map to their preferred error semantics.
 */
export async function callLLM(
  messages: Array<{ role: string; content: unknown }>,
  cfg: AiConfig = getAiConfig(),
): Promise<string> {
  if (!cfg.enabled) {
    throw new Error("ai_disabled");
  }
  const url = `${cfg.baseUrl}/chat/completions`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify(buildRequestBody(cfg.model, messages)),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) {
      const errorText = await response.text();
      const snippet = errorText.length > 300 ? errorText.slice(0, 300) + "…" : errorText;
      throw new Error(`LLM API error ${response.status}: ${snippet}`);
    }
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content || "";
  } catch (err) {
    clearTimeout(timeout);
    // Never include the API key in the error message.
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[llm] Failed to call ${url} (model=${cfg.model}): ${msg}`);
    throw err;
  }
}
