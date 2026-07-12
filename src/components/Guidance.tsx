import { useApp } from '../context/AppContext';
import { useEffect } from 'react';

const guidanceTexts: Record<number, string> = {
  1: '欢迎来到 CityStage！点击中间的「创建」按钮，开始创建一场精彩的活动',
  2: '选择「企业用户」，以品牌方身份配置并发布活动',
  3: '填写下方活动信息',
  4: '点击AI生成任务内容',
  5: '活动发布成功！点击地图上高亮的活动区域，切换到用户视角体验',
  6: '这是活动任务地图，5 个任务等你探索。点击第一个任务开始体验',
  7: 'NPC 正在为你介绍任务背景，点击「开始任务」与 AI 互动',
  8: '完成任务后，AI 会实时生成个性化反馈。完成后点击「继续」进入下一个任务',
  9: '太棒了！全部任务已完成，AI 正在为你生成专属体验卡，记得保存分享',
  10: '体验卡已生成！你可以保存或分享到朋友圈。点击「返回首页」回到任务地图',
};

type GuidancePosition = 'top' | 'bottom';

const stepConfig: Record<number, { arrowDown: boolean; position: GuidancePosition; offsetPct: number }> = {
  1:  { arrowDown: true,  position: 'bottom', offsetPct: 16 },
  // step 2 is now an inline hint inside CreatePopup (replaces full-screen overlay)
  3:  { arrowDown: true,  position: 'top',    offsetPct: 13 },
  4:  { arrowDown: true,  position: 'top',    offsetPct: 13 },
  5:  { arrowDown: false, position: 'bottom', offsetPct: 12 },
  6:  { arrowDown: false, position: 'bottom', offsetPct: 12 },
  7:  { arrowDown: false, position: 'bottom', offsetPct: 12 },
  8:  { arrowDown: false, position: 'bottom', offsetPct: 12 },
  9:  { arrowDown: false, position: 'bottom', offsetPct: 12 },
  10: { arrowDown: false, position: 'bottom', offsetPct: 12 },
};

export default function Guidance() {
  const { state, dismissGuidance } = useApp();

  const currentStep = state.guidanceStep;
  const cfg = stepConfig[currentStep] ?? { arrowDown: false, position: 'bottom' as GuidancePosition, offsetPct: 12 };
  const isCompact = cfg.position === 'top';

  // B-end steps: auto-dismiss after 4 seconds so user can freely edit the form
  useEffect(() => {
    if (!state.showGuidance || !isCompact) return;
    const timer = setTimeout(() => dismissGuidance(), 3000);
    return () => clearTimeout(timer);
  }, [state.showGuidance, isCompact, currentStep, dismissGuidance]);

  if (!state.showGuidance) return null;

  // Step 2: inline hint inside CreatePopup replaces full-screen overlay
  if (currentStep === 2) return null;

  const text = guidanceTexts[currentStep] ?? guidanceTexts[1];

  const positionStyle: React.CSSProperties =
    cfg.position === 'top'
      ? { top: `${cfg.offsetPct}%` }
      : { bottom: `${cfg.offsetPct}%` };

  return (
    <div
      style={{
        position: 'absolute',
        inset: '0',
        zIndex: 90,
        pointerEvents: 'none',
      }}
    >
      <div
        className="animate-bounce-in"
        style={{
          position: 'absolute',
          left: '0',
          right: '0',
          width: isCompact ? 'min(260px, 80%)' : 'min(280px, 82%)',
          margin: '0 auto',
          ...positionStyle,
        }}
      >
        {/* Arrow */}
        {cfg.arrowDown ? (
          <div
            style={{
              position: 'absolute',
              bottom: '-8px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '0',
              height: '0',
              borderLeft: '10px solid transparent',
              borderRight: '10px solid transparent',
              borderTop: '12px solid white',
              filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.08))',
              zIndex: 2,
            }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              top: '-8px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '0',
              height: '0',
              borderLeft: '10px solid transparent',
              borderRight: '10px solid transparent',
              borderBottom: '12px solid white',
              filter: 'drop-shadow(0 -2px 2px rgba(0,0,0,0.08))',
              zIndex: 2,
            }}
          />
        )}

        {/* Card body */}
        <div
          style={{
            position: 'relative',
            background: 'white',
            borderRadius: isCompact ? '12px' : '16px',
            padding: isCompact ? '10px 12px' : '14px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12), 0 0 0 1px rgba(138,101,255,0.08)',
            zIndex: 1,
          }}
        >
          {isCompact ? (
            /* Compact single-row layout for B-end pages */
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <p style={{ fontSize: '12px', lineHeight: 1.4, color: '#1F1827', margin: 0, flex: 1 }}>
                {text}
              </p>
              <button
                onClick={dismissGuidance}
                style={{
                  background: 'linear-gradient(135deg, #8A65FF 0%, #7C3AED 100%)',
                  color: 'white',
                  fontSize: '11px',
                  borderRadius: '999px',
                  padding: '4px 12px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(138,101,255,0.3)',
                  flexShrink: 0,
                  pointerEvents: 'auto',
                  whiteSpace: 'nowrap',
                }}
              >
                知道了
              </button>
            </div>
          ) : (
            /* Full layout for C-end pages */
            <>
              <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#1F1827', margin: 0 }}>
                {text}
              </p>

              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end', pointerEvents: 'auto' }}>
                <button
                  onClick={dismissGuidance}
                  style={{
                    background: 'linear-gradient(135deg, #8A65FF 0%, #7C3AED 100%)',
                    color: 'white',
                    fontSize: '12px',
                    borderRadius: '999px',
                    padding: '6px 16px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(138,101,255,0.3)',
                  }}
                >
                  知道了
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
