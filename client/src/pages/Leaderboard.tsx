import React, { useState, useEffect } from 'react';
import { Flame, Medal, Search, ShieldCheck, Trophy } from 'lucide-react';
import { Leaderboard as LeaderboardWidget, LeaderboardEntry } from '../components/Leaderboard';
import { ApiService } from '../services/api';

export const Leaderboard: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'overall' | 'squats' | 'pushups'>('overall');
  const [selectedState, setSelectedState] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      const data = await ApiService.getLeaderboard({ exercise: selectedCategory });
      setEntries(data as LeaderboardEntry[]);
    };
    fetchData();
  }, [selectedCategory]);

  const filteredEntries = entries.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.state.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = selectedState === 'all' || item.state.toLowerCase() === selectedState.toLowerCase();
    return matchesSearch && matchesState;
  });

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'rgba(245, 158, 11, 0.15)',
          color: 'var(--accent-amber)',
          padding: '0.35rem 0.85rem',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.85rem',
          fontWeight: 700,
          marginBottom: '0.75rem',
          border: '1px solid rgba(245, 158, 11, 0.3)',
        }}>
          <Trophy size={16} /> NATIONAL TALENT IDENTIFICATION PORTAL
        </div>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800 }}>
          All-India Athlete <span className="gradient-text">Leaderboard</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.35rem' }}>
          Rankings verified via computer vision biomechanical analysis for SAI talent scouts.
        </p>
      </div>

      {/* Podium Cards for Top 3 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1.5rem',
      }}>
        {/* Silver #2 */}
        <div className="glass-panel" style={{
          padding: '1.75rem 1.5rem',
          textAlign: 'center',
          border: '1px solid rgba(148, 163, 184, 0.3)',
          order: 1,
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #94a3b8, #475569)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: 800,
            marginBottom: '0.75rem',
            boxShadow: '0 0 15px rgba(148, 163, 184, 0.3)',
          }}>
            2
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Priya Narang</h3>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block' }}>Punjab • Diamond Tier</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', margin: '0.5rem 0' }}>
            96 <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>PTS</span>
          </div>
          <span className="badge badge-emerald">
            <ShieldCheck size={12} /> Verified
          </span>
        </div>

        {/* Gold #1 */}
        <div className="glass-panel" style={{
          padding: '2rem 1.5rem',
          textAlign: 'center',
          border: '2px solid rgba(245, 158, 11, 0.5)',
          background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.08) 0%, rgba(15, 23, 42, 0.8) 100%)',
          boxShadow: '0 0 30px rgba(245, 158, 11, 0.2)',
          order: 0,
        }}>
          <div style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem',
            fontWeight: 800,
            marginBottom: '0.75rem',
            boxShadow: '0 0 20px rgba(245, 158, 11, 0.5)',
          }}>
            <Medal size={34} color="#fff" />
          </div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Vikramaditya Singh</h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--accent-amber)', display: 'block', fontWeight: 600 }}>Haryana • Olympian Tier</span>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)', margin: '0.5rem 0' }}>
            98 <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>PTS</span>
          </div>
          <span className="badge badge-amber">
            <Flame size={12} /> National Benchmark Leader
          </span>
        </div>

        {/* Bronze #3 */}
        <div className="glass-panel" style={{
          padding: '1.75rem 1.5rem',
          textAlign: 'center',
          border: '1px solid rgba(180, 83, 9, 0.3)',
          order: 2,
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #b45309, #78350f)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: 800,
            marginBottom: '0.75rem',
            boxShadow: '0 0 15px rgba(180, 83, 9, 0.3)',
          }}>
            3
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Rohan Mehra</h3>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block' }}>Karnataka • Diamond Tier</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', margin: '0.5rem 0' }}>
            94 <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>PTS</span>
          </div>
          <span className="badge badge-emerald">
            <ShieldCheck size={12} /> Verified
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search by athlete name or state..."
            style={{ paddingLeft: '2.4rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* State Filter */}
        <div>
          <select
            className="input-field"
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
          >
            <option value="all">All States</option>
            <option value="Haryana">Haryana</option>
            <option value="Punjab">Punjab</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="Delhi">Delhi</option>
            <option value="Rajasthan">Rajasthan</option>
          </select>
        </div>

        {/* Categories */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setSelectedCategory('overall')}
            className={`btn ${selectedCategory === 'overall' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.82rem', padding: '0.5rem 0.85rem' }}
          >
            Overall Index
          </button>
          <button
            onClick={() => setSelectedCategory('squats')}
            className={`btn ${selectedCategory === 'squats' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.82rem', padding: '0.5rem 0.85rem' }}
          >
            Squats
          </button>
          <button
            onClick={() => setSelectedCategory('pushups')}
            className={`btn ${selectedCategory === 'pushups' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.82rem', padding: '0.5rem 0.85rem' }}
          >
            Pushups
          </button>
        </div>
      </div>

      {/* Complete Leaderboard Roster */}
      <LeaderboardWidget entries={filteredEntries} />
    </div>
  );
};
