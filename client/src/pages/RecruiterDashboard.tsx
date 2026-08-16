import React, { useState } from 'react';
import { 
  Download, 
  Eye, 
  MapPin, 
  Search, 
  ShieldCheck, 
  Star 
} from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  age: number;
  sport: string;
  state: string;
  overallScore: number;
  tier: string;
  squatScore: number;
  pushupScore: number;
  symmetry: number;
  verified: boolean;
  shortlisted: boolean;
}

export const RecruiterDashboard: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([
    { id: 'ath-101', name: 'Vikramaditya Singh', age: 18, sport: 'Athletics & Sprints', state: 'Haryana', overallScore: 98, tier: 'OLYMPIAN', squatScore: 99, pushupScore: 97, symmetry: 98, verified: true, shortlisted: true },
    { id: 'ath-102', name: 'Priya Narang', age: 19, sport: 'Badminton', state: 'Punjab', overallScore: 96, tier: 'DIAMOND', squatScore: 95, pushupScore: 97, symmetry: 96, verified: true, shortlisted: true },
    { id: 'ath-103', name: 'Rohan Mehra', age: 17, sport: 'Football / Striker', state: 'Karnataka', overallScore: 94, tier: 'DIAMOND', squatScore: 96, pushupScore: 92, symmetry: 95, verified: true, shortlisted: false },
    { id: 'ath-104', name: 'Aarav Sharma', age: 19, sport: 'Athletics & Track', state: 'Delhi', overallScore: 88, tier: 'PLATINUM', squatScore: 90, pushupScore: 86, symmetry: 94, verified: true, shortlisted: false },
    { id: 'ath-105', name: 'Ananya Roy', age: 18, sport: 'Gymnastics', state: 'Maharashtra', overallScore: 91, tier: 'PLATINUM', squatScore: 93, pushupScore: 89, symmetry: 97, verified: true, shortlisted: false },
  ]);

  const [minScore, setMinScore] = useState<number>(85);
  const [search, setSearch] = useState<string>('');

  const toggleShortlist = (id: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, shortlisted: !c.shortlisted } : c))
    );
  };

  const filtered = candidates.filter(
    (c) =>
      c.overallScore >= minScore &&
      (c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.sport.toLowerCase().includes(search.toLowerCase()) ||
        c.state.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div className="glass-panel" style={{
        padding: '2rem',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(15, 23, 42, 0.8) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="badge badge-violet" style={{ marginBottom: '0.5rem' }}>
              <ShieldCheck size={14} /> SAI Talent Scouting Portal
            </span>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>
              National Recruiter & <span className="gradient-text">Scouting Hub</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '650px', marginTop: '0.25rem' }}>
              Identify grassroots athletic talent using verified AI biomechanical metrics and standardized fitness passports.
            </p>
          </div>

          <button className="btn btn-primary" style={{ padding: '0.75rem 1.25rem' }}>
            <Download size={16} /> Export Scouting Report
          </button>
        </div>
      </div>

      {/* Scouting Filters */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Filter by athlete name, sport, or state..."
            style={{ paddingLeft: '2.4rem' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            Min Score: <strong style={{ color: 'var(--accent-cyan)' }}>{minScore}</strong>
          </span>
          <input
            type="range"
            min="60"
            max="95"
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            style={{ accentColor: 'var(--accent-cyan)' }}
          />
        </div>
      </div>

      {/* Candidate Cards Grid */}
      <div className="grid-cards">
        {filtered.map((candidate) => (
          <div
            key={candidate.id}
            className="glass-panel glass-panel-hover"
            style={{
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1.25rem',
              border: candidate.shortlisted ? '1px solid var(--accent-amber)' : '1px solid var(--border-color)',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{candidate.name}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Age {candidate.age} • {candidate.sport}
                  </span>
                </div>

                <button
                  onClick={() => toggleShortlist(candidate.id)}
                  style={{
                    background: candidate.shortlisted ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.4rem',
                    cursor: 'pointer',
                    color: candidate.shortlisted ? 'var(--accent-amber)' : 'var(--text-muted)',
                  }}
                  title={candidate.shortlisted ? 'Remove from Shortlist' : 'Add to Shortlist'}
                >
                  <Star size={18} fill={candidate.shortlisted ? 'currentColor' : 'none'} />
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span className="badge badge-cyan">
                  <MapPin size={12} /> {candidate.state}
                </span>
                <span className="badge badge-emerald">
                  <ShieldCheck size={12} /> Verified Passport
                </span>
              </div>

              {/* Metric Ratings */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.5rem',
                background: 'rgba(15, 23, 42, 0.6)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'center',
              }}>
                <div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'block' }}>FITNESS</span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                    {candidate.overallScore}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'block' }}>SQUAT</span>
                  <strong style={{ fontSize: '1.1rem', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                    {candidate.squatScore}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'block' }}>SYMMETRY</span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--accent-violet)', fontFamily: 'var(--font-mono)' }}>
                    {candidate.symmetry}%
                  </strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" style={{ width: '100%', fontSize: '0.85rem' }}>
                <Eye size={15} /> View Biometrics
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
