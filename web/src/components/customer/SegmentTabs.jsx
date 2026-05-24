import './SegmentTabs.css';

const SEGMENTS = [
  { key: 'simple',  label: 'Sadə',    emoji: '🍽' },
  { key: 'fast',    label: 'Fast',    emoji: '⚡' },
  { key: 'premium', label: 'Premium', emoji: '⭐' },
];

export default function SegmentTabs({ active, onChange }) {
  return (
    <div className="segment-tabs">
      {SEGMENTS.map(seg => (
        <button
          key={seg.key}
          className={`segment-tab ${active === seg.key ? 'active' : ''} segment-${seg.key}`}
          onClick={() => onChange(seg.key)}
        >
          <span className="seg-emoji">{seg.emoji}</span>
          <span>{seg.label}</span>
        </button>
      ))}
    </div>
  );
}
