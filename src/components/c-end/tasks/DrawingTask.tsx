import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '../../../context/AppContext';
import { generateDrawingComment } from '../../../services/api';
import TaskHeader from './TaskHeader';
import type { TaskResult } from '../../../types';
interface Props {
  onComplete: (result: TaskResult) => void;
}

type Phase = 'drawing' | 'loading' | 'result';

export default function DrawingTask({ onComplete }: Props) {
  const { state } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#FF8C42');
  const [brushSize, setBrushSize] = useState(4);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [phase, setPhase] = useState<Phase>('drawing');
  const [comment, setComment] = useState('');
  // Persist the dataUrl in React state — the canvas DOM node is unmounted
  // when phase leaves 'drawing' (AnimatePresence mode="wait"), so reading
  // `canvasRef.current.dataset.drawing` in the result phase returns null.
  const [drawingData, setDrawingData] = useState<string>('');

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctxRef.current = ctx;
  }, []);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (phase !== 'drawing') return;
    e.preventDefault();
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    canvas.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || phase !== 'drawing') return;
    const ctx = ctxRef.current;
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasDrawn) setHasDrawn(true);
  };

  const endDraw = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSubmit = async () => {
    if (!hasDrawn) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    // Persist to React state (the canvas DOM node may unmount on phase change)
    setDrawingData(dataUrl);
    setPhase('loading');
    try {
      const c = await generateDrawingComment(
        state.activityConfig.brandName,
        dataUrl,
      );
      setComment(c);
      setPhase('result');
    } catch {
      // Defensive fallback: never leave the user stuck on the loading
      // screen if the API throws. Show a local comment and continue.
      setComment('柚子店长已经收好你的画啦，下次再一起画个更酷的吧。');
      setPhase('result');
    }
  };

  const colors = [
    { name: 'orange', value: '#FF8C42' },
    { name: 'sunny', value: '#FFD93D' },
    { name: 'mint', value: '#22C55E' },
    { name: 'sky', value: '#3B82F6' },
    { name: 'purple', value: '#8A65FF' },
    { name: 'coral', value: '#EF4444' },
    { name: 'ink', value: '#1F1827' },
  ];

  const brushSizes = [2, 4, 8, 12];

  return (
    <div className="flex flex-col h-full p-3 overflow-y-auto scrollbar-hide">
      <TaskHeader type="drawing" />

      <AnimatePresence mode="wait">
        {phase === 'drawing' && (
          <motion.div
            key="drawing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            {/* Canvas */}
            <div className="bg-white rounded-2xl card-shadow p-2 flex-1 flex flex-col min-h-0">
              <canvas
                ref={canvasRef}
                onPointerDown={startDraw}
                onPointerMove={draw}
                onPointerUp={endDraw}
                onPointerLeave={endDraw}
                className="w-full flex-1 rounded-xl touch-none cursor-crosshair min-h-[200px]"
                style={{ touchAction: 'none' }}
              />
            </div>

            {/* Tools */}
            <div className="mt-3 space-y-2.5 shrink-0">
              {/* Color palette */}
              <div className="flex items-center gap-2 justify-center">
                {colors.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setColor(c.value)}
                    className={`w-7 h-7 rounded-full transition-all no-tap-highlight ${
                      color === c.value ? 'scale-125 ring-2 ring-offset-2 ring-gray-300' : ''
                    }`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>

              {/* Brush sizes */}
              <div className="flex items-center gap-3 justify-center">
                {brushSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setBrushSize(size)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center no-tap-highlight transition-all ${
                      brushSize === size ? 'bg-primary-50' : 'bg-neutral-100'
                    }`}
                  >
                    <span
                      className="rounded-full"
                      style={{
                        width: `${size + 2}px`,
                        height: `${size + 2}px`,
                        backgroundColor: color,
                      }}
                    />
                  </button>
                ))}

                {/* Clear button — uses a real PNG of a wicker
                    wastebasket (no emoji) to keep the toolbar
                    visually consistent with the rest of the
                    app's photo / image based icon system. */}
                <button
                  onClick={handleClear}
                  className="ml-2 px-3 h-8 rounded-full bg-neutral-100 text-neutral-500 text-xs font-medium no-tap-highlight"
                >
                  清除
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={!hasDrawn}
              className={`mt-3 rounded-full py-3 font-medium text-sm no-tap-highlight transition-all flex items-center justify-center gap-2 ${
                hasDrawn
                  ? 'gradient-accent text-white shadow-accent'
                  : 'bg-neutral-100 text-neutral-400'
              }`}
            >
              完成绘画
            </button>
          </motion.div>
        )}

        {phase === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-3"
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
            <p className="text-sm font-medium text-ink-body">柚子店长正在观赏你的画…</p>
          </motion.div>
        )}

        {phase === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            {/* Drawing preview */}
            <div className="bg-white rounded-2xl card-shadow p-2 mb-3">
              <img
                src={drawingData}
                alt="用户绘画"
                className="w-full h-32 object-contain rounded-xl"
              />
            </div>

            {/* AI comment */}
            <div className="bg-white rounded-2xl card-shadow p-4 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <img
                  src="/images/npc-avatar.jpg"
                  alt="柚子店长"
                  className="w-7 h-7 rounded-full object-cover"
                />
                <span className="text-xs font-bold text-ink-primary">柚子店长点评</span>
              </div>
              <p className="text-sm text-ink-body leading-relaxed flex-1">{comment}</p>
            </div>

            {/* Complete button */}
            <button
              onClick={() =>
                onComplete({
                  type: 'drawing',
                  drawingData,
                  drawingComment: comment,
                })
              }
              className="mt-3 gradient-accent text-white rounded-full py-3 font-medium text-sm shadow-accent no-tap-highlight flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95"
            >
              <span
                className="inline-flex items-center justify-center"
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.25)',
                }}
              >
                ✓
              </span>
              完成
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
