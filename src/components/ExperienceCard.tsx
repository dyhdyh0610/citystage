import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import type { TaskResult } from '../types';

/* ─────────────────────────────────────────────────────────────────
 * 夏日探鲜护照 · Summer Foraging Passport
 *
 * Editorial / print-journal layout. Every section lives in its own
 * clear grid cell; nothing rotates, nothing overlaps, every text
 * block has dedicated breathing room. All decorative ornaments are
 * real AI-generated images (no SVG, no CSS gradient circles).
 * ───────────────────────────────────────────────────────────────── */

// Color tokens
const INK = '#1F1827';
const INK_SOFT = 'rgba(31, 24, 39, 0.62)';
const INK_FAINT = 'rgba(31, 24, 39, 0.38)';
const INK_HAIR = 'rgba(31, 24, 39, 0.12)';
const PAPER = '#FBF3E0';
const PAPER_DEEP = '#F2E6C7';
const ACCENT = '#FF8C42';
const ACCENT_DEEP = '#D9631B';
const STAMP_INK = '#9B1C1C';

export default function ExperienceCard() {
  const { state, setCView, setGuidanceStep } = useApp();
  const card = state.experienceCard;
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setGuidanceStep(10);
  }, [setGuidanceStep]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('devView') !== 'experience-card') return;
    if (params.get('devScroll') === 'none') return;
    const id = window.setTimeout(() => {
      const scroller = document.querySelector<HTMLDivElement>(
        '[data-experience-scroller]'
      );
      if (!scroller) return;
      const firstStamp = scroller.querySelector<HTMLElement>('[data-stamp]');
      if (firstStamp) {
        scroller.scrollTo({ top: firstStamp.offsetTop - 24, behavior: 'auto' });
      }
    }, 250);
    return () => window.clearTimeout(id);
  }, []);

  const results = useMemo(() => card?.results ?? [], [card?.results]);
  const byType = useMemo(() => {
    const m: Partial<Record<TaskResult['type'], TaskResult>> = {};
    for (const r of results) m[r.type] = r;
    return m;
  }, [results]);

  if (!card) return null;

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 4000);
  };

  const handleBackHome = () => setCView('task-map');

  const photoData = byType.photo?.photoData;
  const photoUrl = photoData;
  const photoComment = byType.photo?.photoComment;
  const drawing = byType.drawing;
  const find = byType.findObject;
  const message = byType.message;
  const accent = card.visualStyle?.accent || ACCENT;

  // 4 stamp slots — checkin is intentionally omitted from the card
  // per product direction (the cover page already records the visit).
  const stamps = [
    { kind: 'photo' as const, present: !!byType.photo },
    { kind: 'findObject' as const, present: !!byType.findObject },
    { kind: 'message' as const, present: !!byType.message },
    { kind: 'drawing' as const, present: !!byType.drawing },
  ];
  const collected = stamps.filter((s) => s.present).length;

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 16% 0%, ${accent}10 0%, transparent 50%),
          radial-gradient(ellipse at 100% 100%, #FFD93D14 0%, transparent 55%),
          ${PAPER}
        `,
      }}
    >
      {/* Paper grain — full-screen, tileable AI image, multiply blend */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'url(/images/passport-paper-grain.jpg)',
          backgroundSize: '256px 256px',
          backgroundRepeat: 'repeat',
          mixBlendMode: 'multiply',
          opacity: 0.22,
        }}
      />

      {/* ── Top exit bar (always reachable, both buttons
              return to the task map so the user can never get
              stuck inside the card). ── */}
      <div
        className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between pointer-events-none"
        style={{ padding: '12px 16px' }}
      >
        <button
          type="button"
          aria-label="返回任务地图"
          onClick={handleBackHome}
          className="pointer-events-auto flex items-center justify-center no-tap-highlight active:scale-95 transition-transform"
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            background: 'rgba(255, 253, 246, 0.92)',
            boxShadow:
              '0 2px 8px rgba(31, 24, 39, 0.18), ' +
              'inset 0 0 0 1px rgba(255,255,255,0.6)',
          }}
        >
          <img
            src="/images/icon-back-dark.jpg"
            alt=""
            aria-hidden
            style={{ width: 20, height: 20 }}
          />
        </button>
        <button
          type="button"
          aria-label="关闭体验卡"
          onClick={handleBackHome}
          className="pointer-events-auto flex items-center justify-center no-tap-highlight active:scale-95 transition-transform"
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            background: 'rgba(255, 253, 246, 0.92)',
            boxShadow:
              '0 2px 8px rgba(31, 24, 39, 0.18), ' +
              'inset 0 0 0 1px rgba(255,255,255,0.6)',
          }}
        >
          <img
            src="/images/icon-close-dark.jpg"
            alt=""
            aria-hidden
            style={{ width: 18, height: 18 }}
          />
        </button>
      </div>

      {/* Single scrollable area, every section has its own 4-px
          padding rhythm and never collides with adjacent sections.
          padding-top: 56 leaves room for the top exit bar. */}
      <div
        data-experience-scroller
        className="relative z-10 h-full w-full overflow-y-auto scrollbar-hide"
        style={{ paddingTop: 56, paddingBottom: 96 }}
      >
        {/* ════════════════════════════════════════════════════
            1 ·  HEADER  (no overlay, no stamp on top)
           ════════════════════════════════════════════════════ */}
        <section className="px-5 pt-8 pb-3">
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-[10px] font-mono tracking-[0.35em] uppercase"
              style={{ color: INK_SOFT }}
            >
              CityStage · Vol.07
            </span>
            <span
              className="text-[10px] font-mono tracking-widest"
              style={{ color: INK_SOFT }}
            >
              {card.date}
            </span>
          </div>
          <h1
            className="font-black leading-[0.95]"
            style={{
              fontSize: 30,
              color: INK,
              fontFamily: "'Bricolage Grotesque', 'Noto Serif SC', serif",
              letterSpacing: '0.02em',
            }}
          >
            夏日探鲜护照
          </h1>
          <p
            className="mt-2 text-[12px] font-medium"
            style={{ color: INK_SOFT, lineHeight: 1.5 }}
          >
            {card.brandName} · {card.location} · {card.theme}
          </p>
        </section>

        {/* ════════════════════════════════════════════════════
            2 ·  PASSPORT COVER  (real shop photo as the cover,
            postal stamp in the empty bottom-right corner, NO
            sun, NO orange gradient block.)
           ════════════════════════════════════════════════════ */}
        <section className="px-5 pt-2">
          <div
            className="relative w-full overflow-hidden"
            style={{
              aspectRatio: '4 / 3',
              background: PAPER_DEEP,
              boxShadow:
                '0 10px 24px rgba(31, 24, 39, 0.18), ' +
                '0 2px 4px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            {/* Cover artwork — a real photograph of 柚见茶铺.
                This IS the cover; no decorative sun, no
                gradient, no other ornament sits on top of it. */}
            <img
              src="/images/tea-shop-scene.jpg"
              alt="柚见茶铺"
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Postal stamp — a real cancellation stamp image,
                half-tucked under the bottom-right corner of the
                cover, like a sticker pressed onto a postcard. The
                shop photo's bar counter is darker in this region
                so the stamp reads cleanly, and nothing else lives
                in this quadrant of the cover. */}
            <img
              src="/images/passport-stamp-round.jpg"
              alt="2026 visited"
              className="absolute pointer-events-none select-none"
              style={{
                right: -14,
                bottom: -14,
                width: 96,
                height: 96,
                transform: 'rotate(-10deg)',
                filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.22))',
              }}
            />
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            3 ·  AI STORY  (single quiet band, no decorative SVG)
           ════════════════════════════════════════════════════ */}
        <section className="px-5 pt-7">
          <p
            className="text-[10px] font-mono tracking-[0.3em] uppercase mb-2"
            style={{ color: INK_SOFT }}
          >
            短笺 · AI · NARRATIVE
          </p>
          <p
            className="text-[15px] leading-[1.85]"
            style={{
              color: INK,
              fontFamily: "'Noto Serif SC', 'Songti SC', 'STZhongsong', serif",
              fontWeight: 500,
              letterSpacing: '0.02em',
            }}
          >
            {card.storyText}
          </p>
        </section>

        {/* ════════════════════════════════════════════════════
            4 ·  STAMP COLLECTION  (single column, generous gap)
           ════════════════════════════════════════════════════ */}
        <section className="px-5 pt-7">
          <div className="flex items-baseline justify-between mb-3">
            <p
              className="text-[10px] font-mono tracking-[0.3em] uppercase font-bold"
              style={{ color: INK_SOFT }}
            >
              集章 · STAMP COLLECTION
            </p>
            <p
              className="text-[11px] font-mono"
              style={{ color: INK_SOFT }}
            >
              {collected} / 4
            </p>
          </div>
          <div className="flex flex-col" style={{ gap: 14 }}>
            {stamps.map(({ kind, present }, idx) => {
              if (!present) return null;
              const delay = 0.1 + idx * 0.06;
              if (kind === 'photo') {
                return (
                  <motion.div
                    key="photo"
                    data-stamp
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay }}
                  >
                    <PhotoCard
                      photoUrl={photoUrl || ''}
                      photoComment={photoComment}
                      stampNo="01"
                    />
                  </motion.div>
                );
              }
              if (kind === 'findObject') {
                return (
                  <motion.div
                    key="find"
                    data-stamp
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay }}
                  >
                    <FindObjectCard
                      result={find!}
                      stampNo="02"
                    />
                  </motion.div>
                );
              }
              if (kind === 'message') {
                return (
                  <motion.div
                    key="message"
                    data-stamp
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay }}
                  >
                    <MessageCard
                      userMessage={message?.userMessage}
                      coCreatedStory={message?.coCreatedStory}
                      stampNo="03"
                    />
                  </motion.div>
                );
              }
              if (kind === 'drawing') {
                return (
                  <motion.div
                    key="drawing"
                    data-stamp
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay }}
                  >
                    <DrawingCard
                      drawingData={drawing?.drawingData}
                      drawingComment={drawing?.drawingComment}
                      stampNo="04"
                    />
                  </motion.div>
                );
              }
              return null;
            })}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            5 ·  FOOTER  (signature + actions, no floating stamp)
           ════════════════════════════════════════════════════ */}
        <section className="px-5 pt-8">
          <div
            className="flex items-center gap-3 pb-5"
            style={{ borderBottom: `1px solid ${INK_HAIR}` }}
          >
            <img
              src="/images/passport-seal-small.jpg"
              alt="夏"
              className="shrink-0"
              style={{ width: 40, height: 40 }}
            />
            <div>
              <p
                className="text-[10px] font-mono tracking-[0.25em] uppercase"
                style={{ color: INK_SOFT }}
              >
                END · SUMMER 2026
              </p>
              <p
                className="text-[11px] mt-0.5"
                style={{ color: INK, fontWeight: 500 }}
              >
                {card.brandName} · {card.location}
              </p>
            </div>
          </div>

          <div className="flex gap-2.5 pt-5">
            <button
              type="button"
              onClick={() => showToast('护照已收入相册')}
              className="flex-1 rounded-full py-3 text-[12px] font-bold tracking-wider no-tap-highlight transition-transform active:scale-95"
              style={{
                border: `1.5px solid ${INK}26`,
                background: '#FFF8E6',
                color: INK,
                fontFamily: "'Bricolage Grotesque', 'PingFang SC'",
              }}
            >
              收 入 相 册
            </button>
            <button
              type="button"
              onClick={() => showToast('已寄出给朋友')}
              className="flex-[1.2] rounded-full py-3 text-[12px] font-bold text-white tracking-wider no-tap-highlight transition-transform active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${accent} 0%, ${ACCENT_DEEP} 100%)`,
                boxShadow: `0 6px 18px ${accent}55`,
                fontFamily: "'Bricolage Grotesque', 'PingFang SC'",
              }}
            >
              寄 给 朋 友 ↗
            </button>
          </div>

          <button
            type="button"
            onClick={handleBackHome}
            className="block mx-auto mt-4 text-[10px] no-tap-highlight tracking-widest"
            style={{
              color: INK_FAINT,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            ← BACK TO MAP
          </button>
        </section>
      </div>

      {/* ── Toast (local to the card root) ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="absolute left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full text-[12px] font-medium whitespace-nowrap pointer-events-none"
            style={{
              bottom: 24,
              background: INK,
              color: PAPER,
              boxShadow: '0 6px 18px rgba(31, 24, 39, 0.25)',
            }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
 * Card shell — single fixed structure for every artefact.
 *   ┌─ header: NO.0X · type ────────────┐
 *   │  body: media + meta + comment      │
 *   └────────────────────────────────────┘
 * No rotation, no border-radius:999 rings, no perforated overlays
 * that could clip into adjacent text.
 * ───────────────────────────────────────────────────────────────── */
function Card({
  stampNo,
  typeLabel,
  enLabel,
  children,
}: {
  stampNo: string;
  typeLabel: string;
  enLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative w-full"
      style={{
        background: '#FFFDF6',
        border: `1px solid ${INK_HAIR}`,
        boxShadow: '0 4px 14px rgba(31, 24, 39, 0.08)',
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{
          padding: '10px 14px',
          borderBottom: `1px solid ${INK_HAIR}`,
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-mono tracking-widest font-bold"
            style={{ color: STAMP_INK }}
          >
            NO.0{stampNo}
          </span>
          <span
            className="text-[10px]"
            style={{ color: INK_FAINT }}
          >
            ·
          </span>
          <span
            className="text-[12px] font-bold"
            style={{ color: INK }}
          >
            {typeLabel}
          </span>
        </div>
        <span
          className="text-[9px] font-mono tracking-[0.25em] uppercase"
          style={{ color: INK_SOFT }}
        >
          {enLabel}
        </span>
      </div>
      <div style={{ padding: 14 }}>{children}</div>
    </div>
  );
}

/* ── Photo card ── */
function PhotoCard({
  photoUrl,
  photoComment,
  stampNo,
}: {
  photoUrl: string;
  photoComment?: string;
  stampNo: string;
}) {
  return (
    <Card stampNo={stampNo} typeLabel="拍照" enLabel="YOUR SHOT">
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: '4 / 3', background: PAPER_DEEP }}
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt="你的照片"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center text-[12px]"
            style={{ color: INK_FAINT }}
          >
            未上传
          </div>
        )}
      </div>
      {photoComment && (
        <p
          className="mt-3 text-[13px] leading-relaxed"
          style={{
            color: INK,
            fontFamily: "'Noto Serif SC', 'Songti SC', serif",
            fontStyle: 'italic',
          }}
        >
          {photoComment}
        </p>
      )}
    </Card>
  );
}

/* ── Find-object card ── */
function FindObjectCard({
  result,
  stampNo,
}: {
  result: TaskResult;
  stampNo: string;
}) {
  if (result.type !== 'findObject') return null;
  const found = !!result.foundCorrect;
  return (
    <Card stampNo={stampNo} typeLabel="寻物" enLabel="SPOTTED">
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: '4 / 3', background: PAPER_DEEP }}
      >
        <img
          src="/images/tea-shop-scene.jpg"
          alt="门店场景"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {found && (
          <>
            <div
              className="absolute"
              style={{
                left: 'calc(68% - 18px)',
                top: 'calc(42% - 18px)',
                width: 36,
                height: 36,
                borderRadius: 999,
                border: `2.5px solid #22C55E`,
                background: 'rgba(34, 197, 94, 0.18)',
                boxShadow: '0 0 0 6px rgba(34, 197, 94, 0.10)',
                animation: 'pulse-ring 1.6s ease-out infinite',
              }}
            />
            <div
              className="absolute"
              style={{
                left: 12,
                top: 12,
                padding: '4px 8px',
                background: '#22C55E',
                color: '#FFF',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              你点中这里
            </div>
          </>
        )}
      </div>
      <p
        className="mt-3 text-[13px] font-semibold"
        style={{ color: INK }}
      >
        {result.findFeedback || (found ? '找到了小柚子' : '还没找到')}
      </p>
      <style>{`
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.40); }
          70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
      `}</style>
    </Card>
  );
}

/* ── Message card ── */
function MessageCard({
  userMessage,
  coCreatedStory,
  stampNo,
}: {
  userMessage?: string;
  coCreatedStory?: string;
  stampNo: string;
}) {
  return (
    <Card stampNo={stampNo} typeLabel="寄语" enLabel="YOUR WORDS">
      <p
        className="text-[18px] font-black leading-[1.5]"
        style={{
          color: INK,
          fontFamily: "'Noto Serif SC', 'Songti SC', 'STZhongsong', serif",
          letterSpacing: '0.02em',
        }}
      >
        「{userMessage || '（未填）'}」
      </p>
      {coCreatedStory && (
        <div
          className="mt-3 pt-3"
          style={{ borderTop: `1px dashed ${INK_HAIR}` }}
        >
          <p
            className="text-[10px] font-mono tracking-[0.25em] uppercase mb-1"
            style={{ color: INK_SOFT }}
          >
            AI · 店长润色
          </p>
          <p
            className="text-[12px] leading-relaxed italic"
            style={{ color: INK_SOFT }}
          >
            {coCreatedStory}
          </p>
        </div>
      )}
    </Card>
  );
}

/* ── Drawing card ── */
function DrawingCard({
  drawingData,
  drawingComment,
  stampNo,
}: {
  drawingData?: string;
  drawingComment?: string;
  stampNo: string;
}) {
  return (
    <Card stampNo={stampNo} typeLabel="画作" enLabel="YOUR CANVAS">
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: '5 / 4', background: '#FFFCF2' }}
      >
        {drawingData ? (
          <img
            src={drawingData}
            alt="你的画作"
            className="absolute inset-0 w-full h-full object-contain"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center text-[12px]"
            style={{ color: INK_FAINT }}
          >
            未涂鸦
          </div>
        )}
      </div>
      {drawingComment && (
        <p
          className="mt-3 text-[13px] leading-relaxed"
          style={{
            color: INK,
            fontFamily: "'Noto Serif SC', 'Songti SC', serif",
            fontStyle: 'italic',
          }}
        >
          {drawingComment}
        </p>
      )}
    </Card>
  );
}
