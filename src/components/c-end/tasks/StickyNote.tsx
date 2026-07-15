/* Shared sticky-note used by both the message task wall and
 * the experience-card preview. Keeping a single source of
 * truth for the note's visual language means the "what the
 * user just authored" snapshot in the experience card
 * matches the wall they typed on.
 *
 * Variants:
 *  - peach    → user's own note (warmest, the hero of the wall)
 *  - mint     → ambient "fresh" note
 *  - lavender → ambient "soft" note
 *  - butter   → ambient "warm" note
 *  - sky      → ambient "cool" note
 *
 * `editable` flips the body into a transparent <textarea>
 * bound to `onChange` so the user can type directly on the
 * note. Ambient notes never receive `editable`.
 *
 * `highlighted` adds a pulsing amber glow on the outer
 * shadow so the centrepiece note visually signals
 * "edit here" to the user. */
import { motion } from 'framer-motion';

export type NotePalette = 'peach' | 'mint' | 'lavender' | 'butter' | 'sky';

export const NOTE_PALETTE: Record<
  NotePalette,
  { bg: string; ink: string; pin: string; shadow: string }
> = {
  // The user's own note — warmest tone, sits at the visual center.
  peach:    { bg: 'linear-gradient(160deg, #FFE5C2 0%, #FFCB94 100%)', ink: '#5C2A0E', pin: '#FF6A00', shadow: '0 14px 30px rgba(255, 138, 56, 0.30)' },
  mint:     { bg: 'linear-gradient(160deg, #D8F3E1 0%, #B6E5C4 100%)', ink: '#1B4D2E', pin: '#10B981', shadow: '0 12px 26px rgba(16, 185, 129, 0.22)' },
  lavender: { bg: 'linear-gradient(160deg, #E5DEF6 0%, #CCC1EE 100%)', ink: '#3A2A6B', pin: '#8B5CF6', shadow: '0 12px 26px rgba(139, 92, 246, 0.22)' },
  butter:   { bg: 'linear-gradient(160deg, #FFF1B8 0%, #FFE28A 100%)', ink: '#5C3D0A', pin: '#F59E0B', shadow: '0 12px 26px rgba(245, 158, 11, 0.22)' },
  sky:      { bg: 'linear-gradient(160deg, #D4ECFB 0%, #AEDBF4 100%)', ink: '#0F3A5C', pin: '#3B82F6', shadow: '0 12px 26px rgba(59, 130, 246, 0.22)' },
};

export function StickyNote({
  text,
  author,
  palette,
  x,
  y,
  w,
  rotate,
  emphasis,
  editable = false,
  onChange,
  highlighted = false,
  /** When true, skip the spring entry animation. Useful for
      the static preview in the experience card so the notes
      appear at-rest rather than flying in. */
  static_ = false,
}: {
  text: string;
  author: string;
  palette: NotePalette;
  // Position in % of the board. y is from top, x from left.
  x: number;
  y: number;
  // Width in % of the board.
  w: number;
  rotate: number;
  emphasis?: boolean;
  editable?: boolean;
  onChange?: (v: string) => void;
  /** Pulsing amber glow + dashed inner outline. Used to mark
      the centrepiece "edit here" target. */
  highlighted?: boolean;
  /** Disable spring entry animation (static preview mode). */
  static_?: boolean;
}) {
  const p = NOTE_PALETTE[palette];
  return (
    <motion.div
      initial={static_ ? false : { opacity: 0, y: 30, rotate: 0, scale: 0.9 }}
      animate={
        static_
          ? { opacity: 1, y: 0, rotate, scale: 1 }
          : { opacity: 1, y: 0, rotate, scale: 1 }
      }
      transition={
        static_
          ? { duration: 0 }
          : {
              type: 'spring',
              stiffness: 220,
              damping: 18,
              // The user's note lands a hair later so the eye tracks to it.
              delay: emphasis ? 0.35 : 0.1 + (y % 4) * 0.05,
            }
      }
      className="absolute"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${w}%`,
        zIndex: emphasis ? 5 : 3,
      }}
    >
      <div
        className={`relative rounded-md px-2.5 py-2 ${highlighted ? 'mt-note-glow' : ''}`}
        style={{
          background: p.bg,
          boxShadow: emphasis
            ? `${p.shadow}, inset 0 0 0 1px rgba(255, 255, 255, 0.35)`
            : `${p.shadow}, inset 0 0 0 1px rgba(255, 255, 255, 0.25)`,
        }}
      >
        {/* Pin — a real image (no SVG per project rule). Same pin
            is reused at varying sizes so the visual language stays
            coherent across all four notes. */}
        <img
          src="/images/pin-cork.jpg"
          alt=""
          aria-hidden
          className="absolute pointer-events-none select-none"
          style={{
            top: -7,
            left: '50%',
            transform: 'translateX(-50%)',
            width: emphasis ? 18 : 14,
            height: emphasis ? 18 : 14,
            objectFit: 'cover',
          }}
          draggable={false}
        />
        {editable ? (
          <textarea
            value={text}
            onChange={(e) => onChange?.(e.target.value)}
            maxLength={50}
            placeholder="写下你的寄语…"
            className={`w-full resize-none bg-transparent focus:outline-none rounded-sm px-1.5 py-1 scrollbar-hide ${highlighted ? 'border border-dashed border-amber-500/60' : 'border border-transparent focus:border focus:border-dashed focus:border-amber-400/40'}`}
            style={{
              color: p.ink,
              fontFamily:
                '"Ma Shan Zheng", "Noto Serif SC", "Songti SC", serif',
              fontSize: emphasis ? 12.5 : 11,
              fontWeight: emphasis ? 600 : 400,
              lineHeight: 1.4,
              minHeight: emphasis ? 50 : 36,
            }}
          />
        ) : (
          <p
            className={
              emphasis
                ? 'text-[12.5px] font-semibold leading-snug'
                : 'text-[11px] leading-snug'
            }
            style={{
              color: p.ink,
              fontFamily:
                '"Ma Shan Zheng", "Noto Serif SC", "Songti SC", serif',
            }}
          >
            “{text}”
          </p>
        )}
        <p
          className={`text-right mt-0.5 text-[9px] font-bold tracking-wider`}
          style={{ color: emphasis ? '#9A3412' : '#A16207' }}
        >
          — {author}
        </p>
      </div>
    </motion.div>
  );
}
