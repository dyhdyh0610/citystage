import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Icon } from "../Icon";
import {
  mallLocations,
  timeOptions,
  audienceOptions,
  ALL_TASK_TYPES,
  TASK_TYPE_META,
} from '../../data/defaults';
import type { TaskType } from '../../types';

/* ── Real-image task type icons (replacing emoji) ── */

const TASK_TYPE_IMAGES: Record<TaskType, string> = {
  checkin: '/images/tea-1.jpg',
  photo: '/images/tea-shop-scene.jpg',
  findObject: '/images/tea-shop-scene.jpg',
  message: '/images/tea-3.jpg',
  drawing: '/images/experience-card-hero.jpg',
};

/* ── Compact UI Icons (small, used inside inputs).
 *
 * All icons are rendered via the shared PNG-based <Icon /> component
 * (no SVG, no emoji) so the B-end stays consistent with the C-end
 * and looks professional. The `size` and `color` props keep the
 * original API surface so call sites don't have to change. */

function ChevronLeftIcon({ size = 22, color = '#1F1827' }: { size?: number; color?: string }) {
  return <Icon name="chevron-left" size={size} color={color} decorative />;
}

function SparkleIcon({ size = 14, color = '#8A65FF' }: { size?: number; color?: string }) {
  return <Icon name="sparkle" size={size} color={color} decorative />;
}

function PinIcon({ size = 16, color = '#8A65FF' }: { size?: number; color?: string }) {
  return <Icon name="pin" size={size} color={color} decorative />;
}

function ClockIcon({ size = 16, color = '#8A65FF' }: { size?: number; color?: string }) {
  return <Icon name="clock" size={size} color={color} decorative />;
}

function UsersIcon({ size = 16, color = '#8A65FF' }: { size?: number; color?: string }) {
  return <Icon name="users" size={size} color={color} decorative />;
}

function TagIcon({ size = 16, color = '#8A65FF' }: { size?: number; color?: string }) {
  return <Icon name="tag" size={size} color={color} decorative />;
}

function CheckIcon({ size = 12 }: { size?: number }) {
  return <Icon name="check" size={size} color="#FFFFFF" decorative />;
}

function ChevronDownIcon({ size = 16, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return <Icon name="chevron-down" size={size} color={color} decorative />;
}

function ArrowRightIcon({ size = 18 }: { size?: number }) {
  return <Icon name="arrow-right" size={size} color="#1F1827" decorative />;
}

/* ── Floating Label Input ── */

interface FloatingInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  optional?: boolean;
  type?: 'text';
  icon?: React.ReactNode;
  maxLength?: number;
}

function FloatingInput({ label, value, onChange, placeholder, required, optional, icon, maxLength }: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const hasValue = value.length > 0;
  const lifted = focused || hasValue;

  return (
    <div className="relative">
      <div
        className="relative rounded-2xl border bg-white transition-all"
        style={{
          borderColor: focused ? '#8A65FF' : 'rgba(31, 24, 39, 0.08)',
          boxShadow: focused ? '0 0 0 4px rgba(138, 101, 255, 0.12)' : '0 1px 2px rgba(31, 24, 39, 0.04)',
          background: focused ? '#FDFCFF' : 'white',
        }}
      >
        {icon && (
          <div
            className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-opacity"
            style={{ opacity: lifted ? 1 : 0.55 }}
          >
            {icon}
          </div>
        )}
        <input
          type="text"
          value={value}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={lifted ? placeholder : ''}
          className="w-full h-14 bg-transparent outline-none text-[15px] text-ink-primary placeholder:text-ink-disabled no-tap-highlight"
          style={{ paddingLeft: icon ? 44 : 16, paddingRight: 16, paddingTop: lifted ? 18 : 0 }}
        />
        <label
          className="absolute pointer-events-none transition-all"
          style={{
            left: icon ? 44 : 16,
            top: lifted ? 10 : '50%',
            transform: lifted ? 'none' : 'translateY(-50%)',
            fontSize: lifted ? 11 : 15,
            fontWeight: lifted ? 600 : 500,
            color: focused ? '#8A65FF' : '#6B7280',
            letterSpacing: lifted ? 0.2 : 0,
          }}
        >
          {label}
          {required && <span style={{ color: '#FF8C42', marginLeft: 2 }}>*</span>}
          {optional && (
            <span
              style={{
                marginLeft: 6,
                fontSize: 10,
                color: '#9CA3AF',
                fontWeight: 400,
                background: '#F3F4F6',
                padding: '1px 6px',
                borderRadius: 4,
              }}
            >
              选填
            </span>
          )}
        </label>
        {maxLength && lifted && (
          <span
            className="absolute right-3.5 top-2.5 text-[10px] font-medium"
            style={{ color: value.length > maxLength * 0.8 ? '#FF8C42' : '#9CA3AF' }}
          >
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Pill Selector (for location, time) ── */

interface PillSelectorProps {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  required?: boolean;
  icon?: React.ReactNode;
}

function PillSelector({ label, value, options, onChange, required, icon }: PillSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full h-14 rounded-2xl border bg-white text-left transition-all flex items-center no-tap-highlight"
        style={{
          borderColor: open ? '#8A65FF' : 'rgba(31, 24, 39, 0.08)',
          boxShadow: open ? '0 0 0 4px rgba(138, 101, 255, 0.12)' : '0 1px 2px rgba(31, 24, 39, 0.04)',
          background: open ? '#FDFCFF' : 'white',
        }}
      >
        {icon && <div className="pl-3.5 pr-1">{icon}</div>}
        <div className="flex-1 px-3.5">
          <p className="text-[10px] font-semibold mb-0.5" style={{ color: open ? '#8A65FF' : '#9CA3AF' }}>
            {label}
            {required && <span style={{ color: '#FF8C42', marginLeft: 2 }}>*</span>}
          </p>
          <p className="text-[14px] font-medium text-ink-primary leading-tight truncate">
            {value || <span className="text-ink-disabled">请选择</span>}
          </p>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="pr-3.5">
          <ChevronDownIcon />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 rounded-2xl bg-white p-1.5"
            style={{
              boxShadow: '0 12px 32px rgba(31, 24, 39, 0.12), 0 0 0 1px rgba(31, 24, 39, 0.04)',
            }}
          >
            {options.map((opt) => {
              const selected = value === opt;
              return (
                <button
                  key={opt}
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className="w-full h-11 px-3.5 rounded-xl flex items-center justify-between text-left text-[14px] font-medium no-tap-highlight transition-colors"
                  style={{
                    background: selected ? 'linear-gradient(135deg, rgba(138, 101, 255, 0.08), rgba(255, 140, 66, 0.05))' : 'transparent',
                    color: selected ? '#8A65FF' : '#1F1827',
                  }}
                >
                  <span className="flex items-center gap-2">
                    {selected && (
                      <span className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8A65FF, #FF8C42)' }}>
                        <CheckIcon size={9} />
                      </span>
                    )}
                    {opt}
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Task type pill (chip with image) ── */

interface TaskTypeCardProps {
  type: TaskType;
  selected: boolean;
  onClick: () => void;
}

function TaskTypeCard({ type, selected, onClick }: TaskTypeCardProps) {
  const meta = TASK_TYPE_META[type];
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="relative shrink-0 w-[112px] rounded-2xl overflow-hidden text-left no-tap-highlight"
      style={{
        background: selected ? 'linear-gradient(135deg, #8A65FF 0%, #7C3AED 100%)' : 'white',
        boxShadow: selected
          ? '0 8px 20px rgba(138, 101, 255, 0.35), 0 0 0 2px rgba(138, 101, 255, 0.15)'
          : '0 2px 8px rgba(31, 24, 39, 0.06), 0 0 0 1px rgba(31, 24, 39, 0.05)',
      }}
    >
      {/* Image header */}
      <div className="relative h-[72px] overflow-hidden">
        <img
          src={TASK_TYPE_IMAGES[type]}
          alt={meta.label}
          className="w-full h-full object-cover"
          style={{
            filter: selected ? 'saturate(1.15) brightness(0.85)' : 'saturate(0.85) brightness(0.95)',
            transition: 'filter 0.3s',
          }}
        />
        {/* Gradient overlay for legibility */}
        <div
          className="absolute inset-0"
          style={{
            background: selected
              ? 'linear-gradient(180deg, rgba(138, 101, 255, 0.15) 0%, rgba(124, 58, 237, 0.6) 100%)'
              : 'linear-gradient(180deg, rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, 0.6) 100%)',
          }}
        />
        {/* Check badge */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
              className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #FF8C42 0%, #FF6A00 100%)',
                boxShadow: '0 2px 6px rgba(255, 140, 66, 0.5)',
              }}
            >
              <CheckIcon size={10} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Label */}
      <div className="px-2.5 py-2">
        <p
          className="text-[13px] font-bold leading-tight"
          style={{ color: selected ? 'white' : '#1F1827' }}
        >
          {meta.label}
        </p>
        <p
          className="text-[10px] mt-0.5 truncate"
          style={{ color: selected ? 'rgba(255, 255, 255, 0.75)' : '#9CA3AF' }}
        >
          {type === 'checkin' && '到点打卡'}
          {type === 'photo' && '记录瞬间'}
          {type === 'findObject' && '探索发现'}
          {type === 'message' && '互动共创'}
          {type === 'drawing' && '创意绘制'}
        </p>
      </div>
    </motion.button>
  );
}

/* ── Audience chip (multi-select) ── */

interface AudienceChipProps {
  option: string;
  selected: boolean;
  onClick: () => void;
}

function AudienceChip({ option, selected, onClick }: AudienceChipProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className="h-9 px-4 rounded-full text-[13px] font-medium flex items-center gap-1.5 no-tap-highlight transition-all"
      style={{
        background: selected ? 'linear-gradient(135deg, #FF8C42 0%, #FF9347 100%)' : 'white',
        color: selected ? 'white' : '#374151',
        boxShadow: selected
          ? '0 4px 12px rgba(255, 140, 66, 0.32), 0 0 0 1px rgba(255, 140, 66, 0.2)'
          : '0 0 0 1px rgba(31, 24, 39, 0.08)',
      }}
    >
      {selected && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-1.5 h-1.5 rounded-full bg-white"
        />
      )}
      {option}
    </motion.button>
  );
}

/* ── Main component ── */

export default function BEndConfig() {
  const { state, setPhase, updateActivityConfig, setGuidanceStep } = useApp();
  const config = state.activityConfig;

  /**
   * Hero progress: % of basic-info fields the user has filled out.
   * Counts: name, location, time, audience (any), taskTypes (any).
   * Each worth 20%. Clamped 0–100.
   */
  const completionPct = Math.min(
    100,
    (config.name.trim() ? 20 : 0) +
      (config.location ? 20 : 0) +
      (config.time ? 20 : 0) +
      (config.audience.length > 0 ? 20 : 0) +
      (config.taskTypes.length > 0 ? 20 : 0),
  );

  const toggleTaskType = (type: TaskType) => {
    const current = config.taskTypes;
    if (current.includes(type)) {
      updateActivityConfig({ taskTypes: current.filter((t) => t !== type) });
    } else {
      updateActivityConfig({ taskTypes: [...current, type] });
    }
  };

  const toggleAudience = (a: string) => {
    const current = config.audience;
    if (current.includes(a)) {
      updateActivityConfig({ audience: current.filter((x) => x !== a) });
    } else {
      updateActivityConfig({ audience: [...current, a] });
    }
  };

  const canProceed = config.name.trim().length > 0 && config.taskTypes.length > 0;

  const handleNext = () => {
    if (!canProceed) return;
    setGuidanceStep(4);
    setPhase('b-orchestrate');
  };

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
            src="/images/basic-info-hero.jpg"
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
              onClick={() => setPhase('c-app')}
              className="w-9 h-9 rounded-full flex items-center justify-center no-tap-highlight transition-colors"
              style={{
                background: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(8px)',
                color: '#1F1827',
              }}
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
                1 / 3
              </span>
            </div>
          </div>

          {/* Title + subtitle + progress */}
          <div className="relative z-10 px-4 mt-1.5 text-white">
            <h1 className="text-[19px] font-bold leading-tight" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.18)' }}>
              活动基础信息
            </h1>
            <p className="text-[11px] mt-0.5 opacity-90" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.18)' }}>
              填写活动核心信息，AI 将智能推荐玩法
            </p>

            {/* Progress bar */}
            <div className="mt-2 flex items-center gap-2.5">
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.25)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #FF8C42 0%, #FFB066 100%)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(completionPct, 8)}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>
              <span className="text-[10.5px] font-semibold tabular-nums" style={{ minWidth: 32 }}>
                {completionPct}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Form body (scrollable) ── */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="px-4 pt-1 pb-32 space-y-5">
          {/* Section: 核心信息 */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-3xl p-4 space-y-3.5"
            style={{ boxShadow: '0 4px 16px rgba(31, 24, 39, 0.05), 0 0 0 1px rgba(31, 24, 39, 0.04)' }}
          >
            <div className="flex items-center gap-2 pb-1">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #8A65FF 0%, #7C3AED 100%)' }}
              >
                <TagIcon size={13} color="white" />
              </div>
              <h2 className="text-[14px] font-bold text-ink-primary">核心信息</h2>
              <span
                className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded"
                style={{ background: '#FFF7ED', color: '#FF8C42' }}
              >
                必填
              </span>
            </div>

            <FloatingInput
              label="活动名称"
              value={config.name}
              onChange={(v) => {
                updateActivityConfig({ name: v });
              }}
              placeholder="如：夏日新品探鲜季"
              required
              icon={<TagIcon size={16} color={config.name ? '#8A65FF' : '#9CA3AF'} />}
              maxLength={20}
            />

            <FloatingInput
              label="品牌名"
              value={config.brandName}
              onChange={(v) => updateActivityConfig({ brandName: v })}
              placeholder="如：柚见茶铺"
              optional
              icon={<SparkleIcon size={15} color={config.brandName ? '#8A65FF' : '#9CA3AF'} />}
              maxLength={12}
            />
          </motion.section>

          {/* Section: 场景设置 */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-4 space-y-3.5"
            style={{ boxShadow: '0 4px 16px rgba(31, 24, 39, 0.05), 0 0 0 1px rgba(31, 24, 39, 0.04)' }}
          >
            <div className="flex items-center gap-2 pb-1">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #FF8C42 0%, #FF6A00 100%)' }}
              >
                <PinIcon size={13} color="white" />
              </div>
              <h2 className="text-[14px] font-bold text-ink-primary">场景设置</h2>
            </div>

            <PillSelector
              label="活动地点"
              value={config.location}
              options={mallLocations}
              onChange={(v) => updateActivityConfig({ location: v })}
              required
              icon={<PinIcon size={16} color={config.location ? '#8A65FF' : '#9CA3AF'} />}
            />

            <PillSelector
              label="活动时间"
              value={config.time}
              options={timeOptions}
              onChange={(v) => updateActivityConfig({ time: v })}
              required
              icon={<ClockIcon size={16} color={config.time ? '#8A65FF' : '#9CA3AF'} />}
            />
          </motion.section>

          {/* Section: 目标人群 */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-3xl p-4 space-y-3"
            style={{ boxShadow: '0 4px 16px rgba(31, 24, 39, 0.05), 0 0 0 1px rgba(31, 24, 39, 0.04)' }}
          >
            <div className="flex items-center gap-2 pb-1">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #8A65FF 0%, #FF8C42 100%)' }}
              >
                <UsersIcon size={13} color="white" />
              </div>
              <h2 className="text-[14px] font-bold text-ink-primary">目标人群</h2>
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded ml-1"
                style={{ background: '#F3F4F6', color: '#6B7280' }}
              >
                选填
              </span>
              {config.audience.length > 0 && (
                <span
                  className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: '#F5F3FF', color: '#8A65FF' }}
                >
                  已选 {config.audience.length}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {audienceOptions.map((a) => (
                <AudienceChip
                  key={a}
                  option={a}
                  selected={config.audience.includes(a)}
                  onClick={() => toggleAudience(a)}
                />
              ))}
            </div>
          </motion.section>

          {/* Section: 任务类型 (horizontal cards) */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl p-4 space-y-3"
            style={{ boxShadow: '0 4px 16px rgba(31, 24, 39, 0.05), 0 0 0 1px rgba(31, 24, 39, 0.04)' }}
          >
            <div className="flex items-center gap-2 pb-1">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #FF8C42 100%)' }}
              >
                <SparkleIcon size={12} color="white" />
              </div>
              <h2 className="text-[14px] font-bold text-ink-primary whitespace-nowrap">任务类型</h2>
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded ml-1 whitespace-nowrap"
                style={{ background: '#FFF7ED', color: '#FF8C42' }}
              >
                必填 · 多选
              </span>
            </div>

            {/* Horizontal scrollable card list */}
            <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
              <div className="flex gap-2.5 pb-1">
                {ALL_TASK_TYPES.map((type) => (
                  <TaskTypeCard
                    key={type}
                    type={type}
                    selected={config.taskTypes.includes(type)}
                    onClick={() => toggleTaskType(type)}
                  />
                ))}
              </div>
            </div>
          </motion.section>
        </div>
      </div>

      {/* ── Sticky bottom CTA ── */}
      <div
        className="absolute left-0 right-0 px-4 pt-3 z-20"
        style={{
          bottom: '4%',
          paddingBottom: 8,
          background: 'linear-gradient(180deg, rgba(248, 247, 252, 0) 0%, rgba(248, 247, 252, 0.95) 30%, #F8F7FC 100%)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <motion.button
          whileHover={canProceed ? { y: -1 } : {}}
          whileTap={canProceed ? { scale: 0.98 } : {}}
          onClick={handleNext}
          disabled={!canProceed}
          className="w-full rounded-2xl font-bold text-[15px] no-tap-highlight transition-all flex items-center justify-center gap-2"
          style={{
            height: 52,
            background: canProceed
              ? 'linear-gradient(135deg, #8A65FF 0%, #7C3AED 50%, #FF8C42 100%)'
              : '#E5E7EB',
            color: canProceed ? 'white' : '#9CA3AF',
            boxShadow: canProceed
              ? '0 8px 24px rgba(138, 101, 255, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
              : 'none',
            cursor: canProceed ? 'pointer' : 'not-allowed',
          }}
        >
          <span>下一步 · AI 编排任务</span>
          <ArrowRightIcon size={18} />
        </motion.button>
      </div>
    </motion.div>
  );
}
