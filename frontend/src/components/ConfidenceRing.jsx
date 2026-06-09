/** Confidence ring with color-coded progress circle. */
import { Progress } from 'antd';

export default function ConfidenceRing({ value, size = 96 }) {
  const pct   = Math.round(value ?? 0);
  const color = pct >= 80 ? '#22c55e' : pct >= 60 ? '#eab308' : '#ef4444';
  const label = pct >= 80 ? 'High' : pct >= 60 ? 'Medium' : 'Low';

  return (
    <div style={{ textAlign: 'center' }}>
      <Progress
        type="circle"
        percent={pct}
        size={size}
        strokeColor={color}
        trailColor="#1f1f2e"
        strokeWidth={8}
        format={() => (
          <div>
            <div style={{ color, fontSize: size * 0.22, fontWeight: 800, lineHeight: 1 }}>{pct}%</div>
            <div style={{ color: '#6b6b8a', fontSize: size * 0.1, marginTop: 2 }}>conf.</div>
          </div>
        )}
      />
      <div style={{ color, fontSize: 10, fontWeight: 700, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>
        {label}
      </div>
    </div>
  );
}
