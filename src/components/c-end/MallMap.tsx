import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { presetTasks } from '../../data/defaults';
/* ── Inline SVG Icons (used only for essential UI controls) ── */

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M6 9L12 15L18 9" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M12 21C12 21 5 14 5 9C5 5.5 8 3 12 3C16 3 19 5.5 19 9C19 14 12 21 12 21Z" fill="#8A65FF" />
      <circle cx="12" cy="9" r="2.5" fill="#FFFFFF" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M6 6L18 18M18 6L6 18" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export default function MallMap() {
  const { state, setCView, setGuidanceStep, setTaskNodes } = useApp();
  const [showInfo, setShowInfo] = useState(false);

  const handleExplore = () => {
    // 兜底：从未发布过活动时，用 presetTasks 初始化 taskNodes，保证任务地图可点
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

  const handlePinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowInfo(true);
  };

  const closeInfo = () => setShowInfo(false);

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
          <span className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center">
            <MapPinIcon />
          </span>
          <span className="text-sm font-semibold text-ink-primary">{state.activityConfig.location || '星耀广场'}</span>
          <ChevronDownIcon />
        </button>
      </motion.div>

      {/* ── 柚见茶铺店铺 pin ──
          在 B 端未发布活动前,这里应该看起来像一个"正在召唤"的
          暖色入口 —— 用与「开始探索」CTA 同色系的橙色光晕 + 浮
          动 + 呼吸动画,把它从"装饰"提升为"主操作入口"。 */}
      <motion.div
        className="absolute"
        style={{ top: '32%', left: '29%', zIndex: 30 }}
        onClick={handlePinClick}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* 暖色光晕层 —— 呼吸放大/缩小,告诉用户"这里有活动" */}
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

        {/* pin 本体:橙色渐变环 + 真实饮品图 */}
        <div
          className="relative w-12 h-12 rounded-full overflow-hidden cursor-pointer"
          style={{
            background:
              'linear-gradient(135deg, #FF8C42 0%, #FF9347 100%)',
            boxShadow:
              '0 6px 16px rgba(255, 140, 66, 0.55), ' +
              '0 0 0 3px #FFFFFF, ' +
              '0 0 0 4.5px rgba(255, 140, 66, 0.7)',
          }}
        >
          <img
            src="/images/youjian-pin.jpg"
            alt="柚见茶铺"
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>

        {/* 标签:暖色底 + 白色文字,与 pin 同色系,明确"活动入口"语义 */}
        <div
          className="absolute left-1/2 px-2.5 py-1 rounded-lg whitespace-nowrap"
          style={{
            background:
              'linear-gradient(135deg, #FF8C42 0%, #FF9347 100%)',
            boxShadow: '0 4px 12px rgba(255, 140, 66, 0.4)',
            transform: 'translateX(-50%)',
            top: 'calc(100% + 8px)',
          }}
        >
          <p className="text-[11px] font-bold text-white">柚见茶铺 · 新活动</p>
        </div>
      </motion.div>

      {/* ── Bottom: full activity info card (only shows when pin is clicked) ── */}
      <AnimatePresence>
        {showInfo && (
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
              {/* Hero photo banner.
                  Use the same shop photo as the task-map / passport
                  cover so the visual language stays consistent
                  across the app, and pin it to a 4:3 aspect ratio
                  (instead of a fixed 80-px strip) so the picture is
                  always readable regardless of the source image's
                  natural proportions. */}
              <div
                className="relative w-full"
                style={{ aspectRatio: '4 / 3' }}
              >
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
                <button
                  onClick={closeInfo}
                  className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center no-tap-highlight active:scale-95 transition-transform hover:bg-black/60"
                  style={{ zIndex: 10 }}
                  aria-label="关闭"
                >
                  <CloseIcon />
                </button>
                <div className="absolute bottom-1.5 left-2.5 right-10 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-white bg-accent-500 rounded-full px-1.5 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    活动进行中
                  </span>
                  <span className="text-[10px] text-white/90 truncate">限时·集5印记获奖</span>
                </div>
              </div>

              {/* Title + brand */}
              <div className="px-4 pt-2.5 pb-1.5">
                <h2 className="text-base font-bold text-ink-primary leading-tight">
                  {state.activityConfig.name || '夏日新品探鲜季'}
                </h2>
                <p className="text-[11px] text-ink-secondary mt-0.5">
                  {state.activityConfig.brandName || '柚见茶铺'} · {state.activityConfig.location || '星耀广场 1F 中庭'}
                </p>
              </div>

              {/* 3 info chips */}
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

              {/* Full description */}
              <div className="px-4 pb-2.5">
                <p className="text-[11px] text-ink-secondary leading-relaxed">
                  探访柚见茶铺 1F 门店，完成 5 个趣味任务（定位打卡、拍照、寻物、留言、画图），每完成一个即可获得 AI 个性化反馈，集齐 5 印解锁专属体验卡。
                </p>
              </div>

              {/* Full-width CTA */}
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
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M9 6L15 12L9 18" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
