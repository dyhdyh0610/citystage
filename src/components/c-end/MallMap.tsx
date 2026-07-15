import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { presetTasks } from '../../data/defaults';

/* ── Inline icons (used only for essential UI controls that
 *    are not part of the brand-icon registry, e.g. a tiny
 *    chevron in the location chip and the close X on the
 *    info-card). All brand icons below are real PNG images. */

export default function MallMap() {
  const { state, setPhase, setCTab, setCView, setGuidanceStep, setTaskNodes } = useApp();
  const [showInfo, setShowInfo] = useState(false);
  const [showLockedHint, setShowLockedHint] = useState(false);

  /**
   * The C-end is only meaningful after the B-end has published an
   * activity. Until then, the 柚见茶铺 pin is *visually* present on
   * the map (so first-time users see what the experience looks
   * like) but is *functionally* locked — tapping it shows a hint
   * card pointing them at either the B-end (organizers) or the
   * Discover tab (other live activities).
   */
  const isLocked = !state.bEndCompleted;

  const handlePinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLocked) {
      setShowLockedHint(true);
      return;
    }
    setShowInfo(true);
  };

  const goToBEnd = () => {
    setShowLockedHint(false);
    setShowInfo(false);
    setPhase('identity');
  };

  const goToDiscover = () => {
    setShowLockedHint(false);
    setShowInfo(false);
    setCTab('discover');
  };

  const handleExplore = () => {
    if (isLocked) return;
    if (state.taskNodes.length === 0) {
      const seeded = (state.tasks.length > 0 ? state.tasks : presetTasks).map((t, i) => ({
        type: t.type,
        label: t.label,
        icon: t.icon,
        status: (i === 0 ? 'available' : 'locked') as 'available' | 'locked',
        position: { x: 50, y: 50 },
      }));
      setTaskNodes(seeded);
    }
    setCView('task-map');
    setGuidanceStep(6);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="h-full relative overflow-hidden bg-main"
    >
      {/* ── Real 3D mall illustration background ── */}
      <img
        src="/images/mall-map-3d.jpg"
        alt="星耀广场地图"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* ── Top header: location only ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="absolute top-0 left-0 right-0 px-3 pt-3"
        style={{ zIndex: 100 }}
      >
        <button
          onClick={() => alert('切换商场')}
          className="flex items-center gap-1.5 bg-white rounded-full pl-2.5 pr-2 py-1.5 shadow-card no-tap-highlight shrink-0"
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
        >
          <span className="text-sm font-semibold text-ink-primary">{state.activityConfig.location || '星耀广场'}</span>
        </button>
      </motion.div>

      {/* ── 柚见茶铺 pin ──
       *
       * Two visual states:
       *   • Published  — orange breathing ring + a "新活动" pill,
       *                  tap opens the full activity info card.
       *   • Locked     — gray ring (no breathing), a "未发布" pill,
       *                  tap opens a hint pointing at B-end / Discover.
       *
       * Both states share the same map position so the pin never
       * "jumps" when an organizer publishes an activity mid-session.
       */}
      {/* 柚见茶铺 pin only renders after the B-end has published
          (i.e. there are real tasks to explore). Before that, the
          map shows the empty state with a hint instead. */}
      {!isLocked && (
      <motion.div
        className="absolute"
        style={{ top: '32%', left: '29%', zIndex: 30 }}
        onClick={handlePinClick}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Halo / ring — orange + breathing when active, flat gray when locked */}
        {isLocked ? (
          <div
            aria-hidden
            className="absolute rounded-full"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 60,
              height: 60,
              background: 'rgba(156, 163, 175, 0.18)',
              boxShadow: '0 0 0 8px rgba(156, 163, 175, 0.10)',
              pointerEvents: 'none',
            }}
          />
        ) : (
          <motion.div
            aria-hidden
            className="absolute rounded-full"
            style={{
              top: '50%',
              left: '50%',
              x: '-50%',
              y: '-50%',
              width: 60,
              height: 60,
              background: 'rgba(255, 140, 66, 0.35)',
              boxShadow: '0 0 0 8px rgba(255, 140, 66, 0.15)',
              pointerEvents: 'none',
            }}
            animate={{ scale: [1, 1.25, 1], opacity: [0.85, 0.45, 0.85] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Pin body */}
        <div
          className="relative w-12 h-12 rounded-full overflow-hidden cursor-pointer"
          style={{
            background: isLocked
              ? 'linear-gradient(135deg, #D1D5DB 0%, #9CA3AF 100%)'
              : 'linear-gradient(135deg, #FF8C42 0%, #FF9347 100%)',
            boxShadow: isLocked
              ? '0 4px 12px rgba(156, 163, 175, 0.35), 0 0 0 3px #FFFFFF, 0 0 0 4.5px rgba(156, 163, 175, 0.55)'
              : '0 6px 16px rgba(255, 140, 66, 0.55), 0 0 0 3px #FFFFFF, 0 0 0 4.5px rgba(255, 140, 66, 0.7)',
            opacity: isLocked ? 0.85 : 1,
            filter: isLocked ? 'grayscale(0.55)' : 'none',
          }}
        >
          {isLocked ? null : (
            <img
              src="/images/youjian-pin.jpg"
              alt="柚见茶铺"
              className="w-full h-full object-cover"
              draggable={false}
            />
          )}
        </div>

        {/* Label pill — gray when locked, orange when active */}
        <div
          className="absolute left-1/2 px-2.5 py-1 rounded-lg whitespace-nowrap"
          style={{
            background: isLocked
              ? 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)'
              : 'linear-gradient(135deg, #FF8C42 0%, #FF9347 100%)',
            boxShadow: isLocked
              ? '0 4px 12px rgba(107, 114, 128, 0.35)'
              : '0 4px 12px rgba(255, 140, 66, 0.4)',
            transform: 'translateX(-50%)',
            top: 'calc(100% + 8px)',
          }}
        >
          <p className="text-[11px] font-bold text-white">
            {isLocked ? '柚见茶铺 · 筹备中' : '柚见茶铺 · 新活动'}
          </p>
        </div>
      </motion.div>
      )}

      {/* Empty-state hint — when no activity is published we
          replace the missing pin with a soft chip that nudges
          the user toward the B-end (or Discover for browsing
          other live activities). The chip lives in the same
          map position as the future pin so the layout is stable. */}
      {isLocked && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="absolute"
          style={{ top: '32%', left: '29%', transform: 'translate(-50%, -50%)', zIndex: 30 }}
        >
          <button
            onClick={() => setShowLockedHint(true)}
            className="flex items-center gap-1.5 bg-white rounded-full pl-2 pr-2.5 py-1.5 shadow-card no-tap-highlight hover:scale-105 active:scale-95 transition-transform"
            style={{ boxShadow: '0 4px 12px rgba(31, 24, 39, 0.10)' }}
          >
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #F4F4F5 0%, #E5E7EB 100%)' }}
            >
              <span className="text-[12px]">✨</span>
            </span>
            <span className="text-[11px] font-semibold text-ink-secondary">新活动即将上线</span>
          </button>
        </motion.div>
      )}

      {/* ── Locked hint card (only when locked + tapped) ──
       *
       * Replaces the activity info card while the B-end has not
       * published yet. Gives the user two clear next-steps so the
       * map is never a dead-end. */}
      <AnimatePresence>
        {showLockedHint && (
          <motion.div
            key="locked-card"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-0 left-0 right-0 px-3 pb-3"
            style={{ zIndex: 100 }}
          >
            <div
              className="bg-white rounded-2xl overflow-hidden"
              style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
            >
              {/* Hero — soft warm gradient with "coming soon" badge */}
              <div
                className="relative w-full px-5 pt-5 pb-4"
                style={{
                  background:
                    'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
                  aspectRatio: '4 / 2.2',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="min-w-0">
                    <span
                      className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(107, 114, 128, 0.15)', color: '#4B5563' }}
                    >
                      活动筹备中
                    </span>
                    <h2 className="text-base font-bold text-ink-primary leading-tight mt-1.5">
                      柚见茶铺 · 即将上线
                    </h2>
                    <p className="text-[11px] text-ink-secondary mt-0.5">
                      {state.activityConfig.location || '星耀广场 1F 中庭'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Explanation */}
              <div className="px-5 pt-3 pb-2">
                <p className="text-[12px] text-ink-secondary leading-relaxed">
                  这个位置的活动还没有准备好。在 B 端完成活动创建并发布后，这里会变成一个可探索的地图，带你完成定位打卡、拍照、寻物、留言、画图 5 个任务。
                </p>
              </div>

              {/* Two CTAs */}
              <div className="px-5 pb-4 pt-1 space-y-2">
                <button
                  onClick={goToBEnd}
                  className="w-full h-10 flex items-center justify-center gap-1.5 rounded-xl text-white text-sm font-bold no-tap-highlight active:scale-[0.98] transition-transform"
                  style={{
                    background: 'linear-gradient(135deg, #8A65FF 0%, #7C3AED 50%, #FF8C42 100%)',
                    boxShadow: '0 4px 12px rgba(138, 101, 255, 0.35)',
                  }}
                >
                  <span>前往 B 端创建活动</span>
                </button>
                <button
                  onClick={goToDiscover}
                  className="w-full h-10 flex items-center justify-center gap-1.5 rounded-xl text-ink-primary text-sm font-bold no-tap-highlight active:scale-[0.98] transition-transform"
                  style={{
                    background: '#F3F4F6',
                    border: '1px solid #E5E7EB',
                  }}
                >
                  <span>去发现页看看其他活动</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Activity info card (only when published + tapped) ── */}
      <AnimatePresence>
        {showInfo && !isLocked && (
          <motion.div
            key="info-card"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-0 left-0 right-0 px-3 pb-3"
            style={{ zIndex: 100 }}
          >
            <div
              className="bg-white rounded-2xl overflow-hidden"
              style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
            >
              <div className="relative w-full" style={{ aspectRatio: '4 / 3' }}>
                <img
                  src="/images/tea-shop-scene.jpg"
                  alt="活动预览"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 100%)',
                  }}
                />
                <div className="absolute bottom-1.5 left-2.5 right-10 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-white bg-accent-500 rounded-full px-1.5 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    活动进行中
                  </span>
                  <span className="text-[10px] text-white/90 truncate">限时·集5印记获奖</span>
                </div>
              </div>

              <div className="px-4 pt-2.5 pb-1.5">
                <h2 className="text-base font-bold text-ink-primary leading-tight">
                  {state.activityConfig.name || '夏日新品探鲜季'}
                </h2>
                <p className="text-[11px] text-ink-secondary mt-0.5">
                  {state.activityConfig.brandName || '柚见茶铺'} · {state.activityConfig.location || '星耀广场 1F 中庭'}
                </p>
              </div>

              <div className="px-4 pb-2.5">
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="bg-primary-50 rounded-md py-1.5 text-center">
                    <p className="text-[10px] text-ink-secondary leading-none">任务数</p>
                    <p className="text-sm font-bold text-primary-600 leading-tight mt-1">
                      {state.tasks.length || 5} 个
                    </p>
                  </div>
                  <div className="bg-accent-50 rounded-md py-1.5 text-center">
                    <p className="text-[10px] text-ink-secondary leading-none">预计用时</p>
                    <p className="text-sm font-bold text-accent-600 leading-tight mt-1">
                      30 分钟
                    </p>
                  </div>
                  <div className="bg-amber-50 rounded-md py-1.5 text-center">
                    <p className="text-[10px] text-ink-secondary leading-none">完赛奖励</p>
                    <p className="text-sm font-bold text-amber-600 leading-tight mt-1">
                      体验卡
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-4 pb-2.5">
                <p className="text-[11px] text-ink-secondary leading-relaxed">
                  探访柚见茶铺 1F 门店，完成 5 个趣味任务（定位打卡、拍照、寻物、留言、画图），每完成一个即可获得 AI 个性化反馈，集齐 5 印解锁专属体验卡。
                </p>
              </div>

              <div className="px-4 pb-3">
                <button
                  onClick={handleExplore}
                  className="w-full h-10 flex items-center justify-center gap-1 rounded-xl text-white text-sm font-bold no-tap-highlight active:scale-[0.98] transition-transform"
                  style={{
                    background: 'linear-gradient(135deg, #FF8C42 0%, #FF9347 100%)',
                    boxShadow: '0 4px 12px rgba(255,140,66,0.35)',
                  }}
                >
                  开始探索
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
