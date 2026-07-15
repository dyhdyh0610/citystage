import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { npcInfo, TASK_TYPE_META } from '../../data/defaults';
import { generateExperienceCard } from '../../services/api';
import type { TaskResult } from '../../types';
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

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="#A3A3A3" strokeWidth="2" />
      <path d="M8 11V8C8 5.79086 9.79086 4 12 4C14.2091 4 16 5.79086 16 8V11" stroke="#A3A3A3" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function TaskMap() {
  const {
    state,
    setCView,
    setCurrentTask,
    completedCount,
    setGuidanceStep,
    setExperienceCard,
  } = useApp();
  const { taskNodes } = state;
  const total = taskNodes.length;

  // Local toast state — the "查看" button shows a short hint
  // when the achievement is still locked, or "正在生成体验卡…"
  // while we synthesize a fallback card from whatever task
  // results are on hand.
  const [toast, setToast] = useState<string | null>(null);
  const [synthesizing, setSynthesizing] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2500);
  };

  /**
   * Three branches, all of which used to be empty before this fix:
   *   1. experience card already generated → jump straight to it
   *   2. all tasks completed but card missing (e.g. user dismissed
   *      the last task's auto-flow) → synthesize a card from
   *      `state.taskResults` and jump
   *   3. still locked → show a one-liner toast
   */
  const handleViewAchievement = async () => {
    if (state.experienceCard) {
      setCView('experience-card');
      return;
    }
    if (completedCount === total && total > 0) {
      setSynthesizing(true);
      showToast('正在为你准备体验卡…');
      try {
        const lines = state.taskResults
          .map((r: TaskResult) => {
            switch (r.type) {
              case 'checkin':
                return '打卡：到达柚见茶铺 1F 门店';
              case 'photo':
                return '拍照：用户拍了一张照片';
              case 'findObject':
                return '寻找物体：用户找到了柚子吉祥物';
              case 'message':
                return `留言共创：用户写下了「${r.userMessage ?? ''}」`;
              case 'drawing':
                return '画图绘图：用户画了一幅画';
              default:
                return '';
            }
          })
          .filter(Boolean)
          .join('\n');
        const { story, visualStyle } = await generateExperienceCard(
          state.activityConfig.name,
          state.activityConfig.brandName,
          lines,
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
        setGuidanceStep(9);
        setCView('experience-card');
      } catch {
        // Even on AI failure, surface a minimal card so the
        // button click is never a dead-end.
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
        setCView('experience-card');
      } finally {
        setSynthesizing(false);
      }
      return;
    }
    showToast(`再完成 ${total - completedCount} 个任务即可解锁体验卡`);
  };

  const handleNodeClick = (index: number) => {
    const node = taskNodes[index];
    if (node && node.status === 'available') {
      setCurrentTask(index);
      setCView('task');
      setGuidanceStep(7);
    }
  };

  const handlePrimaryCta = () => {
    const firstAvailable = taskNodes.findIndex((n) => n.status === 'available');
    if (firstAvailable >= 0) {
      handleNodeClick(firstAvailable);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-full overflow-y-auto scrollbar-hide bg-main relative"
    >
      {/* ── Floating back button (the title + 0/5 are merged into the hero card) ── */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.05, duration: 0.3 }}
        className="absolute top-3 left-3 z-10"
      >
        <button
          onClick={() => setCView('mall-map')}
          className="w-9 h-9 rounded-full bg-white shadow-card flex items-center justify-center no-tap-highlight transition-colors hover:bg-primary-50 shrink-0"
          aria-label="返回"
        >
          <BackIcon />
        </button>
      </motion.div>

      {/* ── Activity Hero Card (title merged into the card) ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="px-4 pt-3"
      >
        <div className="relative rounded-2xl overflow-hidden shadow-card">
          {/* Hero photo */}
          <div className="relative w-full h-24 overflow-hidden">
            <img
              src="/images/tea-shop-scene.jpg"
              alt="柚见茶铺门店"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.55) 100%)' }}
            />
            {/* Eyebrow title + status merged onto the hero photo.
                Title sits at the top-right corner so it doesn't
                collide with the progress count chip at bottom-left
                and stays out of the way of the storefront scene. */}
            <div className="absolute top-2.5 left-3 right-3 flex items-start justify-end gap-2">
              <span
                className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide backdrop-blur shrink-0"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.92)', color: '#8A65FF' }}
              >
                当前活动
              </span>
              <h1 className="text-base font-bold text-white leading-tight" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                夏日探鲜任务
              </h1>
            </div>
            {/* Progress count sits on the photo's bottom-left, with a soft chip */}
            <div
              className="absolute bottom-2 left-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur"
              style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
            >
              <span className="tabular-nums">{completedCount}/{total}</span>
              <span className="opacity-80">已完成</span>
            </div>
          </div>

          {/* Card body */}
          <div className="bg-white px-3.5 py-3 flex items-center gap-3">
            <img
              src="/images/npc-avatar.jpg"
              alt={npcInfo.name}
              className="w-11 h-11 rounded-full object-cover shrink-0"
              style={{ boxShadow: '0 2px 8px rgba(138, 101, 255, 0.25)' }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-ink-secondary font-semibold">
                {npcInfo.name}
              </p>
            </div>
            <button
              onClick={handlePrimaryCta}
              disabled={taskNodes.every((n) => n.status !== 'available')}
              className="shrink-0 rounded-full px-4 py-2 text-xs font-bold text-white no-tap-highlight transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #FF8C42 0%, #FF9347 100%)',
                boxShadow: '0 4px 14px rgba(255, 140, 66, 0.35)',
              }}
            >
              {completedCount > 0 ? '继续探索' : '开始任务'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Task List ── */}
      <div className="px-4 space-y-2.5 mb-4">
        {taskNodes.map((node, i) => {
          const meta = TASK_TYPE_META[node.type];
          const isCompleted = node.status === 'completed';
          const isAvailable = node.status === 'available';
          const isLocked = node.status === 'locked';
          const accent = meta?.accent ?? '#8A65FF';
          const accentSoft = meta?.accentSoft ?? '#F5F3FF';

          return (
            <motion.button
              key={i}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 + i * 0.06, duration: 0.3 }}
              whileTap={isAvailable ? { scale: 0.985 } : undefined}
              onClick={() => handleNodeClick(i)}
              disabled={isLocked}
              className="w-full bg-white rounded-2xl shadow-card overflow-hidden no-tap-highlight text-left flex items-stretch transition-all"
              style={{
                opacity: isLocked ? 0.55 : 1,
                outline: isAvailable ? `2px solid ${accent}` : '2px solid transparent',
                outlineOffset: '-2px',
              }}
            >
              {/* Thumbnail */}
              <div className="relative w-20 shrink-0 overflow-hidden">
                <img
                  src={meta?.iconImage ?? '/images/tea-shop-scene.jpg'}
                  alt={meta?.label ?? node.label}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(180deg, ${accent}00 0%, ${accent}33 100%)`,
                  }}
                />
                {/* Number badge */}
                <div
                  className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{
                    background: isCompleted ? '#22C55E' : isAvailable ? accent : '#9CA3AF',
                    color: '#FFFFFF',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }}
                >
                  {isCompleted ? <CheckIcon /> : i + 1}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 px-3 py-2.5 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-bold truncate"
                    style={{ color: isLocked ? '#9CA3AF' : '#1F1827' }}
                  >
                    {node.label}
                  </p>
                  <p className="text-[11px] text-ink-secondary mt-0.5 truncate">
                    {meta?.label ?? node.label}
                  </p>
                  {/* Status tag */}
                  <div className="mt-1.5">
                    {isCompleted && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ backgroundColor: '#F0FDF4', color: '#22C55E' }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                        已完成
                      </span>
                    )}
                    {isAvailable && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ backgroundColor: accentSoft, color: accent }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full animate-pulse"
                          style={{ background: accent }}
                        />
                        待完成
                      </span>
                    )}
                    {isLocked && (
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-neutral-100 text-neutral-400">
                        <LockIcon />
                        未解锁
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow CTA */}
                {isAvailable && (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: accentSoft }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M9 6L15 12L9 18"
                        stroke={accent}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* ── Achievement Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.4 }}
        className="px-4 pb-4"
      >
        <div
          className="relative rounded-2xl overflow-hidden p-4 shadow-card"
          style={{
            background: 'linear-gradient(135deg, #8A65FF 0%, #6D28D9 100%)',
          }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -left-6 w-28 h-28 rounded-full bg-white/5" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 ring-2 ring-white/40">
              <img
                src="/images/youjian-pin.jpg"
                alt="体验卡"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white">成就解锁</h3>
              <p className="text-[11px] text-white/80 mt-0.5 truncate">
                集齐 {total} 个印记，获得专属体验卡
              </p>
              {completedCount === total && total > 0 && (
                <span className="inline-block mt-1.5 text-[10px] font-bold text-white/90">
                  已完成 {completedCount}/{total}
                </span>
              )}
            </div>

            <button
              onClick={handleViewAchievement}
              disabled={synthesizing}
              className="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold text-primary-600 bg-white no-tap-highlight transition-transform hover:scale-105 active:scale-95 disabled:opacity-70"
            >
              {synthesizing ? '生成中…' : '查看'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Local toast for the "查看" button ──
          Renders inside the TaskMap scroller (so it inherits the
          `position: relative` parent) and uses fixed-position
          z-index so it never gets clipped by a transform-bearing
          ancestor. Mirrors the experience-card toast pattern. */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute left-1/2 -translate-x-1/2 rounded-full px-4 py-2 text-[12px] font-medium shadow-card pointer-events-none z-50"
            style={{
              bottom: 24,
              background: 'rgba(31, 24, 39, 0.92)',
              color: '#FFF8EE',
              backdropFilter: 'blur(6px)',
            }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
