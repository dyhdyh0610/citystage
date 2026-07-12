// ===== Vercel Function: POST /api/generate-content =====
//
// Proxies an LLM prompt to DeepSeek. The client sends only the
// promptType + params; the server reads the API key from its own
// environment (`DEEPSEEK_API_KEY` configured in the Vercel project
// settings). The key is never returned to the client.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildPrompt } from '../server/prompts';
import { getAiConfig, callLLM } from '../server/llm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS — Vercel Functions receive calls from the same origin in
  // production, but the dev preview URL also needs to be reachable.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { promptType, params } = (req.body ?? {}) as {
    promptType?: unknown;
    params?: unknown;
  };

  if (typeof promptType !== 'string' || !params || typeof params !== 'object') {
    return res
      .status(400)
      .json({ error: 'Bad request: missing promptType or params' });
  }

  const cfg = getAiConfig();
  if (!cfg.enabled) {
    return res.status(503).json({
      error: 'ai_disabled',
      fallback: true,
      message: 'No DEEPSEEK_API_KEY configured on the server.',
    });
  }

  try {
    const prompt = buildPrompt(promptType, params as Record<string, string>);
    console.log(`[generate-content] type=${promptType} model=${cfg.model}`);

    const p = params as Record<string, unknown>;
    const messages: Array<{ role: string; content: unknown }> = [
      { role: 'user', content: prompt },
    ];

    if (typeof p.photoData === 'string' && p.photoData.startsWith('data:image')) {
      messages[0].content = [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: p.photoData } },
      ];
    }

    if (typeof p.drawingData === 'string' && p.drawingData.startsWith('data:image')) {
      messages[0].content = [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: p.drawingData } },
      ];
    }

    const content = await callLLM(messages, cfg);
    return res.status(200).json({ content });
  } catch (err) {
    console.error('[generate-content] upstream error:', err);
    return res.status(502).json({ error: 'upstream_error', fallback: true });
  }
}
