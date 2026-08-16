import React from 'react';
import { Award, CheckCircle, Flame, Medal, ShieldCheck } from 'lucide-react';

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  reps: number;
  tier: string;
  state: string;
  verified: boolean;
}

interface LeaderboardProps {
  entries?: LeaderboardEntry[];
  compact?: boolean;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  entries = [
    { rank: 1, name: 'Vikramaditya Singh', score: 98, reps: 52, tier: 'OLYMPIAN', state: 'Haryana', verified: true },
    { rank: 2, name: 'Priya Narang', score: 96, reps: 48, tier: 'DIAMOND', state: 'Punjab', verified: true },
    { rank: 3, name: 'Rohan Mehra', score: 94, reps: 45, tier: 'DIAMOND', state: 'Karnataka', verified: true },
    { rank: 4, name: 'Ananya Roy', score: 91, reps: 40, tier: 'PLATINUM', state: 'Maharashtra', verified: true },
    { rank: 5, name: 'Aarav Sharma (You)', score: 88, reps: 36, tier: 'PLATINUM', state: 'Delhi', verified: true },
    { rank: 6, name: 'Kavita Chawla', score: 85, reps: 34, tier: 'GOLD', state: 'Rajasthan', verified: false },
    { rank: 7, name: 'Devendra Joshi', score: 82, reps: 30, tier: 'GOLD', state: 'Uttarakhand', verified: true },
  ],
  compact = false,
}) => {
  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 800,
          boxShadow: '0 0 10px rgba(245, 158, 11, 0.5)',
        }}>
          <Medal size={16} />
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #94a3b8, #64748b)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 800,
        }}>
          2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #b45309, #78350f)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 800,
        }}>
          3
        </span>
      );
    }
    return (
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontWeight: 700,
        color: 'var(--text-muted)',
        width: '28px',
        textAlign: 'center',
        display: 'inline-block'
      }}>
        #{rank}
      </span>
    );
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'OLYMPIAN':
        return <span className="badge badge-amber"><Flame size={12} /> Olympian</span>;
      case 'DIAMOND':
        return <span className="badge badge-cyan">Diamond</span>;
      case 'PLATINUM':
        return <span className="badge badge-emerald">Platinum</span>;
      default:
        return <span className="badge badge-violet">{tier}</span>;
    }
  };

  return (
    <div className="glass-panel" style={{ padding: compact ? '1rem' : '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={20} color="var(--accent-amber)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>National Talent Standings</h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            AI Verified Biomechanical Benchmark Rankings
          </span>
        </div>
        <span className="badge badge-emerald">
          <ShieldCheck size={13} /> Live Verified
        </span>
      </div>

      {/* Table List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {entries.map((item) => {
          const isUser = item.name.includes('(You)');
          return (
            <div
              key={item.rank}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                background: isUser ? 'rgba(6, 182, 212, 0.12)' : 'rgba(15, 23, 42, 0.5)',
                border: isUser ? '1px solid rgba(6, 182, 212, 0.35)' : '1px solid var(--border-color)',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Rank and Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                {getRankBadge(item.rank)}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{ fontWeight: isUser ? 800 : 600, color: isUser ? '#fff' : 'var(--text-primary)' }}>
                      {item.name}
                    </span>
                    {item.verified && (
                      <span title="Sports Authority Verified" style={{ display: 'inline-flex' }}>
                        <CheckCircle size={14} color="#10b981" />
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {item.state} • {item.reps} Valid Reps
                  </span>
                </div>
              </div>

              {/* Tier and Score */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {!compact && getTierBadge(item.tier)}
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    color: item.rank === 1 ? 'var(--accent-amber)' : 'var(--accent-cyan)',
                  }}>
                    {item.score}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                    PTS
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
