import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { CTab } from '../../types';
import { useApp } from '../../context/AppContext';
import ExperienceCard from '../ExperienceCard';
import DiscoverTab from './DiscoverTab';
import MallMap from './MallMap';
import MyTab from './MyTab';
import TaskFlow from './TaskFlow';
import TaskMap from './TaskMap';

/* ── Inline SVG Icons ── */

function HomeIcon({ active }: { active: boolean }) {
  const color = active ? '#8A65FF' : '#6B7280';
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H15V14H9V21H4C3.44772 21 3 20.5523 3 20V10.5Z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function CompassIcon({ active }: { active: boolean }) {
  const color = active ? '#8A65FF' : '#6B7280';
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <path d="M15.5 8.5L13 13L8.5 15.5L11 11L15.5 8.5Z" fill={color} stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon({ size = 24, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 5V19M5 12H19" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function TaskIcon({ active }: { active: boolean }) {
  const color = active ? '#8A65FF' : '#6B7280';
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4" width="18" height="16" rx="3" stroke={color} strokeWidth="2" />
      <path d="M8 12L11 15L16 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PersonIcon({ active }: { active: boolean }) {
  const color = active ? '#8A65FF' : '#6B7280';
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" />
      <path d="M4 21C4 16.5817 7.58172 13 12 13C16.4183 13 20 16.5817 20 21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 6L18 18M18 6L6 18" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function EnterpriseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="3" width="16" height="18" rx="2" stroke="#8A65FF" strokeWidth="2" />
      <path d="M9 7H10M14 7H15M9 11H10M14 11H15M9 15H10M14 15H15" stroke="#8A65FF" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 21V18H14V21" stroke="#8A65FF" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function NonEnterpriseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="4" stroke="#F59E0B" strokeWidth="2" />
      <path d="M4 21C4 16.5817 7.58172 13 12 13C16.4183 13 20 16.5817 20 21" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const tabConfig: {
  id: CTab;
  label: string;
  icon: (active: boolean) => React.ReactNode;
}[] = [
  { id: 'home', label: '首页', icon: (a) => <HomeIcon active={a} /> },
  { id: 'discover', label: '发现', icon: (a) => <CompassIcon active={a} /> },
  { id: 'task', label: '任务', icon: (a) => <TaskIcon active={a} /> },
  { id: 'my', label: '我的', icon: (a) => <PersonIcon active={a} /> },
];

/* ── TaskTabContent ── */

import { TASK_TYPE_META, npcInfo } from '../../data/defaults';
function TaskTabContent() {
  const { state, setCView, completedCount } = useApp();
  const hasActiveActivity = state.taskNodes.length > 0;

  if (!hasActiveActivity) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
          <TaskIcon active={false} />
        </div>
        <p className="text-ink-secondary text-sm">快去首页发现活动吧</p>
      </div>
    );
  }

  const total = state.taskNodes.length;
  const nextNode = state.taskNodes.find((n) => n.status !== 'completed');
  const progressPercent = total > 0 ? (completedCount / total) * 100 : 0;

  return (
    <div className="h-full overflow-y-auto scrollbar-hide p-4">
      {/* Activity hero card with photo */}
      <div className="relative rounded-2xl overflow-hidden shadow-card mb-3">
        {/* Hero photo */}
        <div className="relative w-full h-20 overflow-hidden">
          <img
            src="/images/tea-shop-scene.jpg"
            alt="活动门店"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.6) 100%)' }}
          />
          <span
            className="absolute top-2.5 left-2.5 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide backdrop-blur"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.92)', color: '#8A65FF' }}
          >
            进行中
          </span>
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-white/80 font-semibold">
                {npcInfo.name}
              </p>
              <h3 className="text-sm font-bold text-white truncate">
                {state.activityConfig.name}
              </h3>
            </div>
            <div className="text-right shrink-0">
              <div className="text-base font-bold text-white tabular-nums leading-tight">
                {completedCount}
                <span className="text-[11px] text-white/70">/{total}</span>
              </div>
              <p className="text-[9px] text-white/70 uppercase tracking-wider">已完成</p>
            </div>
          </div>
        </div>

        {/* Progress bar with brand info */}
        <div className="bg-white px-3.5 py-2 flex items-center gap-3">
          <img
            src="/images/npc-avatar.jpg"
            alt={npcInfo.name}
            className="w-10 h-10 rounded-full object-cover shrink-0"
            style={{ boxShadow: '0 2px 8px rgba(138, 101, 255, 0.25)' }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-ink-secondary font-semibold">
              {state.activityConfig.brandName}
            </p>
            <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPercent}%`,
                  background: 'linear-gradient(90deg, #8A65FF 0%, #FF8C42 100%)',
                }}
              />
            </div>
            <p className="text-[10px] text-ink-secondary mt-1 tabular-nums">
              已完成 {progressPercent.toFixed(0)}%
            </p>
          </div>
        </div>
      </div>

      {/* Next task preview card */}
      {nextNode && (() => {
        const meta = TASK_TYPE_META[nextNode.type];
        const accent = meta?.accent ?? '#8A65FF';
        const accentSoft = meta?.accentSoft ?? '#F5F3FF';
        return (
          <div
            className="rounded-2xl shadow-card overflow-hidden mb-4"
            style={{ background: '#FFFFFF' }}
          >
            <div className="px-3.5 pt-3 pb-2 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-secondary">
                下一个任务
              </p>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{ backgroundColor: accentSoft, color: accent }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: accent }}
                />
                {nextNode.status === 'available' ? '可进行' : '未解锁'}
              </span>
            </div>
            <div className="flex items-stretch">
              <div className="relative w-20 shrink-0 overflow-hidden">
                <img
                  src={meta?.iconImage ?? '/images/tea-shop-scene.jpg'}
                  alt={meta?.label ?? nextNode.label}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0"
                  style={{ background: `linear-gradient(180deg, ${accent}00 0%, ${accent}40 100%)` }}
                />
                <div
                  className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: accent, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
                >
                  {state.taskNodes.findIndex((n) => n === nextNode) + 1}
                </div>
              </div>
              <div className="flex-1 min-w-0 px-3 py-2.5">
                <p className="text-sm font-bold text-ink-primary truncate">{nextNode.label}</p>
                <p className="text-[11px] text-ink-secondary mt-0.5 truncate">
                  {meta?.label ?? nextNode.label}
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Continue button */}
      <button
        onClick={() => setCView('task-map')}
        className="w-full py-3 rounded-2xl font-bold text-sm text-white shadow-card active:scale-95 transition-transform no-tap-highlight"
        style={{
          background: 'linear-gradient(135deg, #FF8C42 0%, #FF9347 100%)',
          boxShadow: '0 6px 20px rgba(255, 140, 66, 0.35)',
        }}
      >
        {completedCount > 0 ? '继续探索' : '开始任务'}
      </button>
    </div>
  );
}

/* ── CreatePopup ── */

function CreatePopup({ onClose }: { onClose: () => void }) {
  const { setPhase, setGuidanceStep, state, dismissGuidance } = useApp();
  const [showToast, setShowToast] = useState(false);

  // The inline hint is bound to the global guidance step 2, so it stays in sync
  // with the rest of the guidance system. Dismiss it locally or when guidance
  // advances to step 3.
  const showHint =
    state.showGuidance && state.guidanceStep === 2;

  const dismissHint = () => {
    if (state.guidanceStep === 2) {
      setGuidanceStep(3);
    } else {
      dismissGuidance();
    }
  };

  const handleEnterprise = () => {
    dismissGuidance();
    onClose();
    setPhase('b-config');
    setGuidanceStep(3);
  };

  const handleNonEnterprise = () => {
    dismissGuidance();
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      onClose();
    }, 1500);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center px-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="bg-white rounded-2xl w-full max-w-[300px] p-5 relative overflow-visible"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors no-tap-highlight z-10"
          >
            <CloseIcon />
          </button>

          {/* Title */}
          <h3 className="text-center text-base font-bold text-ink-primary mb-1">选择用户类型</h3>

          {/* Inline hint banner (above cards, doesn't block) */}
          <AnimatePresence>
            {showHint && (
              <motion.div
                key="hint"
                initial={{ opacity: 0, y: -4, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -4, height: 0 }}
                transition={{ duration: 0.25 }}
                className="mb-3"
              >
                <div
                  className="flex items-start gap-2 rounded-xl px-3 py-2"
                  style={{
                    background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
                    border: '1px solid rgba(138,101,255,0.18)',
                  }}
                >
                  <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center shrink-0 mt-0.5">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill="#8A65FF" />
                    </svg>
                  </div>
                  <p className="text-[11px] text-primary-700 leading-relaxed flex-1">
                    第 2 步 / 共 10 步 · 选择「<span className="font-bold">企业用户</span>」以品牌方身份配置并发布活动
                  </p>
                  <button
                    onClick={dismissHint}
                    className="w-4 h-4 rounded-full hover:bg-primary-100 flex items-center justify-center shrink-0 no-tap-highlight"
                  >
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
                      <path d="M6 6L18 18M18 6L6 18" stroke="#8A65FF" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Enterprise button — with pulse halo when hint is active */}
          <div className="relative">
            {/* Pulse halo rings — only when hint is showing */}
            <AnimatePresence>
              {showHint && (
                <>
                  <motion.div
                    key="pulse-1"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: [0, 0.55, 0], scale: [0.96, 1.04, 1.1] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                    className="absolute -inset-1.5 rounded-2xl pointer-events-none"
                    style={{
                      boxShadow: '0 0 0 2px rgba(138,101,255,0.5), 0 0 24px rgba(138,101,255,0.35)',
                      zIndex: 0,
                    }}
                  />
                  <motion.div
                    key="pulse-2"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: [0, 0.35, 0], scale: [0.96, 1.02, 1.07] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut', delay: 0.6 }}
                    className="absolute -inset-1.5 rounded-2xl pointer-events-none"
                    style={{
                      boxShadow: '0 0 0 1px rgba(138,101,255,0.4)',
                      zIndex: 0,
                    }}
                  />
                </>
              )}
            </AnimatePresence>

            <button
              onClick={handleEnterprise}
              className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all mb-3 active:scale-95 no-tap-highlight relative"
              style={{
                borderColor: showHint ? 'rgba(138,101,255,0.6)' : 'rgb(229, 231, 235)',
                background: showHint ? 'rgba(245, 243, 255, 0.6)' : 'white',
                zIndex: 1,
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                <EnterpriseIcon />
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-semibold text-ink-primary">企业用户</p>
                <p className="text-[11px] text-ink-secondary mt-0.5">配置并发布品牌活动</p>
              </div>
              {/* Pointer indicator arrow */}
              {showHint && (
                <motion.div
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-primary-500"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.div>
              )}
            </button>
          </div>

          {/* Non-enterprise button */}
          <button
            onClick={handleNonEnterprise}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-neutral-200 hover:border-primary-400 hover:bg-primary-50 transition-all active:scale-95 no-tap-highlight"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <NonEnterpriseIcon />
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-semibold text-ink-primary">非企业用户</p>
              <p className="text-[11px] text-ink-secondary mt-0.5">个人创作者体验</p>
            </div>
          </button>
        </motion.div>
      </motion.div>

      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 z-[60] bg-black/80 text-white text-xs px-4 py-2 rounded-full whitespace-nowrap"
          >
            产品支持，Demo 暂未开放
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function CEndApp() {
  const { state, setCTab, setCView, setGuidanceStep } = useApp();
  const { cTab, cView } = state;
  const [showCreatePopup, setShowCreatePopup] = useState(false);

  // Full-screen overlays: no tab bar
  const isFullScreenOverlay = cView === 'task' || cView === 'experience-card';
  const showTabBar = !isFullScreenOverlay;

  const handleTabClick = (tab: CTab) => {
    setCTab(tab);
    if (tab === 'home') {
      setCView('mall-map');
    }
  };

  const handleCreateClick = () => {
    setShowCreatePopup(true);
    setGuidanceStep(2);
  };

  const renderContent = () => {
    if (cTab === 'home') {
      switch (cView) {
        case 'mall-map':
          return <MallMap />;
        case 'task-map':
          return <TaskMap />;
        case 'task':
          return <TaskFlow />;
        case 'experience-card':
          return <ExperienceCard />;
        default:
          return <MallMap />;
      }
    }
    if (cTab === 'discover') return <DiscoverTab />;
    if (cTab === 'task') return <TaskTabContent />;
    return <MyTab />;
  };

  return (
    <div className="h-full flex flex-col bg-main relative">
      {/* Content area — the inner view is responsible for its own
          scrolling so the experience card (and any other full-height
          view) gets a real `h-full` to fill. The wrapper itself does
          NOT set `overflow-y-auto`, otherwise nested `h-full` views
          end up with 0 height and their CTAs fall outside the viewport. */}
      <div className="flex-1 min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${cTab}-${cView}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom tab bar */}
      {showTabBar && (
        <div
          className="flex items-end justify-around no-tap-highlight shrink-0 relative px-2 pt-1"
          style={{
            height: '56px',
            paddingBottom: '8px',
            backgroundImage: 'url(/images/tab-bar-bg.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'top center',
            backgroundRepeat: 'no-repeat',
            borderTop: '1px solid rgba(255,255,255,0.5)',
            boxShadow: '0 -6px 24px rgba(138,101,255,0.1), inset 0 1px 0 rgba(255,255,255,0.6)',
          }}
        >
          {/* 首页 */}
          <button
            onClick={() => handleTabClick('home')}
            className={`flex flex-col items-center gap-0.5 no-tap-highlight transition-all duration-200 ${
              cTab === 'home' ? 'text-primary-500' : 'text-ink-secondary'
            }`}
          >
            {tabConfig[0].icon(cTab === 'home')}
            <span className={`text-[10px] font-medium ${cTab === 'home' ? 'text-primary-500 font-semibold' : 'text-ink-secondary'}`}>
              {tabConfig[0].label}
            </span>
          </button>

          {/* 发现 */}
          <button
            onClick={() => handleTabClick('discover')}
            className={`flex flex-col items-center gap-0.5 no-tap-highlight transition-all duration-200 ${
              cTab === 'discover' ? 'text-primary-500' : 'text-ink-secondary'
            }`}
          >
            {tabConfig[1].icon(cTab === 'discover')}
            <span className={`text-[10px] font-medium ${cTab === 'discover' ? 'text-primary-500 font-semibold' : 'text-ink-secondary'}`}>
              {tabConfig[1].label}
            </span>
          </button>

          {/* 创建 (center, elevated with 3D look) */}
          <button
            onClick={handleCreateClick}
            className="flex flex-col items-center no-tap-highlight transition-transform hover:scale-105 active:scale-95"
            style={{ marginTop: '-32px' }}
          >
            {/* Outer glow ring */}
            <div
              className="absolute rounded-full"
              style={{
                width: 64,
                height: 64,
                marginTop: -4,
                background: 'radial-gradient(circle, rgba(138,101,255,0.3) 0%, rgba(138,101,255,0) 70%)',
                filter: 'blur(6px)',
                pointerEvents: 'none',
              }}
            />
            <div
              className="relative w-13 h-13 rounded-full flex items-center justify-center"
              style={{
                width: 52,
                height: 52,
                background: 'linear-gradient(135deg, #B49EFF 0%, #8A65FF 35%, #7C4FFF 100%)',
                boxShadow:
                  '0 0 0 1px rgba(255,255,255,0.4) inset, 0 0 0 4px rgba(255,255,255,0.5) inset, 0 0 0 1px rgba(138,101,255,0.3), 0 4px 12px rgba(138,101,255,0.4), 0 8px 20px rgba(138,101,255,0.3)',
              }}
            >
              {/* Top highlight gloss */}
              <div
                className="absolute rounded-full pointer-events-none"
                style={{
                  top: 4,
                  left: 6,
                  right: 6,
                  height: 18,
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 100%)',
                }}
              />
              {/* Inner shadow at bottom */}
              <div
                className="absolute rounded-full pointer-events-none"
                style={{
                  bottom: 4,
                  left: 6,
                  right: 6,
                  height: 14,
                  background: 'linear-gradient(0deg, rgba(60,30,180,0.3) 0%, rgba(60,30,180,0) 100%)',
                }}
              />
              <PlusIcon size={22} color="#FFFFFF" />
            </div>
            <span className="text-[10px] font-semibold text-primary-500 mt-1">创建</span>
          </button>

          {/* 任务 */}
          <button
            onClick={() => handleTabClick('task')}
            className={`flex flex-col items-center gap-0.5 no-tap-highlight transition-all duration-200 ${
              cTab === 'task' ? 'text-primary-500' : 'text-ink-secondary'
            }`}
          >
            {tabConfig[2].icon(cTab === 'task')}
            <span className={`text-[10px] font-medium ${cTab === 'task' ? 'text-primary-500 font-semibold' : 'text-ink-secondary'}`}>
              {tabConfig[2].label}
            </span>
          </button>

          {/* 我的 */}
          <button
            onClick={() => handleTabClick('my')}
            className={`flex flex-col items-center gap-0.5 no-tap-highlight transition-all duration-200 ${
              cTab === 'my' ? 'text-primary-500' : 'text-ink-secondary'
            }`}
          >
            {tabConfig[3].icon(cTab === 'my')}
            <span className={`text-[10px] font-medium ${cTab === 'my' ? 'text-primary-500 font-semibold' : 'text-ink-secondary'}`}>
              {tabConfig[3].label}
            </span>
          </button>
        </div>
      )}

      {/* Create popup */}
      <AnimatePresence>
        {showCreatePopup && <CreatePopup onClose={() => setShowCreatePopup(false)} />}
      </AnimatePresence>
    </div>
  );
}
