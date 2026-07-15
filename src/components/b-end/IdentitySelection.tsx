import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { createTaskNodes } from '../../data/defaults';
// ── Inline SVG Icons ──

function CrownIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 16L11 28L22 10L33 28L38 16L35 34H9L6 16Z" fill="#FFD93D" stroke="#8A65FF" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="6" cy="16" r="3.5" fill="#FF8C42" stroke="#8A65FF" strokeWidth="1.5" />
      <circle cx="38" cy="16" r="3.5" fill="#FF8C42" stroke="#8A65FF" strokeWidth="1.5" />
      <circle cx="22" cy="10" r="3.5" fill="#FF8C42" stroke="#8A65FF" strokeWidth="1.5" />
      <rect x="9" y="34" width="26" height="4" rx="2" fill="#8A65FF" />
    </svg>
  );
}

function BuildingIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 21H21V19H3V21Z" fill="white" />
      <path d="M5 19V8L12 4L19 8V19" stroke="white" strokeWidth="2" strokeLinejoin="round" fill="none" />
      <rect x="9" y="10" width="2.5" height="3" rx="0.5" fill="white" />
      <rect x="12.5" y="10" width="2.5" height="3" rx="0.5" fill="white" />
      <rect x="9" y="14.5" width="2.5" height="3" rx="0.5" fill="white" />
      <rect x="12.5" y="14.5" width="2.5" height="3" rx="0.5" fill="white" />
    </svg>
  );
}

function PersonIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="4" stroke="white" strokeWidth="2" fill="none" />
      <path d="M4 20C4 16 7.5 14 12 14C16.5 14 20 16 20 20" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function SparkleIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill="currentColor" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L14.5 9H22L16 13.5L18.5 21L12 16.5L5.5 21L8 13.5L2 9H9.5L12 2Z" fill="currentColor" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
      <path d="M6 6L18 18M18 6L6 18" stroke="#8A65FF" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export default function IdentitySelection() {
  const { state, setPhase, setGuidanceStep, setTaskNodes, setCView } = useApp();
  const [showCToast, setShowCToast] = useState(false);
  const [showStep2Hint, setShowStep2Hint] = useState(state.guidanceStep === 2);

  // Sync hint visibility with global guidance step
  useEffect(() => {
    if (state.showGuidance && state.guidanceStep === 2) {
      setShowStep2Hint(true);
    } else {
      setShowStep2Hint(false);
    }
  }, [state.showGuidance, state.guidanceStep]);

  const handleBEndClick = () => {
    setShowStep2Hint(false);
    setPhase('b-config');
    setGuidanceStep(1);  // Reset to step 1 of B-end flow
  };

  const handleCEndClick = () => {
    setShowStep2Hint(false);
    if (!state.bEndCompleted) {
      setShowCToast(true);
      window.setTimeout(() => setShowCToast(false), 3000);
      // Show the hint again if user still hasn't selected B-end
      window.setTimeout(() => {
        if (state.guidanceStep === 2) setShowStep2Hint(true);
      }, 3000);
      return;
    }
    setTaskNodes(createTaskNodes(state.tasks));
    setCView('mall-map');
    setPhase('c-app');
    setGuidanceStep(4);
  };

  const dismissHint = () => {
    setShowStep2Hint(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-full bg-main relative overflow-hidden flex flex-col"
    >
      {/* ── Brush-bg gradient header ── */}
      <div
        className="absolute top-0 left-0 right-0 h-[300px] pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 40%, #C084FC 100%)',
          borderRadius: '0 0 50% 50%',
          opacity: 0.6,
        }}
      />

      {/* ── Brand section ── */}
      <div className="relative z-10 flex flex-col items-center pt-14 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="mb-3"
        >
          <CrownIcon />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-[28px] font-bold leading-tight"
          style={{ color: '#8A65FF' }}
        >
          City
          <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Stage</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm font-medium mt-1"
          style={{ color: '#7C3AED' }}
        >
          城市共创剧场
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xs text-ink-secondary mt-3 text-center leading-relaxed max-w-[240px]"
        >
          用AI点亮线下空间，让每一次探索都有故事
        </motion.p>
      </div>

      {/* ── Identity cards (stacked, full-width) ── */}
      <div className="relative z-10 flex flex-col gap-4 px-5 mt-8">
        {/* Merchant card — with pulse halo when hint is active */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="relative"
        >
          {/* Yellow recommendation sticker */}
          <div
            className="absolute -top-3 left-5 z-20 flex items-center gap-1 px-3 py-1 rounded-full shadow-card-lg"
            style={{ background: '#FFD93D', color: '#92400E' }}
          >
            <StarIcon />
            <span className="text-[10px] font-bold">推荐</span>
          </div>

          {/* Pulse halo rings — only when hint is active */}
          <AnimatePresence>
            {showStep2Hint && (
              <>
                <motion.div
                  key="pulse-1"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: [0, 0.6, 0], scale: [0.95, 1.08, 1.15] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                  className="absolute -inset-2 rounded-2xl pointer-events-none"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,140,66,0.18), rgba(255,147,71,0.12))',
                    boxShadow: '0 0 0 2px rgba(255,140,66,0.5), 0 8px 32px rgba(255,140,66,0.25)',
                    zIndex: 0,
                  }}
                />
                <motion.div
                  key="pulse-2"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: [0, 0.4, 0], scale: [0.95, 1.05, 1.12] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut', delay: 0.6 }}
                  className="absolute -inset-2 rounded-2xl pointer-events-none"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,140,66,0.15), rgba(255,147,71,0.08))',
                    boxShadow: '0 0 0 1px rgba(255,140,66,0.4)',
                    zIndex: 0,
                  }}
                />
              </>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleBEndClick}
            className="relative w-full overflow-hidden rounded-xl p-5 text-left no-tap-highlight"
            style={{
              background: 'linear-gradient(135deg, #FF8C42, #FF9347)',
              zIndex: 1,
              boxShadow: showStep2Hint
                ? '0 0 0 3px rgba(255,140,66,0.55), 0 8px 24px rgba(255,140,66,0.4)'
                : undefined,
            }}
          >
            {/* Decorative circles */}
            <div
              className="absolute -right-6 -top-6 w-24 h-24 rounded-full pointer-events-none"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            />
            <div
              className="absolute -right-4 bottom-2 w-16 h-16 rounded-full pointer-events-none"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            />

            <div className="relative flex items-center gap-4">
              {/* Icon container */}
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,255,255,0.2)' }}
              >
                <BuildingIcon />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[20px] font-bold text-white leading-tight">我是商家/组织者</h3>
                <p className="text-xs text-white/80 mt-1">创建活动 · AI辅助编排 · 发布推广</p>
              </div>
              {/* AI badge */}
              <div
                className="px-2 py-0.5 rounded-full shrink-0"
                style={{ background: 'rgba(255,255,255,0.25)' }}
              >
                <span className="text-[10px] font-medium text-white">AI</span>
              </div>
            </div>
          </motion.button>

          {/* Hint tooltip — positioned just above the card, with arrow pointing down */}
          <AnimatePresence>
            {showStep2Hint && (
              <motion.div
                key="hint"
                initial={{ opacity: 0, y: -6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                className="absolute left-0 right-0 z-30"
                style={{ bottom: 'calc(100% + 8px)' }}
              >
                <div
                  className="relative bg-white rounded-xl px-3 py-2.5 mx-1"
                  style={{
                    boxShadow: '0 8px 24px rgba(138,101,255,0.18), 0 0 0 1px rgba(138,101,255,0.15)',
                  }}
                >
                  <div className="flex items-start gap-2">
                    {/* Hand pointer icon */}
                    <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center shrink-0 mt-0.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M7 11V7a2 2 0 1 1 4 0v4M11 11V5a2 2 0 1 1 4 0v6M15 11V7a2 2 0 1 1 4 0v8c0 3-2 6-6 6s-6-3-6-6v-3a2 2 0 0 1 4 0" stroke="#8A65FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-ink-primary leading-relaxed">
                        选择<span className="font-bold text-accent-600 mx-0.5">「企业用户」</span>，以品牌方身份配置并发布活动
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissHint();
                      }}
                      className="w-5 h-5 rounded-full bg-primary-50 hover:bg-primary-100 flex items-center justify-center shrink-0 no-tap-highlight transition-colors"
                    >
                      <CloseIcon />
                    </button>
                  </div>

                  {/* Down arrow */}
                  <div
                    className="absolute left-1/2"
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: '8px solid transparent',
                      borderRight: '8px solid transparent',
                      borderTop: '9px solid white',
                      transform: 'translateX(-50%)',
                      bottom: '-8px',
                      filter: 'drop-shadow(0 2px 1px rgba(138,101,255,0.1))',
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* User card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="relative"
        >
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleCEndClick}
            className="w-full relative overflow-hidden rounded-xl p-5 text-left no-tap-highlight"
            style={{ background: 'linear-gradient(135deg, #8A65FF, #7C3AED)' }}
          >
            {/* Decorative circles */}
            <div
              className="absolute -left-6 -bottom-6 w-24 h-24 rounded-full pointer-events-none"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            />
            <div
              className="absolute left-4 -top-4 w-16 h-16 rounded-full pointer-events-none"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            />

            <div className="relative flex items-center gap-4">
              {/* Icon container */}
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,255,255,0.2)' }}
              >
                <PersonIcon />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[20px] font-bold text-white leading-tight">我是城市探索者</h3>
                <p className="text-xs text-white/80 mt-1">参与活动 · 互动体验 · 收集故事</p>
              </div>
            </div>
          </motion.button>

          {/* C-end locked toast */}
          {showCToast && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-56 bg-ink-primary text-white text-[11px] rounded-xl p-2.5 z-20 shadow-card-lg text-center leading-relaxed"
            >
              请先从品牌方视角开始体验，了解活动是如何创建的
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-b-[5px] border-l-transparent border-r-transparent border-b-ink-primary" />
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* ── Decorative sparkles at bottom ── */}
      <div className="relative z-10 flex justify-center items-center gap-6 py-8 mt-auto">
        <div className="text-primary-300 animate-twinkle">
          <SparkleIcon />
        </div>
        <div className="text-accent-300 animate-twinkle" style={{ animationDelay: '0.5s' }}>
          <SparkleIcon />
        </div>
        <div className="text-sunny animate-twinkle" style={{ animationDelay: '1s' }}>
          <SparkleIcon />
        </div>
        <div className="text-primary-400 animate-twinkle" style={{ animationDelay: '1.5s' }}>
          <SparkleIcon />
        </div>
      </div>
    </motion.div>
  );
}
