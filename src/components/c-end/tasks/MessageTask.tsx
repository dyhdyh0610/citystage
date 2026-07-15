import { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../../context/AppContext';
import TaskHeader from './TaskHeader';
import { StickyNote, type NotePalette } from './StickyNote';
import { generateCoCreatedStory, polishMessage } from '../../../services/api';

/* Pulse-border keyframes for the AI 润色 button and the
   user's own sticky note. The same "pulsing amber ring"
   visual language is shared between the affordance (button)
   and the surface it acts on (centrepiece note) so the user
   reads them as a paired interactive unit. */
const PULSE_STYLE = `
@keyframes mt-shimmer-border {
  0%   { box-shadow: 0 0 0 0 rgba(255, 140, 66, 0.55), 0 0 12px 0 rgba(255, 140, 66, 0.35); }
  50%  { box-shadow: 0 0 0 4px rgba(255, 140, 66, 0.20), 0 0 18px 2px rgba(255, 140, 66, 0.55); }
  100% { box-shadow: 0 0 0 0 rgba(255, 140, 66, 0.55), 0 0 12px 0 rgba(255, 140, 66, 0.35); }
}
.mt-shimmer-border {
  animation: mt-shimmer-border 1.6s ease-in-out infinite;
}
@keyframes mt-note-glow {
  0%   { box-shadow: 0 14px 30px rgba(255, 138, 56, 0.30), 0 0 0 0 rgba(255, 140, 66, 0.45), inset 0 0 0 1px rgba(255, 255, 255, 0.35); }
  50%  { box-shadow: 0 14px 30px rgba(255, 138, 56, 0.30), 0 0 0 6px rgba(255, 140, 66, 0.18), inset 0 0 0 1px rgba(255, 255, 255, 0.35); }
  100% { box-shadow: 0 14px 30px rgba(255, 138, 56, 0.30), 0 0 0 0 rgba(255, 140, 66, 0.45), inset 0 0 0 1px rgba(255, 255, 255, 0.35); }
}
.mt-note-glow {
  animation: mt-note-glow 1.6s ease-in-out infinite;
}
`;
function ShimmerStyles() {
  return <style dangerouslySetInnerHTML={{ __html: PULSE_STYLE }} />;
}
import type { TaskResult } from '../../../types';

interface Props {
  onComplete: (result: TaskResult) => void;
  /** When true (B-end preview inside a 360×640 mock), skip the
      tall TaskHeader banner so the bulletin board has room to
      breathe. The textarea + submit button are also collapsed
      into a compact strip, leaving the wall as the dominant
      visual — exactly the surface the organizer needs to see. */
  compact?: boolean;
}

// ── Decorative "other visitors" notes that surround the user's
// own note on the finished bulletin board. These are static strings —
// the message board is a single-page in-app artifact, not a real
// community feed — so we don't need backend storage for them. They
// serve a UX purpose: giving the user's note context and a sense of
// being "added to a wall", rather than floating alone in white space.
// Shorter, more poetic lines so each note fits 1–2 lines and
// the wall never feels crowded. Authors are single-token names.
const AMBIENT_NOTES: Array<{ author: string; text: string; palette: NotePalette }> = [
  { author: '阿橘', text: '第一口的夏天，是柚子味的。', palette: 'mint' },
  { author: 'K.',   text: '风很轻，茶刚好。',           palette: 'lavender' },
  { author: '小满', text: '把时间，按下暂停键。',     palette: 'butter' },
];

export default function MessageTask({
  onComplete,
  compact = false,
}: Props) {
  const { state } = useApp();
  // Demo: prefill the textarea so the user has a starting point and
  // can tap "贴上留言墙" without typing. They can also edit freely.
  const [text, setText] = useState('柚子茶的第一口夏天，从这一杯开始。');
  const [polishing, setPolishing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [justPolished, setJustPolished] = useState(false);
  // After submit we switch to the "completed" view, which is a
  // bulletin-board layout of sticky notes. We hold the submitted
  // text + story locally so the board can render the user's own
  // note as the centerpiece, and the "next" CTA still works without
  // the parent having to round-trip through the experience card.
  const [submitted, setSubmitted] = useState<
    { userMessage: string; coCreatedStory?: string } | null
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

  // No more view-switching: the user can see both the input
  // textarea and the sticky-note wall at the same time. Whatever
  // they type in the textarea is rendered live as the centrepiece
  // note in the wall, so the relationship between "input" and
  // "wall placement" is immediately visible. Submitting just marks
  // the note as officially pinned (subtle visual confirmation).
  // The user's note is the centrepiece of the wall. It binds
  // directly to `text` so the moment the user types on the
  // sticky note, every other consumer (the CTA validation,
  // the AI-polish affordance, the experience card) sees the
  // updated value. If the field is empty we fall back to a
  // hand-picked default so the wall never looks blank.
  const liveMessage = text.trim() || '柚子茶的第一口夏天，从这一杯开始。';

  return (
    <div className={`flex flex-col h-full ${compact ? 'p-2 overflow-hidden' : 'p-3 overflow-y-auto'} scrollbar-hide`}>
      {!compact && <TaskHeader type="message" />}

      {/* The wall is the only surface — the user types directly
          on the centrepiece note, no separate textarea card. */}
      <MessageBoardView
        note={{ userMessage: liveMessage }}
        live
        compact={compact}
        submitted={submitted !== null}
        onSubmit={handleSubmit}
        onTextChange={setText}
        onPolish={handlePolish}
        polishing={polishing}
        justPolished={justPolished}
        canPolish={canPolish}
        submitting={submitting}
        isValid={isValid}
      />
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
  live = false,
  compact = false,
  submitted = false,
  onSubmit,
  onTextChange,
  onPolish,
  polishing = false,
  justPolished = false,
  canPolish = false,
  submitting = false,
  isValid = false,
}: {
  note: { userMessage: string; coCreatedStory?: string };
  /** Live mode: textarea content is mirrored into the centrepiece
      note in real time. Renders the "贴上留言墙" CTA. */
  live?: boolean;
  /** B-end 360×640 模拟手机模式：压缩 header 字号，省略 AI
      润色附文，把所有可用空间让给便签墙。 */
  compact?: boolean;
  /** Whether the note has been officially pinned (after submit). */
  submitted?: boolean;
  onSubmit?: () => void;
  /** Edit-on-note: callback for when the user types in the
      centrepiece note. Bound to the textarea inside StickyNote. */
  onTextChange?: (v: string) => void;
  /** AI-polish trigger — wired to the button that replaces the
      old "实时预览" status chip. */
  onPolish?: () => void;
  polishing?: boolean;
  justPolished?: boolean;
  canPolish?: boolean;
  submitting?: boolean;
  isValid?: boolean;
}) {
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <ShimmerStyles />
      {/* Header — kept light so the board is the hero. We use
          `items-center` so the "留言墙" title and the "AI 润色"
          button sit on the same baseline; the old "YUZU WALL ·
          2026" sublabel has been removed to give the wall more
          breathing room. */}
      <div className={`flex items-center justify-between shrink-0 px-1 ${compact ? 'mb-1' : 'mb-2'}`}>
        <h3 className={`${compact ? 'text-[12.5px]' : 'text-[15px]'} font-bold text-ink-primary leading-tight`}>
          {live
            ? submitted
              ? '已收录到留言墙'
              : '留言墙'
            : '你的留言,已经贴在留言墙上了'}
        </h3>
        {/* The right-side header slot is context-sensitive:
            - after submit  → green "收录成功" status pill
            - before submit → "AI 润色" button (the same action
              the old textarea card used to expose, now placed
              next to the wall because the textarea is gone). */}
        {submitted ? (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5 shrink-0"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            收录成功
          </span>
        ) : onPolish ? (
          <motion.button
            type="button"
            onClick={onPolish}
            disabled={!canPolish}
            whileTap={canPolish ? { scale: 0.95 } : undefined}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold no-tap-highlight disabled:cursor-not-allowed shrink-0 ${canPolish ? 'mt-shimmer-border' : ''}`}
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
              <span>AI 润色</span>
            )}
          </motion.button>
        ) : null}
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

        {/* The user's own note — sits front-and-centre as the
            visual anchor of the wall. We give it 56% width and
            place it on the left half so the right side has
            breathing room for the ambient notes. In live mode
            it becomes the input surface itself — the user types
            directly on the note via a transparent textarea. */}
        <StickyNote
          text={note.userMessage}
          author="你"
          palette="peach"
          x={6}
          y={live ? 14 : 18}
          w={56}
          rotate={-3}
          emphasis
          editable={live && !submitted}
          highlighted={live && !submitted}
          onChange={onTextChange}
        />

        {/* Ambient notes from other visitors. We use exactly 3
            smaller notes arranged in a triangular composition:
              • top-right
              • mid-right (under #1)
              • bottom-left (under the user's note)
            Each is 30–34% wide, never overlaps the centerpiece,
            and the board has clear negative space at the corners. */}
        <StickyNote
          text={AMBIENT_NOTES[0].text}
          author={AMBIENT_NOTES[0].author}
          palette={AMBIENT_NOTES[0].palette}
          x={64}
          y={6}
          w={32}
          rotate={4}
        />
        <StickyNote
          text={AMBIENT_NOTES[1].text}
          author={AMBIENT_NOTES[1].author}
          palette={AMBIENT_NOTES[1].palette}
          x={66}
          y={live ? 36 : 40}
          w={30}
          rotate={-5}
        />
        <StickyNote
          text={AMBIENT_NOTES[2].text}
          author={AMBIENT_NOTES[2].author}
          palette={AMBIENT_NOTES[2].palette}
          x={8}
          y={live ? 62 : 66}
          w={30}
          rotate={5}
        />
      </div>

      {/* Live-mode CTA — the user types in the textarea above and
          can see the wall update in real time. Hitting this button
          marks the note as officially pinned (subtle confirmation
          in the header chip). */}
      {live && onSubmit && (
        <button
          type="button"
          onClick={onSubmit}
          disabled={!isValid || submitting}
          className="mt-2 rounded-full py-2.5 font-bold text-sm text-white no-tap-highlight transition-transform shrink-0"
          style={{
            background: isValid && !submitting
              ? 'linear-gradient(135deg, #FF8C42 0%, #FF9347 100%)'
              : '#E5E7EB',
            boxShadow: isValid && !submitting ? '0 4px 16px rgba(255, 140, 66, 0.35)' : 'none',
            opacity: isValid && !submitting ? 1 : 0.6,
          }}
        >
          {submitting ? '正在收录…' : submitted ? '已收录到留言墙 ✓' : isValid ? '贴上留言墙' : '请至少写 5 个字'}
        </button>
      )}

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
