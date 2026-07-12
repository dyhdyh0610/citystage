import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { createTaskNodes, presetTasks } from '../../data/defaults';
/* ── Inline SVG Icons (matching BEndConfig + TaskOrchestration style) ── */

function ChevronLeftIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SparkleIcon({ size = 14, color = '#8A65FF' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill={color} />
    </svg>
  );
}

function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 12L10 17L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function PublishConfirm() {
  const { state, setBEndCompleted, setPhase, setCTab, setCView, setTaskNodes, setGuidanceStep } = useApp();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setBEndCompleted(true);
      setPhase('c-app');
      setCTab('home');
      setCView('mall-map');
      setTaskNodes(createTaskNodes(state.tasks.length > 0 ? state.tasks : presetTasks));
      setGuidanceStep(5);
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [state.tasks, setBEndCompleted, setPhase, setCTab, setCView, setTaskNodes, setGuidanceStep]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="h-full flex flex-col bg-main relative overflow-hidden"
    >
      {/* ── Top hero header (image + gradient + step indicator) ── */}
      <div className="px-3.5 pt-3.5 pb-2 shrink-0">
        <div
          className="relative overflow-hidden"
          style={{ height: 132, borderRadius: 20 }}
        >
          {/* Background image */}
          <img
            src="/images/publishing-hero.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Multi-layer gradient for legibility */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(31, 24, 39, 0.35) 0%, rgba(31, 24, 39, 0.25) 40%, rgba(31, 24, 39, 0.75) 100%)',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, rgba(138, 101, 255, 0.25) 0%, rgba(255, 140, 66, 0.15) 100%)',
              mixBlendMode: 'overlay',
            }}
          />

          {/* Nav row */}
          <div className="relative z-10 flex items-center gap-2 px-3 pt-2.5">
            <button
              disabled
              className="w-9 h-9 rounded-full flex items-center justify-center no-tap-highlight opacity-50"
              style={{
                background: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(8px)',
                color: '#1F1827',
              }}
              aria-label="返回"
            >
              <ChevronLeftIcon />
            </button>
            <div className="flex-1" />
            <div
              className="h-7 px-3 rounded-full flex items-center gap-1.5"
              style={{
                background: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <SparkleIcon size={11} color="#8A65FF" />
              <span className="text-[11px] font-bold" style={{ color: '#8A65FF' }}>
                3 / 3
              </span>
            </div>
          </div>

          {/* Title + subtitle + progress */}
          <div className="relative z-10 px-4 mt-1.5 text-white">
            <h1 className="text-[19px] font-bold leading-tight" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.18)' }}>
              正在发布活动
            </h1>
            <p className="text-[11px] mt-0.5 opacity-90" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.18)' }}>
              AI 正在为你的活动做最后准备
            </p>

            {/* Progress bar */}
            <div className="mt-2 flex items-center gap-2.5">
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.25)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #FF8C42 0%, #FFB066 100%)' }}
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 3.7, ease: 'easeInOut' }}
                />
              </div>
              <span className="text-[10.5px] font-semibold tabular-nums" style={{ minWidth: 32 }}>
                发布中
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Centered publish status card (the original purpose of this page) ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-8 -mt-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 220, damping: 20 }}
          className="bg-white rounded-3xl px-6 py-7 flex flex-col items-center w-full max-w-[280px]"
          style={{
            boxShadow:
              '0 12px 32px rgba(31, 24, 39, 0.10), 0 0 0 1px rgba(31, 24, 39, 0.04)',
          }}
        >
          {/* Pulsing icon ring */}
          <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ background: 'linear-gradient(135deg, rgba(138, 101, 255, 0.18), rgba(255, 140, 66, 0.18))' }}
              animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
            />
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ background: 'linear-gradient(135deg, rgba(138, 101, 255, 0.18), rgba(255, 140, 66, 0.18))' }}
              animate={{ scale: [1, 1.32, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
            />
            <div
              className="relative w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #8A65FF 0%, #FF8C42 100%)',
                boxShadow: '0 6px 16px rgba(138, 101, 255, 0.35)',
              }}
            >
              <CheckIcon size={20} />
            </div>
          </div>

          <h2 className="font-bold text-[17px] text-ink-primary">活动即将上线</h2>
          <p className="text-[12px] text-ink-secondary mt-1.5 text-center leading-relaxed">
            任务节点已生成，
            <br />
            即将进入 C 端体验
          </p>

          {/* Step list */}
          <div className="w-full mt-5 space-y-2">
            {[
              { label: '活动信息', done: true },
              { label: '任务编排', done: true },
              { label: '活动发布', done: 'progress' as const },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-2.5 text-[12px]">
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background:
                      step.done === true
                        ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                        : step.done === 'progress'
                        ? 'linear-gradient(135deg, #FF8C42 0%, #FF6A00 100%)'
                        : '#E5E7EB',
                  }}
                >
                  {step.done === true ? (
                    <CheckIcon size={9} />
                  ) : step.done === 'progress' ? (
                    <motion.div
                      className="w-1.5 h-1.5 rounded-full bg-white"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 0.9, repeat: Infinity }}
                    />
                  ) : null}
                </div>
                <span
                  className="flex-1"
                  style={{
                    color: step.done ? '#1F1827' : '#9CA3AF',
                    fontWeight: step.done ? 500 : 400,
                  }}
                >
                  {step.label}
                </span>
                {step.done === 'progress' && (
                  <span className="text-[10px] font-semibold" style={{ color: '#FF8C42' }}>
                    进行中
                  </span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
