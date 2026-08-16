import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, 
  ArrowRight, 
  Award, 
  CheckCircle, 
  Flame, 
  Play, 
  ShieldCheck, 
  TrendingUp, 
  Zap 
} from 'lucide-react';
import { ProgressChart } from '../components/ProgressChart';
import { Leaderboard } from '../components/Leaderboard';

export const Dashboard: React.FC = () => {
  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Welcome Banner */}
      <div className="glass-panel" style={{
        padding: '2rem',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
        border: '1px solid var(--border-highlight)',
      }}>
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '240px',
          height: '240px',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-cyan">
                <ShieldCheck size={14} /> SAI Verified Athlete
              </span>
              <span className="badge badge-emerald">
                <Flame size={14} /> 12 Day Streak
              </span>
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Welcome Back, <span className="gradient-text">Aarav Sharma</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '600px', marginTop: '0.25rem' }}>
              Your biomechanical passport is ranked in the top <strong style={{ color: 'var(--accent-cyan)' }}>88th percentile</strong> nationwide. Ready for your daily physical evaluation?
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/assessment" className="btn btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
              <Play size={18} fill="#fff" />
              Start Assessment
            </Link>
            <Link to="/passport" className="btn btn-secondary" style={{ padding: '0.85rem 1.5rem' }}>
              View Passport
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid-cards">
        <div className="glass-panel glass-panel-hover" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>OVERALL FITNESS INDEX</span>
            <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '0.4rem', borderRadius: '8px' }}>
              <Activity size={18} color="var(--accent-cyan)" />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
            88.4 <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/100</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <TrendingUp size={14} /> +4.2% from last week
          </div>
        </div>

        <div className="glass-panel glass-panel-hover" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL VALID REPS</span>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.4rem', borderRadius: '8px' }}>
              <CheckCircle size={18} color="var(--accent-emerald)" />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#10b981' }}>
            348 <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>reps</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            94.2% Form Depth Precision
          </div>
        </div>

        <div className="glass-panel glass-panel-hover" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>ATHLETE TIER & ELO</span>
            <div style={{ background: 'rgba(139, 92, 246, 0.15)', padding: '0.4rem', borderRadius: '8px' }}>
              <Award size={18} color="var(--accent-violet)" />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-violet)' }}>
            1,850 <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>ELO</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', marginTop: '0.35rem' }}>
            Platinum Tier • Rank #5 Delhi
          </div>
        </div>

        <div className="glass-panel glass-panel-hover" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>CALORIES BURNED</span>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '0.4rem', borderRadius: '8px' }}>
              <Zap size={18} color="var(--accent-amber)" />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)' }}>
            1,420 <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>kcal</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            This week's active energy
          </div>
        </div>
      </div>

      {/* Main Split: Analytics Chart & Leaderboard */}
      <div className="grid-2">
        <ProgressChart />
        <Leaderboard compact={true} />
      </div>

      {/* Recommended Assessments Section */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
          National Standard Physical Benchmark Tests
        </h3>
        <div className="grid-cards">
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '1rem'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Deep Squats Assessment</h4>
                <span className="badge badge-cyan">Lower Body ROM</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Evaluates quad power, hip mobility, knee tracking symmetry, and depth below 90 degrees.
              </p>
            </div>
            <Link to="/assessment" className="btn btn-secondary" style={{ width: '100%' }}>
              Begin Test <ArrowRight size={16} />
            </Link>
          </div>

          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '1rem'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Pushup Biomechanics</h4>
                <span className="badge badge-emerald">Upper Body & Core</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Measures chest power, elbow flexion angle, trunk stability, and anti-sagging plank form.
              </p>
            </div>
            <Link to="/assessment" className="btn btn-secondary" style={{ width: '100%' }}>
              Begin Test <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
