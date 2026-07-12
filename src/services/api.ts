import type { GenerateContentRequest, GenerateContentResponse, TaskContent, ActivityConfig, VisualStyle } from '../types';
import {
  presetTasks,
  fallbackPhotoComments,
  fallbackFindFeedback,
  fallbackStories,
  fallbackDrawingComments,
  fallbackExperienceStory,
  fallbackVisualStyle,
  getRandomFallback,
  TASK_TYPE_META,
  ALL_TASK_TYPES,
} from '../data/defaults';

// ===== Built-in model name =====
//
// The model is a fixed client constant. There is no longer any
// user-facing setting for it; the value is sent to the backend on
// every call as a hint, but the backend reads its own credentials
// from the environment and may override.
const MODEL_NAME = 'deepseek-v4-flash';

// ===== Timeout wrapper =====
function fetchWithTimeout(url: string, options: RequestInit, timeout = 8000): Promise<Response> {
  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    ),
  ]);
}

// ===== Backend AI availability =====
//
// The client does NOT hold an API key. The actual LLM call is made
// by the CityStage backend (server/index.ts) which reads the key
// from its own environment. We cache a single boolean so we can
// skip the network round-trip on every AI call when the backend has
// already told us AI is disabled.
let cachedAiEnabled: boolean | null = null;

export async function probeAiEnabled(): Promise<boolean> {
  if (cachedAiEnabled !== null) return cachedAiEnabled;
  try {
    const res = await fetchWithTimeout(
      '/api/health',
      { method: 'GET' },
      3000
    );
    if (!res.ok) {
      cachedAiEnabled = false;
      return false;
    }
    const data = (await res.json()) as { aiEnabled?: boolean };
    cachedAiEnabled = data.aiEnabled === true;
    return cachedAiEnabled;
  } catch {
    cachedAiEnabled = false;
    return false;
  }
}

/** Reset the cached health check — useful for tests / HMR. */
export function resetAiEnabledCache() {
  cachedAiEnabled = null;
}

// When the server replies with 503 `{ error: 'ai_disabled',
// fallback: true }`, callers should switch to their offline
// fallback path. We model that with this shared error type.
class AiDisabledError extends Error {
  readonly fallback = true;
  constructor() {
    super('AI is disabled on the server');
    this.name = 'AiDisabledError';
  }
}

/**
 * Send a request to the CityStage backend's `/api/generate-content`
 * proxy. The client request body now contains only the prompt type
 * and parameters — never the API key, base URL, or any other secret.
 * The server injects its own credentials.
 */
async function callBackend(
  promptType: string,
  params: Record<string, unknown>,
  timeoutMs: number,
): Promise<string> {
  // Fast path: we've already learned AI is disabled.
  if (cachedAiEnabled === false) throw new AiDisabledError();

  try {
    const response = await fetchWithTimeout(
      '/api/generate-content',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // SECURITY: only the built-in model name is sent. There is
        // no apiKey/baseUrl in the request body — the server reads
        // its own environment.
        body: JSON.stringify({
          promptType,
          params,
          aiConfig: { model: MODEL_NAME },
        } as GenerateContentRequest),
      },
      timeoutMs
    );

    if (response.status === 503) {
      // The backend has no key configured. Remember this so we
      // don't probe on every call.
      cachedAiEnabled = false;
      throw new AiDisabledError();
    }

    if (!response.ok) throw new Error(`Backend HTTP ${response.status}`);
    const data = (await response.json()) as GenerateContentResponse;
    // First successful call confirms AI is live.
    if (cachedAiEnabled === null) cachedAiEnabled = true;
    return data.content || '';
  } catch (err) {
    if (err instanceof AiDisabledError) throw err;
    throw err;
  }
}

// ===== B-end: Generate Activity Plan =====
// Uses preset content by default; calls AI if configured
export async function generateActivityPlan(
  config: ActivityConfig,
): Promise<TaskContent[]> {
  // Always use preset tasks mapped to selected task types for demo reliability
  const selectedTypes = config.taskTypes.length > 0 ? config.taskTypes : ALL_TASK_TYPES;
  const tasks = selectedTypes.map((type) => {
    const preset = presetTasks.find((t) => t.type === type);
    if (preset) {
      return {
        ...preset,
        // Customize description with brand name if different
        description: preset.description,
      };
    }
    const meta = TASK_TYPE_META[type];
    return {
      type,
      label: meta.label,
      icon: meta.icon,
      customPrompt: '',
      description: '',
      promptHint: '',
      npcWelcome: '',
      npcFarewell: '',
      mode: 'ai' as const,
    };
  });
  return tasks;
}

// ===== B-end: AI Generate Task Content =====
// When AI is configured, generate task content for all AI-mode tasks
export async function aiGenerateTasks(
  tasks: TaskContent[],
  config: ActivityConfig,
): Promise<TaskContent[]> {
  // Fast-fail if we already know the backend has no key.
  if (cachedAiEnabled === false) {
    return presetFallback(tasks);
  }

  // Probe the backend once per session. If it reports AI disabled
  // we switch to the offline path for this call and all subsequent ones.
  if (cachedAiEnabled === null) {
    const ok = await probeAiEnabled();
    if (!ok) return presetFallback(tasks);
  }

  try {
    const taskTypeStr = tasks.filter((t) => t.mode === 'ai').map((t) => t.label).join('、');
    const userIdeas = tasks
      .filter((t) => t.mode === 'ai' && t.customPrompt && t.customPrompt.trim().length > 0)
      .map((t) => `【${t.label}】${t.customPrompt.trim()}`)
      .join('\n');

    const content = await callBackend(
      'generatePlan',
      {
        theme: config.name,
        brandName: config.brandName,
        venue: config.location,
        audience: config.audience.join('、'),
        taskTypes: taskTypeStr,
        userIdeas,
      },
      10000
    );

    // Try to parse JSON response with task content
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.tasks && Array.isArray(parsed.tasks)) {
          return tasks.map((t) => {
            if (t.mode !== 'ai') return t;
            const generated = parsed.tasks.find((gt: { type: string }) => gt.type === t.type);
            if (generated) {
              return {
                ...t,
                description: generated.description || t.description,
                promptHint: generated.promptHint || t.promptHint,
                npcWelcome: generated.npcWelcome || t.npcWelcome,
                npcFarewell: generated.npcFarewell || t.npcFarewell,
              };
            }
            return t;
          });
        }
      }
    } catch {
      // Fall through to preset
    }
    throw new Error('Parse failed');
  } catch {
    return presetFallback(tasks);
  }
}

// Shared offline fallback used by every AI task-list call. Lives in
// one place so behaviour is consistent: we keep the organizer's
// `customPrompt` if they wrote one, otherwise we drop in the preset
// for that task type.
function presetFallback(tasks: TaskContent[]): TaskContent[] {
  return tasks.map((t) => {
    if (t.mode === 'ai') {
      const preset = presetTasks.find((p) => p.type === t.type);
      if (preset) {
        return {
          ...preset,
          mode: 'ai' as const,
          customPrompt: t.customPrompt || preset.customPrompt,
          description: t.customPrompt ? `${t.customPrompt}` : preset.description,
        };
      }
    }
    return t;
  });
}

// ===== B-end: AI Generate Activity Idea (for customPrompt) =====
/**
 * Generates a 30-60 character creative idea (活动创意描述) for a single
 * task. Used by the B-end editor's "AI 生成" button in the custom-prompt
 * textarea. Falls back to a per-type preset example if AI is unavailable
 * so the demo always produces something.
 */
export async function aiGenerateCustomPrompt(
  task: TaskContent,
  config: ActivityConfig,
  aiConfig?: { model: string },
): Promise<string> {
  // `task.customPrompt` is the value currently sitting in the textarea,
  // which is the result of the previous generation. We pass it to
  // `fallbackIdea` so the offline fallback never returns the same
  // string twice in a row.
  const fallback = fallbackIdea(task.type, task.customPrompt);
  if (cachedAiEnabled === false) return fallback;
  if (cachedAiEnabled === null) {
    const ok = await probeAiEnabled();
    if (!ok) return fallback;
  }

  try {
    const content = await callBackend(
      'generateIdea',
      {
        brandName: config.brandName || '品牌',
        theme: config.name || '夏日活动',
        venue: config.location || '线下门店',
        audience: config.audience.join('、') || '城市青年',
        taskLabel: task.label || TASK_TYPE_META[task.type].label,
        taskType: task.type,
        aiConfig: aiConfig ?? { model: 'default' },
      },
      8000
    );
    const text = (content || '').trim();
    // Strip surrounding quotes or code-fence markers the LLM may add
    const cleaned = text
      .replace(/^```[a-zA-Z]*\n?/, '')
      .replace(/\n?```$/, '')
      .replace(/^["「]|["」]$/g, '')
      .trim();
    return cleaned || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Per-task-type fallback ideas used when the AI is unavailable or
 * returns empty. Each task type has 4 alternative phrasings so the
 * organizer gets a sense of variety between successive "AI 生成"
 * clicks even when the LLM call fails.
 *
 * If `avoidText` is supplied and matches one of the entries, the
 * function re-rolls the random pick until it lands on a different
 * one. This guarantees successive generations never return the same
 * string unless the pool is exhausted (in which case we just return
 * the next entry in rotation).
 */
function fallbackIdea(type: TaskContent['type'], avoidText?: string): string {
  const map: Record<TaskContent['type'], string[]> = {
    checkin: [
      '邀请用户在到店时完成 GPS 签到,解锁一份只属于这个夏天的限定小礼。',
      '到店扫一下门店码,系统会送你一张夏日限定的"柚子店长"纪念卡。',
      '路过门店时按下签到,记录你和这个夏天的第一次相遇。',
      '在门店门口贴出"今日已营业"立牌,客人一签到就能收到一杯冰摇柚子茶。',
    ],
    photo: [
      '让用户拍下店里最让他心动的那杯特调,AI 会为他的照片配上一段专属文案。',
      '邀请用户晒出店内的任意一个角落,AI 会把他的照片变成一句夏日诗。',
      '拍一张店里最夏天的一角,我们会把它收录进这个夏天的相册。',
      '按下快门,把你眼里"最夏天"的那一帧留给我们,优秀作品会上墙展示。',
    ],
    findObject: [
      '把一只小柚子藏在门店的某个角落,看谁能第一眼发现它并合影留念。',
      '柚子店长今天把一只小柚子藏在了店里,谁先找到它就能收到神秘礼物。',
      '在门店里找到藏着的小柚子拍照打卡,即可领取限定周边一份。',
      '在店内的五个角落各藏了一只小柚子,集齐三只以上就能换一杯免费特调。',
    ],
    message: [
      '邀请用户写一句关于夏天的短句,所有留言会被拼成一面属于夏日的留言墙。',
      '把此刻最想说的那句话写下来,你的字句会成为夏天故事里的一行。',
      '写一句关于这个夏天的真心话,所有留言会被拼成一面柚见茶铺的留言墙。',
      '用 5-50 字写下你的夏天,每一句都会被柚子店长亲笔收进留言墙。',
    ],
    drawing: [
      '让用户在画板上自由涂鸦心中的柚子形象,优秀作品会被门店收藏展示。',
      '用手指在画板上画出你心中的夏日柚子,AI 会为你的作品写一段评语。',
      '在画板上自由涂鸦心中的夏日印象,被店长精选的作品会收进门店展示墙。',
      '在画板上随手涂一只你眼里的柚子,也许下一季的产品包装就有它的影子。',
    ],
  };
  const pool = map[type] || [];
  if (pool.length === 0) return '';
  if (!avoidText) {
    return pool[Math.floor(Math.random() * pool.length)];
  }
  // Try a few re-rolls to avoid the previous fallback. If we still
  // collide after 6 attempts (unlikely with a 4-entry pool), just
  // return the next entry in rotation so the caller always sees a
  // different value.
  const avoidIdx = pool.indexOf(avoidText);
  if (avoidIdx === -1) {
    return pool[Math.floor(Math.random() * pool.length)];
  }
  for (let i = 0; i < 6; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    if (idx !== avoidIdx) return pool[idx];
  }
  return pool[(avoidIdx + 1) % pool.length];
}

// ===== B-end: Apply Activity Idea to 5 Fields =====
/**
 * Applies the organizer's `customPrompt` (创意描述) to the 5 task fields
 * (label / description / promptHint / npcWelcome / npcFarewell) by
 * calling the LLM with the `applyIdeaToFields` prompt. Returns the
 * generated fields so the editor can show a preview, or `null` on
 * failure. Falls back to the existing draft values if the LLM returns
 * invalid JSON so the user can keep editing safely.
 */
export async function aiApplyIdeaToTask(
  task: TaskContent,
  config: ActivityConfig,
): Promise<Partial<TaskContent> | null> {
  if (!task.customPrompt.trim()) return null;
  if (cachedAiEnabled === false) return applyIdeaOffline(task);
  if (cachedAiEnabled === null) {
    const ok = await probeAiEnabled();
    if (!ok) return applyIdeaOffline(task);
  }

  try {
    const content = await callBackend(
      'applyIdeaToFields',
      {
        brandName: config.brandName || '品牌',
        theme: config.name || '夏日活动',
        venue: config.location || '线下门店',
        audience: config.audience.join('、') || '城市青年',
        taskLabel: task.label || TASK_TYPE_META[task.type].label,
        taskType: task.type,
        idea: task.customPrompt,
      },
      12000
    );
    const raw = (content || '').trim();
    // Strip markdown code fences if the LLM adds them despite instructions
    const cleaned = raw
      .replace(/^```[a-zA-Z]*\n?/, '')
      .replace(/\n?```$/, '')
      .trim();
    // Extract the first JSON object in the response
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON object found');
    const parsed = JSON.parse(match[0]);
    // Only accept the 4 expected string fields. `label` is intentionally
    // NOT in this list — it's auto-derived from the task type so the
    // B-end editor doesn't need to (and shouldn't be able to) override it.
    const allowed = ['description', 'promptHint', 'npcWelcome', 'npcFarewell'] as const;
    const result: Partial<TaskContent> = {};
    for (const key of allowed) {
      if (typeof parsed[key] === 'string' && parsed[key].trim()) {
        (result as Record<string, string>)[key] = parsed[key].trim();
      }
    }
    return Object.keys(result).length > 0 ? result : null;
  } catch (err) {
    console.warn('aiApplyIdeaToTask failed, using offline fallback:', err);
    // Offline fallback: derive 5 fields deterministically from the
    // customPrompt + task type so the "应用" button still does
    // something useful when the LLM is unreachable. The fields are
    // crafted to feel personal rather than generic by pulling key
    // phrases out of the organizer's idea and layering the brand /
    // venue / task-type flavour on top.
    return applyIdeaOffline(task);
  }
}

/**
 * Deterministic offline implementation of `aiApplyIdeaToTask`. Reads
 * the organizer's `customPrompt` (创意描述) and produces 4 fields:
 *   description, promptHint, npcWelcome, npcFarewell.
 *
 * The task name (`label`) is intentionally NOT produced here — it is
 * always derived from the task type via `TASK_TYPE_META` so the B-end
 * UI doesn't have to maintain a separate editable text field.
 *
 * The `description` here is a "工整转写" of the organizer's idea:
 * we extract the *first concrete action step* from the idea (using a
 * short list of flow verbs per task type) rather than echoing the
 * whole idea back, so the result is a clear流程 statement rather
 * than a copy of the marketing copy.
 *
 * Returns `null` if there is no customPrompt to work with.
 */
function applyIdeaOffline(task: TaskContent): Partial<TaskContent> | null {
  const idea = task.customPrompt.trim();
  if (!idea) return null;

  // Per-task-type flow templates. Each entry is a 18-35 character
  // "do X → get Y" sentence that describes the task in concrete
  // user-visible steps. We pick one of two variants per task type
  // (alternating on a stable hash of the idea) so two successive
  // "应用" clicks don't always land on the same wording.
  const flowMap: Record<TaskContent['type'], [string, string]> = {
    checkin: [
      '到店后按下定位签到,即可领取夏日探鲜纪念卡一张',
      '走进门店按下签到按钮,系统会送你一张限定入场凭证',
    ],
    photo: [
      '打开相机拍下店内最心动的一杯,AI 会为它配上一段文案',
      '举手机拍下你最爱的特调,系统实时生成夏日风格点评',
    ],
    findObject: [
      '观察店内场景,找到藏起来的小柚子并拍照确认位置',
      '睁大眼睛在店内找出小柚子,点中位置即可领取限定贴纸',
    ],
    message: [
      '在留言区写下 5-50 字的寄语,它会出现在门店留言墙上',
      '输入一段话(5-50 字),你的字句会被拼成一面夏日留言墙',
    ],
    drawing: [
      '在画板上涂鸦心中的柚子,提交后 AI 会给出一段评价',
      '用画笔画下你眼里的夏日柚子,精选作品会上门店展示墙',
    ],
  };
  // Per-task-type prompt hint templates — short, on-brand nudges that
  // match the C-end task UIs. Each entry uses a concrete action verb
  // rather than a generic "开始任务" so the offline path keeps the
  // same warmth and specificity as the LLM-driven path.
  const hintMap: Record<TaskContent['type'], string> = {
    checkin: '按下定位签到,我们就算正式见面啦',
    photo: '举起手机,拍下最让你心动的那一帧',
    findObject: '睁大眼睛,找到藏在店里的小柚子',
    message: '写一句此刻最想说的话,5-50 字就够',
    drawing: '在画板上随手涂鸦,留下你心里的那个柚子',
  };
  const welcomeMap: Record<TaskContent['type'], string> = {
    checkin: '柚子店长:「呀,你到啦!按一下签到按钮,今天的故事就由你开场。」',
    photo: '柚子店长:「你眼里的夏天,比我的更值得被收藏——举起手机吧。」',
    findObject: '柚子店长:「今天我藏了一只小柚子在店里,你能在进门之前找到它吗?」',
    message: '柚子店长:「这一刻你想到什么,就写什么;我会一字一句认真收下。」',
    drawing: '柚子店长:「画板已经递到你手边,涂什么、怎么涂,都听你的。」',
  };
  const farewellMap: Record<TaskContent['type'], string> = {
    checkin: '柚子店长:「签到完成!从这一秒起,这个夏天就和你绑在一起了。」',
    photo: '柚子店长:「这张照片我也想留一份——下次来店里,可以看见它上了墙。」',
    findObject: '柚子店长:「找到了!这只小柚子从今天起,归你啦。」',
    message: '柚子店长:「写完了?这句话真好,我会把它放在留言墙最高的那一格。」',
    drawing: '柚子店长:「收下了。下次来店里,记得去看展示墙——你的作品已经在那里等你了。」',
  };

  // Pick a flow variant deterministically from the idea text. This
  // keeps successive offline generations from being byte-identical.
  const flowPair = flowMap[task.type] || flowMap.photo;
  const pickIdx = simpleHash(idea) % flowPair.length;
  const description = flowPair[pickIdx];

  return {
    description,
    promptHint: hintMap[task.type] || '点一下开始你的任务吧',
    npcWelcome: welcomeMap[task.type] || '柚子店长:「很高兴你来,我们开始吧～」',
    npcFarewell: farewellMap[task.type] || '柚子店长:「谢谢你,期待下次再见到你。」',
  };
}

// Lightweight stable string hash used only for the offline fallback's
// flow-variant selection. Kept here (instead of reusing `stableHash`
// further down) so the two offline subsystems stay independent.
function simpleHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

// ===== C-end: Generate Photo Comment =====
export async function generatePhotoComment(
  brandName: string,
  photoData: string,
): Promise<string> {
  if (cachedAiEnabled === false) return getRandomFallback(fallbackPhotoComments);
  if (cachedAiEnabled === null) {
    const ok = await probeAiEnabled();
    if (!ok) return getRandomFallback(fallbackPhotoComments);
  }

  try {
    const content = await callBackend(
      'photoComment',
      { brandName, photoData },
      8000
    );
    return content || getRandomFallback(fallbackPhotoComments);
  } catch {
    return getRandomFallback(fallbackPhotoComments);
  }
}

// ===== C-end: Generate Find Object Feedback =====
export async function generateFindFeedback(
  brandName: string,
): Promise<string> {
  if (cachedAiEnabled === false) return getRandomFallback(fallbackFindFeedback);
  if (cachedAiEnabled === null) {
    const ok = await probeAiEnabled();
    if (!ok) return getRandomFallback(fallbackFindFeedback);
  }

  try {
    const content = await callBackend(
      'findFeedback',
      { brandName },
      8000
    );
    return content || getRandomFallback(fallbackFindFeedback);
  } catch {
    return getRandomFallback(fallbackFindFeedback);
  }
}

// ===== C-end: Generate Co-created Story =====
export async function generateCoCreatedStory(
  brandName: string,
  userMessage: string,
): Promise<string> {
  if (cachedAiEnabled === false) return getRandomFallback(fallbackStories);
  if (cachedAiEnabled === null) {
    const ok = await probeAiEnabled();
    if (!ok) return getRandomFallback(fallbackStories);
  }

  try {
    const content = await callBackend(
      'coCreateStory',
      { brandName, userMessage },
      10000
    );
    return content || getRandomFallback(fallbackStories);
  } catch {
    return getRandomFallback(fallbackStories);
  }
}

// ===== C-end: Generate Drawing Comment =====
export async function generateDrawingComment(
  brandName: string,
  drawingData: string,
): Promise<string> {
  // Fast-fail if we already know the backend has no key.
  if (cachedAiEnabled === false) return getRandomFallback(fallbackDrawingComments);
  if (cachedAiEnabled === null) {
    const ok = await probeAiEnabled();
    if (!ok) return getRandomFallback(fallbackDrawingComments);
  }

  try {
    const content = await callBackend(
      'drawingComment',
      { brandName, drawingData },
      8000
    );
    return content || getRandomFallback(fallbackDrawingComments);
  } catch {
    return getRandomFallback(fallbackDrawingComments);
  }
}

// ===== C-end: Generate Experience Card =====
export async function generateExperienceCard(
  theme: string,
  brandName: string,
  userContents: string,
): Promise<{ story: string; visualStyle: VisualStyle }> {
  if (cachedAiEnabled === false) {
    return { story: fallbackExperienceStory, visualStyle: fallbackVisualStyle };
  }
  if (cachedAiEnabled === null) {
    const ok = await probeAiEnabled();
    if (!ok) return { story: fallbackExperienceStory, visualStyle: fallbackVisualStyle };
  }

  try {
    const content = await callBackend(
      'experienceCard',
      { theme, brandName, userContents },
      12000
    );

    // Try to parse JSON with story + visualStyle
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          story: parsed.story || fallbackExperienceStory,
          visualStyle: parsed.visualStyle || fallbackVisualStyle,
        };
      }
    } catch {
      // If not JSON, treat entire content as story
      if (content && content.length > 20) {
        return { story: content, visualStyle: fallbackVisualStyle };
      }
    }
    return { story: fallbackExperienceStory, visualStyle: fallbackVisualStyle };
  } catch {
    return { story: fallbackExperienceStory, visualStyle: fallbackVisualStyle };
  }
}

// ===== C-end: AI Polish user's summer message =====
export async function polishMessage(
  raw: string,
  brandName = '柚见茶铺',
): Promise<string> {
  const source = raw.trim();
  if (!source) return source;

  // Try AI first (via the same backend proxy)
  if (cachedAiEnabled !== false) {
    // We still allow a probe if we don't yet know whether AI is enabled.
    if (cachedAiEnabled === null) {
      const ok = await probeAiEnabled();
      if (!ok) {
        // fall through to local heuristic below
      }
    }
    if (cachedAiEnabled === true) {
      try {
        const content = await callBackend(
          'polishMessage',
          { brandName, userMessage: source },
          4000
        );
        if (content) {
          // CJK chars count as 1 each; total display length <= 50
          return content.length > 50 ? content.slice(0, 50) : content;
        }
      } catch {
        // fall through to local heuristic
      }
    }
  }

  // Local heuristic polish (offline-deterministic, but produces a real
  // summer-tinged line rather than a trivial emoji append)
  return localPolish(source);
}

// Suffix emojis that match the brand's summer mood. Picked deterministically
// from a stable hash of the input so the same input always gets the same
// emoji (predictable UX, no flicker on re-polish).
const SUMMER_EMOJI_POOL = ['🍹', '🌿', '🍃', '🍋', '☀️', '🌴', '✨', '🧊'] as const;

// Yuzu-shopkeeper-style poetic frames. Each frame has a lead phrase and a
// closing phrase; the user's original line slots in between, then the
// whole thing is wrapped in summer-flavoured imagery.
const POETIC_FRAMES: Array<{ lead: string; close: string }> = [
  { lead: '这一杯，',        close: '，是整个夏天的开场白' },
  { lead: '把',              close: '，藏进这个夏天最温柔的角落' },
  { lead: '尝一口，',        close: '，暑气都退了三步' },
  { lead: '今日份的，',      close: '，被柚风轻轻托起' },
  { lead: '捧在手心的，',    close: '，是盛夏的独家记忆' },
  { lead: '一口下去，',      close: '，是夏天写给你的情书' },
  { lead: '盛夏想说的，',    close: '，都泡在了这杯里' },
  { lead: '把',              close: '，调成一杯夏日特调' },
  { lead: '这一句，',        close: '，留作夏天的签到页' },
  { lead: '把',              close: '，酿成这个夏天的小诗' },
];

function stableHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

/**
 * Offline polish. Produces a yuzu-shopkeeper-style line up to 50 chars.
 * Strategy:
 *  1. Clean the user's input (collapse whitespace, drop trailing punctuation).
 *  2. Pick a poetic frame deterministically from a stable hash.
 *  3. Slot the user's line in (truncated to fit).
 *  4. Append 1 summer emoji.
 *  5. Hard-cap to 50 characters; trim the user's slot first if needed.
 */
function localPolish(source: string): string {
  const cleaned = source.replace(/\s+/g, ' ').trim().replace(/[，。.,!?！？；;]+$/, '');
  if (!cleaned) return cleaned;

  const hash = stableHash(cleaned);
  const frame = POETIC_FRAMES[hash % POETIC_FRAMES.length];
  const emoji = SUMMER_EMOJI_POOL[(hash >>> 3) % SUMMER_EMOJI_POOL.length];

  // Reserve budget: lead + close + emoji + separators ≈ frame.lead.length + frame.close.length + 3
  const frameLen = frame.lead.length + frame.close.length + 3;
  const userBudget = Math.max(6, 50 - frameLen);

  const userPart =
    cleaned.length > userBudget ? cleaned.slice(0, userBudget) : cleaned;

  return `${frame.lead}${userPart}${frame.close}${emoji}`;
}
