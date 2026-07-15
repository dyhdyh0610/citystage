import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Icon } from "../Icon";
import { presetTasks, createEmptyTask, TASK_TYPE_META } from '../../data/defaults';
import { aiGenerateCustomPrompt, aiApplyIdeaToTask } from '../../services/api';
import type { TaskContent, TaskType } from '../../types';
import CheckinTask from '../c-end/tasks/CheckinTask';
import PhotoTask from '../c-end/tasks/PhotoTask';
import FindObjectTask from '../c-end/tasks/FindObjectTask';
import MessageTask from '../c-end/tasks/MessageTask';
import DrawingTask from '../c-end/tasks/DrawingTask';

/* ── Inline SVG Icons ── */


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
    src: '/images/task-checkin.jpg',
    gradient: 'linear-gradient(135deg, #8A65FF 0%, #7C3AED 100%)',
    tint: 'rgba(138, 101, 255, 0.18)',
  },
  photo: {
    src: '/images/tea-shop-scene.jpg',
    gradient: 'linear-gradient(135deg, #FF8C42 0%, #FF6A00 100%)',
    tint: 'rgba(255, 140, 66, 0.18)',
  },
  findObject: {
    src: '/images/task-find-object.jpg',
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    tint: 'rgba(16, 185, 129, 0.18)',
  },
  message: {
    src: '/images/task-message.jpg',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    tint: 'rgba(245, 158, 11, 0.18)',
  },
  drawing: {
    src: '/images/task-drawing.jpg',
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
  /* ── WYSIWYG preview for the B-end ──
   *
   * Renders the *real* C-end task component (the same JSX a user
   * would see on their phone) so the organizer can verify the
   * user experience while editing.
   *
   * Mechanics:
   *   1. Temporarily swap state.tasks to [draft] and reset
   *      currentTaskIndex to 0 so the C-end component's derived
   *      currentTask reads our draft.
   *   2. Render the matching C-end task component (CheckinTask,
   *      PhotoTask, …) inside a PhoneShell, with a no-op
   *      onComplete so the user can't actually advance state.
   *   3. Restore the previous tasks + index in a cleanup so the
   *      B-end isn't left in a polluted state.
   *
   * Per project rule, the C-end TaskHeader is part of the actual
   * user view and IS still rendered — we just removed the B-end's
   * previous bespoke "preview hero strip" that duplicated it. The
   * C-end body now speaks for itself. */

  const { state, setTasks, setCurrentTask } = useApp();
  const [activeDraft, setActiveDraft] = useState<TaskContent>(draft);

  useEffect(() => { setActiveDraft(draft); }, [draft]);

  useEffect(() => {
    const prevTasks = state.tasks;
    const prevIndex = state.currentTaskIndex;
    setTasks([draft]);
    setCurrentTask(0);
    return () => {
      setTasks(prevTasks);
      setCurrentTask(prevIndex);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    draft.type,
    draft.label,
    draft.description,
    draft.promptHint,
    draft.npcWelcome,
    draft.npcFarewell,
  ]);

  const renderTaskBody = () => {
    const noop = () => undefined;
    switch (activeDraft.type) {
      case 'checkin':
        return <CheckinTask onComplete={noop} />;
      case 'photo':
        return <PhotoTask onComplete={noop} />;
      case 'findObject':
        return <FindObjectTask onComplete={noop} />;
      case 'message':
        return <MessageTask onComplete={noop} compact />;
      case 'drawing':
        return <DrawingTask onComplete={noop} />;
      default:
        return null;
    }
  };

  return (
    /* Simulated iPhone viewport (360×640) for the B-end preview.
       We give the C-end task component a fixed pixel viewport so:
         - h-full in MessageTask resolves to 640px (a real phone)
         - mt-auto on the submit button pins it to the bottom
         - the message task's own overflow-y-auto handles overflow
       This matches what a real C-end user sees on their phone.
       The outer white card scales the 360px down via maxWidth:100%
       if the modal viewport is narrower. */
    <div
      className="h-full w-full overflow-hidden flex items-stretch justify-center p-2"
      style={{ background: '#FBF3E0' }}
    >
      <div
        style={{
          width: 360,
          maxWidth: '100%',
          height: 640,
          maxHeight: '100%',
          aspectRatio: '9 / 16',
          background: '#FBF3E0',
          borderRadius: 16,
          boxShadow: '0 4px 18px rgba(31, 24, 39, 0.10)',
          overflow: 'hidden',
          display: 'flex',
        }}
      >
        <div style={{ width: '100%', height: '100%' }}>{renderTaskBody()}</div>
      </div>
    </div>
  );
}


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
          style={{ height: 80, borderRadius: 20 }}
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

          {/* Top row: title (left) + 2/3 step badge (right) on the same line */}
          <div className="relative z-10 flex items-center justify-between gap-2 px-4 pt-2.5">
            <h1
              className="text-[17px] font-bold leading-none text-white"
              style={{ textShadow: '0 2px 8px rgba(0,0,0,0.18)' }}
            >
              任务编排
            </h1>
            <div
              className="h-7 px-3 rounded-full flex items-center gap-1.5 shrink-0"
              style={{
                background: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span className="text-[11px] font-bold" style={{ color: '#8A65FF' }}>
                2 / 3
              </span>
            </div>
          </div>

          {/* Subtitle + progress — same px-4 so the subtitle aligns with the title */}
          <div className="relative z-10 px-4 mt-1 text-white">
            <p className="text-[10.5px] leading-none opacity-90" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.18)' }}>
              为活动精心编排每一个互动环节
            </p>

            {/* Progress bar */}
            <div className="mt-1.5 flex items-center gap-2.5">
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

      {/* ── Bottom area: 上一步 / 下一步 ── */}
      <div className="sticky bottom-0 bg-main px-4 pt-4 pb-4 mt-4">
        <div className="flex items-center gap-2">
          {/* 上一步 — back to BEndConfig */}
          <motion.button
            type="button"
            onClick={() => setPhase('b-config')}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="shrink-0 rounded-md font-semibold text-sm no-tap-highlight transition-all flex items-center justify-center"
            style={{
              height: 48,
              width: 96,
              background: '#FFFFFF',
              color: '#7B3F0F',
              border: '1.5px solid rgba(123, 63, 15, 0.18)',
              boxShadow: '0 4px 12px rgba(31, 24, 39, 0.06)',
              cursor: 'pointer',
            }}
            aria-label="返回上一步"
          >
            上一步
          </motion.button>

          {/* 下一步 — primary action */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNext}
            className="flex-1 h-12 rounded-md font-semibold text-base text-white shadow-accent no-tap-highlight flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #FF8C42, #FF9347)' }}
          >
            下一步
          </motion.button>
        </div>
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
