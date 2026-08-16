import React, { useEffect, useState } from 'react';
import { 
  BarChart2, 
  Calendar, 
  CheckCircle2, 
  Layers, 
  TrendingUp 
} from 'lucide-react';
import { ProgressChart } from '../components/ProgressChart';
import { OfflineStorage, StoredAssessment } from '../storage/indexedDB';

export const Progress: React.FC = () => {
  const [history, setHistory] = useState<StoredAssessment[]>([]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await OfflineStorage.getAllAssessments();
        if (data.length > 0) {
          setHistory(data);
        } else {
          // Mock initial data if storage empty
          setHistory([
            { id: '1', exerciseType: 'squat', date: '2026-08-16', totalScore: 92, grade: 'S', repsCompleted: 40, validReps: 38, durationSeconds: 65, caloriesBurned: 14.5, symmetryScore: 95, depthScore: 92, synced: true },
            { id: '2', exerciseType: 'pushup', date: '2026-08-15', totalScore: 88, grade: 'A', repsCompleted: 35, validReps: 34, durationSeconds: 58, caloriesBurned: 11.2, symmetryScore: 92, depthScore: 89, synced: true },
            { id: '3', exerciseType: 'squat', date: '2026-08-14', totalScore: 85, grade: 'A', repsCompleted: 32, validReps: 30, durationSeconds: 50, caloriesBurned: 10.5, symmetryScore: 88, depthScore: 86, synced: true },
            { id: '4', exerciseType: 'pushup', date: '2026-08-12', totalScore: 79, grade: 'B', repsCompleted: 26, validReps: 24, durationSeconds: 45, caloriesBurned: 8.8, symmetryScore: 84, depthScore: 80, synced: true },
          ]);
        }
      } catch (err) {
        console.warn(err);
      }
    };
    loadHistory();
  }, []);

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Page Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <BarChart2 size={24} color="var(--accent-cyan)" />
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>
            Biomechanical & <span className="gradient-text">Progress Analytics</span>
          </h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Longitudinal tracking of joint mobility, cadence symmetry, and physical capacity.
        </p>
      </div>

      {/* Analytics Highlights */}
      <div className="grid-cards">
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Average Form Rating</span>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', marginTop: '0.25rem' }}>
            88.5 <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>pts</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
            <TrendingUp size={14} /> +6.4% consistency gain
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Knee & Hip Symmetry</span>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)', marginTop: '0.25rem' }}>
            94.8%
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
            Balanced bilateral power transfer
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Sessions Logged</span>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-violet)', fontFamily: 'var(--font-mono)', marginTop: '0.25rem' }}>
            {history.length} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>assessments</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', marginTop: '0.25rem', display: 'block' }}>
            Verified on-device with IndexedDB
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Weekly Volume</span>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)', marginTop: '0.25rem' }}>
            133 <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>reps</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
            54.2 kcal estimated expenditure
          </span>
        </div>
      </div>

      {/* Main Chart */}
      <ProgressChart title="Form Precision & Cadence Velocity Trend" />

      {/* Historical Assessment Log Table */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Assessment History Log</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Complete record of all AI pose evaluations and verified scores
            </span>
          </div>
          <span className="badge badge-cyan">
            <Layers size={13} /> {history.length} Entries
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                <th style={{ padding: '0.75rem 1rem' }}>Exercise</th>
                <th style={{ padding: '0.75rem 1rem' }}>Valid Reps</th>
                <th style={{ padding: '0.75rem 1rem' }}>Depth ROM</th>
                <th style={{ padding: '0.75rem 1rem' }}>Symmetry</th>
                <th style={{ padding: '0.75rem 1rem' }}>Score & Grade</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row) => (
                <tr
                  key={row.id}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    transition: 'background 0.2s ease',
                  }}
                >
                  <td style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Calendar size={14} color="var(--text-muted)" /> {row.date}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 600, textTransform: 'capitalize' }}>
                    {row.exerciseType}s
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)' }}>
                    <strong style={{ color: '#10b981' }}>{row.validReps}</strong> / {row.repsCompleted}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)' }}>
                    {row.depthScore}%
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)' }}>
                    {row.symmetryScore}%
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                        {row.totalScore}
                      </span>
                      <span className={`badge ${row.grade === 'S' || row.grade === 'A' ? 'badge-emerald' : 'badge-amber'}`}>
                        {row.grade}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className="badge badge-emerald">
                      <CheckCircle2 size={12} /> Verified
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
