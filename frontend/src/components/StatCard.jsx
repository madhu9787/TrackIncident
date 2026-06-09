/** Animated KPI stat card with count-up effect. */
import { useEffect, useRef, useState } from 'react';

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

function useCountUp(target, duration = 1200) {
  const [display, setDisplay] = useState(0);
  const frame = useRef(null);
  const start = useRef(null);
  const prev  = useRef(0);

  useEffect(() => {
    if (target === null || target === undefined) return;
    const numTarget = parseFloat(target) || 0;
    cancelAnimationFrame(frame.current);
    start.current = null;

    const tick = (ts) => {
      if (!start.current) start.current = ts;
      const elapsed = ts - start.current;
      const progress = Math.min(elapsed / duration, 1);
      const current = prev.current + (numTarget - prev.current) * easeOut(progress);
      setDisplay(current);
      if (progress < 1) frame.current = requestAnimationFrame(tick);
      else { prev.current = numTarget; setDisplay(numTarget); }
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [target, duration]);

  return display;
}

export default function StatCard({ label, value, color, icon, suffix = '', decimals = 0 }) {
  const animated = useCountUp(typeof value === 'number' ? value : parseFloat(value) || 0);
  const display = typeof value === 'string' && isNaN(parseFloat(value))
    ? value
    : `${animated.toFixed(decimals)}${suffix}`;

  return (
    <div style={{
      background: '#16161d',
      border: `1px solid ${color}22`,
      borderRadius: 12,
      padding: '20px 24px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'border-color 0.2s, transform 0.2s',
      cursor: 'default',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}55`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = `${color}22`; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Glow blob */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 80, height: 80, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: '#6b6b8a', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            {label}
          </div>
          <div style={{ color, fontSize: 28, fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {display}
          </div>
        </div>
        {icon && (
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: `${color}15`, border: `1px solid ${color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, color,
          }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
