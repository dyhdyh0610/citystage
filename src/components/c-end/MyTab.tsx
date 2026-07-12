import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Icon } from "../Icon";
/* ── Brand image assets (all real PNG, no SVG, no emoji) ── */

const AVATAR_IMG = '/images/my-avatar.png';
const HERO_TEXTURE_IMG = '/images/my-bg-texture.png';
const MEDAL_IMG = '/images/my-medal.png';

/* ── Menu icon registry ──
 *
 * Each item is rendered as a 36×36 round medallion with a real
 * illustrated glyph, tinted by a brand color. The visual style
 * is "stamped luggage tag" — warm, vintage, tactile.
 */

interface MenuItemDef {
  key: string;
  label: string;
  hint: string;
  icon: 'portfolio' | 'favorites' | 'bell' | 'settings' | 'info';
  badge?: string;
  /** Card-stock background color (warm, paper-like). */
  tint: string;
  /** Icon tint applied to the underlying PNG. */
  iconColor: string;
}

const menuItems: MenuItemDef[] = [
  {
    key: 'portfolio',
    label: '我的作品',
    hint: '拍过的照片 · 画过的画',
    icon: 'portfolio',
    tint: 'linear-gradient(135deg, #FFE7C2 0%, #FFD2A0 100%)',
    iconColor: '#D9631B',
  },
  {
    key: 'favorites',
    label: '我的收藏',
    hint: '最喜欢的瞬间 · 写下的寄语',
    icon: 'favorites',
    tint: 'linear-gradient(135deg, #FFD3DC 0%, #FFB6C1 100%)',
    iconColor: '#C1305F',
  },
  {
    key: 'bell',
    label: '消息通知',
    hint: '活动上新 · 商家回复',
    icon: 'bell',
    badge: '3',
    tint: 'linear-gradient(135deg, #E4D7FF 0%, #C4B0FF 100%)',
    iconColor: '#5B3FBF',
  },
  {
    key: 'settings',
    label: '设置',
    hint: '通知 · 隐私 · 偏好',
    icon: 'settings',
    tint: 'linear-gradient(135deg, #F0E6D2 0%, #D9C8A6 100%)',
    iconColor: '#7B5A2A',
  },
  {
    key: 'info',
    label: '关于柚见',
    hint: '品牌故事 · 联系我们',
    icon: 'info',
    tint: 'linear-gradient(135deg, #C8E9D6 0%, #9BD3AF 100%)',
    iconColor: '#2E6A41',
  },
];

/* ── Tiny menu icons rendered as 36px image-on-tint medallions ── */

function MenuGlyph({ name, tint, color }: { name: MenuItemDef['icon']; tint: string; color: string }) {
  return (
    <div
      className="w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0"
      style={{
        background: tint,
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.6), ' +
          'inset 0 -1px 0 rgba(0,0,0,0.06), ' +
          '0 2px 4px rgba(31, 24, 39, 0.06)',
      }}
    >
      <Icon
        name={
          name === 'portfolio' ? 'task' :
          name === 'favorites' ? 'star' :
          name === 'bell' ? 'bell' :
          name === 'settings' ? 'settings' :
          'info'
        }
        size={20}
        color={color}
        decorative
      />
    </div>
  );
}

/* ── Activity history (kept from original list) ── */

const activityHistory = [
  { title: '夏日新品探鲜季', date: '2026.07.05', status: '进行中', statusColor: '#C1301E', statusBg: '#FFF1E5' },
  { title: '中秋游园会', date: '2026.06.18', status: '已完成', statusColor: '#2E6A41', statusBg: '#E8F3EC' },
  { title: '光影艺术周', date: '2026.05.20', status: '已完成', statusColor: '#2E6A41', statusBg: '#E8F3EC' },
];

/* ── Reusable decorative primitives ── */

function Stamp({ children, color = '#C1301E', rotate = -6 }: { children: React.ReactNode; color?: string; rotate?: number }) {
  return (
    <div
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] font-bold"
      style={{
        fontSize: 9,
        letterSpacing: 0.4,
        color,
        border: `1.2px solid ${color}`,
        transform: `rotate(${rotate}deg)`,
        textTransform: 'uppercase',
        background: 'rgba(255, 255, 255, 0.6)',
      }}
    >
      {children}
    </div>
  );
}

export default function MyTab() {
  const { completedCount, allTasksCompleted } = useApp();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="h-full overflow-y-auto scrollbar-hide relative"
      style={{ background: '#FBF3E0' }}
    >
      {/* ── Top passport header (image-backed hero) ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.45 }}
        className="relative overflow-hidden"
        style={{ paddingTop: 28, paddingBottom: 56 }}
      >
        {/* Background image — hand-painted paper texture */}
        <img
          aria-hidden
          src={HERO_TEXTURE_IMG}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'saturate(0.85) brightness(1.02)' }}
        />
        {/* Warm gradient wash on top of texture to keep text legible */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(255, 247, 230, 0.55) 0%, rgba(255, 230, 200, 0.35) 60%, rgba(251, 243, 224, 0.85) 100%)',
          }}
        />

        <div className="relative px-4">
          {/* Passport card — passport-style layout with the user info */}
          <div
            className="relative overflow-hidden"
            style={{
              background: 'rgba(255, 252, 244, 0.92)',
              borderRadius: 18,
              border: '1px solid rgba(123, 63, 15, 0.18)',
              boxShadow:
                '0 12px 32px rgba(123, 63, 15, 0.12), ' +
                '0 2px 6px rgba(123, 63, 15, 0.06)',
              padding: 16,
            }}
          >
            {/* Decorative tape strip across the top */}
            <div
              className="absolute left-0 right-0 top-0 h-1.5"
              style={{
                background:
                  'repeating-linear-gradient(90deg, #D9631B 0 8px, #FF8C42 8px 16px, #FFD2A0 16px 24px)',
                opacity: 0.6,
              }}
            />

            <div className="flex items-center gap-3.5 pt-2">
              {/* Real photo avatar with brass ring */}
              <div className="relative shrink-0">
                <div
                  className="rounded-full p-[3px]"
                  style={{
                    background: 'linear-gradient(135deg, #FF8C42 0%, #D9631B 50%, #9B1C1C 100%)',
                    boxShadow: '0 4px 10px rgba(217, 99, 27, 0.3)',
                  }}
                >
                  <img
                    src={AVATAR_IMG}
                    alt="夏日探险家头像"
                    className="w-[64px] h-[64px] rounded-full object-cover block"
                    draggable={false}
                  />
                </div>
                {/* Online dot */}
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-[2px]"
                  style={{
                    background: 'linear-gradient(135deg, #4ADE80, #22C55E)',
                    borderColor: 'rgba(255, 252, 244, 1)',
                  }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-[18px] font-bold truncate" style={{ color: '#1F1827' }}>
                    夏日探险家
                  </h2>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Stamp color="#9B1C1C" rotate={-3}>LV.3</Stamp>
                  <Stamp color="#7B3F0F" rotate={2}>城市探索家</Stamp>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <img src={MEDAL_IMG} alt="" className="w-4 h-4 object-contain" aria-hidden />
                  <span className="text-[10px] font-semibold" style={{ color: '#7B3F0F' }}>
                    夏日勋章 · 收集 {allTasksCompleted ? '1' : '0'}/1
                  </span>
                </div>
              </div>
            </div>

            {/* XP progress — passport visa stamps */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className="text-[9px] font-bold"
                  style={{ color: '#7B3F0F', letterSpacing: 0.6 }}
                >
                  本月探索进度
                </span>
                <span className="text-[9px] font-semibold tabular-nums" style={{ color: '#D9631B' }}>
                  {Math.min(completedCount * 25, 100)} / 100
                </span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{
                  background: 'rgba(123, 63, 15, 0.1)',
                  boxShadow: 'inset 0 1px 2px rgba(123, 63, 15, 0.12)',
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(completedCount * 25, 100)}%` }}
                  transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{
                    background:
                      'linear-gradient(90deg, #FFD93D 0%, #FF8C42 50%, #D9631B 100%)',
                    boxShadow: '0 0 6px rgba(255, 140, 66, 0.5)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Stats bar — three "visa stamps" ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.4 }}
        className="px-4 -mt-9 relative z-10"
      >
        <div
          className="rounded-2xl flex items-stretch overflow-hidden"
          style={{
            background: '#FFFDF6',
            border: '1px solid rgba(123, 63, 15, 0.15)',
            boxShadow:
              '0 8px 20px rgba(123, 63, 15, 0.08), ' +
              '0 1px 3px rgba(123, 63, 15, 0.06)',
          }}
        >
          <StatCell label="参与活动" value="3" accent="#7B3F0F" />
          <StatDivider />
          <StatCell label="完成任务" value={String(completedCount)} accent="#D9631B" />
          <StatDivider />
          <StatCell label="体验卡片" value={allTasksCompleted ? '1' : '0'} accent="#9B1C1C" highlight />
        </div>
      </motion.div>

      {/* ── Activity history ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="px-4 mt-6"
      >
        <SectionTitle ink="探索足迹" en="FOOTPRINTS" />

        <div className="space-y-2.5">
          {activityHistory.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.06, duration: 0.32 }}
              className="relative overflow-hidden flex items-center gap-3 no-tap-highlight"
              style={{
                background: '#FFFDF6',
                borderRadius: 14,
                padding: '12px 14px 12px 18px',
                border: '1px solid rgba(123, 63, 15, 0.12)',
                boxShadow: '0 2px 6px rgba(123, 63, 15, 0.05)',
              }}
            >
              {/* Left accent ribbon */}
              <div
                className="absolute left-0 top-0 bottom-0"
                style={{
                  width: 4,
                  background:
                    i === 0
                      ? 'linear-gradient(180deg, #FF8C42 0%, #D9631B 100%)'
                      : 'linear-gradient(180deg, #2E6A41 0%, #1B4A2C 100%)',
                }}
              />
              {/* Date pill */}
              <div className="shrink-0 w-12 text-center">
                <p
                  className="text-[9px] font-bold"
                  style={{ color: '#9B1C1C', letterSpacing: 0.5 }}
                >
                  {item.date.split('.')[1]}月
                </p>
                <p
                  className="text-[20px] font-bold leading-none mt-0.5"
                  style={{ color: '#1F1827' }}
                >
                  {item.date.split('.')[2]}
                </p>
                <p className="text-[8px] mt-0.5" style={{ color: '#7B3F0F' }}>
                  {item.date.split('.')[0]}
                </p>
              </div>
              {/* Title + status */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold truncate" style={{ color: '#1F1827' }}>
                  {item.title}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: '#7B3F0F' }}>
                  {i === 0 ? '还在继续的探索' : item.status === '已完成' ? '已盖满印章 · 完美收官' : '已结束'}
                </p>
              </div>
              <span
                className="rounded-full px-2 py-0.5 text-[9px] font-bold"
                style={{
                  backgroundColor: item.statusBg,
                  color: item.statusColor,
                  border: `0.5px solid ${item.statusColor}30`,
                }}
              >
                {item.status}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Menu section ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4 }}
        className="px-4 mt-6 mb-6"
      >
        <SectionTitle ink="随身工具" en="TOOLS" />

        <div
          className="overflow-hidden"
          style={{
            background: '#FFFDF6',
            borderRadius: 16,
            border: '1px solid rgba(123, 63, 15, 0.12)',
            boxShadow: '0 4px 10px rgba(123, 63, 15, 0.05)',
          }}
        >
          {menuItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className="w-full flex items-center gap-3 px-3.5 py-3 no-tap-highlight transition-colors active:bg-[#FFF7E6] text-left"
            >
              <MenuGlyph name={item.icon} tint={item.tint} color={item.iconColor} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold" style={{ color: '#1F1827' }}>
                  {item.label}
                </p>
                <p className="text-[10px] mt-0.5 truncate" style={{ color: '#7B3F0F' }}>
                  {item.hint}
                </p>
              </div>
              {item.badge && (
                <span
                  className="rounded-full text-white text-[9px] font-bold px-1.5 py-0.5 min-w-[18px] text-center"
                  style={{
                    background: 'linear-gradient(135deg, #C1301E, #9B1C1C)',
                    boxShadow: '0 1px 3px rgba(155, 28, 28, 0.4)',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Footer signature */}
        <p
          className="text-center text-[9px] mt-5 tracking-[0.25em]"
          style={{ color: 'rgba(123, 63, 15, 0.5)' }}
        >
          柚見茶鋪 · 城市探索护照 · VOL.07
        </p>
      </motion.div>
    </motion.div>
  );
}

/* ── Section title with vintage ink bar + EN sublabel ── */

function SectionTitle({ ink, en }: { ink: string; en: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div
        className="w-[3px] h-4 rounded-full"
        style={{ background: 'linear-gradient(180deg, #FF8C42 0%, #D9631B 100%)' }}
      />
      <h3 className="text-[15px] font-bold" style={{ color: '#1F1827' }}>
        {ink}
      </h3>
      <span
        className="text-[8px] font-bold tracking-[0.3em] ml-1"
        style={{ color: 'rgba(123, 63, 15, 0.45)' }}
      >
        {en}
      </span>
    </div>
  );
}

function StatCell({ label, value, accent, highlight }: { label: string; value: string; accent: string; highlight?: boolean }) {
  return (
    <div
      className="flex-1 py-3 text-center relative"
      style={highlight ? { background: 'linear-gradient(180deg, rgba(255, 217, 61, 0.12) 0%, rgba(255, 140, 66, 0.06) 100%)' } : undefined}
    >
      <p
        className="text-[20px] font-bold leading-none"
        style={{ color: accent, fontFamily: 'Georgia, "Noto Serif SC", serif' }}
      >
        {value}
      </p>
      <p className="text-[10px] mt-1 font-medium" style={{ color: '#7B3F0F' }}>
        {label}
      </p>
    </div>
  );
}

function StatDivider() {
  return <div className="w-px self-stretch my-3" style={{ background: 'rgba(123, 63, 15, 0.12)' }} />;
}
