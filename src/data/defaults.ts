import type { TaskContent, TaskType, TaskNodeState, ActivityConfig } from '../types';

// ===== Task Type Metadata =====

export const TASK_TYPE_META: Record<
  TaskType,
  {
    label: string;
    icon: string; // 保留用于 B 端编排面板的紧凑展示
    iconImage: string; // C 端任务卡 / 任务地图使用的高保真图
    accent: string; // 任务卡色彩点缀
    accentSoft: string; // 浅色背景
  }
> = {
  checkin: {
    label: '定位打卡',
    icon: '📍',
    iconImage: '/images/task-checkin.jpg',
    accent: '#8A65FF',
    accentSoft: '#F5F3FF',
  },
  photo: {
    label: '拍照任务',
    icon: '📷',
    iconImage: '/images/tea-shop-scene.jpg',
    accent: '#FF8C42',
    accentSoft: '#FFF7ED',
  },
  findObject: {
    label: '寻找物体',
    icon: '🔍',
    iconImage: '/images/task-find-object.jpg',
    accent: '#3B82F6',
    accentSoft: '#EFF6FF',
  },
  message: {
    label: '留言共创',
    icon: '💬',
    iconImage: '/images/task-message.jpg',
    accent: '#22C55E',
    accentSoft: '#F0FDF4',
  },
  drawing: {
    label: '画图绘图',
    icon: '🎨',
    iconImage: '/images/task-drawing.jpg',
    accent: '#F59E0B',
    accentSoft: '#FFFBEB',
  },
};

export const ALL_TASK_TYPES: TaskType[] = ['checkin', 'photo', 'findObject', 'message', 'drawing'];

// ===== Default Activity Config =====

export const defaultActivityConfig: ActivityConfig = {
  name: '夏日新品探鲜季',
  brandName: '柚见茶铺',
  location: '星耀广场',
  time: '周末',
  audience: ['大学生', '城市青年'],
  taskTypes: [...ALL_TASK_TYPES],
};

// ===== Preset Task Content (PRD Section 9.3) =====

export const presetTasks: TaskContent[] = [
  {
    type: 'checkin',
    label: '定位打卡',
    icon: '📍',
    customPrompt: '邀请用户到店扫码完成 GPS 签到,领取一张"夏日探鲜"限定纪念卡,作为整个活动的入场凭证。',
    description: '到店签到',
    promptHint: '',
    npcWelcome: '柚子店长：「欢迎！夏日的第一杯茶，等你来品。我这里有 5 个夏日印记等你收集，集齐了有惊喜！」',
    npcFarewell: '柚子店长：「第一个印记到手啦！探鲜之旅正式开始，继续往前走吧～」',
    mode: 'ai',
  },
  {
    type: 'photo',
    label: '拍照任务',
    icon: '📷',
    customPrompt: '让用户拍下店内最让他心动的那杯特调或一款甜品,AI 会为他的照片配上一段夏日专属文案。',
    description: '拍下这一杯',
    promptHint: '选择一张照片，AI 将为你实时点评',
    npcWelcome: '柚子店长：「接下来，让我看看你的观察力！拍下最吸引你的那杯茶～」',
    npcFarewell: '柚子店长：「好眼光！这张照片充满了夏日的味道，第二个印记归你了！」',
    mode: 'ai',
  },
  {
    type: 'findObject',
    label: '寻找物体',
    icon: '🔍',
    customPrompt: '把一只小柚子吉祥物藏在门店的某个角落,看谁能第一眼发现它并合影留念,可获限定贴纸一张。',
    description: '找吧台小柚子',
    promptHint: '仔细观察场景图，点击你认为是柚子吉祥物的位置',
    npcWelcome: '柚子店长：「听说我们店藏着一个小秘密…仔细找找吧台旁边哦」',
    npcFarewell: '柚子店长：「找到了！你的观察力真敏锐，第三个印记收好啦！」',
    mode: 'ai',
  },
  {
    type: 'message',
    label: '留言共创',
    icon: '💬',
    customPrompt: '邀请用户写一句关于这个夏天的短句(5-50 字),所有留言会被拼成一面属于夏日的留言墙。',
    description: '写一句夏天的寄语',
    promptHint: '输入 5-50 字的留言，AI 会把它融入专属故事',
    npcWelcome: '柚子店长：「你的话会成为我们故事的一部分。说说看吧～」',
    npcFarewell: '柚子店长：「多美的寄语！第四个印记因你而更加闪亮。」',
    mode: 'manual',
  },
  {
    type: 'drawing',
    label: '画图绘图',
    icon: '🎨',
    customPrompt: '让用户在画板上自由涂鸦心中的柚子 IP 形象,AI 会点评作品,精选作品会被收进门店展示墙。',
    description: '画一个你的柚子',
    promptHint: '在画板上自由涂鸦，或使用示例图，AI 会给你评价',
    npcWelcome: '柚子店长：「5 个印记就差最后一个了！让我看看你的创造力！」',
    npcFarewell: '柚子店长：「太有才了！5 个印记全部集齐，你的夏日故事已经成型——」',
    mode: 'manual',
  },
];

// ===== Empty Task Content Template =====

export function createEmptyTask(type: TaskType): TaskContent {
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
    mode: 'manual',
  };
}

// ===== Task Node Positions (for C-end task map) =====

export const taskNodePositions: { x: number; y: number }[] = [
  { x: 15, y: 70 },
  { x: 35, y: 40 },
  { x: 55, y: 65 },
  { x: 72, y: 30 },
  { x: 88, y: 55 },
];

export function createTaskNodes(tasks: TaskContent[]): TaskNodeState[] {
  return tasks.map((t, i) => ({
    type: t.type,
    label: t.label,
    icon: t.icon,
    status: (i === 0 ? 'available' : 'locked') as TaskNodeState['status'],
    position: taskNodePositions[i] || { x: 50, y: 50 },
  }));
}

// ===== Fallback Content (for AI degradation) =====

export const fallbackPhotoComments = [
  '这张照片抓住了夏日的清凉感，色彩搭配很有品味！',
  '构图很棒！画面里的光影让整个场景都活了起来。',
  '完美捕捉了夏日氛围，这张照片值得发朋友圈！',
];

export const fallbackFindFeedback = [
  '找到了！你的观察力真敏锐，这就是藏在角落里的小秘密。',
  '太厉害了！这就是我们要找的柚子吉祥物，你有一双侦探般的眼睛！',
];

export const fallbackStories = [
  '你说的话像一颗种子，落在了这片夏日的土壤里，开始生长出新的故事。从这间店出发，故事的主角踏上了寻找意义的旅程。',
  '你的留言被风带走了，穿过走廊，越过扶梯，和商场里每一个路过的灵魂产生了共鸣。这就是共创的力量。',
  '在这句话里，我听见了夏天的心跳。它将和你的探店之旅一起，被写进这座城市的故事档案。',
];

export const fallbackDrawingComments = [
  '这充满创意的线条让人眼前一亮！你的想象力是夏日里最棒的色彩。',
  '每一笔都充满了生命力！这幅作品完美表达了你的夏日灵感。',
  '太有个性了！这个独特的风格让人过目不忘，继续创作吧！',
];

export const fallbackExperienceStory = `这个夏天，柚子店长带你走过五个任务。你拍下了橱窗里的夏日新品，找到了吧台旁的柚子吉祥物，写下了心中的夏日寄语，画出了你心中的柚子 IP…每一步都是你与柚见茶铺共创的夏日故事。五个印记集齐了，你的夏日故事已经成型。`;

export const fallbackVisualStyle = {
  primary: '#FF8C42',
  secondary: '#FFD93D',
  accent: '#FF5C8A',
  decoration: 'sun',
};

// ===== Sample Photos (for photo task) =====

export const samplePhotos = [
  { id: 'p1', label: '柚香冰茶', colors: ['#FF8C42', '#FFD93D', '#4ECDC4'] },
  { id: 'p2', label: '蜜桃乌龙', colors: ['#FF6B9D', '#FFC1DA', '#FF8C42'] },
  { id: 'p3', label: '青柠气泡', colors: ['#4ECDC4', '#FFD93D', '#5DADE2'] },
];

// ===== Mall Locations =====

export const mallLocations = ['星耀广场', '城市光廊购物中心', '艺术街区'];

// ===== Time Options =====

export const timeOptions = ['周末', '一周', '节假日'];

// ===== Audience Options =====

export const audienceOptions = ['大学生', '情侣', '家庭', '游客', '城市青年'];

// ===== Discover Page Activities =====

export const discoverActivities = [
  {
    id: 'd1',
    name: '中秋游园会',
    location: '城市光廊购物中心',
    status: '即将开始',
    statusColor: '#FFD93D',
    brandCount: 4,
    hint: '节日场景扩展',
    icon: '🥮',
    gradient: 'linear-gradient(135deg, #FF8C42, #FFD93D)',
  },
  {
    id: 'd2',
    name: '开学季校园探索',
    location: '星耀广场',
    status: '进行中',
    statusColor: '#4ECDC4',
    brandCount: 6,
    hint: '校园场景扩展',
    icon: '🎓',
    gradient: 'linear-gradient(135deg, #4ECDC4, #5DADE2)',
  },
  {
    id: 'd3',
    name: '光影艺术周',
    location: '艺术街区',
    status: '已结束',
    statusColor: '#B388FF',
    brandCount: 8,
    hint: '街区/景区扩展',
    icon: '🎨',
    gradient: 'linear-gradient(135deg, #9B5DE5, #B388FF)',
  },
];

// ===== Helper =====

export function getRandomFallback<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ===== NPC Info =====

export const npcInfo = {
  name: '柚子店长',
  avatar: '🍊',
  personality: '热情、话多、爱分享',
  goal: '收集 5 个夏日印记',
};

// ===== Drawing Colors =====

export const drawingColors = ['#FF8C42', '#FF5C8A', '#4ECDC4', '#FFD93D', '#9B5DE5'];
