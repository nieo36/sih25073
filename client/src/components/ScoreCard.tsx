import React from 'react';
import { Award, CheckCircle2, Flame, Gauge, Zap } from 'lucide-react';
import { AssessmentScore } from '../analytics/scoring';

interface ScoreCardProps {
  score: AssessmentScore;
  feedbackMessage?: string;
  calories?: number;
  isLive?: boolean;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({
  score,
  feedbackMessage,
  calories = 42,
  isLive = false,
}) => {
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'S':
        return 'linear-gradient(135deg, #f59e0b, #ef4444)';
      case 'A':
        return 'linear-gradient(135deg, #10b981, #06b6d4)';
      case 'B':
        return 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
      case 'C':
        return 'linear-gradient(135deg, #f59e0b, #d97706)';
      default:
        return 'linear-gradient(135deg, #ef4444, #b91c1c)';
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
      {/* Background Accent Glow */}
      <div style={{
        position: 'absolute',
        top: '-40px',
        right: '-40px',
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        background: 'rgba(6, 182, 212, 0.12)',
        filter: 'blur(30px)',
        pointerEvents: 'none',
      }} />

      {/* Header with Title & Grade */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={20} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              {isLive ? 'Live Performance Score' : 'Assessment Summary'}
            </h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Biomechanical Precision Analysis
          </span>
        </div>

        <div style={{
          background: getGradeColor(score.grade),
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.4rem',
          fontWeight: 800,
          color: '#fff',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
        }}>
          {score.grade}
        </div>
      </div>

      {/* Primary Big Metric Display */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem',
        padding: '1rem',
        background: 'rgba(15, 23, 42, 0.6)',
        borderRadius: 'var(--radius-sm)',
        marginBottom: '1.25rem',
        border: '1px solid var(--border-color)',
        textAlign: 'center',
      }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Overall Score
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
            {score.totalScore}
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/100</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Valid Reps
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
            {score.validReps}
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/{score.repsCompleted}</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Est. Calories
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>
            {calories}
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}> kcal</span>
          </div>
        </div>
      </div>

      {/* Sub-Score Breakdown Bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
            <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Gauge size={14} color="var(--accent-cyan)" /> Form Accuracy
            </span>
            <span style={{ fontWeight: 600 }}>{score.formAccuracy}%</span>
          </div>
          <div style={{ height: '6px', width: '100%', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${score.formAccuracy}%`, background: 'var(--gradient-neon)', borderRadius: '3px' }} />
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
            <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <CheckCircle2 size={14} color="var(--accent-emerald)" /> Depth & ROM
            </span>
            <span style={{ fontWeight: 600 }}>{score.depthScore}%</span>
          </div>
          <div style={{ height: '6px', width: '100%', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${score.depthScore}%`, background: '#10b981', borderRadius: '3px' }} />
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
            <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Zap size={14} color="var(--accent-violet)" /> Symmetry & Balance
            </span>
            <span style={{ fontWeight: 600 }}>{score.symmetryScore}%</span>
          </div>
          <div style={{ height: '6px', width: '100%', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${score.symmetryScore}%`, background: '#8b5cf6', borderRadius: '3px' }} />
          </div>
        </div>
      </div>

      {/* Live AI Coach Feedback Pill */}
      {feedbackMessage && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          padding: '0.75rem 1rem',
          background: 'rgba(6, 182, 212, 0.1)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          borderRadius: 'var(--radius-sm)',
        }}>
          <Flame size={18} color="var(--accent-cyan)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {feedbackMessage}
          </span>
        </div>
      )}
    </div>
  );
};
