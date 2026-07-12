type PromptParams = Record<string, string>;

const prompts: Record<string, (params: PromptParams) => string> = {
  generatePlan: (p) => `你是品牌"${p.brandName}"的活动策划师。请根据活动主题"${p.theme}"、活动地点"${p.venue}"、目标人群"${p.audience}"，为以下任务类型生成内容：${p.taskTypes}。

每个任务包含：任务描述、提示文案、NPC欢迎语、NPC结语。
NPC角色名是"柚子店长"，性格热情、话多、爱分享。
语气要贴合夏日氛围和目标人群。

请返回JSON格式，严格如下结构：
{
  "tasks": [
    {
      "type": "checkin",
      "description": "任务描述",
      "promptHint": "提示文案",
      "npcWelcome": "NPC欢迎语（以「柚子店长：」开头）",
      "npcFarewell": "NPC结语（以「柚子店长：」开头）"
    }
  ]
}

type 的可选值：checkin, photo, findObject, message, drawing
只返回JSON，不要其他文字。`,

  photoComment: (p) => `用户在品牌"${p.brandName}"拍了一张照片。请基于照片内容生成1-2句点评，语气温暖有品味，融入夏日氛围。直接返回点评文字，不要其他内容。`,

  findFeedback: (p) => `用户在品牌"${p.brandName}"找到了柚子吉祥物。请生成一句成功反馈，语气欢快，融入品牌特色。直接返回文字。`,

  coCreateStory: (p) => `用户在品牌"${p.brandName}"留下了这句话：「${p.userMessage}」
请将这句话融入一段50-80字的探店故事中，保持夏日氛围，让用户感觉自己是故事的一部分。直接返回故事文字，不要其他内容。`,

  polishMessage: (p) => `你是「${p.brandName}」的店长，擅长把顾客写的简单留言润色为一句不超过 50 个字、带有夏日清凉感和品牌温度的短句。
要求：
- 保留原意核心，不改写主题
- 文字不超过 50 个字符（含 emoji、标点）
- 可加 1-2 个 emoji 增强表达
- 单行输出，不要换行、不要编号、不要引号包裹
- 语气亲切自然，像朋友转述

原句：${p.userMessage}
润色后：`,

  drawingComment: (p) => `用户在品牌"${p.brandName}"画了一幅画。请基于绘画内容生成1-2句鼓励性评价，语气真诚有创意。直接返回评价文字，不要其他内容。`,

  experienceCard: (p) => `用户完成了"${p.theme}"活动，以下是用户的具体表现：

${p.userContents}

请生成：
1. 一段150字左右的故事文案，要求引用用户留言原话或近义表述，提及用户拍的照片和画的画的内容特征，以"柚子店长"的口吻叙述，语气温暖有记忆点
2. 一套视觉风格方案

请返回JSON格式：
{
  "story": "故事文案",
  "visualStyle": {
    "primary": "#主色hex",
    "secondary": "#辅色hex",
    "accent": "#点缀色hex",
    "decoration": "装饰元素类型（如sun/wave/fruit等）"
  }
}

视觉风格使用夏日暖色调。只返回JSON，不要其他文字。`,

  generateIdea: (p) => {
    // Pick a random angle each time so the LLM is forced to take a
    // different perspective instead of converging on the same phrasing.
    const seed = Math.floor(Math.random() * 1e9);
    const angle = [
      '用"感官记忆"切入：聚焦味觉 / 嗅觉 / 触觉 / 视觉的某一个具体瞬间',
      '用"人物独白"切入：以一个具体的用户口吻讲他/她会怎么参与',
      '用"仪式感"切入：把这个任务设计成一个有起承转合的小型仪式',
      '用"对比反差"切入：先描述一个常见的无聊场景，再转折到这次活动的独特体验',
      '用"细节彩蛋"切入：藏一个让用户发现时会会心一笑的小细节',
      '用"情绪氛围"切入：先营造一种特定的夏日情绪（慵懒 / 雀跃 / 微醺 / 怦然心动）',
    ][seed % 6];
    return `你是品牌"${p.brandName}"的活动策划师，正在为"${p.taskLabel}"任务（任务类型：${p.taskType}，活动主题"${p.theme}"，活动地点"${p.venue}"）撰写一段活动创意描述。

请基于任务类型特点、品牌调性和夏日氛围，${angle}，输出一段 30-60 字的创意描述，告诉用户这个任务要做什么、有什么亮点。要求：
- 具体、生动、有画面感
- 贴合目标人群"${p.audience}"的语境
- 用主办方的口吻撰写，可直接填入表单使用
- 不要使用「请」「让我们」等祈使句开头
- 不要使用 markdown 或 JSON
- 每次都要给出与上次不同的表达，避免重复同一句式

只返回创意描述文字，不要其他内容。本次会话序号：${seed}`;
  },

  applyIdeaToFields: (p) => {
    // Per-task-type language guidance. Each task type has its own
    // tonal sweet spot — a checkin welcome should feel like a warm
    // door-greeting, a drawing farewell should feel like a curator
    // taking the work off the wall. Hard-coding these constraints
    // here (instead of asking the LLM to guess) is what stops the
    // generator from collapsing every task into the same bland
    // brand-speak template.
    const taskTypeVoice: Record<string, string> = {
      checkin: `任务类型是「定位打卡（checkin）」—— 用户到店时完成 GPS 定位。
  语调定位：仪式感 + 欢迎感 + 物理空间感。
  - description 要写清"到店后按定位 → 签到成功 → 拿到入场凭证"这一段流程和奖励细节，不要堆形容词。
  - promptHint 要直白告诉用户"按下签到按钮"，不要绕弯。
  - npcWelcome 是"店门口的第一声招呼"—— 像店员抬头看见客人走进来，可以有"欢迎光临 / 进来吧 / 你到了呀"等具体动作。
  - npcFarewell 是"签到完成后的第一时间反馈"—— 强调"今天我们就算认识了 / 第一步完成"等节点感，避免空泛的"祝你愉快"。`,
      photo: `任务类型是「拍照（photo）」—— 用户拍下店内某个画面。
  语调定位：欣赏 + 邀请 + 镜头感。
  - description 要写清"打开相机 → 选一个角度 → 拍下 → AI 给出点评"这一段流程，以及"拍什么、拍出来会怎样"。
  - promptHint 要让用户感觉"举手机是值得的"—— 强调"你眼里的 / 你的那一帧"。
  - npcWelcome 像站在取景器对面的人—— 邀请用户去发现，而不是命令他去拍。
  - npcFarewell 是"收下这张照片"的感觉—— 强调"我也想看 / 已经被收藏"。`,
      findObject: `任务类型是「寻物（findObject）」—— 用户在店内寻找藏起来的物品。
  语调定位：游戏感 + 童趣 + 一点点神秘。
  - description 要写清"观察场景 → 找到目标 → 点击 / 拍照确认 → 领取奖励"这一段流程，以及"藏了什么、找到后会得到什么"。
  - promptHint 要勾起好奇心（藏了什么 / 在哪），但不要剧透位置。
  - npcWelcome 是"出题人"的口吻—— 神秘但不吓人，可以带"今天我藏了一样东西 / 你能找到吗"。
  - npcFarewell 是"公布答案 / 颁奖"的感觉—— 强调"找到了 / 这归你 / 眼力真好"。`,
      message: `任务类型是「寄语（message）」—— 用户写下一段话。
  语调定位：共情 + 留白 + 文字感。
  - description 要写清"输入文字（注明字数）→ 提交 → 出现在哪里（如留言墙/共创故事）"这一段流程。
  - promptHint 要低门槛—— 强调"一句话 / 几个字 / 你想到的"，不要强调"必须写完"。
  - npcWelcome 是"倾听者"的姿态—— 邀请用户开口，但不催他/她。
  - npcFarewell 要让用户感觉"他/她写下的字真的被人认真收下了"。`,
      drawing: `任务类型是「画图（drawing）」—— 用户在画板上自由涂鸦。
  语调定位：玩心 + 自由 + 创作尊重。
  - description 要写清"打开画板 → 选择画笔 / 颜色 → 涂鸦 → 提交 → AI 点评 / 进入展示墙"这一段流程。
  - promptHint 要把"画得好不好"的紧张感降下来—— 强调"随便涂 / 你心里的"。
  - npcWelcome 像"把画板递过来"的动作，温柔不施压。
  - npcFarewell 是"认真看了"的口吻—— 强调"收下了 / 被展示 / 下次还能画"。`,
    };
    const voice = taskTypeVoice[p.taskType] || taskTypeVoice.photo;

    return `你是品牌"${p.brandName}"的活动策划师，已经为「${p.taskLabel}」任务想好了一段创意描述。现在需要把它**工整转写**为 4 个具体文案字段，填入任务编辑表单。**任务名称 label 不需要你生成，它由系统根据任务类型自动生成**（例如 checkin 永远叫"定位打卡"）。

【活动主题】${p.theme}
【活动地点】${p.venue}
【目标人群】${p.audience}
【任务名称】${p.taskLabel}（仅供你理解语境，不要在输出里出现这个字段）

【创意描述】（来自主办方的"灵感原文"——你需要在 description 里转写它，但不能原样照抄）：
${p.idea}

【本任务类型的语言调性指引】
${voice}

【4 个字段的语言质量硬要求】

1. **description 是创意描述的"工整转写"，不是原文复读**：
   - 创意描述是主办方写的感性灵感描述（"邀请用户到店扫码完成 GPS 签到,领取一张'夏日探鲜'限定纪念卡"）。
   - description 必须是它的清晰版：用更工整、无歧义、易理解的语言，**重点是"用户要做哪几步、做完会得到什么"**——只写流程和细节。
   - 字数 18-35 字。**严禁**直接复制创意描述中的原句、也**严禁**照搬其全部名词（"邀请/扫码/领取/凭证"等官话）。请拆解并保留核心动词和关键物品（"签到 → 拿纪念卡"），丢掉营销腔。

2. **统一 4 个字段的语气**：4 句话读起来像同一个人写给同一位用户的一段连续对话，不要前两句热情第三句突然变商务。

3. **动词具体，不要抽象**：用"按下签到 / 举起手机 / 写一句 / 涂一笔"等具体动作代替"参与 / 体验 / 完成"。

4. **避免万能句式**：禁止出现"欢迎来到 / 让我们一起 / 请尽情享受 / 开启你的旅程"等任何活动模板套话。

5. **NPC 人格一致**：NPC 叫"柚子店长"，性格温和、爱分享、有点小俏皮。开场白和结语的第一人称要稳定（都是"我"），不要一会儿"我"一会儿"店长"。

6. **长度硬约束**（超出或不足都会扣分）：
   - description: 18-35 字
   - promptHint: 10-25 字
   - npcWelcome: 25-45 字（用"柚子店长："开头）
   - npcFarewell: 20-40 字（用"柚子店长："开头）

7. **不要 JSON 之外的任何内容**：不要解释、不要 markdown 代码块标记、不要多余换行。

【输出 JSON 格式】（4 个字段，不要出现 label）
{
  "description": "...",
  "promptHint": "...",
  "npcWelcome": "...",
  "npcFarewell": "..."
}`;
  },
};

export function buildPrompt(type: string, params: PromptParams): string {
  const builder = prompts[type];
  if (!builder) throw new Error(`Unknown prompt type: ${type}`);
  return builder(params);
}
