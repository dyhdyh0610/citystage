import { motion } from 'framer-motion';
import type { TaskType } from '../../../types';
import { useApp } from '../../../context/AppContext';

interface Props {
  type: TaskType;
  // Optional override for the hero photo. Defaults to a per-type image
  // (e.g. photo tasks use the still-life pin) so the organizer can
  // leave it unset and still get a coherent look.
  heroSrc?: string;
  // Optional override for the brand badge label (defaults to
  // the type name from the task meta). Mostly used for the localized
  // "柚见茶铺" subline.
  brandLabel?: string;
}

/* ── Per-type visual language ──
 * Each task type gets a unique combination of:
 *   - a 3-color gradient (background → mid → accent)
 *   - a 1-line subtitle in the brand voice
 *   - a small decorative element (emoji / 文字) that matches the
 *     activity ("闻见茶香", "拍一张", "找一找", "说一说", "画一画")
 * The goal is that the user can read five title bars in a row and
 * immediately tell which task is which, without needing to read
 * the type label.
 *
 * Colors are intentionally close to the "柚见茶铺" brand palette
 * (yuzu / matcha / cream) so the whole 5-step journey feels like
 * one tasting menu, not five unrelated screens. */
const TYPE_VISUAL: Record<
  TaskType,
  {
    gradient: string;
    sub: string;
    // Per-type large decorative image rendered on the right side
    // of the header body. Real PNG (no emoji) so the visual
    // quality matches the rest of the brand.
    glyph: string;
    glyphAlt: string;
    // The "step N of 5" pill on the badge.
    step: number;
  }
> = {
  checkin: {
    gradient: 'linear-gradient(135deg, #FFE9C7 0%, #FFD8A8 100%)',
    sub: '闻见茶香了吗?轻按一下',
    glyph: '/images/glyph-checkin.png',
    glyphAlt: '茶具',
    step: 1,
  },
  photo: {
    gradient: 'linear-gradient(135deg, #FFE0C2 0%, #FFB97A 100%)',
    sub: '定格这一杯,把夏天带回家',
    glyph: '/images/glyph-photo.png',
    glyphAlt: '拍立得相机',
    step: 2,
  },
  findObject: {
    gradient: 'linear-gradient(135deg, #D8F3E1 0%, #A9D8B6 100%)',
    sub: '睁大眼睛,小柚子藏在店里',
    glyph: '/images/glyph-find.png',
    glyphAlt: '放大镜',
    step: 3,
  },
  message: {
    gradient: 'linear-gradient(135deg, #FFF1B8 0%, #FFE28A 100%)',
    sub: '写一句想说的,会有人认真听',
    glyph: '/images/glyph-message.png',
    glyphAlt: '信件与火漆',
    step: 4,
  },
  drawing: {
    gradient: 'linear-gradient(135deg, #F7DDEC 0%, #F2B6D5 100%)',
    sub: '随手涂一笔,留下你的柚子',
    glyph: '/images/glyph-drawing.png',
    glyphAlt: '调色板与画笔',
    step: 5,
  },
};

// Default hero image per task type. Chosen to be a real photo
// (no SVG) that visually fits the activity.
const DEFAULT_HERO: Record<TaskType, string> = {
  checkin: '/images/tea-shop-scene.jpg',
  photo: '/images/youjian-pin.jpg',
  findObject: '/images/tea-shop-scene.jpg',
  message: '/images/youjian-pin.jpg',
  drawing: '/images/tea-shop-scene.jpg',
};

const TYPE_NAME: Record<TaskType, string> = {
  checkin: '定位打卡',
  photo: '拍照任务',
  findObject: '寻找物体',
  message: '留言共创',
  drawing: '画图绘图',
};

/* ── TaskHeader ──
 * A horizontally-arranged hero that replaces the previous
 * "left photo + right title" white card. The new design has:
 *   - a 56-px-tall hero strip with a real photo and a dark
 *     "step N · 柚见茶铺" wooden sign
 *   - a body with a per-task-type gradient, a Chinese type name
 *     in serif (the "ink" of the page), a brand-tinted subtitle,
 *     and a large decorative glyph on the right
 *
 * Why a two-row layout (hero + body) instead of side-by-side:
 *   - the hero photo is only 56px tall, so it doesn't compete
 *     with the task body below for vertical space
 *   - the gradient body gives the page a soft warm anchor at
 *     the top, which is what the user sees first
 */
export default function TaskHeader({ type, heroSrc, brandLabel = '柚见茶铺' }: Props) {
  const { currentTask } = useApp();
  const v = TYPE_VISUAL[type];
  const hero = heroSrc ?? DEFAULT_HERO[type];
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl overflow-hidden shadow-card mb-2.5 shrink-0"
    >
      {/* ── Hero strip (real photo, narrow) ── */}
      <div className="relative w-full" style={{ height: 56 }}>
        <img
          src={hero}
          alt={TYPE_NAME[type]}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
        {/* Subtle bottom-to-top dark gradient so the wooden sign
            stays legible regardless of photo brightness. */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.45) 100%)',
          }}
        />
        {/* Wooden-sign pill: "STEP N · 柚见茶铺" */}
        <div
          className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5"
          style={{
            background: 'rgba(31, 16, 7, 0.86)',
            color: '#FFF8EE',
            boxShadow: '0 1px 3px rgba(0,0,0,0.30)',
            backdropFilter: 'blur(2px)',
          }}
        >
          <span
            className="text-[8px] font-black tracking-[0.18em] uppercase"
            style={{ color: '#FBBF24' }}
          >
            STEP {v.step}
          </span>
          <span className="text-[9px] font-bold tracking-[0.04em]">
            · {brandLabel}
          </span>
        </div>
      </div>

      {/* ── Body: per-type gradient + title row ── */}
      <div
        className="relative px-3.5 py-2.5 flex items-center gap-3"
        style={{ background: v.gradient }}
      >
        {/* Type label — Chinese in serif, the "ink" of the page. */}
        <div className="flex-1 min-w-0">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{ color: '#9A3412' }}
          >
            · {TYPE_NAME[type]} ·
          </p>
          <h3
            className="font-bold text-[15px] leading-snug mt-0.5 truncate"
            style={{
              color: '#2A1F0F',
              fontFamily: '"Noto Serif SC", "Songti SC", "STSong", serif',
            }}
          >
            {currentTask?.description ?? ''}
          </h3>
          <p
            className="text-[11px] font-medium mt-0.5"
            style={{ color: '#7A5C3E' }}
          >
            {v.sub}
          </p>
        </div>
        {/* Large decorative image on the right — a real PNG
            (vintage teacup / camera / magnifier / envelope /
            palette) so the visual quality matches the rest of
            the brand. Sized large but with a soft drop shadow,
            slightly rotated to feel like a hand-placed sticker. */}
        <img
          aria-hidden
          src={v.glyph}
          alt={v.glyphAlt}
          draggable={false}
          className="shrink-0 select-none"
          style={{
            width: 56,
            height: 56,
            objectFit: 'contain',
            filter: 'drop-shadow(0 3px 6px rgba(122, 92, 62, 0.22))',
            transform: 'rotate(-6deg)',
          }}
        />
      </div>
    </motion.div>
  );
}
