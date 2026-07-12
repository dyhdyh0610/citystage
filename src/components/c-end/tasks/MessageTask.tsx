import { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../../context/AppContext';
import TaskHeader from './TaskHeader';
import { generateCoCreatedStory, polishMessage } from '../../../services/api';
import type { TaskResult } from '../../../types';

interface Props {
  onComplete: (result: TaskResult) => void;
}

// ── Decorative "other visitors" notes that surround the user's
// own note on the finished bulletin board. These are static strings —
// the message board is a single-page in-app artifact, not a real
// community feed — so we don't need backend storage for them. They
// serve a UX purpose: giving the user's note context and a sense of
// being "added to a wall", rather than floating alone in white space.
const AMBIENT_NOTES: Array<{ author: string; text: string; palette: NotePalette }> = [
  { author: '阿橘', text: '第一口的柚子茶,是夏天给的最温柔的拥抱。', palette: 'mint' },
  { author: 'K.',    text: '今天的风,闻起来是柚子味的。', palette: 'lavender' },
  { author: '小满',  text: '在这家店把时间按下暂停键', palette: 'butter' },
  { author: '丘丘',  text: '续杯的理由:第二杯半价,和心情也好。', palette: 'sky' },
];

type NotePalette = 'peach' | 'mint' | 'lavender' | 'butter' | 'sky';

const NOTE_PALETTE: Record<
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

export default function MessageTask({ onComplete }: Props) {
  const { state } = useApp();
  const [text, setText] = useState('');
  const [polishing, setPolishing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [justPolished, setJustPolished] = useState(false);
  // After submit we switch to the "completed" view, which is a
  // bulletin-board layout of sticky notes. We hold the submitted
  // text + story locally so the board can render the user's own
  // note as the centerpiece, and the "next" CTA still works without
  // the parent having to round-trip through the experience card.
  const [submitted, setSubmitted] = useState<
    | { userMessage: string; coCreatedStory?: string }
    | null
  >(null);

  const isValid = text.trim().length >= 5 && text.trim().length <= 50;
  const canPolish = isValid && !polishing;

  const handlePolish = async () => {
    if (!canPolish) return;
    setPolishing(true);
    setJustPolished(false);
    try {
      const polished = await polishMessage(
        text.trim(),
        state.activityConfig.brandName,
      );
      // Truncate defensively to 50 chars to respect the counter
      const next = polished.length > 50 ? polished.slice(0, 50) : polished;
      setText(next);
      setJustPolished(true);
      window.setTimeout(() => setJustPolished(false), 1600);
    } catch {
      // silent fail — keep user's original text
    } finally {
      setPolishing(false);
    }
  };

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    try {
      // Wait for the AI co-created story so the experience card can
      // display the full story (not just the user's raw input).
      const story = await generateCoCreatedStory(
        state.activityConfig.brandName,
        text.trim(),
      );
      setSubmitted({ userMessage: text.trim(), coCreatedStory: story });
      onComplete({
        type: 'message',
        userMessage: text.trim(),
        coCreatedStory: story,
      });
    } catch {
      // Fallback: still pass the user's message; the experience card
      // will display the userMessage as a fallback quote.
      setSubmitted({ userMessage: text.trim() });
      onComplete({ type: 'message', userMessage: text.trim() });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Submitted view: bulletin board ──
  if (submitted) {
    return <MessageBoardView note={submitted} />;
  }

  return (
    <div className="flex flex-col h-full p-3 overflow-y-auto scrollbar-hide">
      <TaskHeader type="message" />

      {/* Input card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-2xl shadow-card p-3 mb-3 shrink-0"
        style={{ background: '#FFFFFF' }}
      >
        <div className="flex items-center justify-between mb-2 px-1">
          <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">写下你的夏日寄语</p>
          <motion.button
            type="button"
            onClick={handlePolish}
            disabled={!canPolish}
            whileTap={canPolish ? { scale: 0.95 } : undefined}
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold no-tap-highlight disabled:cursor-not-allowed"
            style={{
              background: canPolish
                ? 'linear-gradient(135deg, #FFE4B5 0%, #FFD08A 100%)'
                : '#F3F4F6',
              color: canPolish ? '#9A3412' : '#9CA3AF',
              boxShadow: canPolish ? '0 2px 6px rgba(255, 140, 66, 0.18)' : 'none',
            }}
            title={isValid ? '让 AI 帮你润色这句话' : '请先写 5 个字以上'}
          >
            {polishing ? (
              <>
                <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
                  <path d="M21 12a9 9 0 0 1-9 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <span>润色中…</span>
              </>
            ) : justPolished ? (
              <>
                <span
                  className="inline-flex items-center justify-center"
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 999,
                    background: '#22C55E',
                    color: '#FFFFFF',
                    fontSize: 9,
                    lineHeight: 1,
                  }}
                >
                  ✓
                </span>
                <span>已润色</span>
              </>
            ) : (
              <>
                <img
                  aria-hidden
                  src="/images/glyph-photo.png"
                  alt=""
                  draggable={false}
                  style={{ width: 16, height: 16, objectFit: 'contain' }}
                />
                <span>AI 润色</span>
              </>
            )}
          </motion.button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="例如：夏天的第一杯柚子茶,酸酸甜甜,像极了青春的味道..."
          maxLength={50}
          className="w-full h-24 p-2.5 text-sm text-ink-primary bg-[#F9FAFB] border-0 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#FF8C42]/30 placeholder:text-ink-disabled scrollbar-hide"
        />
        <div className="flex items-center justify-between mt-1.5 px-1">
          <span className="text-[10px] text-ink-disabled">最多 50 字</span>
          <span
            className="text-[10px] font-semibold tabular-nums"
            style={{ color: text.length >= 5 ? '#FF8C42' : '#9CA3AF' }}
          >
            {text.length} / 50
          </span>
        </div>
      </motion.div>

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!isValid || submitting}
        className="mt-auto rounded-full py-3 font-bold text-sm text-white no-tap-highlight transition-transform shrink-0"
        style={{
          background: isValid && !submitting
            ? 'linear-gradient(135deg, #FF8C42 0%, #FF9347 100%)'
            : '#E5E7EB',
          boxShadow: isValid && !submitting ? '0 4px 16px rgba(255, 140, 66, 0.35)' : 'none',
          opacity: isValid && !submitting ? 1 : 0.6,
        }}
      >
        {submitting ? '正在收录…' : isValid ? '贴上留言墙' : '请至少写 5 个字'}
      </button>
    </div>
  );
}

/* ── Message Board View (post-submit) ──
 *
 * Renders the user's just-submitted note as a sticky on a cork-board
 * background, surrounded by a few ambient notes from other visitors.
 * The user's note is the visual centerpiece: warmer color, larger
 * pin, slightly bigger drop shadow.
 *
 * The board uses real `img` assets (no SVG decoration) per the
 * project's hard rule: the wooden pin and string lights are real
 * AI-generated PNGs under /public/images.
 */
function MessageBoardView({
  note,
}: {
  note: { userMessage: string; coCreatedStory?: string };
}) {
  return (
    <div className="flex flex-col h-full p-3 overflow-hidden">
      {/* Header — kept light so the board is the hero. */}
      <div className="flex items-center justify-between mb-2 shrink-0 px-1">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-600">
            YUZU WALL · 2026
          </p>
          <h3 className="text-[15px] font-bold text-ink-primary leading-tight mt-0.5">
            你的留言,已经贴在留言墙上了
          </h3>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          收录成功
        </span>
      </div>

      {/* Bulletin board — cork / kraft background with pinned notes. */}
      <div
        className="relative flex-1 min-h-0 rounded-2xl overflow-hidden"
        style={{
          background:
            'linear-gradient(180deg, #E8D7B8 0%, #D9C29B 100%)',
          boxShadow:
            'inset 0 0 0 1px rgba(120, 90, 50, 0.15), 0 10px 30px rgba(120, 90, 50, 0.18)',
        }}
      >
        {/* Subtle paper grain — small radial dots to suggest a cork board. */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-50 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(rgba(120, 90, 50, 0.18) 1px, transparent 1px)',
            backgroundSize: '8px 8px',
          }}
        />

        {/* The user's own note — placed centrally, larger and warm. */}
        <StickyNote
          text={note.userMessage}
          author="你"
          palette="peach"
          // Visual position: slightly above center, 1.0 scale (largest).
          x={6}
          y={4}
          w={70}
          rotate={-3}
          emphasis
        />

        {/* Ambient notes from other visitors. Positions are tuned so
            the user's note is clearly the focal point — neighbors are
            smaller, more colorful, and never overlap the centerpiece. */}
        <StickyNote
          text={AMBIENT_NOTES[0].text}
          author={AMBIENT_NOTES[0].author}
          palette={AMBIENT_NOTES[0].palette}
          x={62}
          y={2}
          w={50}
          rotate={4}
        />
        <StickyNote
          text={AMBIENT_NOTES[1].text}
          author={AMBIENT_NOTES[1].author}
          palette={AMBIENT_NOTES[1].palette}
          x={70}
          y={42}
          w={42}
          rotate={-5}
        />
        <StickyNote
          text={AMBIENT_NOTES[2].text}
          author={AMBIENT_NOTES[2].author}
          palette={AMBIENT_NOTES[2].palette}
          x={2}
          y={48}
          w={42}
          rotate={5}
        />
        <StickyNote
          text={AMBIENT_NOTES[3].text}
          author={AMBIENT_NOTES[3].author}
          palette={AMBIENT_NOTES[3].palette}
          x={6}
          y={72}
          w={50}
          rotate={-2}
        />
      </div>

      {/* Footnote — quietly acknowledge the AI co-create. Hidden
          when no story was generated, so the offline path stays clean. */}
      {note.coCreatedStory && (
        <div className="mt-2 shrink-0 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2">
          <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">
            柚子店长 · 笔下生花
          </p>
          <p className="text-[11.5px] text-ink-body leading-relaxed mt-0.5">
            {note.coCreatedStory}
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Sticky Note ── */
function StickyNote({
  text,
  author,
  palette,
  x,
  y,
  w,
  rotate,
  emphasis,
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
}) {
  const p = NOTE_PALETTE[palette];
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotate: 0, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, rotate, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 220,
        damping: 18,
        // The user's note lands a hair later so the eye tracks to it.
        delay: emphasis ? 0.35 : 0.1 + (y % 4) * 0.05,
      }}
      className="absolute"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${w}%`,
        zIndex: emphasis ? 5 : 3,
      }}
    >
      <div
        className="relative rounded-md px-2.5 py-2"
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
        <p
          className="text-right mt-1 text-[9.5px] font-bold tracking-wider"
          style={{ color: p.pin }}
        >
          — {author}
        </p>
      </div>
    </motion.div>
  );
}
