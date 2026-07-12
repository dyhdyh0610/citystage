import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Icon } from "../Icon";
import { presetTasks, createEmptyTask, TASK_TYPE_META } from '../../data/defaults';
import { aiGenerateCustomPrompt, aiApplyIdeaToTask } from '../../services/api';
import type { TaskContent, TaskType } from '../../types';

/* ── Inline SVG Icons ── */

function ChevronLeftIcon({ className = '', size = 24, color = '#1F1827' }: { className?: string; size?: number; color?: string }) {
  return <Icon name="chevron-left" size={size} color={color} className={className} decorative />;
}

function CloseIcon({ size = 16, color = '#6B7280' }: { size?: number; color?: string }) {
  return <Icon name="close" size={size} color={color} decorative />;
}

/**
 * Real-image task type icons (kept in sync with BEndConfig's TaskTypeCard).
 * Each task type gets a real photo with a colored gradient overlay so the
 * card stays recognizable at a glance.
 */
const TASK_TYPE_IMAGES: Record<TaskType, { src: string; gradient: string; tint: string }> = {
  checkin: {
    src: '/images/tea-1.jpg',
    gradient: 'linear-gradient(135deg, #8A65FF 0%, #7C3AED 100%)',
    tint: 'rgba(138, 101, 255, 0.18)',
  },
  photo: {
    src: '/images/tea-shop-scene.jpg',
    gradient: 'linear-gradient(135deg, #FF8C42 0%, #FF6A00 100%)',
    tint: 'rgba(255, 140, 66, 0.18)',
  },
  findObject: {
    src: '/images/tea-2.jpg',
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    tint: 'rgba(16, 185, 129, 0.18)',
  },
  message: {
    src: '/images/tea-3.jpg',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    tint: 'rgba(245, 158, 11, 0.18)',
  },
  drawing: {
    src: '/images/experience-card-hero.jpg',
    gradient: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
    tint: 'rgba(236, 72, 153, 0.18)',
  },
};

function PencilIcon({ size = 14, color = '#8A65FF' }: { size?: number; color?: string }) {
  return <Icon name="edit" size={size} color={color} decorative />;
}

function SparkleIcon({ size = 14, color = '#8A65FF' }: { size?: number; color?: string }) {
  return <Icon name="sparkle" size={size} color={color} decorative />;
}

/* ── Chevron icon for the accordion headers ── */

function ChevronDownIcon({ size = 12, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return <Icon name="chevron-down" size={size} color={color} decorative />;
}

/* ── Task C-end Preview ── */
// Renders a miniature, in-context preview of how this task will look
// to an end user (C-end). The preview consumes the current draft
// directly so changes in the form (description / promptHint / npc lines)
// are reflected live without clicking "save" or running AI generation.

function TaskPreview({ draft }: { draft: TaskContent }) {
  // Per-type visual gradient (matches the C-end task cards)
  const previewGradient: Record<TaskType, string> = {
    checkin: 'linear-gradient(135deg, #8A65FF 0%, #7C3AED 100%)',
    photo: 'linear-gradient(135deg, #FF8C42 0%, #FF6A00 100%)',
    findObject: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    message: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    drawing: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
  };
  const previewImage: Record<TaskType, string> = {
    checkin: '/images/tea-1.jpg',
    photo: '/images/tea-shop-scene.jpg',
    findObject: '/images/tea-shop-scene.jpg',
    message: '/images/tea-3.jpg',
    drawing: '/images/experience-card-hero.jpg',
  };

  // Per-type icon: real PNG paths (no emoji) so the B-end task
  // cards look as professional as the C-end's PNG-based task
  // header. Image-only enforcement per project convention.
  const typeIcon: Record<TaskType, string> = {
    checkin: '/images/glyph-checkin.png',
    photo: '/images/glyph-photo.png',
    findObject: '/images/glyph-find.png',
    message: '/images/glyph-message.png',
    drawing: '/images/glyph-drawing.png',
  };

  return (
    <div className="flex flex-col h-full bg-main">
      {/* Hero strip with type badge (no status bar — this is a preview, not a real phone) */}
      <div
        className="relative mx-2 rounded-xl overflow-hidden shrink-0"
        style={{ height: 76, background: previewGradient[draft.type] }}
      >
        <img
          src={previewImage[draft.type]}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'saturate(1.1) brightness(0.85)' }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(31,24,39,0.25) 0%, rgba(31,24,39,0.6) 100%)',
          }}
        />
        <div className="relative z-10 flex items-center gap-1.5 px-2.5 pt-2">
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center text-[11px]"
            style={{ background: 'rgba(255,255,255,0.92)' }}
          >
            <img
              aria-hidden
              src={typeIcon[draft.type]}
              alt=""
              draggable={false}
              style={{ width: 22, height: 22, objectFit: 'contain' }}
            />
          </div>
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.92)', color: '#1F1827' }}
          >
            {TASK_TYPE_META[draft.type].label}
          </span>
        </div>
        <div className="relative z-10 px-2.5 mt-1.5">
          <h4
            className="text-[12px] font-bold text-white leading-tight truncate"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
          >
            {draft.label || TASK_TYPE_META[draft.type].label}
          </h4>
        </div>
      </div>

      {/* Body — varies by task type, mimicking the C-end task views */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-2.5 py-2 space-y-2">
        {/* Task description */}
        <p className="text-[10px] text-ink-secondary leading-relaxed">
          {draft.description || (
            <span className="italic opacity-60">任务描述未填写,用户将看到此处</span>
          )}
        </p>

        {/* NPC welcome card — shared across all task types */}
        <div
          className="rounded-lg p-1.5 flex items-start gap-1.5"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 140, 66, 0.08) 0%, rgba(245, 158, 11, 0.06) 100%)',
          }}
        >
          <img
            src="/images/npc-avatar.jpg"
            alt="NPC"
            className="w-5 h-5 rounded-full object-cover shrink-0"
          />
          <p className="text-[9.5px] text-ink-body leading-snug">
            {draft.npcWelcome || (
              <span className="italic opacity-60">NPC 开场白未填写</span>
            )}
          </p>
        </div>

        {/* Per-type interactive area */}
        {draft.type === 'checkin' && (
          <div className="bg-white rounded-lg p-2.5 flex flex-col items-center">
            <div className="relative w-12 h-12 flex items-center justify-center mb-1.5">
              <span className="absolute w-10 h-10 rounded-full border-2 border-primary-500/60 animate-pulse-ring" />
              <img
                aria-hidden
                src="/images/glyph-checkin.png"
                alt=""
                draggable={false}
                style={{ width: 24, height: 24, objectFit: 'contain' }}
              />
            </div>
            <p className="text-[9px] text-ink-secondary mb-1.5">
              {draft.promptHint}
            </p>
            <button
              className="w-full py-1.5 rounded-full text-[10px] font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #FF8C42, #FF9347)' }}
            >
              模拟签到
            </button>
          </div>
        )}

        {draft.type === 'photo' && (
          <div className="bg-white rounded-lg p-2.5">
            <div
              className="w-full h-16 rounded-md flex items-center justify-center mb-1.5"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255, 140, 66, 0.12) 0%, rgba(138, 101, 255, 0.08) 100%)',
              }}
            >
              <img
                aria-hidden
                src="/images/glyph-photo.png"
                alt=""
                draggable={false}
                style={{ width: 36, height: 36, objectFit: 'contain' }}
              />
            </div>
            <p className="text-[9px] text-ink-secondary mb-1.5 text-center">
              {draft.promptHint || '选择一张照片,AI 将为你实时点评'}
            </p>
            <button
              className="w-full py-1.5 rounded-full text-[10px] font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #FF8C42, #FF9347)' }}
            >
              拍照 / 选图
            </button>
          </div>
        )}

        {draft.type === 'findObject' && (
          <div className="bg-white rounded-lg p-2.5">
            <div
              className="w-full h-16 rounded-md mb-1.5 relative overflow-hidden"
              style={{ background: previewImage[draft.type] }}
            >
              <img
                src={previewImage.findObject}
                alt=""
                className="w-full h-full object-cover"
                style={{ filter: 'saturate(0.9) brightness(0.9)' }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  aria-hidden
                  src="/images/glyph-find.png"
                  alt=""
                  draggable={false}
                  style={{ width: 28, height: 28, objectFit: 'contain' }}
                />
              </div>
            </div>
            <p className="text-[9px] text-ink-secondary">
              {draft.promptHint || '仔细观察场景图,点击你认为是目标物体的位置'}
            </p>
          </div>
        )}

        {draft.type === 'message' && (
          // Two-stage preview: the left half shows the input state
          // (so the organizer can clearly see "this is where the user
          // types"); the right half shows the post-submit bulletin
          // board. An arrow chip in the middle marks the transition.
          <div
            className="flex items-stretch gap-1.5 rounded-md p-1.5"
            style={{
              background:
                'linear-gradient(180deg, #FAFAF7 0%, #F4F1EA 100%)',
              border: '1px solid #E5E7EB',
            }}
          >
            {/* ── Left: input state ── */}
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <p className="text-[8px] font-bold text-ink-secondary uppercase tracking-wider">
                ① 用户输入
              </p>
              <div
                className="rounded-md px-1.5 py-1 text-[8.5px] text-ink-disabled"
                style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #FF8C42',
                  boxShadow: '0 0 0 2px rgba(255, 140, 66, 0.15)',
                }}
              >
                {draft.promptHint || '写下你的寄语(5-50 字)'}
              </div>
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[7.5px] text-ink-secondary">
                  5–50 字
                </span>
                <span
                  className="text-[7.5px] font-semibold tabular-nums"
                  style={{ color: '#FF8C42' }}
                >
                  {Math.min(50, (draft.promptHint?.length ?? 0))} / 50
                </span>
              </div>
              <button
                className="w-full py-1 rounded-full text-[8.5px] font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #FF8C42, #FF9347)' }}
              >
                贴上留言墙
              </button>
            </div>

            {/* ── Middle: transition arrow ── */}
            <div className="flex flex-col items-center justify-center shrink-0 w-3.5">
              <div
                className="rounded-full w-3.5 h-3.5 flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #FF8C42, #FF9347)',
                  boxShadow: '0 1px 3px rgba(255,140,66,0.35)',
                }}
              >
                <span
                  className="text-white font-bold leading-none"
                  style={{ fontSize: '7px' }}
                >
                  →
                </span>
              </div>
            </div>

            {/* ── Right: bulletin board (post-submit) ── */}
            <div
              className="flex-1 min-w-0 flex flex-col gap-0.5"
            >
              <p className="text-[8px] font-bold text-amber-700 uppercase tracking-wider">
                ② 上墙后
              </p>
              <div
                className="relative flex-1 rounded-md overflow-hidden"
                style={{
                  minHeight: 96,
                  background:
                    'linear-gradient(180deg, #E8D7B8 0%, #D9C29B 100%)',
                  boxShadow:
                    'inset 0 0 0 1px rgba(120, 90, 50, 0.15), 0 3px 8px rgba(120, 90, 50, 0.18)',
                }}
              >
                {/* Paper grain */}
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-50 pointer-events-none"
                  style={{
                    backgroundImage:
                      'radial-gradient(rgba(120, 90, 50, 0.18) 1px, transparent 1px)',
                    backgroundSize: '5px 5px',
                  }}
                />
                {/* User's note — peach, top-left, the visual focus */}
                <div
                  className="absolute rounded-sm px-1.5 py-1"
                  style={{
                    left: '6%',
                    top: '12%',
                    width: '64%',
                    background:
                      'linear-gradient(160deg, #FFE5C2 0%, #FFCB94 100%)',
                    boxShadow:
                      '0 3px 8px rgba(255, 138, 56, 0.32), inset 0 0 0 1px rgba(255,255,255,0.35)',
                    transform: 'rotate(-4deg)',
                    zIndex: 5,
                  }}
                >
                  <img
                    src="/images/pin-cork.jpg"
                    alt=""
                    aria-hidden
                    className="absolute pointer-events-none select-none"
                    style={{
                      top: -3.5,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 8,
                      height: 8,
                      objectFit: 'cover',
                    }}
                    draggable={false}
                  />
                  <p
                    className="text-[8.5px] font-semibold leading-tight"
                    style={{
                      color: '#5C2A0E',
                      fontFamily:
                        '"Ma Shan Zheng", "Noto Serif SC", "Songti SC", serif',
                    }}
                  >
                    "{draft.description || '夏天的第一杯柚子茶'}"
                  </p>
                  <p
                    className="text-right mt-0.5 text-[6.5px] font-bold tracking-wider"
                    style={{ color: '#FF6A00' }}
                  >
                    — 你
                  </p>
                </div>
                {/* Ambient note — mint, top-right */}
                <div
                  className="absolute rounded-sm px-1 py-0.5"
                  style={{
                    right: '3%',
                    top: '8%',
                    width: '38%',
                    background:
                      'linear-gradient(160deg, #D8F3E1 0%, #B6E5C4 100%)',
                    boxShadow:
                      '0 2px 6px rgba(16, 185, 129, 0.22), inset 0 0 0 1px rgba(255,255,255,0.25)',
                    transform: 'rotate(5deg)',
                    zIndex: 3,
                  }}
                >
                  <img
                    src="/images/pin-cork.jpg"
                    alt=""
                    aria-hidden
                    className="absolute pointer-events-none select-none"
                    style={{
                      top: -3,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 6,
                      height: 6,
                      objectFit: 'cover',
                    }}
                    draggable={false}
                  />
                  <p
                    className="text-[6.5px] leading-tight"
                    style={{
                      color: '#1B4D2E',
                      fontFamily:
                        '"Ma Shan Zheng", "Noto Serif SC", "Songti SC", serif',
                    }}
                  >
                    "今天的风是柚子味的"
                  </p>
                  <p
                    className="text-right text-[5.5px] font-bold tracking-wider"
                    style={{ color: '#10B981' }}
                  >
                    — K.
                  </p>
                </div>
                {/* Ambient note — lavender, bottom */}
                <div
                  className="absolute rounded-sm px-1 py-0.5"
                  style={{
                    left: '4%',
                    bottom: '6%',
                    width: '40%',
                    background:
                      'linear-gradient(160deg, #E5DEF6 0%, #CCC1EE 100%)',
                    boxShadow:
                      '0 2px 6px rgba(139, 92, 246, 0.22), inset 0 0 0 1px rgba(255,255,255,0.25)',
                    transform: 'rotate(4deg)',
                    zIndex: 3,
                  }}
                >
                  <img
                    src="/images/pin-cork.jpg"
                    alt=""
                    aria-hidden
                    className="absolute pointer-events-none select-none"
                    style={{
                      top: -3,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 6,
                      height: 6,
                      objectFit: 'cover',
                    }}
                    draggable={false}
                  />
                  <p
                    className="text-[6.5px] leading-tight"
                    style={{
                      color: '#3A2A6B',
                      fontFamily:
                        '"Ma Shan Zheng", "Noto Serif SC", "Songti SC", serif',
                    }}
                  >
                    "把夏天存进这杯茶里"
                  </p>
                  <p
                    className="text-right text-[5.5px] font-bold tracking-wider"
                    style={{ color: '#8B5CF6' }}
                  >
                    — 阿橘
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {draft.type === 'drawing' && (
          // Mirrors the C-end DrawingTask 1:1: a real canvas-shaped
          // drawing area + the 7-color palette + 4-step brush-size
          // selector + clear button + submit button. Sizes are scaled
          // down to fit the preview viewport, but the visual language
          // (white card, dashed pink guide for the canvas, pink CTA)
          // matches exactly so the organizer can read the actual UX
          // at a glance.
          <div className="bg-white rounded-lg p-2">
            {/* Drawing surface — same 1.5px dashed pink border and
                light pink fill as the C-end canvas wrapper. */}
            <div
              className="w-full h-14 rounded-md flex items-center justify-center relative"
              style={{
                background:
                  'linear-gradient(135deg, rgba(236, 72, 153, 0.10) 0%, rgba(219, 39, 119, 0.04) 100%)',
                border: '1.5px dashed rgba(236, 72, 153, 0.3)',
              }}
            >
              <span className="text-[10px] text-ink-disabled italic">
                {draft.promptHint || '在画板上自由涂鸦'}
              </span>
            </div>

            {/* Color palette — same 7 colors as the real task,
                scaled to 5x5 dots so they fit the preview. */}
            <div className="flex items-center gap-1.5 justify-center mt-1.5">
              {[
                '#FF8C42', '#FFD93D', '#22C55E',
                '#3B82F6', '#8A65FF', '#EF4444', '#1F1827',
              ].map((c) => (
                <span
                  key={c}
                  className="rounded-full"
                  style={{
                    width: 6,
                    height: 6,
                    backgroundColor: c,
                    // Highlight the first color (orange = default in
                    // C-end DrawingTask) to signal "current pick".
                    boxShadow: c === '#FF8C42'
                      ? '0 0 0 1.5px #FFFFFF, 0 0 0 2.5px #9CA3AF'
                      : 'none',
                  }}
                />
              ))}
            </div>

            {/* Brush sizes + clear — same layout as the real task. */}
            <div className="flex items-center gap-1.5 justify-center mt-1.5">
              {[2, 4, 8, 12].map((s) => (
                <span
                  key={s}
                  className="rounded-full flex items-center justify-center"
                  style={{
                    width: 11,
                    height: 11,
                    background: s === 4 ? 'rgba(138, 101, 255, 0.12)' : '#F3F4F6',
                  }}
                >
                  <span
                    className="rounded-full"
                    style={{
                      width: s + 1,
                      height: s + 1,
                      backgroundColor: '#FF8C42',
                    }}
                  />
                </span>
              ))}
              <span className="ml-1 px-1.5 h-4 rounded-full bg-neutral-100 text-neutral-500 text-[7.5px] font-medium flex items-center gap-0.5">
                <img
                  aria-hidden
                  src="/images/glyph-trash.png"
                  alt=""
                  draggable={false}
                  style={{ width: 8, height: 8, objectFit: 'contain' }}
                />
                清除
              </span>
            </div>

            {/* Submit — same pink→magenta gradient as C-end "完成绘画". */}
            <button
              className="w-full mt-1.5 py-1.5 rounded-full text-[9.5px] font-semibold text-white flex items-center justify-center gap-1"
              style={{ background: 'linear-gradient(135deg, #EC4899, #DB2777)' }}
            >
              <img
                aria-hidden
                src="/images/glyph-brush.png"
                alt=""
                draggable={false}
                style={{ width: 12, height: 12, objectFit: 'contain' }}
              />
              完成绘画
            </button>
          </div>
        )}

        {/* NPC farewell — always visible at the bottom */}
        <div
          className="rounded-lg p-1.5 flex items-start gap-1.5"
          style={{
            background: 'linear-gradient(135deg, rgba(138, 101, 255, 0.08) 0%, rgba(124, 58, 237, 0.04) 100%)',
          }}
        >
          <img
            src="/images/npc-avatar.jpg"
            alt="NPC"
            className="w-5 h-5 rounded-full object-cover shrink-0"
          />
          <p className="text-[9.5px] text-ink-body leading-snug italic opacity-90">
            {draft.npcFarewell || (
              <span className="italic opacity-60">NPC 结束语未填写</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Task Edit Modal ── */

function TaskEditModal({
  task,
  onClose,
  onSave,
}: {
  task: TaskContent;
  index: number;
  onClose: () => void;
  onSave: (updated: TaskContent) => void;
}) {
  const { state } = useApp();
  const [draft, setDraft] = useState<TaskContent>({ ...task });
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  // Mutually exclusive accordion state. Form is open by default so
  // the organizer can edit immediately; preview is collapsed until
  // explicitly opened (e.g. via the footer's "生成预览" button).
  const [openSections, setOpenSections] = useState<{ form: boolean; preview: boolean }>({
    form: true,
    preview: false,
  });
  // Tracks whether the "AI 生成" button inside the 活动创意 box is
  // currently generating the creative idea. Separate from the
  // outer `generating` prop (which is for the full-task generator).
  const [generatingIdea, setGeneratingIdea] = useState(false);
  // Tracks whether the "应用" button is currently asking the LLM
  // to expand the custom idea into 5 concrete fields.
  const [applyingIdea, setApplyingIdea] = useState(false);
  // After a successful "应用" we briefly flash a confirmation on the
  // button so the organizer knows the fields were updated.
  const [appliedFlash, setAppliedFlash] = useState(false);

  useEffect(() => {
    // Find the phone screen container — modal is portaled there so it sits
    // above the scrollable content area at the highest z-index.
    const target = document.querySelector<HTMLElement>('[data-phone-screen]');
    if (target) setPortalTarget(target);
  }, []);

  // Per-task-type prompt hints to help organizers write a useful
  // customPrompt. Shown in the modal's "活动创意描述" placeholder area.
  const customPromptPlaceholder: Record<TaskType, string> = {
    checkin: '例:让用户在线下门店完成 GPS 签到,完成即可领取夏日特调一杯',
    photo: '例:让用户拍下门店里最打动他的那杯夏日特调,AI 点评后会生成专属海报',
    findObject: '例:让用户在店内找出藏在某个角落的限定小徽章',
    message: '例:让用户写一句关于夏天 / 茶 / 心情的短句,我们会拼成一面留言墙',
    drawing: '例:让用户画出自己心中的柚子形象,优秀作品会被门店收藏展示',
  };

  const fieldConfig = [
    { key: 'description' as const, label: '任务描述', placeholder: '描述任务内容', multiline: true },
    { key: 'promptHint' as const, label: '提示文案', placeholder: '给用户的提示语', multiline: true },
    { key: 'npcWelcome' as const, label: 'NPC 欢迎语', placeholder: 'NPC 对用户说的开场白', multiline: true },
    { key: 'npcFarewell' as const, label: 'NPC 告别语', placeholder: 'NPC 任务完成后的结束语', multiline: true },
  ];

  const toggleSection = (section: 'form' | 'preview') => {
    // Mutually exclusive accordion: opening one closes the other.
    // If the user clicks the currently-open section, it stays open
    // (i.e. we don't allow both to be collapsed at once).
    setOpenSections((prev) => {
      if (prev[section]) {
        // Already open — keep it open (no-op).
        return prev;
      }
      // Opening this section — close the other one.
      return { form: section === 'form', preview: section === 'preview' };
    });
  };

  /**
   * Generates a creative idea (活动创意描述) for the current draft and
   * fills it into the customPrompt textarea. This is the "AI 生成"
   * button at the top of the form — distinct from the footer's
   * "生成预览" button which just switches to the preview section.
   */
  const handleGenerateIdea = async () => {
    if (generatingIdea) return;
    setGeneratingIdea(true);
    try {
      const idea = await aiGenerateCustomPrompt(draft, state.activityConfig);
      if (idea) {
        setDraft((prev) => ({ ...prev, customPrompt: idea }));
      }
    } finally {
      setGeneratingIdea(false);
    }
  };

  /**
   * Footer's "生成预览" button — expands the preview section and
   * collapses the form. The live preview reflects the current draft
   * (no further API call needed).
   */
  const handleGeneratePreview = () => {
    setOpenSections({ form: false, preview: true });
  };

  /**
   * "应用" button next to "AI 生成" — asks the LLM to expand the
   * current `customPrompt` into the 5 task fields (label, description,
   * promptHint, npcWelcome, npcFarewell) and merges them into the
   * draft in one shot. A short confirmation flash on the button
   * gives the organizer feedback that the update succeeded.
   */
  const handleApplyIdea = async () => {
    if (applyingIdea) return;
    if (!draft.customPrompt.trim()) return;
    setApplyingIdea(true);
    try {
      const result = await aiApplyIdeaToTask(draft, state.activityConfig);
      if (result && Object.keys(result).length > 0) {
        setDraft((prev) => ({ ...prev, ...result }));
        setAppliedFlash(true);
        setTimeout(() => setAppliedFlash(false), 1500);
      }
    } finally {
      setApplyingIdea(false);
    }
  };

  // Convenience: is the form/preview currently visible (and gets to take up the body height)?
  const formOpen = openSections.form;
  const previewOpen = openSections.preview;

  const modalContent = (
    <div
      className="absolute inset-0 z-[200] flex items-end justify-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
        animation: 'modalFadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full rounded-t-2xl flex flex-col overflow-hidden relative"
        style={{
          height: '88%',
          maxHeight: '88%',
          animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <div
              className="w-6 h-6 rounded-md overflow-hidden shrink-0 relative"
              style={{ background: TASK_TYPE_IMAGES[task.type].gradient }}
            >
              <img
                src={TASK_TYPE_IMAGES[task.type].src}
                alt=""
                className="w-full h-full object-cover"
                style={{ filter: 'saturate(1.1) brightness(0.95)' }}
              />
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.15) 100%)' }}
              />
            </div>
            <h3 className="text-[13px] font-bold text-ink-primary truncate">{TASK_TYPE_META[task.type].label}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors no-tap-highlight shrink-0"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Body — vertical accordion: 活动创意&文案 + 成品预览, 互斥展开 */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* ── Section 1: 活动创意 + 文案编辑 (form) ── */}
          <div
            className="flex flex-col overflow-hidden min-h-0"
            style={{
              flex: formOpen ? 1 : '0 0 auto',
            }}
          >
            {/* Section header — click to toggle */}
            <button
              type="button"
              onClick={() => toggleSection('form')}
              className="flex items-center gap-2 px-3 py-1.5 shrink-0 no-tap-highlight transition-colors"
              style={{
                background: formOpen
                  ? 'linear-gradient(90deg, rgba(138, 101, 255, 0.10) 0%, transparent 100%)'
                  : '#F8F7FC',
                borderBottom: formOpen ? '1px solid rgba(138, 101, 255, 0.18)' : '1px solid rgba(31, 24, 39, 0.05)',
              }}
            >
              <span
                className="w-5 h-5 rounded-md flex items-center justify-center text-[11px] shrink-0"
                style={{
                  background: formOpen
                    ? 'linear-gradient(135deg, #8A65FF 0%, #7C3AED 100%)'
                    : '#E5E7EB',
                }}
              >
                <img
                  aria-hidden
                  src="/images/glyph-pencil.png"
                  alt=""
                  draggable={false}
                  style={{ width: 12, height: 12, objectFit: 'contain' }}
                />
              </span>
              <span
                className="text-[12px] font-bold leading-none"
                style={{ color: formOpen ? '#7C3AED' : '#6B7280' }}
              >
                活动创意 + 文案编辑
              </span>
              <span
                className="text-[9px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
                style={{
                  background: formOpen ? 'rgba(138, 101, 255, 0.12)' : 'rgba(31, 24, 39, 0.05)',
                  color: formOpen ? '#7C3AED' : '#9CA3AF',
                }}
              >
                主办方输入
              </span>
              <span className="ml-auto inline-flex" style={{ transform: formOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}>
                <ChevronDownIcon size={12} color={formOpen ? '#7C3AED' : '#9CA3AF'} />
              </span>
            </button>

            {/* Section body — only rendered when open */}
            {formOpen && (
              <div className="flex-1 overflow-y-auto scrollbar-hide px-3 py-2 space-y-1.5">
                {/* ── Organizer's custom idea (drives AI generation) ── */}
                <div
                  className="rounded-lg px-2 py-1.5 border relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(138, 101, 255, 0.06) 0%, rgba(255, 140, 66, 0.04) 100%)',
                    borderColor: 'rgba(138, 101, 255, 0.28)',
                    boxShadow: '0 1px 4px rgba(138, 101, 255, 0.08)',
                  }}
                >
                  <div className="flex items-center mb-1 gap-1.5">
                    <label className="flex items-center gap-1 text-[10px] font-bold leading-none shrink-0" style={{ color: '#7C3AED' }}>
                      <SparkleIcon size={10} color="#7C3AED" />
                      活动创意描述
                    </label>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={handleGenerateIdea}
                        disabled={generatingIdea}
                        className="text-[9px] font-semibold px-1.5 py-0.5 rounded inline-flex items-center gap-0.5 no-tap-highlight active:scale-95 transition-all disabled:opacity-70"
                        style={{
                          background: 'linear-gradient(135deg, #8A65FF 0%, #7C3AED 100%)',
                          color: 'white',
                          boxShadow: '0 1px 3px rgba(138, 101, 255, 0.3)',
                        }}
                      >
                        {generatingIdea ? (
                          <>
                            <motion.span
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className="inline-flex"
                            >
                              <SparkleIcon size={8} color="white" />
                            </motion.span>
                            生成中
                          </>
                        ) : (
                          <>
                            <SparkleIcon size={8} color="white" />
                            AI 生成
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyIdea}
                        disabled={applyingIdea || !draft.customPrompt.trim()}
                        title="把创意描述应用到下方 5 个文案字段"
                        className="text-[9px] font-semibold px-1.5 py-0.5 rounded inline-flex items-center gap-0.5 no-tap-highlight active:scale-95 transition-all disabled:opacity-50"
                        style={
                          appliedFlash
                            ? {
                                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                color: 'white',
                                boxShadow: '0 1px 3px rgba(16, 185, 129, 0.35)',
                              }
                            : {
                                background: 'white',
                                color: '#7C3AED',
                                border: '1px solid rgba(138, 101, 255, 0.5)',
                                boxShadow: '0 1px 2px rgba(138, 101, 255, 0.1)',
                              }
                        }
                      >
                        {applyingIdea ? (
                          <>
                            <motion.span
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className="inline-flex"
                            >
                              <SparkleIcon size={8} color="#7C3AED" />
                            </motion.span>
                            应用中
                          </>
                        ) : appliedFlash ? (
                          <>✓ 已应用</>
                        ) : (
                          <>↘ 应用</>
                        )}
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={draft.customPrompt}
                    onChange={(e) => setDraft({ ...draft, customPrompt: e.target.value })}
                    placeholder={customPromptPlaceholder[task.type]}
                    rows={2}
                    className="w-full text-[12px] leading-snug text-ink-primary bg-white/60 rounded px-1.5 py-1 border border-white focus:border-primary-400 focus:bg-white focus:outline-none resize-none transition-colors placeholder:text-ink-disabled"
                    style={{ minHeight: 36 }}
                  />
                  <p className="text-[9px] text-ink-secondary leading-none mt-1 opacity-70">
                    围绕「{TASK_TYPE_META[task.type].label}」主题,描述你想要的个性化内容。AI 将以此生成下方 5 项文案
                  </p>
                </div>

                {fieldConfig.map((field) => (
                  <div key={field.key} className="bg-neutral-50 rounded-lg px-2 py-1 border border-gray-100">
                    <label className="block text-[10px] font-semibold text-ink-secondary leading-none mb-0.5">
                      {field.label}
                    </label>
                    {field.multiline ? (
                      <textarea
                        value={draft[field.key]}
                        onChange={(e) => setDraft({ ...draft, [field.key]: e.target.value })}
                        placeholder={field.placeholder}
                        rows={1}
                        className="w-full text-[12px] leading-snug text-ink-primary bg-transparent rounded px-0 py-0.5 border-0 focus:outline-none resize-none transition-colors placeholder:text-ink-disabled"
                        style={{ minHeight: 20 }}
                      />
                    ) : (
                      <input
                        type="text"
                        value={draft[field.key]}
                        onChange={(e) => setDraft({ ...draft, [field.key]: e.target.value })}
                        placeholder={field.placeholder}
                        className="w-full text-[12px] text-ink-primary bg-transparent rounded px-0 py-0 border-0 focus:outline-none transition-colors placeholder:text-ink-disabled"
                        style={{ height: 18 }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Section 2: 成品预览 (preview) ── */}
          <div
            className="flex flex-col overflow-hidden min-h-0"
            style={{
              flex: previewOpen ? 1 : '0 0 auto',
            }}
          >
            {/* Section header — click to toggle */}
            <button
              type="button"
              onClick={() => toggleSection('preview')}
              className="flex items-center gap-2 px-3 py-1.5 shrink-0 no-tap-highlight transition-colors border-t border-gray-100"
              style={{
                background: previewOpen
                  ? 'linear-gradient(90deg, rgba(138, 101, 255, 0.10) 0%, transparent 100%)'
                  : '#F8F7FC',
                borderBottom: previewOpen ? '1px solid rgba(138, 101, 255, 0.18)' : '1px solid rgba(31, 24, 39, 0.05)',
              }}
            >
              <span
                className="w-5 h-5 rounded-md flex items-center justify-center text-[11px] shrink-0"
                style={{
                  background: previewOpen
                    ? 'linear-gradient(135deg, #8A65FF 0%, #7C3AED 100%)'
                    : '#E5E7EB',
                }}
              >
                <img
                  aria-hidden
                  src="/images/glyph-phone.png"
                  alt=""
                  draggable={false}
                  style={{ width: 12, height: 12, objectFit: 'contain' }}
                />
              </span>
              <span
                className="text-[12px] font-bold leading-none"
                style={{ color: previewOpen ? '#7C3AED' : '#6B7280' }}
              >
                成品预览
              </span>
              <span
                className="text-[9px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
                style={{
                  background: previewOpen ? 'rgba(138, 101, 255, 0.12)' : 'rgba(31, 24, 39, 0.05)',
                  color: previewOpen ? '#7C3AED' : '#9CA3AF',
                }}
              >
                {previewOpen ? '实时同步中' : '点击展开'}
              </span>
              <span className="ml-auto inline-flex" style={{ transform: previewOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}>
                <ChevronDownIcon size={12} color={previewOpen ? '#7C3AED' : '#9CA3AF'} />
              </span>
            </button>

            {/* Section body — only rendered when open */}
            {previewOpen && (
              <div className="flex-1 overflow-hidden p-2">
                <div
                  className="h-full rounded-xl bg-white overflow-hidden"
                  style={{
                    boxShadow: '0 2px 8px rgba(31, 24, 39, 0.08), 0 0 0 1px rgba(31, 24, 39, 0.04)',
                  }}
                >
                  <TaskPreview draft={draft} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex gap-1.5 px-3 py-2 border-t border-gray-100 shrink-0"
          style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
        >
          <button
            onClick={handleGeneratePreview}
            className="h-8 px-2.5 rounded-lg text-[11px] font-semibold no-tap-highlight active:scale-95 transition-all flex items-center gap-1"
            style={{
              background: 'linear-gradient(135deg, #8A65FF 0%, #7C3AED 100%)',
              color: 'white',
              boxShadow: '0 2px 6px rgba(138, 101, 255, 0.22)',
            }}
          >
            <SparkleIcon size={10} color="white" />
            生成预览
          </button>
          <button
            onClick={onClose}
            className="flex-1 h-8 rounded-lg border border-gray-200 text-[11px] font-medium text-ink-secondary no-tap-highlight active:scale-95 transition-transform"
          >
            取消
          </button>
          <button
            onClick={() => onSave(draft)}
            className="flex-1 h-8 rounded-lg text-white text-[11px] font-semibold no-tap-highlight active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(135deg, #FF8C42, #FF9347)' }}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );

  if (!portalTarget) return null;
  return createPortal(modalContent, portalTarget);
}

/* ── Main Component ── */

export default function TaskOrchestration() {
  const { state, setPhase, setTasks, setGuidanceStep } = useApp();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    setGuidanceStep(4);
  }, [setGuidanceStep]);

  /**
   * Build the task list shown in this view.
   * - If the global state already has tasks and they match the currently
   *   selected task types, use them as-is.
   * - Otherwise, project from `config.taskTypes` (the user's selection on the
   *   previous step): include any preset task whose type is selected, and
   *   synthesize an empty stub for selected types that have no preset.
   * This guarantees that toggling a task type on the previous screen
   * immediately changes what shows up here.
   */
  const tasks: TaskContent[] = useMemo(() => {
    const selected = state.activityConfig.taskTypes;
    if (selected.length === 0) {
      return state.tasks.length > 0 ? state.tasks : presetTasks;
    }

    const byType = new Map<TaskType, TaskContent>();
    for (const t of state.tasks) byType.set(t.type, t);
    for (const t of presetTasks) if (!byType.has(t.type)) byType.set(t.type, t);

    return selected.map((type) => byType.get(type) ?? createEmptyTask(type));
  }, [state.activityConfig.taskTypes, state.tasks]);

  const handleNext = () => {
    setPhase('b-publishing');
  };

  const handleTaskClick = (i: number) => {
    setEditingIndex(i);
  };

  const handleSaveTask = (updated: TaskContent) => {
    if (editingIndex === null) return;
    const newTasks = [...tasks];
    newTasks[editingIndex] = updated;
    setTasks(newTasks);
    setEditingIndex(null);
  };

  const selectedTypesLabel = state.activityConfig.taskTypes
    .map((t) => TASK_TYPE_META[t].label)
    .join(' · ');

  /**
   * Hero progress: % of the orchestration done.
   * Counts: every selected task type whose content has at least one
   * non-empty field (label / description / prompt / welcome / farewell).
   * The progress bar in the hero visualises how much of the work is complete.
   */
  const orchestrationPct = useMemo(() => {
    if (tasks.length === 0) return 0;
    const total = tasks.length;
    const filled = tasks.filter(
      (t) =>
        (t.description && t.description.length > 0) ||
        (t.promptHint && t.promptHint.length > 0) ||
        (t.npcWelcome && t.npcWelcome.length > 0) ||
        (t.npcFarewell && t.npcFarewell.length > 0),
    ).length;
    return Math.round((filled / total) * 100);
  }, [tasks]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-full bg-main"
    >
      {/* ── Top hero header (image + gradient + step indicator) ── */}
      <div className="px-3.5 pt-3.5 pb-2 shrink-0">
        <div
          className="relative overflow-hidden"
          style={{ height: 132, borderRadius: 20 }}
        >
          {/* Background image */}
          <img
            src="/images/orchestration-hero.jpg"
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
              onClick={() => setPhase('b-config')}
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
                2 / 3
              </span>
            </div>
          </div>

          {/* Title + subtitle + progress */}
          <div className="relative z-10 px-4 mt-1.5 text-white">
            <h1 className="text-[19px] font-bold leading-tight" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.18)' }}>
              任务编排
            </h1>
            <p className="text-[11px] mt-0.5 opacity-90" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.18)' }}>
              为活动精心编排每一个互动环节
            </p>

            {/* Progress bar */}
            <div className="mt-2 flex items-center gap-2.5">
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.25)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #FF8C42 0%, #FFB066 100%)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(orchestrationPct, 8)}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>
              <span className="text-[10.5px] font-semibold tabular-nums" style={{ minWidth: 32 }}>
                {orchestrationPct}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Selected task types summary (linked to previous step) ── */}
      {selectedTypesLabel && (
        <div className="px-4 mt-4">
          <div
            className="rounded-2xl px-3.5 py-2.5 flex items-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
              border: '1px solid rgba(138, 101, 255, 0.18)',
            }}
          >
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8A65FF 0%, #7C3AED 100%)' }}>
              <SparkleIcon size={11} color="white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold leading-none" style={{ color: '#7C3AED' }}>
                上一环节已选
              </p>
              <p className="text-[12px] font-semibold text-ink-primary leading-tight mt-0.5 truncate">
                {selectedTypesLabel}
              </p>
            </div>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
              style={{ background: 'white', color: '#8A65FF', boxShadow: '0 1px 2px rgba(138,101,255,0.18)' }}
            >
              {tasks.length} 项
            </span>
          </div>
        </div>
      )}

      {/* ── Section header ── */}
      <div className="flex items-center justify-between px-4 mt-5 mb-3">
        <h2 className="text-sm font-semibold text-ink-primary">活动任务</h2>
        <span className="text-xs text-ink-secondary flex items-center gap-1">
          <PencilIcon size={11} color="#8A65FF" />
          点击卡片编辑内容
        </span>
      </div>

      {/* ── Task cards (editable on click) ── */}
      <div className="px-4 space-y-2.5">
        {tasks.map((task, i) => {
          const typeMeta = TASK_TYPE_IMAGES[task.type];
          const isEmpty =
            !task.description && !task.promptHint && !task.npcWelcome && !task.npcFarewell;
          return (
            <motion.button
              key={`${task.type}-${i}`}
              type="button"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.06, duration: 0.3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleTaskClick(i)}
              className="group relative w-full bg-white rounded-2xl pl-3 pr-3.5 py-3 flex items-center gap-3 cursor-pointer no-tap-highlight text-left"
              style={{
                border: '1.5px dashed rgba(138, 101, 255, 0.32)',
                boxShadow: '0 2px 8px rgba(31, 24, 39, 0.04)',
                background: isEmpty
                  ? 'linear-gradient(180deg, #FFFFFF 0%, #FAFAFF 100%)'
                  : 'white',
              }}
            >
              {/* Number circle */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[12px] font-bold shrink-0"
                style={{ background: 'linear-gradient(135deg, #8A65FF, #7C3AED)' }}
              >
                {i + 1}
              </div>

              {/* Type icon (real image with colored gradient frame) */}
              <div
                className="w-10 h-10 rounded-xl overflow-hidden shrink-0 relative"
                style={{
                  background: typeMeta.gradient,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                <img
                  src={typeMeta.src}
                  alt={TASK_TYPE_META[task.type].label}
                  className="w-full h-full object-cover"
                  style={{ filter: 'saturate(1.1) brightness(0.92)' }}
                />
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.25) 100%)' }}
                />
              </div>

              {/* Title + meta (no description) */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-[14px] font-bold text-ink-primary leading-tight truncate">
                    {TASK_TYPE_META[task.type].label}
                  </h3>
                  {isEmpty && (
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
                      style={{ background: '#FFF7ED', color: '#FF8C42' }}
                    >
                      待完善
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-ink-secondary leading-none mt-1 truncate">
                  {TASK_TYPE_META[task.type].label} · 点击编辑文案
                </p>
              </div>

              {/* Edit affordance — a small edit icon */}
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform"
                style={{
                  background: 'rgba(138, 101, 255, 0.08)',
                  color: '#8A65FF',
                }}
                aria-hidden="true"
              >
                <PencilIcon size={13} color="#8A65FF" />
              </div>

              {/* Subtle hover border accent */}
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  boxShadow: '0 0 0 2px rgba(138, 101, 255, 0.32)',
                }}
              />
            </motion.button>
          );
        })}
      </div>

      {/* ── Bottom area: Next button only (AI generation lives in the edit modal) ── */}
      <div className="sticky bottom-0 bg-main px-4 pt-4 pb-4 mt-4">
        {/* Next button (orange) */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleNext}
          className="w-full h-12 rounded-md font-semibold text-base text-white shadow-accent no-tap-highlight flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #FF8C42, #FF9347)' }}
        >
          下一步
        </motion.button>
      </div>

      {/* ── Task Edit Modal ── */}
      <AnimatePresence>
        {editingIndex !== null && (
          <TaskEditModal
            task={tasks[editingIndex]}
            index={editingIndex}
            onClose={() => setEditingIndex(null)}
            onSave={handleSaveTask}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
