import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import type {
  AppPhase,
  CTab,
  CView,
  TaskContent,
  TaskResult,
  ExperienceCardData,
  TaskNodeState,
  ActivityConfig,
  NodeStatus,
} from '../types';
import { defaultActivityConfig, presetTasks, createTaskNodes } from '../data/defaults';

// ===== State =====
//
// The state is intentionally AI-agnostic. There is no `aiConfig`
// on the client — the model name lives as a constant in
// `services/api.ts`, and the API key is server-side only.

interface AppState {
  phase: AppPhase;
  bEndCompleted: boolean;

  // B-end
  activityConfig: ActivityConfig;
  tasks: TaskContent[];

  // C-end
  cTab: CTab;
  cView: CView;
  currentTaskIndex: number;
  taskNodes: TaskNodeState[];
  taskResults: TaskResult[];
  experienceCard: ExperienceCardData | null;

  // Guidance
  guidanceStep: number;
  showGuidance: boolean;
}

const initialState: AppState = {
  phase: 'c-app',
  bEndCompleted: false,
  activityConfig: { ...defaultActivityConfig },
  tasks: [],
  cTab: 'home',
  cView: 'mall-map',
  currentTaskIndex: 0,
  taskNodes: [],
  taskResults: [],
  experienceCard: null,
  guidanceStep: 1,
  showGuidance: true,
};

// ===== Actions =====

type Action =
  | { type: 'SET_PHASE'; phase: AppPhase }
  | { type: 'SET_B_END_COMPLETED'; completed: boolean }
  | { type: 'SET_ACTIVITY_CONFIG'; config: ActivityConfig }
  | { type: 'UPDATE_ACTIVITY_CONFIG'; config: Partial<ActivityConfig> }
  | { type: 'SET_TASKS'; tasks: TaskContent[] }
  | { type: 'UPDATE_TASK'; index: number; task: Partial<TaskContent> }
  | { type: 'SET_C_TAB'; tab: CTab }
  | { type: 'SET_C_VIEW'; view: CView }
  | { type: 'SET_CURRENT_TASK'; index: number }
  | { type: 'SET_TASK_NODES'; nodes: TaskNodeState[] }
  | { type: 'COMPLETE_TASK_NODE'; index: number }
  | { type: 'ADD_TASK_RESULT'; result: TaskResult }
  | { type: 'SET_EXPERIENCE_CARD'; card: ExperienceCardData }
  | { type: 'SET_GUIDANCE_STEP'; step: number }
  | { type: 'SHOW_GUIDANCE'; show: boolean }
  | { type: 'DISMISS_GUIDANCE' }
  | { type: 'RESET_C_END' }
  | { type: 'RESET_ALL' };

// ===== Reducer =====

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_PHASE':
      return { ...state, phase: action.phase };

    case 'SET_B_END_COMPLETED':
      return { ...state, bEndCompleted: action.completed };

    case 'SET_ACTIVITY_CONFIG':
      return { ...state, activityConfig: action.config };

    case 'UPDATE_ACTIVITY_CONFIG':
      return { ...state, activityConfig: { ...state.activityConfig, ...action.config } };

    case 'SET_TASKS':
      return { ...state, tasks: action.tasks };

    case 'UPDATE_TASK': {
      const tasks = state.tasks.map((t, i) =>
        i === action.index ? { ...t, ...action.task } : t
      );
      return { ...state, tasks };
    }

    case 'SET_C_TAB':
      return { ...state, cTab: action.tab };

    case 'SET_C_VIEW':
      return { ...state, cView: action.view };

    case 'SET_CURRENT_TASK':
      return { ...state, currentTaskIndex: action.index };

    case 'SET_TASK_NODES':
      return { ...state, taskNodes: action.nodes };

    case 'COMPLETE_TASK_NODE': {
      const taskNodes = state.taskNodes.map((n, i) => {
        if (i === action.index) return { ...n, status: 'completed' as const };
        if (n.status === 'locked' && i === action.index + 1) return { ...n, status: 'available' as const };
        return n;
      });
      return { ...state, taskNodes };
    }

    case 'ADD_TASK_RESULT':
      return { ...state, taskResults: [...state.taskResults, action.result] };

    case 'SET_EXPERIENCE_CARD':
      return { ...state, experienceCard: action.card, cView: 'experience-card' };

    case 'SET_GUIDANCE_STEP':
      return { ...state, guidanceStep: action.step, showGuidance: true };

    case 'SHOW_GUIDANCE':
      return { ...state, showGuidance: action.show };

    case 'DISMISS_GUIDANCE':
      return { ...state, showGuidance: false };

    case 'RESET_C_END':
      return {
        ...state,
        cTab: 'home',
        cView: 'mall-map',
        currentTaskIndex: 0,
        taskNodes: createTaskNodes(state.tasks.length > 0 ? state.tasks : presetTasks),
        taskResults: [],
        experienceCard: null,
      };

    case 'RESET_ALL':
      return {
        ...initialState,
      };

    default:
      return state;
  }
}

// ===== Context =====

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  setPhase: (phase: AppPhase) => void;
  setBEndCompleted: (completed: boolean) => void;
  setActivityConfig: (config: ActivityConfig) => void;
  updateActivityConfig: (config: Partial<ActivityConfig>) => void;
  setTasks: (tasks: TaskContent[]) => void;
  updateTask: (index: number, task: Partial<TaskContent>) => void;
  setCTab: (tab: CTab) => void;
  setCView: (view: CView) => void;
  setCurrentTask: (index: number) => void;
  setTaskNodes: (nodes: TaskNodeState[]) => void;
  completeTaskNode: (index: number) => void;
  addTaskResult: (result: TaskResult) => void;
  setExperienceCard: (card: ExperienceCardData) => void;
  setGuidanceStep: (step: number) => void;
  dismissGuidance: () => void;
  resetCEnd: () => void;
  resetAll: () => void;
  // Derived
  currentTask: TaskContent | null;
  completedCount: number;
  allTasksCompleted: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Dev-only: fast-forward to a specific task via ?devTask=<index> query,
  // or jump to the experience card with mock data via ?devView=experience-card.
  // Production: no-op (Vite strips this useEffect in production builds via
  // the import.meta.env.DEV check).
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      typeof import.meta === 'undefined' ||
      !(import.meta as any).env?.DEV
    ) {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const devTask = params.get('devTask');
    const devView = params.get('devView');

    // ?devView=experience-card — seed a mock experience card and jump
    // straight to the card view. Useful for design reviews of the card.
    //
    // Dev-mode artefacts are NOT inline SVGs (the user explicitly
    // rejected those as "low quality"). Instead we:
    //   • photo  → fetch the real /images/tea-1.jpg and convert it to
    //              a base64 data URL (mimicking what PhotoTask does at
    //              runtime via FileReader)
    //   • drawing → draw a real pomelo on an off-screen HTMLCanvasElement
    //              and export the result with canvas.toDataURL() — this
    //              is a real PNG byte stream from the browser, exactly
    //              the same shape that DrawingTask produces in production.
    // Both async calls run in parallel; once the data is ready we
    // dispatch SET_EXPERIENCE_CARD with the populated results.
    if (devView === 'experience-card') {
      dispatch({ type: 'SET_TASKS', tasks: presetTasks });
      dispatch({
        type: 'SET_TASK_NODES',
        nodes: presetTasks.map((t) => ({
          type: t.type,
          label: t.label,
          icon: t.icon,
          status: 'completed' as const,
          position: { x: 0, y: 0 },
        })),
      });

      // Helpers run only in the browser. They never throw to the
      // outside world; on any failure we fall back to the URL path so
      // the card is still reviewable.
      const fetchPhotoDataUrl = async (src: string): Promise<string> => {
        try {
          const res = await fetch(src);
          if (!res.ok) throw new Error(`fetch ${src} failed`);
          const blob = await res.blob();
          return await new Promise<string>((resolve, reject) => {
            const r = new FileReader();
            r.onloadend = () => resolve(r.result as string);
            r.onerror = () => reject(new Error('FileReader failed'));
            r.readAsDataURL(blob);
          });
        } catch {
          return src; // fall back to the original URL
        }
      };

      const drawPomeloToDataUrl = (): string => {
        // Off-screen canvas (240×192) — same aspect ratio as the
        // production drawing task's canvas. We draw a real pomelo
        // with a wobbly leaf, a highlight, and a tiny smile, then
        // export a PNG. This produces actual canvas pixel data,
        // not vector markup.
        const c = document.createElement('canvas');
        c.width = 240;
        c.height = 192;
        const ctx = c.getContext('2d');
        if (!ctx) return '';
        // Paper background
        ctx.fillStyle = '#FFFCF2';
        ctx.fillRect(0, 0, c.width, c.height);
        // Pomelo body
        ctx.fillStyle = '#FF8C42';
        ctx.strokeStyle = '#D9631B';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(120, 110, 62, 54, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Highlight
        ctx.fillStyle = 'rgba(255, 220, 170, 0.55)';
        ctx.beginPath();
        ctx.ellipse(95, 92, 18, 10, -0.5, 0, Math.PI * 2);
        ctx.fill();
        // Smile
        ctx.strokeStyle = '#7A3B0E';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(120, 122, 14, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
        // Eyes
        ctx.fillStyle = '#7A3B0E';
        ctx.beginPath();
        ctx.arc(104, 100, 2.6, 0, Math.PI * 2);
        ctx.arc(136, 100, 2.6, 0, Math.PI * 2);
        ctx.fill();
        // Leaf
        ctx.fillStyle = '#22C55E';
        ctx.strokeStyle = '#167C3D';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.ellipse(135, 50, 22, 11, -0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Stem
        ctx.strokeStyle = '#167C3D';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(120, 56);
        ctx.lineTo(128, 50);
        ctx.stroke();
        return c.toDataURL('image/png');
      };

      // Resolve real artefacts and then dispatch the experience card.
      void (async () => {
        const photoData = await fetchPhotoDataUrl('/images/tea-1.jpg');
        const drawingData = drawPomeloToDataUrl();
        dispatch({
          type: 'SET_EXPERIENCE_CARD',
          card: {
            theme: '夏日新品探鲜季',
            brandName: '柚见茶铺',
            date: '2026/07/12',
            location: '星耀广场',
            results: [
              { type: 'checkin', checkinTime: '14:32' },
              {
                type: 'photo',
                photoComment: '这杯柚香冰茶,冰得刚刚好',
                photoData,
              },
              {
                type: 'findObject',
                foundCorrect: true,
                findFeedback: '在右侧中部找到啦',
              },
              {
                type: 'message',
                userMessage: '夏天的第一杯柚子茶',
                coCreatedStory: '今日份的,夏天的第一杯柚子茶,被柚风轻轻托起。',
              },
              {
                type: 'drawing',
                drawingData,
                drawingComment: '柚子店长：「这只小柚子我先收下啦～下次来画点更酷的！」',
              },
            ],
            storyText:
              '她把那杯冰茶端到阳光下,柚子香气在指尖绽开,像一整个夏天的开场白,把酸甜都酿成了小小诗。',
            visualStyle: {
              primary: '#FF8C42',
              secondary: '#FFD93D',
              accent: '#FF8C42',
              decoration: 'sun',
            },
          },
        });
        dispatch({ type: 'SET_C_VIEW', view: 'experience-card' });
      })();
      return;
    }

    if (devTask === null) return;
    const idx = Math.max(0, Math.min(Number(devTask) || 0, presetTasks.length - 1));
    const seedTypes: TaskNodeState[] = presetTasks.map((t, i) => ({
      type: t.type,
      label: t.label,
      icon: t.icon,
      status:
        i < idx ? 'completed' : i === idx ? 'available' : 'locked',
      position: { x: 0, y: 0 },
    }));
    dispatch({ type: 'SET_TASKS', tasks: presetTasks });
    dispatch({ type: 'SET_TASK_NODES', nodes: seedTypes });
    dispatch({ type: 'SET_CURRENT_TASK', index: idx });
    dispatch({ type: 'SET_C_VIEW', view: 'task' });
  }, []);

  // ===== Cleanup legacy AI config storage =====
  //
  // Older builds (v1 / v2 / v3) wrote the user's AI configuration
  // to localStorage. Earlier versions also wrote the hard-coded
  // demo API key in plaintext. We no longer expose any AI settings
  // on the client, but we still want to scrub the disk to be safe.
  useEffect(() => {
    try {
      localStorage.removeItem('citystage-ai-config');
      localStorage.removeItem('citystage-ai-config-v2');
      localStorage.removeItem('citystage-ai-config-v3');
    } catch {
      // localStorage may be disabled (private mode, etc.). Not
      // critical — we just lose the cleanup.
    }
  }, []);

  const setPhase = useCallback((phase: AppPhase) => dispatch({ type: 'SET_PHASE', phase }), []);
  const setBEndCompleted = useCallback((completed: boolean) => dispatch({ type: 'SET_B_END_COMPLETED', completed }), []);
  const setActivityConfig = useCallback((config: ActivityConfig) => dispatch({ type: 'SET_ACTIVITY_CONFIG', config }), []);
  const updateActivityConfig = useCallback((config: Partial<ActivityConfig>) => dispatch({ type: 'UPDATE_ACTIVITY_CONFIG', config }), []);
  const setTasks = useCallback((tasks: TaskContent[]) => dispatch({ type: 'SET_TASKS', tasks }), []);
  const updateTask = useCallback((index: number, task: Partial<TaskContent>) => dispatch({ type: 'UPDATE_TASK', index, task }), []);
  const setCTab = useCallback((tab: CTab) => dispatch({ type: 'SET_C_TAB', tab }), []);
  const setCView = useCallback((view: CView) => dispatch({ type: 'SET_C_VIEW', view }), []);
  const setCurrentTask = useCallback((index: number) => dispatch({ type: 'SET_CURRENT_TASK', index }), []);
  const setTaskNodes = useCallback((nodes: TaskNodeState[]) => dispatch({ type: 'SET_TASK_NODES', nodes }), []);
  const completeTaskNode = useCallback((index: number) => dispatch({ type: 'COMPLETE_TASK_NODE', index }), []);
  const addTaskResult = useCallback((result: TaskResult) => dispatch({ type: 'ADD_TASK_RESULT', result }), []);
  const setExperienceCard = useCallback((card: ExperienceCardData) => dispatch({ type: 'SET_EXPERIENCE_CARD', card }), []);
  const setGuidanceStep = useCallback((step: number) => dispatch({ type: 'SET_GUIDANCE_STEP', step }), []);
  const dismissGuidance = useCallback(() => dispatch({ type: 'DISMISS_GUIDANCE' }), []);
  const resetCEnd = useCallback(() => dispatch({ type: 'RESET_C_END' }), []);
  const resetAll = useCallback(() => dispatch({ type: 'RESET_ALL' }), []);

  const currentTask = state.tasks[state.currentTaskIndex] || presetTasks[state.currentTaskIndex] || null;
  const completedCount = state.taskNodes.filter((n) => n.status === 'completed').length;
  const allTasksCompleted = state.taskNodes.length > 0 && completedCount === state.taskNodes.length;

  const value: AppContextValue = {
    state,
    dispatch,
    setPhase,
    setBEndCompleted,
    setActivityConfig,
    updateActivityConfig,
    setTasks,
    updateTask,
    setCTab,
    setCView,
    setCurrentTask,
    setTaskNodes,
    completeTaskNode,
    addTaskResult,
    setExperienceCard,
    setGuidanceStep,
    dismissGuidance,
    resetCEnd,
    resetAll,
    currentTask,
    completedCount,
    allTasksCompleted,
  };

  // Dev-only: expose context synchronously to window for browser-console
  // automation. Runs on every render so callers always see the freshest
  // value (matches React's internal state). Production: no-op.
  const isDev =
    typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV === true;
  const valueRef = useRef<AppContextValue>(value);
  valueRef.current = value;
  if (isDev && typeof window !== 'undefined') {
    (window as any).__APP_CTX__ = valueRef.current;
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// Re-export NodeStatus for convenience
export type { NodeStatus };
