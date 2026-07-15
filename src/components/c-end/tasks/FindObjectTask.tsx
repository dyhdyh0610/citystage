import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import TaskHeader from './TaskHeader';
import type { TaskResult } from '../../../types';

interface Props {
  onComplete: (result: TaskResult) => void;
}

type Phase = 'exploring' | 'found';

/**
 * Translate a click position (% of scene) into a Chinese direction
 * phrase used in the experience card and feedback line. This lets
 * the card reflect where the user *actually* clicked, instead of a
 * hard-coded "在转角的风铃后面" string.
 */
function describePosition(xPct: number, yPct: number): string {
  const horizontal =
    xPct < 33 ? '左侧' : xPct > 66 ? '右侧' : '画面中间';
  const vertical = yPct < 33 ? '上方' : yPct > 66 ? '下方' : '中部';
  return `在${horizontal}${vertical}`;
}

export default function FindObjectTask({ onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('exploring');
  // 预先在图片中"埋"一个小柚子，位置以百分比表达，方便跨屏
  const mascotPos = useMemo(() => ({ x: 68, y: 42 }), []);
  // Remember the exact spot the user clicked, so the experience
  // card can say "在右侧中部找到" instead of a generic sentence.
  const [foundAt, setFoundAt] = useState<{ x: number; y: number } | null>(
    null
  );

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (phase !== 'exploring') return;
    // 距离 mascotPos 25% 内算"找到"
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    const dx = xPct - mascotPos.x;
    const dy = yPct - mascotPos.y;
    if (Math.hypot(dx, dy) <= 18) {
      setPhase('found');
      setFoundAt({ x: xPct, y: yPct });
    }
  };

  const findFeedback = foundAt
    ? `${describePosition(foundAt.x, foundAt.y)}找到啦`
    : '找到了';

  return (
    <div className="flex flex-col h-full p-3 overflow-y-auto scrollbar-hide">
      <TaskHeader type="findObject" />

      {/* Scene with hidden mascot */}
      <div className="flex-1 min-h-0">
        <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-2 px-1">点击你看到的小柚子</p>
        <div
          onClick={handleClick}
          className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden shadow-card cursor-crosshair"
        >
          <img
            src="/images/tea-shop-scene.jpg"
            alt="门店场景"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Hint chip when exploring */}
          {phase === 'exploring' && (
            <div
              className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-semibold tracking-wide backdrop-blur"
              style={{ background: 'rgba(255, 255, 255, 0.9)', color: '#8A65FF', boxShadow: '0 2px 8px rgba(138, 101, 255, 0.2)' }}
            >
              在画面里找一找
            </div>
          )}

          {/* Hidden mascot marker — only visible after user finds it */}
          <AnimatePresence>
            {phase === 'found' && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="absolute z-10"
                style={{ left: `${mascotPos.x}%`, top: `${mascotPos.y}%` }}
              >
                <div className="relative -translate-x-1/2 -translate-y-1/2">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center backdrop-blur"
                    style={{
                      background: 'rgba(255, 255, 255, 0.92)',
                      boxShadow: '0 6px 20px rgba(255, 140, 66, 0.45)',
                    }}
                  >
                    <img
                      src="/images/youjian-pin.jpg"
                      alt="小柚子"
                      className="w-11 h-11 rounded-full object-cover"
                    />
                  </div>
                  {/* Pulse ring around it */}
                  <span
                    className="absolute inset-0 rounded-full animate-pulse-ring"
                    style={{ boxShadow: '0 0 0 0 rgba(255, 140, 66, 0.55)' }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Submit button */}
      <button
        onClick={() =>
          onComplete({
            type: 'findObject',
            foundCorrect: phase === 'found',
            findFeedback:
              phase === 'found' ? findFeedback : '还没找到，下次仔细看～',
          })
        }
        disabled={phase !== 'found'}
        className="mt-1 rounded-full py-3 font-bold text-sm text-white no-tap-highlight transition-transform shrink-0"
        style={{
          background: phase === 'found'
            ? 'linear-gradient(135deg, #FF8C42 0%, #FF9347 100%)'
            : '#E5E7EB',
          boxShadow: phase === 'found' ? '0 4px 16px rgba(255, 140, 66, 0.35)' : 'none',
          opacity: phase === 'found' ? 1 : 0.6,
        }}
      >
        {phase === 'found' ? '我找到了 · 继续' : '还没找到,再看看…'}
      </button>
    </div>
  );
}
