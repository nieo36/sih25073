import React, { useState } from 'react';
import { TrendingUp, Calendar, Zap } from 'lucide-react';

interface ChartPoint {
  date: string;
  score: number;
  reps: number;
  exercise: string;
}

interface ProgressChartProps {
  data?: ChartPoint[];
  title?: string;
}

export const ProgressChart: React.FC<ProgressChartProps> = ({
  data = [
    { date: 'Mon', score: 72, reps: 20, exercise: 'Squats' },
    { date: 'Tue', score: 78, reps: 24, exercise: 'Pushups' },
    { date: 'Wed', score: 81, reps: 28, exercise: 'Squats' },
    { date: 'Thu', score: 85, reps: 32, exercise: 'Squats' },
    { date: 'Fri', score: 89, reps: 36, exercise: 'Pushups' },
    { date: 'Sat', score: 92, reps: 40, exercise: 'Squats' },
    { date: 'Sun', score: 95, reps: 45, exercise: 'Pushups' },
  ],
  title = 'Fitness & Form Progression Curve',
}) => {
  const [activeMetric, setActiveMetric] = useState<'score' | 'reps'>('score');

  const width = 600;
  const height = 220;
  const padding = 35;

  const values = data.map((d) => (activeMetric === 'score' ? d.score : d.reps));
  const minVal = Math.min(...values) * 0.85;
  const maxVal = Math.max(...values) * 1.1;

  const points = data.map((d, index) => {
    const x = padding + (index * (width - padding * 2)) / (data.length - 1);
    const val = activeMetric === 'score' ? d.score : d.reps;
    const y = height - padding - ((val - minVal) / (maxVal - minVal)) * (height - padding * 2);
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    // Cubic bezier smoothing
    const prev = points[i - 1];
    const cx1 = prev.x + (pt.x - prev.x) / 2;
    const cy1 = prev.y;
    const cx2 = prev.x + (pt.x - prev.x) / 2;
    const cy2 = pt.y;
    return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={20} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{title}</h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Biomechanical consistency over last 7 sessions
          </span>
        </div>

        {/* Metric Switcher */}
        <div style={{
          display: 'flex',
          background: 'rgba(15, 23, 42, 0.7)',
          padding: '0.2rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)',
          gap: '0.25rem',
        }}>
          <button
            onClick={() => setActiveMetric('score')}
            style={{
              background: activeMetric === 'score' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
              color: activeMetric === 'score' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              border: 'none',
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Form Score
          </button>
          <button
            onClick={() => setActiveMetric('reps')}
            style={{
              background: activeMetric === 'reps' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              color: activeMetric === 'reps' ? 'var(--accent-emerald)' : 'var(--text-secondary)',
              border: 'none',
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reps Volume
          </button>
        </div>
      </div>

      {/* SVG Responsive Chart */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: 'auto', minWidth: '420px' }}
        >
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={activeMetric === 'score' ? '#06b6d4' : '#10b981'} stopOpacity="0.4" />
              <stop offset="100%" stopColor={activeMetric === 'score' ? '#06b6d4' : '#10b981'} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = height - padding - ratio * (height - padding * 2);
            return (
              <line
                key={idx}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="rgba(255, 255, 255, 0.05)"
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Fill Area */}
          <path d={areaD} fill="url(#areaGradient)" />

          {/* Stroke Line */}
          <path
            d={pathD}
            fill="none"
            stroke={activeMetric === 'score' ? 'var(--accent-cyan)' : 'var(--accent-emerald)'}
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Interactive Data Dots & Labels */}
          {points.map((pt, idx) => (
            <g key={idx}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r="5"
                fill="#0f172a"
                stroke={activeMetric === 'score' ? 'var(--accent-cyan)' : 'var(--accent-emerald)'}
                strokeWidth="2.5"
              />
              <text
                x={pt.x}
                y={height - 12}
                textAnchor="middle"
                fill="var(--text-muted)"
                fontSize="11"
                fontWeight="500"
              >
                {pt.date}
              </text>
              <text
                x={pt.x}
                y={pt.y - 10}
                textAnchor="middle"
                fill="var(--text-primary)"
                fontSize="11"
                fontWeight="700"
                fontFamily="var(--font-mono)"
              >
                {activeMetric === 'score' ? `${pt.score}` : `${pt.reps}r`}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Calendar size={14} color="var(--accent-cyan)" /> 7-Day Velocity: +23%
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Zap size={14} color="var(--accent-amber)" /> Peak Session: 95 pts (Sunday)
        </span>
      </div>
    </div>
  );
};
