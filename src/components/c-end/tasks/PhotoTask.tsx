import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '../../../context/AppContext';
import TaskHeader from './TaskHeader';
import { generatePhotoComment } from '../../../services/api';
import { samplePhotos } from '../../../data/defaults';
import type { TaskResult } from '../../../types';

interface Props {
  onComplete: (result: TaskResult) => void;
}

type Phase = 'select' | 'loading' | 'result';

/**
 * Load a static image asset and convert it to a base64 data URL.
 * Used to persist the user's real photo selection into the
 * experience card, so the card shows their actual image bytes
 * (not a static image path that may change later).
 */
async function fetchPhotoAsDataUrl(src: string): Promise<string> {
  const res = await fetch(src);
  if (!res.ok) throw new Error(`Failed to fetch ${src}`);
  const blob = await res.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.readAsDataURL(blob);
  });
}

export default function PhotoTask({ onComplete }: Props) {
  const { state } = useApp();
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('select');
  const [comment, setComment] = useState('');
  // Captured image bytes for the experience card. We load this when
  // the user confirms so the card can show their real selection
  // (not a static asset keyed off photoId).
  const [photoData, setPhotoData] = useState<string | undefined>(undefined);

  const handleConfirm = async () => {
    if (selectedPhoto === null) return;
    setPhase('loading');
    const photo = samplePhotos[selectedPhoto];
    // Try to load the actual photo bytes as a data URL so the
    // experience card can show the user's real selection, not just
    // a static image by id. If the asset can't be loaded (offline
    // demo, dev view, etc.) we fall back to the photoId path.
    let captured: string | undefined;
    try {
      captured = await fetchPhotoAsDataUrl(
        `/images/tea-${(selectedPhoto ?? 0) + 1}.jpg`
      );
    } catch {
      captured = undefined;
    }
    setPhotoData(captured);
    try {
      const c = await generatePhotoComment(
        state.activityConfig.brandName,
        photo?.label ?? '',
      );
      setComment(c);
      setPhase('result');
    } catch (e) {
      // 兜底：失败直接放行,避免卡住
      setComment('这张照片很有夏天的味道,酸酸甜甜的柚香扑面而来～');
      setPhase('result');
    }
  };

  return (
    <div className="flex flex-col h-full p-3 pb-6 overflow-y-auto scrollbar-hide">
      {/* TaskHeader is only shown in the "select" and "loading"
          phases. The "result" phase has its own photo-as-hero
          moment (the user's uploaded shot is the visual focus),
          so the wooden sign would be redundant and crowd the
          judging card. */}
      {phase !== 'result' && <TaskHeader type="photo" />}

      <AnimatePresence mode="wait">
        {phase === 'select' && (
          <motion.div
            key="select"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 min-h-0 flex flex-col"
          >
            {/* Upload zone — soft neumorphic card with cloud + icon */}
            <motion.button
              whileTap={{ scale: 0.99 }}
              onClick={() => {
                // simulate "open file picker" by jumping to first unsent photo
                if (selectedPhoto === null) setSelectedPhoto(0);
              }}
              className="relative w-full rounded-2xl flex flex-col items-center justify-center gap-2 mb-3 shrink-0 transition-colors"
              style={{
                background: 'linear-gradient(145deg, #FAFAFA 0%, #F4F4F5 100%)',
                height: 110,
                boxShadow:
                  '6px 6px 14px rgba(0, 0, 0, 0.05), ' +
                  '-4px -4px 10px rgba(255, 255, 255, 0.9), ' +
                  'inset 0 1px 2px rgba(255, 255, 255, 0.7)',
              }}
            >
              {/* Icon — white raised circle, orange accent */}
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(145deg, #FFFFFF 0%, #F5F5F7 100%)',
                  boxShadow:
                    '3px 3px 6px rgba(0, 0, 0, 0.06), ' +
                    '-2px -2px 4px rgba(255, 255, 255, 0.9), ' +
                    'inset 0 1px 2px rgba(255, 255, 255, 0.8)',
                }}
              />
              <p className="text-[15px] font-semibold text-ink-primary tracking-wide">点击上传照片</p>
              <p className="text-[11px] text-ink-secondary">支持 JPG / PNG · 单张 ≤ 10MB</p>
            </motion.button>

            {/* Album strip — three pre-loaded sample photos to "upload".
                We constrain each cell to a fixed 110×110 square so the
                row never grows to fill the flex column and push the
                submit button off-screen. */}
            <div className="flex items-center justify-between mb-2 px-1 shrink-0">
              <p className="text-sm font-semibold text-ink-primary">从相册选择</p>
              <p className="text-[10px] text-ink-tertiary">{samplePhotos.length} 张备选</p>
            </div>
            <div className="grid grid-cols-3 gap-1.5 justify-items-center shrink-0">
              {samplePhotos.map((photo, idx) => (
                <motion.button
                  key={photo.id}
                  whileTap={{ scale: 0.96 }}
                  whileHover={{ y: -2 }}
                  onClick={() => setSelectedPhoto(idx)}
                  className="relative rounded-xl overflow-hidden shadow-card bg-white"
                  style={{
                    width: 86,
                    height: 86,
                    outline: selectedPhoto === idx ? '3px solid #FF8C42' : '2px solid transparent',
                    outlineOffset: selectedPhoto === idx ? '-2px' : '0',
                    transition: 'outline 0.15s',
                  }}
                >
                  <img src={`/images/tea-${idx + 1}.jpg`} alt={photo.label} className="absolute inset-0 w-full h-full object-cover" />
                  {/* Upload progress overlay when selected */}
                  {selectedPhoto === idx && (
                    <div
                      className="absolute inset-0 flex items-end"
                      style={{ background: 'linear-gradient(180deg, rgba(255,140,66,0) 50%, rgba(0,0,0,0.55) 100%)' }}
                    >
                      <div className="w-full px-1.5 pb-1.5">
                        <div className="flex items-center gap-1 mb-1">
                          <span
                            className="inline-flex items-center justify-center"
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: 999,
                              background: '#22C55E',
                              color: '#FFFFFF',
                              fontSize: 8,
                              lineHeight: 1,
                            }}
                          >
                            ✓
                          </span>
                          <span className="text-[9px] text-white font-semibold">已选中</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Filename label */}
                  <div
                    className="absolute top-1 left-1 rounded px-1 py-0.5 text-[8px] font-mono font-semibold backdrop-blur"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', color: 'white' }}
                  >
                    IMG_0{idx + 1}
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Submit button */}
            <button
              onClick={handleConfirm}
              disabled={selectedPhoto === null}
              className="mt-2 rounded-full py-2.5 font-bold text-sm text-white no-tap-highlight transition-transform shrink-0"
              style={{
                background: selectedPhoto !== null
                  ? 'linear-gradient(135deg, #FF8C42 0%, #FF9347 100%)'
                  : '#E5E7EB',
                boxShadow: selectedPhoto !== null ? '0 4px 16px rgba(255, 140, 66, 0.35)' : 'none',
                opacity: selectedPhoto !== null ? 1 : 0.6,
              }}
            >
              {selectedPhoto !== null ? '上传并获取点评' : '请先选择照片'}
            </button>
          </motion.div>
        )}

        {phase === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 min-h-0 flex flex-col items-center justify-center gap-3"
            style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #FFF7EC 100%)' }}
          >
            <div className="relative">
              <img
                src="/images/npc-avatar.jpg"
                alt="柚子店长"
                className="w-16 h-16 rounded-full object-cover"
                style={{ boxShadow: '0 8px 24px rgba(255, 140, 66, 0.25)' }}
              />
              <div
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: '#FFFFFF' }}
              >
                <div
                  className="w-4 h-4 border-2 rounded-full"
                  style={{
                    borderColor: '#FF8C42',
                    borderTopColor: 'transparent',
                    animation: 'spin 1s linear infinite',
                  }}
                />
              </div>
            </div>
            <p className="text-sm font-medium text-ink-body">柚子店长正在品味这张照片…</p>
          </motion.div>
        )}

        {phase === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 min-h-0 flex flex-col"
          >
            {/* Selected photo preview */}
            <div
              className="relative rounded-2xl overflow-hidden shadow-card mb-3 shrink-0"
              style={{ height: 180 }}
            >
              <img
                src={`/images/tea-${(selectedPhoto ?? 0) + 1}.jpg`}
                alt={samplePhotos[selectedPhoto ?? 0]?.label ?? '作品'}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.6) 100%)' }}
              />
              <div
                className="absolute bottom-2 left-2.5 right-2.5 flex items-end justify-between"
              >
                <span
                  className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide backdrop-blur"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.92)', color: '#8A65FF' }}
                >
                  你拍的这张
                </span>
                <span className="text-[10px] text-white/90 font-semibold">0{(selectedPhoto ?? 0) + 1}</span>
              </div>
            </div>

            {/* AI comment card — sized to match the signed "name"
                row, not a full-width hero panel. The previous
                version used a fixed 168-px min-height that left a
                lot of empty space below short comments. New size:
                compact, hugs the comment text + signature, with
                the 店长推荐 stamp floating on top-left as the
                page's only visual anchor. */}
            <div
              className="relative rounded-2xl shadow-card"
              style={{
                background: 'linear-gradient(180deg, #FFFDF8 0%, #FFF7EC 100%)',
                minHeight: 92,
              }}
            >
              {/* Top-left red stamp decoration (店长推荐) */}
              <div
                className="absolute -top-2 -left-2 w-14 h-14 rounded-full flex items-center justify-center pointer-events-none z-10"
                style={{
                  background: 'linear-gradient(135deg, #E63946 0%, #C81E2C 100%)',
                  boxShadow: '0 3px 8px rgba(230, 57, 70, 0.35), inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.15)',
                  transform: 'rotate(-12deg)',
                }}
              >
                <div
                  className="absolute inset-1 rounded-full"
                  style={{ border: '1.5px dashed rgba(255, 255, 255, 0.55)' }}
                />
                <div className="text-center leading-tight">
                  <div className="text-[9px] font-bold text-white tracking-tighter" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.2)' }}>
                    店长
                  </div>
                  <div className="text-[10px] font-extrabold text-white" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.2)' }}>
                    推荐
                  </div>
                </div>
              </div>

              {/* Top-right: small gold disc accent (replaces the
                  previous 8-point star SVG). The disc echoes the
                  shape language of the 店长推荐 stamp on the left
                  and the 印章 style used elsewhere. */}
              <span
                aria-hidden
                className="absolute top-2.5 right-2.5 inline-block z-10 pointer-events-none"
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background:
                    'radial-gradient(circle at 35% 30%, #FFE39A 0%, #F2B43D 70%, #A66B12 100%)',
                  boxShadow:
                    '0 0 0 1.5px rgba(255, 255, 255, 0.85), ' +
                    '0 1px 2px rgba(0,0,0,0.15)',
                }}
              />

              <div className="pl-14 pr-5 pt-2.5 pb-3.5">
                {/* Decorative opening quote — comment text (no rating) */}
                <div className="relative pl-2.5 mb-1.5 pr-1">
                  <span
                    className="absolute left-0 top-0 text-2xl font-extrabold leading-none select-none"
                    style={{ color: '#FF8C42', opacity: 0.35 }}
                  >
                    "
                  </span>
                  <p
                    className="text-[12.5px] text-ink-body font-medium"
                    style={{ letterSpacing: '0.01em', lineHeight: '1.55' }}
                  >
                    {comment}
                  </p>
                  <span
                    className="absolute right-0 -bottom-0.5 text-2xl font-extrabold leading-none select-none"
                    style={{ color: '#FF8C42', opacity: 0.35 }}
                  >
                    "
                  </span>
                </div>

                {/* Signed name — right-aligned below the comment, not in the corner */}
                <p
                  className="text-[9.5px] italic font-semibold text-right"
                  style={{ color: '#C2410C' }}
                >
                  — 柚子店长
                </p>
              </div>
            </div>

            {/* Complete button */}
            <button
              onClick={() =>
                onComplete({
                  type: 'photo',
                  photoComment: comment,
                  // Persist the user's real selection as a data URL so
                  // the experience card can show the actual image
                  // they chose (not just a static asset by id).
                  photoData,
                })
              }
              className="mt-2 rounded-full py-3 font-bold text-sm text-white no-tap-highlight transition-transform hover:scale-105 active:scale-95 shrink-0"
              style={{
                background: 'linear-gradient(135deg, #FF8C42 0%, #FF9347 100%)',
                boxShadow: '0 4px 16px rgba(255, 140, 66, 0.35)',
              }}
            >
              收下点评 · 继续
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
