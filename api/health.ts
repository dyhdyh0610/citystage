// ===== Vercel Function: GET /api/health =====
//
// Reports liveness + whether the server has a usable DEEPSEEK_API_KEY.
// The client uses `aiEnabled` to decide between the online LLM path
// and the offline fallback (preset) path.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAiConfig } from '../server/llm';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  // CORS for direct browser hits (Vite dev proxy is not in play here).
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (_req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  const cfg = getAiConfig();
  return res.status(200).json({
    status: 'ok',
    aiEnabled: cfg.enabled,
    model: cfg.model,
    baseUrl: cfg.baseUrl,
  });
}
