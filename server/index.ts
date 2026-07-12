// ===== CityStage local dev backend =====
//
// Express server that runs in `npm run dev` on port 3001. The
// production deployment uses Vercel Serverless Functions under /api/*,
// which share the same business logic via ./llm.ts.
//
// Endpoints:
//   GET  /api/health           — liveness + AI-enabled flag
//   POST /api/generate-content — prompt the LLM via DeepSeek
//
// SECURITY: the API key is read from the server-side environment only.
// It is never accepted from the client, never logged, never returned.

import express from 'express';
import cors from 'cors';
import { buildPrompt } from './prompts';
import { getAiConfig, callLLM } from './llm';

const PORT = Number(process.env.PORT ?? 3001);

const cfg = getAiConfig();
if (!cfg.enabled) {
  console.warn(
    '[server] DEEPSEEK_API_KEY is not set (or is a known placeholder). ' +
      'AI endpoints will return 503 aiDisabled. The client will use ' +
      'its built-in offline fallbacks.'
  );
} else {
  console.log(
    `[server] DeepSeek configured: model=${cfg.model} baseUrl=${cfg.baseUrl} ` +
      `key=${cfg.apiKey.slice(0, 6)}…${cfg.apiKey.slice(-4)}`
  );
}

const app = express();

app.use(
  cors({
    origin: true, // dev-only; tighten in production
    credentials: false,
  })
);
app.use(express.json({ limit: '10mb' }));

// ===== Health check =====
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    aiEnabled: cfg.enabled,
    model: cfg.model,
    baseUrl: cfg.baseUrl,
  });
});

// ===== Generate Content =====
app.post('/api/generate-content', async (req, res) => {
  const { promptType, params } = req.body ?? {};

  if (typeof promptType !== 'string' || !params || typeof params !== 'object') {
    return res.status(400).json({ error: 'Bad request: missing promptType or params' });
  }

  if (!cfg.enabled) {
    return res.status(503).json({
      error: 'ai_disabled',
      fallback: true,
      message: 'No DEEPSEEK_API_KEY configured on the server.',
    });
  }

  try {
    const prompt = buildPrompt(promptType, params);
    console.log(`[generate-content] type=${promptType} model=${cfg.model}`);

    const messages: Array<{ role: string; content: unknown }> = [
      { role: 'user', content: prompt },
    ];

    if (
      typeof params.photoData === 'string' &&
      params.photoData.startsWith('data:image')
    ) {
      messages[0].content = [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: params.photoData } },
      ];
    }

    if (
      typeof params.drawingData === 'string' &&
      params.drawingData.startsWith('data:image')
    ) {
      messages[0].content = [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: params.drawingData } },
      ];
    }

    const response = await callLLM(messages, cfg);
    res.json({ content: response });
  } catch (err) {
    console.error('[generate-content] upstream error:', err);
    res.status(502).json({ error: 'upstream_error', fallback: true });
  }
});

app.listen(PORT, () => {
  console.log(`CityStage backend running on http://localhost:${PORT}`);
  console.log(`[server] AI enabled: ${cfg.enabled}`);
});
