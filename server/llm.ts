// ===== Shared LLM gateway for CityStage =====
//
// This module is consumed by two runtimes:
//   1. The local Express server (server/index.ts) — used in `npm run dev`.
//   2. The Vercel Serverless Functions under /api — used in production.
//
// Both call into `getAiConfig()` and `callLLM()` so that:
//   - env-var loading + secret-keeping rules stay in one place
//   - the same prompt construction (`buildPrompt`) is shared
//   - behaviour, timeouts, and error semantics are identical

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ===== .env loader (local dev only; on Vercel env vars are injected) =====
function loadDotEnv() {
  // Only attempt to load .env when running locally. Vercel injects env
  // vars directly, and reading a .env file from inside a Function
  // bundle would silently fail anyway.
  if (process.env.VERCEL) return;
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) return;
  try {
    const raw = readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch (err) {
    console.warn('[llm] failed to read .env:', err);
  }
}
loadDotEnv();

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
 * change at runtime.
 */
export function getAiConfig(): AiConfig {
  if (cachedConfig) return cachedConfig;
  const apiKey = (process.env.DEEPSEEK_API_KEY ?? '').trim();
  const baseUrl = (process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com').replace(/\/$/, '');
  const model = (process.env.DEEPSEEK_MODEL ?? 'deepseek-chat').trim();
  // Real DeepSeek keys are 35+ chars. Shorter = placeholder / test value.
  const enabled = apiKey.length >= 30;
  cachedConfig = { apiKey, baseUrl, model, enabled };
  return cachedConfig;
}

/**
 * Build the LLM request body for a list of messages. Exported so the
 * dev server can log it in dry-run mode and so tests can assert shape.
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
    throw new Error('ai_disabled');
  }
  const url = `${cfg.baseUrl}/chat/completions`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify(buildRequestBody(cfg.model, messages)),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) {
      const errorText = await response.text();
      const snippet = errorText.length > 300 ? errorText.slice(0, 300) + '…' : errorText;
      throw new Error(`LLM API error ${response.status}: ${snippet}`);
    }
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content || '';
  } catch (err) {
    clearTimeout(timeout);
    // Never include the API key in the error message.
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[llm] Failed to call ${url} (model=${cfg.model}): ${msg}`);
    throw err;
  }
}
