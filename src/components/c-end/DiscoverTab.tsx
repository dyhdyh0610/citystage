import { useState } from 'react';
import { motion } from 'framer-motion';
import { discoverActivities } from '../../data/defaults';
/* ── Inline SVG Icons ── */

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="11" cy="11" r="7" stroke="#9CA3AF" strokeWidth="2" />
      <path d="M20 20L16.5 16.5" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
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

function CalendarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="#6B7280" strokeWidth="2" />
      <path d="M3 9H21M8 3V7M16 3V7" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const filters = ['全部', '节日', '校园', '艺术', '美食', '运动'];

const statusBadgeMap: Record<string, { bg: string; text: string }> = {
  '即将开始': { bg: '#F5F3FF', text: '#8A65FF' },
  '进行中': { bg: '#FFF7ED', text: '#FF8C42' },
  '已结束': { bg: '#F5F5F5', text: '#737373' },
};

const gradientMap: Record<string, string> = {
  d1: 'linear-gradient(135deg, #FF8C42 0%, #FFD93D 100%)',
  d2: 'linear-gradient(135deg, #4ECDC4 0%, #5DADE2 100%)',
  d3: 'linear-gradient(135deg, #9B5DE5 0%, #B388FF 100%)',
};

const brandDotColors = ['#FF8C42', '#8A65FF', '#4ECDC4', '#FFD93D', '#FF5C8A', '#5DADE2', '#22C55E', '#9B5DE5'];

export default function DiscoverTab() {
  const [activeFilter, setActiveFilter] = useState('全部');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="h-full overflow-y-auto scrollbar-hide bg-main relative"
    >
      {/* ── Page Title ── */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="px-4 pt-4 pb-3"
      >
        <h1 className="text-xl font-bold text-ink-primary">发现</h1>
      </motion.div>

      {/* ── Search Bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="px-4 mb-3"
      >
        <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2.5 shadow-card">
          <SearchIcon />
          <input
            type="text"
            placeholder="搜索活动、品牌、地点"
            className="flex-1 bg-transparent text-sm text-ink-body placeholder:text-ink-secondary outline-none no-tap-highlight"
          />
        </div>
      </motion.div>

      {/* ── Filter Pills ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="mb-3"
      >
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-1">
          {filters.map((filter) => {
            const active = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium no-tap-highlight transition-all whitespace-nowrap ${
                  active
                    ? 'text-white shadow-primary'
                    : 'bg-white text-ink-secondary shadow-card'
                }`}
                style={active ? { background: 'linear-gradient(135deg, #8A65FF 0%, #7C3AED 100%)' } : {}}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ── Activity Cards ── */}
      <div className="px-4 pb-4 space-y-3">
        {discoverActivities.map((activity, index) => {
          const badge = statusBadgeMap[activity.status] || statusBadgeMap['已结束'];
          const gradient = gradientMap[activity.id] || activity.gradient;

          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 + index * 0.1 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white rounded-lg overflow-hidden shadow-card no-tap-highlight"
            >
              {/* Hero image area */}
              <div className="relative h-[140px] overflow-hidden">
                {/* Hero artwork — a real AI-generated photo keyed off
                    the activity id. Replaces the previous gradient +
                    emoji placeholder with imagery that matches each
                    activity's actual subject matter. Falls back to
                    the original gradient if a hero image hasn't been
                    generated yet for a given id. */}
                {(() => {
                  const heroById: Record<string, string | undefined> = {
                    d1: '/images/discover-d1.jpg',
                    d2: '/images/discover-d2.jpg',
                    d3: '/images/discover-d3.jpg',
                  };
                  const heroSrc = heroById[activity.id];
                  if (heroSrc) {
                    return (
                      <img
                        src={heroSrc}
                        alt={activity.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    );
                  }
                  return (
                    <div
                      className="absolute inset-0"
                      style={{ background: gradient }}
                    />
                  );
                })()}
                {/* Subtle bottom darkening so the activity title
                    below the hero reads clearly, and the status
                    pill in the top-right doesn't fight the image. */}
                <div
                  aria-hidden
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(0,0,0,0.20) 100%)',
                  }}
                />
                {/* Status badge top-right */}
                <div
                  className="absolute top-3 right-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold backdrop-blur"
                  style={{ backgroundColor: badge.bg, color: badge.text }}
                >
                  {activity.status}
                </div>
              </div>

              {/* Card body */}
              <div className="p-4">
                {/* Brand dots row */}
                <div className="flex items-center gap-1.5 mb-2">
                  {Array.from({ length: Math.min(activity.brandCount, 5) }).map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: brandDotColors[i % brandDotColors.length] }}
                    />
                  ))}
                  <span className="text-[10px] text-ink-secondary ml-1">{activity.brandCount} 个品牌</span>
                </div>

                {/* Title */}
                <h3 className="text-base font-semibold text-ink-primary">{activity.name}</h3>

                {/* Location */}
                <div className="flex items-center gap-1 mt-1">
                  <PinIcon />
                  <span className="text-xs text-ink-secondary">{activity.location}</span>
                </div>

                {/* Date */}
                <div className="flex items-center gap-1 mt-1">
                  <CalendarIcon />
                  <span className="text-xs text-ink-secondary">周末 · 全天</span>
                </div>

                {/* Description */}
                <p className="text-sm text-ink-body mt-2 leading-relaxed">
                  探索{activity.location}的精彩活动，参与互动体验，收集专属印记。
                </p>

                {/* Implication tag */}
                <div className="mt-3">
                  <span className="inline-block rounded-full px-3 py-1 text-[10px] font-medium" style={{ backgroundColor: '#F5F3FF', color: '#8A65FF' }}>
                    {activity.hint}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
