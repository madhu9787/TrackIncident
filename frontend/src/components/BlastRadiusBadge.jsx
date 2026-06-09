/** Blast radius badge with color coding. */
const CONFIG = {
  critical: { color: '#ef4444', bg: '#1a0a0a', label: 'Critical' },
  high:     { color: '#f97316', bg: '#1a0f0a', label: 'High' },
  medium:   { color: '#eab308', bg: '#1a160a', label: 'Medium' },
  low:      { color: '#22c55e', bg: '#0a1a0f', label: 'Low' },
};

export default function BlastRadiusBadge({ value, style }) {
  const cfg = CONFIG[value?.toLowerCase()] || CONFIG.medium;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '3px 10px',
      borderRadius: 6,
      background: cfg.bg,
      border: `1px solid ${cfg.color}44`,
      color: cfg.color,
      fontSize: 11,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      ...style,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: cfg.color,
        boxShadow: `0 0 6px ${cfg.color}`,
        display: 'inline-block',
      }} />
      {cfg.label} blast
    </span>
  );
}
