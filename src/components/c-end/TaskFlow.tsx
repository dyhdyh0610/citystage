import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { generateExperienceCard } from '../../services/api';
import { npcInfo, TASK_TYPE_META } from '../../data/defaults';
import type { ExperienceCardData, TaskResult } from '../../types';
import CheckinTask from './tasks/CheckinTask';
import PhotoTask from './tasks/PhotoTask';
import FindObjectTask from './tasks/FindObjectTask';
import MessageTask from './tasks/MessageTask';
import DrawingTask from './tasks/DrawingTask';
type SubStage = 'welcome' | 'interaction' | 'farewell';

/* ── Inline SVG Icons ── */

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 6L9 12L15 18" stroke="#1F1827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 12L10 17L19 7" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9S10.62 6.5 12 6.5S14.5 7.62 14.5 9S13.38 11.5 12 11.5Z" fill="#6B7280" />
    </svg>
  );
}

/**
 * Per-task-type hero artwork. Maps each task type to the photo that
 * best evokes the activity, taken from the curated /images/ folder so
 * the task UI never falls back on emoji or rough SVG. Falls back to
 * the shop scene for unknown types.
 */
const taskHeroByType: Record<string, { src: string; alt: string }> = {
  checkin: { src: '/images/task-checkin.jpg', alt: '到店打卡场景' },
  photo: { src: '/images/tea-shop-scene.jpg', alt: '拍照打卡场景' },
  findObject: { src: '/images/task-find-object.jpg', alt: '寻找小柚子场景' },
  message: { src: '/images/task-message.jpg', alt: '留言墙场景' },
  drawing: { src: '/images/task-drawing.jpg', alt: '画图绘图场景' },
};

/** Build a formatted summary string of all task results for the experience card AI prompt. */
function buildUserContents(results: TaskResult[]): string {
  const lines: string[] = [];
  for (const r of results) {
    switch (r.type) {
      case 'checkin':
        lines.push('- 打卡：到达柚见茶铺 1F 门店');
        break;
      case 'photo':
        lines.push('- 拍照：用户拍了一张照片');
        break;
      case 'findObject':
        lines.push('- 寻找物体：用户找到了柚子吉祥物');
        break;
      case 'message':
        lines.push(`- 留言共创：用户写下了「${r.userMessage ?? ''}」`);
        break;
      case 'drawing':
        lines.push('- 画图绘图：用户画了一幅画');
        break;
    }
  }
  return lines.join('\n');
}

/** Short summary text for the current task result, shown in farewell stage. */
function resultSummary(result: TaskResult): string {
  switch (result.type) {
    case 'checkin':
      return `已于 ${result.checkinTime ?? ''} 完成打卡`;
    case 'photo':
      return '已完成拍照';
    case 'findObject':
      return '已找到柚子吉祥物';
    case 'message':
      return '已留下夏日寄语';
    case 'drawing':
      return '已完成绘画';
    default:
      return '已完成';
  }
}

export default function TaskFlow() {
  const {
    state,
    currentTask,
    setCView,
    setCurrentTask,
    completeTaskNode,
    addTaskResult,
    setExperienceCard,
    setGuidanceStep,
  } = useApp();

  const [subStage, setSubStage] = useState<SubStage>('welcome');
  const [taskResult, setTaskResult] = useState<TaskResult | null>(null);
  const [continuing, setContinuing] = useState(false);

  // Guard: no current task. We get here if `state.tasks` is empty
  // AND the currentTaskIndex has been pushed past the end of
  // `presetTasks` (the demo tasks that back the un-configured flow).
  //
  // Recovery: build an experience card from whatever taskResults
  // we have on hand, then jump to it. If we already have an
  // experience card, just jump to it. This avoids the previous
  // "stuck on 暂无任务" dead-end that happened when the last
  // task's "生成体验卡" handler incorrectly walked into the
  // "advance to next task" branch (see handleContinue).
  if (!currentTask) {
    void (async () => {
      if (!state.experienceCard) {
        // Synthesize a fallback experience card from whatever
        // results the user has accumulated. This keeps the user
        // out of the dead-end "暂无任务" screen even if a previous
        // version of the handler pushed the index past the end.
        const userContents = buildUserContents(state.taskResults);
        try {
          const { story, visualStyle } = await generateExperienceCard(
            state.activityConfig.name,
            state.activityConfig.brandName,
            userContents,
          );
          setExperienceCard({
            theme: state.activityConfig.name,
            brandName: state.activityConfig.brandName,
            date: new Date().toLocaleDateString('zh-CN'),
            location: state.activityConfig.location,
            results: [...state.taskResults],
            storyText: story,
            visualStyle,
          });
        } catch {
          // Even if the AI fails, build a minimal card so the
          // user can still see their results. The story will be
          // empty but the photos / drawings / messages will still
          // be visible.
          setExperienceCard({
            theme: state.activityConfig.name,
            brandName: state.activityConfig.brandName,
            date: new Date().toLocaleDateString('zh-CN'),
            location: state.activityConfig.location,
            results: [...state.taskResults],
            storyText: '你今天在小店的足迹，已经收进了这本夏日护照。',
            visualStyle: {
              primary: '#FF8C42',
              secondary: '#FFD93D',
              accent: '#FF8C42',
              decoration: 'sun',
            },
          });
        }
      }
      setGuidanceStep(9);
      setCView('experience-card');
    })();
    return (
      <div className="h-full flex flex-col bg-main items-center justify-center">
        <p className="text-sm text-ink-secondary mb-2">正在为你准备体验卡…</p>
        <button
          onClick={() => setCView('task-map')}
          className="text-primary-500 text-sm font-medium"
        >
          返回任务地图
        </button>
      </div>
    );
  }

  const handleComplete = (result: TaskResult) => {
    setTaskResult(result);
    addTaskResult(result);
    setSubStage('farewell');
  };

  const handleContinue = async () => {
    completeTaskNode(state.currentTaskIndex);
    // The "is this the last task?" check has to be robust against an
    // empty `state.tasks` (e.g. when the user has not yet published an
    // activity, so the activity-config state holds no tasks but
    // `presetTasks` is what backs the actual flow). The Continue
    // button label on line ~501 already uses the same `tasks.length
    // || taskNodes.length || 5` fallback, so the gating logic must
    // match — otherwise the button says "生成体验卡" but the handler
    // walks into the "advance to next task" branch and the user gets
    // bumped off the end of presetTasks into the "暂无任务" screen.
    const totalTasks =
      state.tasks.length || state.taskNodes.length || 5;
    const isLast = state.currentTaskIndex === totalTasks - 1;

    if (isLast) {
      // Generate experience card from all task results
      setContinuing(true);
      const userContents = buildUserContents(state.taskResults);
      const { story, visualStyle } = await generateExperienceCard(
        state.activityConfig.name,
        state.activityConfig.brandName,
        userContents,
      );
      const card: ExperienceCardData = {
        theme: state.activityConfig.name,
        brandName: state.activityConfig.brandName,
        date: new Date().toLocaleDateString('zh-CN'),
        location: state.activityConfig.location,
        results: [...state.taskResults],
        storyText: story,
        visualStyle,
      };
      setExperienceCard(card);
      setContinuing(false);
      setGuidanceStep(9);
      setCView('experience-card');
    } else {
      // Advance to next task
      setCurrentTask(state.currentTaskIndex + 1);
      setSubStage('welcome');
      setTaskResult(null);
    }
  };

  const renderTask = () => {
    switch (currentTask.type) {
      case 'checkin':
        return <CheckinTask onComplete={handleComplete} />;
      case 'photo':
        return <PhotoTask onComplete={handleComplete} />;
      case 'findObject':
        return <FindObjectTask onComplete={handleComplete} />;
      case 'message':
        return <MessageTask onComplete={handleComplete} />;
      case 'drawing':
        return <DrawingTask onComplete={handleComplete} />;
      default:
        return null;
    }
  };

  return (
    <div
      className="h-full flex flex-col relative"
      style={{
        backgroundImage: 'url(/images/taskflow-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Soft white veil — keeps cards readable on top of photo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.45) 55%, rgba(255,255,255,0.58) 100%)' }}
        aria-hidden
      />
      <div className="relative z-10 flex flex-col h-full">
      {/* ── Nav header ── */}
      <div className="flex items-center gap-2.5 px-4 py-1.5 shrink-0 border-b border-white/40 backdrop-blur-md" style={{ backgroundColor: 'rgba(255, 255, 255, 0.55)' }}>
        <button
          onClick={() => setCView('task-map')}
          className="w-7 h-7 rounded-full bg-[#F5F3FF] flex items-center justify-center text-ink-primary no-tap-highlight transition-colors hover:bg-primary-100 shrink-0"
        >
          <BackIcon />
        </button>
        <span className="font-bold text-[13px] text-ink-primary flex-1">
          {currentTask ? TASK_TYPE_META[currentTask.type].label : '任务体验'}
        </span>
        <span className="text-[11px] text-ink-secondary font-medium">
          {state.currentTaskIndex + 1}/{state.tasks.length || state.taskNodes.length || 5}
        </span>
      </div>

      {/* Progress steps removed — the dedicated per-step
          "STEP N · 柚见茶铺" wooden sign in the TaskHeader is
          enough context for the user, and the in-flow back
          button + task-body content convey the rest. The old
          1-2-3-4-5 dot row was visually competing with the
          hero photo for attention. */}

      {/* ── Stage content ── */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <AnimatePresence mode="wait">
          {subStage === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="min-h-full flex flex-col p-4"
              style={{ background: 'linear-gradient(180deg, #FFF7EC 0%, #FFFFFF 60%)' }}
            >
              {/* NPC dialogue section — decorative card style */}
              <div className="flex items-start gap-3 mb-5">
                {/* NPC portrait */}
                <div className="relative shrink-0">
                  <img
                    src="/images/npc-avatar.jpg"
                    alt={npcInfo.name}
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-white"
                    style={{ boxShadow: '0 4px 10px rgba(255, 140, 66, 0.25)' }}
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>
                {/* Speech bubble — tightened, decorated */}
                <div className="relative flex-1">
                  <div
                    className="rounded-2xl rounded-tl-sm shadow-card relative overflow-hidden"
                    style={{ background: 'linear-gradient(180deg, #FFFDF8 0%, #FFF7EC 100%)' }}
                  >
                    {/* Tail pointing to avatar */}
                    <div
                      className="absolute left-0 top-5 -translate-x-1/2 w-3 h-3 rotate-45"
                      style={{ background: '#FFFDF8', marginLeft: '-2px', boxShadow: '-1px 1px 2px rgba(0,0,0,0.04)' }}
                    />
                    <div className="px-4 pt-3 pb-3.5 relative">
                      {/* Header: name + role */}
                      <p className="text-[11px] font-bold tracking-wider mb-1.5" style={{ color: '#C2410C' }}>
                        {npcInfo.name} · 店长寄语
                      </p>
                      {/* Tightened quote with paired decorative marks */}
                      <div className="relative pl-3.5 pr-1">
                        <span
                          className="absolute left-0 top-0 text-2xl font-extrabold leading-none select-none"
                          style={{ color: '#FF8C42', opacity: 0.4 }}
                        >
                          "
                        </span>
                        <p className="text-[13px] text-ink-body leading-relaxed font-medium" style={{ letterSpacing: '0.02em' }}>
                          {currentTask.npcWelcome}
                        </p>
                        <span
                          className="absolute right-0 -bottom-1 text-2xl font-extrabold leading-none select-none"
                          style={{ color: '#FF8C42', opacity: 0.4 }}
                        >
                          "
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Task card with hero photo */}
              <div
                className="rounded-2xl overflow-hidden shadow-card mb-3"
                style={{ background: '#FFFFFF' }}
              >
                {/* Hero photo */}
                <div className="relative w-full h-20 overflow-hidden">
                  <img
                    src={taskHeroByType[currentTask.type]?.src ?? '/images/tea-shop-scene.jpg'}
                    alt={taskHeroByType[currentTask.type]?.alt ?? currentTask.label}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {/* Gradient overlay for legibility */}
                  <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.55) 100%)' }}
                  />
                  {/* Task type badge floating on photo */}
                  <span
                    className="absolute top-3 left-3 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide backdrop-blur"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.92)', color: '#8A65FF' }}
                  >
                    {currentTask.label}
                  </span>
                </div>

                {/* Card body */}
                <div className="p-4">
                  <h3 className="text-base font-bold text-ink-primary leading-tight">
                    {currentTask.description}
                  </h3>
                  <div className="flex items-center gap-1 mt-2">
                    <PinIcon />
                    <span className="text-xs text-ink-secondary">
                      {state.activityConfig.brandName} · {state.activityConfig.location}
                    </span>
                  </div>
                </div>
              </div>

              {/* CTA button */}
              <button
                onClick={() => {
                  setSubStage('interaction');
                  setGuidanceStep(8);
                }}
                className="rounded-full py-3 font-bold text-sm text-white no-tap-highlight transition-transform hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #FF8C42 0%, #FF9347 100%)',
                  boxShadow: '0 4px 16px rgba(255, 140, 66, 0.35)',
                }}
              >
                开始任务
              </button>
            </motion.div>
          )}

          {subStage === 'interaction' && (
            <motion.div
              key="interaction"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderTask()}
            </motion.div>
          )}

          {subStage === 'farewell' && (
            <motion.div
              key="farewell"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="min-h-full flex flex-col p-4"
              style={{ background: 'linear-gradient(180deg, #F0FAF0 0%, #FFFFFF 60%)' }}
            >
              {/* NPC dialogue section — decorative card style */}
              <div className="flex items-start gap-3 mb-4">
                {/* NPC portrait */}
                <div className="relative shrink-0">
                  <img
                    src="/images/npc-avatar.jpg"
                    alt={npcInfo.name}
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-white"
                    style={{ boxShadow: '0 4px 10px rgba(34, 197, 94, 0.25)' }}
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>
                <div className="relative flex-1">
                  <div
                    className="rounded-2xl rounded-tl-sm shadow-card relative overflow-hidden"
                    style={{ background: 'linear-gradient(180deg, #F0FDF4 0%, #ECFDF5 100%)' }}
                  >
                    <div
                      className="absolute left-0 top-5 -translate-x-1/2 w-3 h-3 rotate-45"
                      style={{ background: '#F0FDF4', marginLeft: '-2px', boxShadow: '-1px 1px 2px rgba(0,0,0,0.04)' }}
                    />
                    <div className="px-4 pt-3 pb-3.5 relative">
                      {/* Header: name + role */}
                      <p className="text-[11px] font-bold tracking-wider mb-1.5" style={{ color: '#15803D' }}>
                        {npcInfo.name} · 完赛寄语
                      </p>
                      {/* Tightened quote with paired decorative marks */}
                      <div className="relative pl-3.5 pr-1">
                        <span
                          className="absolute left-0 top-0 text-2xl font-extrabold leading-none select-none"
                          style={{ color: '#22C55E', opacity: 0.4 }}
                        >
                          "
                        </span>
                        <p className="text-[13px] text-ink-body leading-relaxed font-medium" style={{ letterSpacing: '0.02em' }}>
                          {currentTask.npcFarewell}
                        </p>
                        <span
                          className="absolute right-0 -bottom-1 text-2xl font-extrabold leading-none select-none"
                          style={{ color: '#22C55E', opacity: 0.4 }}
                        >
                          "
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Task result summary */}
              {taskResult && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-2xl p-3 mb-4 flex items-center gap-2"
                  style={{ background: '#ECFDF5' }}
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: '#22C55E' }}
                  >
                    <CheckIcon />
                  </div>
                  <span className="text-sm font-medium" style={{ color: '#15803D' }}>
                    {resultSummary(taskResult)}
                  </span>
                </motion.div>
              )}

              {/* Continue button */}
              <button
                onClick={handleContinue}
                disabled={continuing}
                className="rounded-full py-3 font-bold text-sm text-white no-tap-highlight flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #FF8C42 0%, #FF9347 100%)',
                  boxShadow: '0 4px 16px rgba(255, 140, 66, 0.35)',
                }}
              >
                {continuing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                    正在生成体验卡...
                  </>
                ) : (
                  state.currentTaskIndex === (state.tasks.length || state.taskNodes.length || 5) - 1 ? '生成体验卡' : '继续'
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </div>
    </div>
  );
}
