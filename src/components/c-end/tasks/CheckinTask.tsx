import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TaskHeader from './TaskHeader';
import type { TaskResult } from '../../../types';
interface Props {
  onComplete: (result: TaskResult) => void;
}

/* ── Brand palette for "柚见茶铺" ──
 * yuzu-rind:  warm orange-yellow of the peel, used for accents/CTA
 * matcha:     deep green of freshly brewed tea, used for status / "open"
 * cream:      warm off-white for surfaces, replaces the previous cold #FFF
 * ink-pith:   deep brown-black (like citrus pith shadow) for primary text
 * The pairing of orange + green is deliberately chosen — it's the visual
 * identity of "柚见": the rind of the fruit, paired with the leaf that
 * grew it. Every component in this file is built from these 4 colors. */
const BRAND = {
  yuzu: '#D97706',
  yuzuLight: '#FBBF24',
  matcha: '#3D6B3A',
  matchaLight: '#86A86B',
  cream: '#FFF8EE',
  creamDeep: '#FFE9C7',
  ink: '#2A1F0F',
  inkSoft: '#7A5C3E',
} as const;

export default function CheckinTask({ onComplete }: Props) {
  const [checked, setChecked] = useState(false);

  const handleCheckin = () => {
    if (checked) return;
    setChecked(true);
    setTimeout(() => {
      onComplete({
        type: 'checkin',
        checkinTime: new Date().toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
    }, 900);
  };

  return (
    <div
      className="flex flex-col h-full relative overflow-hidden"
      style={{
        // Cream-on-cream page background, no cold white. Two-layer
        // gradient: brighter top (where the brand badge sits) fading
        // into a deeper cream toward the bottom (where the CTA sits).
        background:
          `linear-gradient(180deg, ${BRAND.cream} 0%, ${BRAND.creamDeep} 100%)`,
      }}
    >
      {/* Background ornament: a faint yuzu-slice watermark anchored to
          the bottom-right. Visually reinforces the brand without
          competing for attention. Uses a real image (per the "no
          decorative SVG" rule), low opacity, large blur. */}
      <img
        aria-hidden
        src="/images/yuzu-slice.png"
        alt=""
        draggable={false}
        className="absolute pointer-events-none"
        style={{
          right: '-30%',
          bottom: '-20%',
          width: 260,
          height: 260,
          opacity: 0.10,
          filter: 'blur(2px)',
        }}
      />

      <div className="px-3 shrink-0">
        <TaskHeader type="checkin" />
      </div>

      {/* ── Store / status card ──
          Step card design (not the old "left photo + right text"
          layout, which made "营业中" wrap awkwardly on narrow
          screens). New structure: a full-width hero image with a
          2-row body, where row 1 holds the store name + status pill
          side-by-side (each in its own line) and row 2 holds a
          small matcha-tinted info strip. Result: nothing wraps,
          and the card has a clear visual hierarchy. */}
      <div className="px-3 mt-2 mb-2 shrink-0 relative z-10">
        <div
          className="rounded-2xl overflow-hidden shadow-card"
          style={{ background: '#FFFFFF' }}
        >
          {/* Hero photo strip with overlaid status pill. Slim and
              full-width so it reads as a "shop facade" even on
              narrow viewports. */}
          <div className="relative w-full" style={{ height: 64 }}>
            <img
              src="/images/tea-shop-scene.jpg"
              alt="柚见茶铺门店"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.55) 100%)',
              }}
            />
            {/* 营业中 pill — top-right, white frosted glass so it
                pops against the photo. Includes a tiny green pulse
                dot to signal "live". */}
            <span
              className="absolute top-1.5 right-1.5 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold tracking-wider"
              style={{
                background: 'rgba(255, 255, 255, 0.92)',
                color: BRAND.matcha,
                boxShadow: '0 1px 3px rgba(0,0,0,0.20)',
              }}
            >
              <span className="relative inline-flex">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: BRAND.matcha }}
                />
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `${BRAND.matcha}66`,
                    animation: 'checkin-pulse 1.6s ease-out infinite',
                  }}
                />
              </span>
              营业中
            </span>
            {/* 店长推荐 / 限定 tag — top-left, dark wooden sign so
                it ties to the TaskHeader wooden-sign language.
                Uses a real PNG of a wooden placard (no emoji). */}
            <span
              className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[9px] font-bold tracking-[0.04em]"
              style={{
                background: 'rgba(31, 16, 7, 0.86)',
                color: BRAND.cream,
                boxShadow: '0 1px 3px rgba(0,0,0,0.30)',
                backdropFilter: 'blur(2px)',
              }}
            >
              本季限定
            </span>
            {/* Photo credit: store name anchored to the bottom-left
                of the photo so the right text area below only has
                to carry "address + season", not the brand name. */}
            <div className="absolute bottom-1.5 left-2 right-2">
              <p
                className="text-[11.5px] font-extrabold tracking-wide truncate"
                style={{ color: '#FFFFFF', textShadow: '0 1px 2px rgba(0,0,0,0.45)' }}
              >
                柚见茶铺 · 星耀广场 1F
              </p>
            </div>
          </div>

          {/* Body: a single matcha-tinted info strip.
              No more flex wrapping; everything fits on one line. */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5"
            style={{ background: `${BRAND.matcha}0F` }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: BRAND.matcha }}
            />
            <p
              className="text-[10.5px] font-medium flex-1 min-w-0 truncate"
              style={{ color: BRAND.inkSoft }}
            >
              距你 · 0 m · 已在店
            </p>
            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider shrink-0"
              style={{ color: BRAND.yuzu }}
            >
              柚风冰摇
            </span>
          </div>
        </div>
      </div>

      {/* Keyframes for the 营业中 green pulse — kept inline so this
          component stays self-contained. */}
      <style>{`
        @keyframes checkin-pulse {
          0%   { transform: scale(1);   opacity: 0.7; }
          100% { transform: scale(2.4); opacity: 0;   }
        }
        /* Bell sway — the kind of idle micro-swing a real
           shop door-bell does when nobody touches it. */
        @keyframes bell-sway {
          0%, 100% { transform: rotate(-2deg); }
          50%      { transform: rotate(2deg);  }
        }
        /* Ringing sway — faster, larger arc, used the moment
           the bell is pressed (one-shot via state). */
        @keyframes bell-ring {
          0%   { transform: rotate(0deg);    }
          15%  { transform: rotate(-14deg);  }
          35%  { transform: rotate(12deg);   }
          55%  { transform: rotate(-8deg);   }
          75%  { transform: rotate(5deg);    }
          100% { transform: rotate(0deg);    }
        }
      `}</style>

      {/* ── Checkin button — SHOP DOOR BELL (来店鈴) ──
          A small wooden shop signboard with a hanging brass bell.
          Tap the bell to "ring yourself in" — when you press it
          the bell actually swings like a real one (a CSS keyframe
          bell-ring one-shot), the placard flips to matcha green
          with a stamped "已 抵 达" mark, and a soft chime ripple
          expands outward.

          Layout (vertical, all centered, 144 wide):
            ┌──────────────┐
            │              │
            │  ╭─bell──╮   │  ← 88×88 image, swings on CSS keyframes
            │  ╰───────╯   │     (idle: bell-sway 3.4s, tap: bell-ring 0.85s)
            │  ─placard──  │  ← the actual tappable target
            │   請 按 鈴   │     (covers the whole bottom block)
            │  柚 見 茶 鋪  │
            └──────────────┘

          The placard is the button — the bell is just visual eye
          candy above it. The bell image already contains its own
          brass hook + string, so we don't need to draw them. */}
      <div className="px-3 pb-3 shrink-0 flex items-center justify-center relative z-10 -mt-2">
        <div
          className="relative flex flex-col items-center gap-1.5"
          style={{ width: 128, height: 196 }}
        >
          {/* ── Chime ripple: a soft ring that expands once when
                the user presses the bell. Lives behind everything
                else, so it doesn't fight the placard. */}
          {checked && (
            <>
              <motion.span
                aria-hidden
                className="absolute rounded-full pointer-events-none z-0"
                style={{
                  top: 40,
                  left: '50%',
                  x: '-50%',
                  width: 60,
                  height: 60,
                  border: '1.5px solid rgba(61, 107, 58, 0.55)',
                }}
                initial={{ scale: 0.4, opacity: 0.8 }}
                animate={{ scale: 4.2, opacity: 0 }}
                transition={{ duration: 1.1, ease: 'easeOut' }}
              />
              <motion.span
                aria-hidden
                className="absolute rounded-full pointer-events-none z-0"
                style={{
                  top: 40,
                  left: '50%',
                  x: '-50%',
                  width: 60,
                  height: 60,
                  border: '1.5px solid rgba(61, 107, 58, 0.40)',
                }}
                initial={{ scale: 0.4, opacity: 0.6 }}
                animate={{ scale: 5.6, opacity: 0 }}
                transition={{ duration: 1.1, delay: 0.18, ease: 'easeOut' }}
              />
            </>
          )}

          {/* ── The bell itself — a single 3D-rendered PNG image
                (a brass shop door-bell hanging from its hook), per
                the project's "no decorative SVG / pure-CSS shapes
                for non-text UI" rule. The image already includes
                the hook and string, so we just place the image
                here and let it rock on a CSS keyframe (idle sway)
                or do a one-shot ring on press. */}
          <div
            aria-hidden
            className="relative z-10"
            style={{
              width: 88,
              height: 88,
              transformOrigin: '50% 8%',
              animation: checked
                ? 'bell-ring 0.85s ease-in-out 1'
                : 'bell-sway 3.4s ease-in-out infinite',
            }}
          >
            <img
              src="/images/checkin-bell.png"
              alt=""
              draggable={false}
              className="absolute inset-0 w-full h-full object-contain"
            />
          </div>

          {/* ── The actual button: a wooden signboard that flips
                between "請 按 鈴" and "已 抵 达". Uses flex column
                centering so text stays perfectly centered
                regardless of locale. */}
          <motion.button
            onClick={handleCheckin}
            disabled={checked}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={!checked ? { scale: 0.96, transition: { duration: 0.05 } } : undefined}
            transition={{ delay: 0.05, duration: 0.3, ease: 'easeOut' }}
            className="no-tap-highlight rounded-xl flex flex-col items-center justify-center gap-1"
            style={{
              width: 96,
              height: 88,
              padding: '0 8px',
              // Wood-grain gradient — vertical, with 3 darker
              // bands faking plank seams. Top-lit to match the
              // directional light on the bell.
              background:
                checked
                  ? // Matcha green (post-tap) — same vertical light, but cool.
                    'linear-gradient(180deg, #86A86B 0%, #5E8E50 50%, #3D6B3A 100%)'
                  : // Warm tea-wood (pre-tap)
                    'linear-gradient(180deg, #C49A6A 0%, #A87844 50%, #6B4A26 100%)',
              // Subtle plank seams — two thin darker lines at
              // 33% and 66% of the height, very low alpha.
              backgroundImage:
                checked
                  ? 'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.20) 100%)'
                  : 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.20) 100%)',
              boxShadow:
                '0 2px 0 rgba(0,0,0,0.18) inset, ' +
                '0 -2px 0 rgba(255,255,255,0.18) inset, ' +
                '0 6px 14px rgba(0,0,0,0.18), ' +
                '0 12px 28px rgba(0,0,0,0.10)',
              // Wood-grain texture overlay — 3 thin gradient bands
              // faking the grain of a tea-wood plank.
              borderRadius: 14,
              position: 'relative',
              overflow: 'hidden',
            }}
            aria-label={checked ? '已完成签到' : '按下铃铛完成签到'}
          >
            {/* Wood-grain overlay — three thin translucent bands
                across the width, simulating the soft grain of
                a tea-house sign. Uses mix-blend so it sits on
                top of the gradient without washing it out. */}
            {!checked && (
              <>
                <span
                  aria-hidden
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'repeating-linear-gradient(180deg, ' +
                      'rgba(0,0,0,0) 0px, rgba(0,0,0,0) 8px, ' +
                      'rgba(60,30,10,0.08) 9px, rgba(0,0,0,0) 10px)',
                    mixBlendMode: 'multiply',
                  }}
                />
                {/* Hanging nails — two tiny brass dots on the top
                    edge, where the sign would be screwed to a
                    door frame. Pure detail. */}
                <span
                  aria-hidden
                  className="absolute"
                  style={{
                    top: 4,
                    left: 12,
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background:
                      'radial-gradient(circle at 35% 30%, #FFE9A8 0%, #C9932B 70%, #6B4A14 100%)',
                    boxShadow: '0 1px 1px rgba(0,0,0,0.3)',
                  }}
                />
                <span
                  aria-hidden
                  className="absolute"
                  style={{
                    top: 4,
                    right: 12,
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background:
                      'radial-gradient(circle at 35% 30%, #FFE9A8 0%, #C9932B 70%, #6B4A14 100%)',
                    boxShadow: '0 1px 1px rgba(0,0,0,0.3)',
                  }}
                />
              </>
            )}

            {/* Engraved copy — main kanji, large. */}
            <AnimatePresence mode="wait" initial={false}>
              {!checked ? (
                <motion.span
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="relative text-center font-black tracking-[0.32em] pointer-events-none"
                  style={{
                    color: 'rgba(255, 246, 226, 0.96)',
                    fontFamily: '"Noto Serif SC", "Songti SC", "STSong", serif',
                    fontSize: 18,
                    lineHeight: 1.2,
                    textShadow:
                      '0 1px 0 rgba(0,0,0,0.35), ' +
                      '0 2px 3px rgba(0,0,0,0.25)',
                  }}
                >
                  請 按 鈴
                </motion.span>
              ) : (
                <motion.span
                  key="done"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 16 }}
                  className="relative text-center font-black tracking-[0.24em] pointer-events-none"
                  style={{
                    color: 'rgba(255, 255, 255, 0.98)',
                    fontFamily: '"Noto Serif SC", "Songti SC", "STSong", serif',
                    fontSize: 18,
                    lineHeight: 1.2,
                    textShadow: '0 1px 0 rgba(0,0,0,0.30)',
                  }}
                >
                  已 抵 达
                </motion.span>
              )}
            </AnimatePresence>

            {/* Brand mark — small, at the bottom of the sign. */}
            <AnimatePresence mode="wait" initial={false}>
              {!checked ? (
                <motion.span
                  key="brand-idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="relative text-center pointer-events-none"
                  style={{
                    color: 'rgba(255, 246, 226, 0.78)',
                    fontFamily: '"Noto Serif SC", "Songti SC", "STSong", serif',
                    fontSize: 10,
                    letterSpacing: '0.42em',
                    textShadow: '0 1px 0 rgba(0,0,0,0.30)',
                  }}
                >
                  柚見茶鋪
                </motion.span>
              ) : (
                <motion.span
                  key="brand-done"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.2 }}
                  className="relative text-center pointer-events-none"
                  style={{
                    color: 'rgba(255, 255, 255, 0.85)',
                    fontFamily: '"Noto Serif SC", "Songti SC", "STSong", serif',
                    fontSize: 10,
                    letterSpacing: '0.42em',
                    textShadow: '0 1px 0 rgba(0,0,0,0.30)',
                  }}
                >
                  欢迎光临
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
