import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

interface PhoneShellProps {
  children: ReactNode;
  overlay?: ReactNode;
}

/* ── Apple-style SVG status bar icons ─────────────────────── */

function CellularIcon({ color = '#000' }: { color?: string }) {
  const bars = [
    { x: 0, y: 7, w: 3, h: 3 },
    { x: 4.5, y: 5, w: 3, h: 5 },
    { x: 9, y: 3, w: 3, h: 7 },
    { x: 13.5, y: 0, w: 3, h: 10 },
  ];
  return (
    <svg width="18" height="10" viewBox="0 0 18 10" fill="none" xmlns="http://www.w3.org/2000/svg">
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx={1} fill={color} />
      ))}
    </svg>
  );
}

function WifiIcon({ color = '#000' }: { color?: string }) {
  return (
    <svg width="17" height="12" viewBox="0 0 17 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 4.5C3.5 2 6 1 8.5 1S13.5 2 16 4.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M3.5 6.5C5 5 6.7 4.3 8.5 4.3S12 5 13.5 6.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M5.8 8.3C6.6 7.5 7.5 7.1 8.5 7.1S10.4 7.5 11.2 8.3" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <circle cx="8.5" cy="10.2" r="1.1" fill={color} />
    </svg>
  );
}

function BatteryIcon({ color = '#000', level = 0.82 }: { color?: string; level?: number }) {
  const fillWidth = 22 * level;
  return (
    <svg width="27" height="13" viewBox="0 0 27 13" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0.5" y="0.5" width="22" height="12" rx="3.5" stroke={color} strokeOpacity="0.35" strokeWidth="1" fill="none" />
      <rect x="2" y="2" width={fillWidth} height="9" rx="2" fill={color} />
      <rect x="24" y="4" width="2" height="5" rx="1" fill={color} fillOpacity="0.4" />
    </svg>
  );
}

export default function PhoneShell({ children, overlay }: PhoneShellProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [radius, setRadius] = useState(55);
  const [now, setNow] = useState(() => new Date());

  // Measure the phone width and compute a uniform pixel-based border-radius.
  // This avoids the CSS percentage bug where `border-radius: 13.5%` creates
  // elliptical corners on non-square elements (horizontal radius ≠ vertical radius).
  // Also stores the raw width to compute a scale factor for status bar icons,
  // so they shrink proportionally on smaller phone renders (e.g. 264px vs 390px).
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth;
        setRadius(Math.round(w * 0.135));
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Status bar clock — update every 30s so it follows real-world time.
  // The minute granularity means we never show a stale time by more than 60s.
  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const timeText = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // Derived radii for each layer
  const frameRadius = radius;           // outer aluminum frame
  const bezelRadius = radius - 5;       // inner black bezel
  const screenRadius = radius - 9;      // actual screen

  // Scale factor for status bar elements — real iPhone is 390px logical width.
  // SVG icons have fixed pixel sizes designed for 390px; on smaller renders they
  // would be proportionally too large and crowd the Dynamic Island.
  // Target: icon group rendered width ≈ 68px.
  // Unscaled icon area width: cellular(18) + gap(7) + wifi(17) + gap(7) + battery(27) = 76px
  const iconAreaWidth = 68;
  const iconScale = iconAreaWidth / 76;

  return (
    <div
      ref={containerRef}
      className="relative shrink-0"
      style={{
        /* iPhone 17 Pro: 71.9mm × 150.0mm → ratio 0.4793 */
        height: 'calc(100vh - 72px)',
        aspectRatio: '71.9 / 150',
        maxHeight: '860px',
      }}
    >
      {/* ── Side buttons — left: Action button + volume up / volume down ── */}
      <div
        className="absolute rounded-l-sm"
        style={{
          left: '-2px',
          top: '15%',
          width: '3px',
          height: '2.5%',
          background: 'linear-gradient(to right, #3a3a3c, #1c1c1e)',
        }}
      />
      <div
        className="absolute rounded-l-sm"
        style={{
          left: '-2px',
          top: '23%',
          width: '3px',
          height: '6%',
          background: 'linear-gradient(to right, #3a3a3c, #1c1c1e)',
        }}
      />
      <div
        className="absolute rounded-l-sm"
        style={{
          left: '-2px',
          top: '33%',
          width: '3px',
          height: '6%',
          background: 'linear-gradient(to right, #3a3a3c, #1c1c1e)',
        }}
      />

      {/* ── Side button — right: power ── */}
      <div
        className="absolute rounded-r-sm"
        style={{
          right: '-2px',
          top: '27%',
          width: '3px',
          height: '9%',
          background: 'linear-gradient(to left, #3a3a3c, #1c1c1e)',
        }}
      />

      {/* ── Aluminum frame ── */}
      <div
        className="w-full h-full relative"
        style={{
          borderRadius: `${frameRadius}px`,
          padding: '4px',
          background:
            'linear-gradient(145deg, #3a3a3c 0%, #1c1c1e 18%, #2c2c2e 45%, #1c1c1e 72%, #3a3a3c 100%)',
          boxShadow:
            '0 0 0 1px rgba(255,255,255,0.05), 0 2px 6px rgba(0,0,0,0.12), 0 12px 40px rgba(0,0,0,0.28), 0 30px 60px rgba(0,0,0,0.12)',
        }}
      >
        {/* ── Inner black bezel ── */}
        <div
          className="w-full h-full bg-black relative overflow-hidden"
          style={{
            borderRadius: `${bezelRadius}px`,
            padding: '2px',
          }}
        >
          {/* ── Screen ── */}
          <div
            data-phone-screen
            className="w-full h-full bg-white overflow-hidden relative"
            style={{
              borderRadius: `${screenRadius}px`,
            }}
          >
            {/* ── Dynamic Island ── */}
            <div
              className="absolute left-1/2 -translate-x-1/2 bg-black z-[60] flex items-center justify-end"
              style={{
                top: '1.4%',
                width: '32%',
                height: '4.6%',
                borderRadius: '999px',
                paddingRight: '4%',
              }}
            >
              {/* Camera lens */}
              <div
                className="rounded-full ring-1 ring-gray-700/40"
                style={{
                  width: '26%',
                  height: '52%',
                  background: 'radial-gradient(circle at 35% 35%, #3a3a3c, #1c1c1e 60%, #0a0a0a)',
                }}
              />
              {/* Sensor dot */}
              <div
                className="absolute rounded-full bg-gray-800/70"
                style={{ left: '18%', top: '50%', transform: 'translateY(-50%)', width: '14%', height: '28%' }}
              />
            </div>

            {/* ── Top status bar gradient overlay (subtle frosted effect) ── */}
            <div
              className="absolute left-0 right-0 pointer-events-none z-40"
              style={{
                top: 0,
                height: '12%',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                maskImage: 'linear-gradient(180deg, #000 0%, #000 50%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(180deg, #000 0%, #000 50%, transparent 100%)',
              }}
            />

            {/* ── Status bar (Apple style) ── */}
            <div
              className="absolute left-0 right-0 flex items-center justify-between pointer-events-none z-50"
              style={{
                top: '1.2%',
                height: '5.5%',
                paddingLeft: '7%',
                paddingRight: '7%',
                color: '#000',
              }}
            >
              <span
                style={{
                  fontSize: 'clamp(11px, 1.8vh, 16px)',
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                  fontFeatureSettings: '"tnum"',
                  fontFamily: '-apple-system, "SF Pro Text", "Helvetica Neue", sans-serif',
                }}
              >
                {timeText}
              </span>

              <div
                className="flex items-center"
                style={{
                  gap: `${7 * iconScale}px`,
                  transform: `scale(${iconScale})`,
                  transformOrigin: 'right center',
                  width: `${iconAreaWidth}px`,
                  justifyContent: 'flex-end',
                }}
              >
                <CellularIcon color="#000" />
                <WifiIcon color="#000" />
                <BatteryIcon color="#000" level={0.82} />
              </div>
            </div>

            {/* ── Content area ── */}
            <div
              className="absolute left-0 right-0 overflow-y-auto scrollbar-hide"
              style={{ top: '6.7%', bottom: 0 }}
            >
              {children}
            </div>

            {/* ── Overlay layer (guidance, popups, etc.) ── */}
            {overlay}

            {/* ── Home indicator ── */}
            <div
              className="absolute left-1/2 -translate-x-1/2 rounded-full z-50"
              style={{
                bottom: '1.2%',
                width: '34%',
                height: '4px',
                background: 'rgba(0,0,0,0.22)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
