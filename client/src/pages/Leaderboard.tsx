import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Award,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
  BarChart3,
  Zap,
  Star,
  MapPin,
  Users,
  Trophy,
  Target,
  RefreshCw,
  Flame,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  fetchLeaderboard,
  filterAndSortAthletes,
  LeaderboardAthlete,
  LeaderboardFilters,
  MetricKey,
  METRIC_LABELS,
  STATES,
  SPORTS,
  AGE_GROUPS,
  MOCK_MY_POSITION,
  Tier,
  VerificationStatus,
} from '../services/leaderboardService';

// ── Design Tokens (matching Navbar Neo-Brutalist system) ──────────────────────
const T = {
  bg: '#f5f0e8',
  surfaceLowest: '#ffffff',
  surfaceVariant: '#e8e3da',
  surfaceHigh: '#e8e3da',
  surfaceDim: '#d6d1c9',
  primary: '#1a1a1a',
  primaryContainer: '#ffcc00',
  tertiary: '#0055ff',
  secondary: '#e63b2e',
  onPrimary: '#ffffff',
  green: '#16a34a',
  fontHeadline: "'Space Grotesk', sans-serif",
  fontBody: "'Inter', sans-serif",
  border2: '2px solid #1a1a1a',
  border4: '4px solid #1a1a1a',
  shadow2: '2px 2px 0px 0px #1a1a1a',
  shadow4: '4px 4px 0px 0px #1a1a1a',
  shadow6: '6px 6px 0px 0px #1a1a1a',
} as const;

// ── Tier Colors ───────────────────────────────────────────────────────────────
function getTierColors(tier: Tier) {
  switch (tier) {
    case 'OLYMPIAN': return { bg: '#ffcc00', color: '#1a1a1a', border: '2px solid #1a1a1a' };
    case 'DIAMOND':  return { bg: '#dbeafe', color: '#1d4ed8', border: '2px solid #1d4ed8' };
    case 'PLATINUM': return { bg: '#f3e8ff', color: '#7c3aed', border: '2px solid #7c3aed' };
    case 'GOLD':     return { bg: '#fef9c3', color: '#a16207', border: '2px solid #a16207' };
    case 'SILVER':   return { bg: '#f1f5f9', color: '#475569', border: '2px solid #475569' };
    case 'BRONZE':   return { bg: '#fef3c7', color: '#92400e', border: '2px solid #92400e' };
    default:         return { bg: '#e8e3da', color: '#1a1a1a', border: '2px solid #1a1a1a' };
  }
}

function getVerificationIcon(status: VerificationStatus) {
  if (status === 'VERIFIED')   return <CheckCircle size={14} color="#16a34a" />;
  if (status === 'PENDING')    return <Clock size={14} color="#d97706" />;
  return <XCircle size={14} color="#9ca3af" />;
}

function getRankChangeEl(change: number) {
  if (change > 0) return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '1px', color: '#16a34a', fontSize: '0.7rem', fontWeight: 700 }}>
      <TrendingUp size={11} />+{change}
    </span>
  );
  if (change < 0) return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '1px', color: '#e63b2e', fontSize: '0.7rem', fontWeight: 700 }}>
      <TrendingDown size={11} />{change}
    </span>
  );
  return <Minus size={11} color="#9ca3af" />;
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

// ── Podium Card ───────────────────────────────────────────────────────────────
interface PodiumCardProps {
  athlete: LeaderboardAthlete;
  position: 1 | 2 | 3;
  score: number;
}

const PodiumCard: React.FC<PodiumCardProps> = ({ athlete, position, score }) => {
  const isFirst = position === 1;
  const [hovered, setHovered] = useState(false);
  const height = isFirst ? 340 : position === 2 ? 300 : 280;
  const marginTop = isFirst ? -32 : 0;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isFirst ? T.primaryContainer : T.surfaceHigh,
        border: T.border4,
        boxShadow: hovered ? T.shadow6 : (isFirst ? T.shadow6 : T.shadow4),
        padding: '1.75rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        justifyContent: 'space-between',
        minHeight: `${height}px`,
        marginTop: `${marginTop}px`,
        zIndex: isFirst ? 10 : 1,
        position: 'relative',
        transform: hovered ? 'translateY(-4px)' : 'none',
        transition: 'all 0.15s ease',
      }}
    >
      {isFirst && (
        <div style={{
          position: 'absolute', top: '-14px', right: '-14px',
          background: T.primary, color: T.onPrimary,
          padding: '0.25rem 0.6rem', fontSize: '0.68rem',
          fontFamily: T.fontHeadline, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.05em',
          border: T.border2, transform: 'rotate(3deg)', boxShadow: T.shadow2,
        }}>National Leader</div>
      )}

      <div style={{
        width: isFirst ? '72px' : '60px', height: isFirst ? '72px' : '60px',
        borderRadius: '50%',
        background: isFirst ? T.primary : T.surfaceDim,
        border: isFirst ? T.border4 : T.border2,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: T.fontHeadline, fontWeight: 900,
        fontSize: isFirst ? '1.4rem' : '1.3rem',
        color: isFirst ? T.primaryContainer : T.primary,
        boxShadow: isFirst ? T.shadow4 : T.shadow2,
        marginBottom: '0.75rem', flexShrink: 0,
      }}>
        {isFirst ? <Trophy size={28} color={T.primaryContainer} /> : position}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
        <h3 style={{
          fontFamily: T.fontHeadline, fontWeight: isFirst ? 900 : 700,
          fontSize: isFirst ? '1.15rem' : '1rem', textTransform: 'uppercase',
          letterSpacing: '-0.02em', lineHeight: 1.1, color: T.primary,
        }}>{athlete.name}</h3>
        <p style={{ fontSize: '0.72rem', fontWeight: 600, color: isFirst ? 'rgba(26,26,26,0.75)' : '#4a4a4a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {athlete.state} • {athlete.tier.charAt(0) + athlete.tier.slice(1).toLowerCase()}
        </p>
        <p style={{ fontSize: '0.68rem', color: '#6b6b6b', fontWeight: 500 }}>{athlete.sport}</p>
      </div>

      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px', marginBottom: '0.65rem' }}>
          <span style={{
            fontFamily: T.fontHeadline, fontWeight: 900,
            fontSize: isFirst ? '3.5rem' : '2.8rem',
            lineHeight: 1, color: isFirst ? T.primary : T.tertiary,
          }}>{score}</span>
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#4a4a4a' }}>PTS</span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
          background: isFirst ? '#ffffff' : T.surfaceLowest,
          border: isFirst ? T.border2 : '1px solid #1a1a1a',
          padding: '0.4rem 0.75rem',
          fontFamily: T.fontHeadline, fontWeight: 700,
          fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em',
          boxShadow: isFirst ? T.shadow2 : 'none',
        }}>
          {isFirst
            ? <><Flame size={13} /> Benchmark Leader</>
            : <><CheckCircle size={13} color="#16a34a" /> AI Verified</>}
        </div>
      </div>
    </div>
  );
};

// ── Athlete Row ───────────────────────────────────────────────────────────────
interface AthleteRowProps {
  athlete: LeaderboardAthlete;
  displayRank: number;
  metric: MetricKey;
  score: number;
  isCurrentUser: boolean;
}

const AthleteRow: React.FC<AthleteRowProps> = ({ athlete, displayRank, metric, score, isCurrentUser }) => {
  const tierColors = getTierColors(athlete.tier);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.8rem 1rem',
        background: isCurrentUser ? T.primaryContainer : (hovered ? T.surfaceVariant : T.surfaceLowest),
        border: T.border4,
        boxShadow: hovered && !isCurrentUser ? T.shadow4 : T.shadow2,
        transform: hovered && !isCurrentUser ? 'translate(2px,-2px)' : 'none',
        transition: 'all 0.12s ease',
        cursor: 'pointer',
        fontFamily: T.fontBody,
      }}
    >
      {/* Rank */}
      <div style={{
        width: '40px', height: '40px', flexShrink: 0,
        background: displayRank === 1 ? T.primaryContainer : (isCurrentUser ? T.primary : T.surfaceDim),
        border: displayRank <= 3 ? T.border2 : '2px solid rgba(26,26,26,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '0.95rem',
        color: isCurrentUser && displayRank > 3 ? T.primaryContainer : T.primary,
      }}>
        {displayRank === 1 ? <Trophy size={17} color={T.primary} /> : `#${displayRank}`}
      </div>

      {/* Avatar */}
      <div style={{
        width: '36px', height: '36px', flexShrink: 0, borderRadius: '50%',
        background: isCurrentUser ? T.primary : T.surfaceDim,
        border: T.border2,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '0.78rem',
        color: isCurrentUser ? T.primaryContainer : T.primary,
      }}>
        {getInitials(athlete.name)}
      </div>

      {/* Name & meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.18rem', flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: T.fontHeadline, fontWeight: 700, fontSize: '0.95rem',
            textTransform: 'uppercase', letterSpacing: '-0.01em',
            color: T.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px',
          }}>{athlete.name}</span>
          {getVerificationIcon(athlete.verificationStatus)}
          {isCurrentUser && (
            <span style={{
              background: T.primary, color: T.primaryContainer,
              padding: '0.08rem 0.35rem', fontSize: '0.62rem',
              fontFamily: T.fontHeadline, fontWeight: 700, textTransform: 'uppercase',
            }}>YOU</span>
          )}
        </div>
        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#4a4a4a', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
          {athlete.state} • {athlete.sport} • {athlete.validReps} reps
        </div>
      </div>

      {/* Rank Change */}
      <div style={{ flexShrink: 0, width: '32px', display: 'flex', justifyContent: 'center' }}>
        {getRankChangeEl(athlete.rankChange)}
      </div>

      {/* Tier badge - hidden on mobile via inline style */}
      <div style={{
        flexShrink: 0, background: tierColors.bg, color: tierColors.color,
        border: tierColors.border, padding: '0.18rem 0.5rem',
        fontSize: '0.65rem', fontFamily: T.fontHeadline, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.05em',
      }}>
        {athlete.tier.charAt(0) + athlete.tier.slice(1).toLowerCase()}
      </div>

      {/* Score */}
      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: '50px' }}>
        <div style={{
          fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '1.55rem',
          lineHeight: 1, color: hovered ? T.tertiary : T.primary, transition: 'color 0.12s',
        }}>{score}</div>
        <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', color: '#6b6b6b', marginTop: '2px' }}>
          {metric === 'overallScore' ? 'PTS' : METRIC_LABELS[metric].slice(0, 5).toUpperCase()}
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [allAthletes, setAllAthletes] = useState<LeaderboardAthlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const myPosition = MOCK_MY_POSITION;

  const [filters, setFilters] = useState<LeaderboardFilters>({
    search: '', state: 'All States', sport: 'All Sports',
    ageGroup: 'All', gender: 'All', verificationStatus: 'All',
    metric: 'overallScore', sortBy: 'score',
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchLeaderboard().then((data) => {
      if (!cancelled) { setAllAthletes(data); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, []);

  const setFilter = useCallback(<K extends keyof LeaderboardFilters>(key: K, value: LeaderboardFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const filteredAthletes = useMemo(() => filterAndSortAthletes(allAthletes, filters), [allAthletes, filters]);

  const top3 = useMemo(() => {
    return [...allAthletes]
      .sort((a, b) => {
        const aS = filters.metric === 'overallScore' ? a.overallScore : a.metrics[filters.metric as keyof typeof a.metrics];
        const bS = filters.metric === 'overallScore' ? b.overallScore : b.metrics[filters.metric as keyof typeof b.metrics];
        return bS - aS;
      })
      .slice(0, 3);
  }, [allAthletes, filters.metric]);

  const getScore = (a: LeaderboardAthlete) =>
    filters.metric === 'overallScore' ? a.overallScore : a.metrics[filters.metric as keyof typeof a.metrics];

  const metrics: MetricKey[] = ['overallScore','speed','strength','agility','endurance','power','pushups','squats','sprint'];

  const hasActiveFilters = filters.state !== 'All States' || filters.sport !== 'All Sports' ||
    filters.ageGroup !== 'All' || filters.gender !== 'All' || filters.verificationStatus !== 'All' || !!filters.search;

  const statsCards = [
    { label: 'National Rank', value: `#${myPosition.nationalRank.toLocaleString()}`, icon: Trophy, bg: T.primaryContainer },
    { label: 'State Rank',    value: `#${myPosition.stateRank}`,                    icon: MapPin,  bg: '#dbeafe' },
    { label: 'Sport Rank',    value: `#${myPosition.sportRank}`,                    icon: Star,    bg: '#f3e8ff' },
    { label: 'Percentile',    value: `${myPosition.percentile}th`,                  icon: BarChart3, bg: '#dcfce7' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700;900&family=Inter:wght@400;500;600;700&display=swap');
        .lb-page { background: #f5f0e8; min-height: calc(100vh - 64px); color: #1a1a1a; }
        .lb-inner { max-width: 1280px; margin: 0 auto; padding: 2rem 1.5rem 5rem; }
        .lb-podium { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.25rem; align-items: end; margin-bottom: 2.5rem; }
        .lb-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 1rem; }
        .lb-metric-row { display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 0.25rem; scrollbar-width: none; }
        .lb-metric-row::-webkit-scrollbar { display: none; }
        .lb-filter-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(170px,1fr)); gap: 0.75rem; }
        @keyframes lb-spin { to { transform: rotate(360deg); } }
        .lb-spin { animation: lb-spin 1s linear infinite; }
        @media (max-width: 900px) {
          .lb-podium { grid-template-columns: 1fr; }
          .lb-stats { grid-template-columns: repeat(2,1fr); }
        }
        @media (max-width: 640px) {
          .lb-inner { padding: 1.25rem 0.9rem 5rem; }
          .lb-stats { grid-template-columns: repeat(2,1fr); gap: 0.65rem; }
        }
      `}</style>

      <div className="lb-page">
        <div className="lb-inner">

          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
              background: '#e8e3da', border: '2px solid #1a1a1a', boxShadow: '2px 2px 0 #1a1a1a',
              padding: '0.28rem 0.75rem', fontFamily: "'Space Grotesk',sans-serif",
              fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase',
              letterSpacing: '0.07em', marginBottom: '0.9rem',
            }}>
              <Award size={13} /> {t('lb.portal', 'National Talent Identification Portal')}
            </div>
            <h1 style={{
              fontFamily: "'Space Grotesk',sans-serif", fontWeight: 900,
              fontSize: 'clamp(2.2rem,6vw,4.2rem)', lineHeight: 0.95,
              textTransform: 'uppercase', letterSpacing: '-0.04em', marginBottom: '0.75rem',
            }}>
              {t('lb.title1', 'All-India')} <br /><span style={{ color: '#0055ff' }}>{t('lb.title2', 'Leaderboard')}</span>
            </h1>
            <p style={{ fontSize: '0.9rem', fontWeight: 500, color: '#4a4a4a', maxWidth: '540px' }}>
              {t('lb.subtitle', 'Rankings verified via computer vision biomechanical analysis for SAI talent scouts.')}{' '}
              <strong>{myPosition.totalAthletes.toLocaleString()}</strong> athletes competing nationally.
            </p>
          </div>

          {/* Podium */}
          {loading ? (
            <div style={{
              background: '#e8e3da', border: '4px solid #1a1a1a', boxShadow: '4px 4px 0 #1a1a1a',
              padding: '3rem', textAlign: 'center', marginBottom: '2rem',
              fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
            }}>
              <RefreshCw size={20} className="lb-spin" /> Loading Rankings...
            </div>
          ) : top3.length >= 3 && (
            <div className="lb-podium">
              <PodiumCard athlete={top3[1]} position={2} score={getScore(top3[1])} />
              <PodiumCard athlete={top3[0]} position={1} score={getScore(top3[0])} />
              <PodiumCard athlete={top3[2]} position={3} score={getScore(top3[2])} />
            </div>
          )}

          {/* Your Position Bar */}
          <div style={{
            background: '#1a1a1a', color: '#ffffff', border: '4px solid #1a1a1a',
            boxShadow: '4px 4px 0 #1a1a1a', padding: '1rem 1.25rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{
                width: '44px', height: '44px', background: '#ffcc00', color: '#1a1a1a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Space Grotesk',sans-serif", fontWeight: 900, fontSize: '0.85rem',
                border: '2px solid rgba(255,255,255,0.2)', flexShrink: 0,
              }}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'YU'}
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#ffcc00', marginBottom: '2px' }}>
                  Your Position
                </div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 900, fontSize: '1.15rem', textTransform: 'uppercase', lineHeight: 1 }}>
                  {user?.name || 'Athlete'} · #{myPosition.nationalRank.toLocaleString()} Nationally
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              {[
                ['State', `#${myPosition.stateRank}`],
                ['Sport', `#${myPosition.sportRank}`],
                ['Age Group', `#${myPosition.ageGroupRank}`],
                ['Percentile', `${myPosition.percentile}th`],
              ].map(([lbl, val]) => (
                <div key={lbl} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.55)', fontFamily: "'Space Grotesk',sans-serif" }}>{lbl}</div>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 900, fontSize: '1.1rem', color: '#ffcc00' }}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Metric Tabs */}
          <div style={{
            background: '#e8e3da', border: '4px solid #1a1a1a', boxShadow: '4px 4px 0 #1a1a1a',
            padding: '0.85rem 1.25rem', marginBottom: '0.85rem',
          }}>
            <div style={{ fontSize: '0.67rem', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#4a4a4a', marginBottom: '0.55rem' }}>
              Ranking Metric
            </div>
            <div className="lb-metric-row">
              {metrics.map((m) => (
                <button
                  key={m}
                  onClick={() => setFilter('metric', m)}
                  style={{
                    flexShrink: 0,
                    background: filters.metric === m ? '#1a1a1a' : '#ffffff',
                    color: filters.metric === m ? '#ffffff' : '#1a1a1a',
                    border: '2px solid #1a1a1a',
                    padding: '0.4rem 0.8rem',
                    fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
                    fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.04em',
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    boxShadow: filters.metric === m ? '2px 2px 0 #1a1a1a' : 'none',
                    transition: 'all 0.1s ease',
                  }}
                >{METRIC_LABELS[m]}</button>
              ))}
            </div>
          </div>

          {/* Search + Filters */}
          <div style={{
            background: '#e8e3da', border: '4px solid #1a1a1a', boxShadow: '4px 4px 0 #1a1a1a',
            padding: '1rem 1.25rem', marginBottom: '1.5rem',
          }}>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: showFilters ? '0.85rem' : '0', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                <Search size={15} color="#4a4a4a" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search athlete, state, sport..."
                  value={filters.search}
                  onChange={(e) => setFilter('search', e.target.value)}
                  style={{
                    width: '100%', padding: '0.6rem 1rem 0.6rem 2.2rem',
                    background: '#ffffff', border: '2px solid #1a1a1a',
                    fontFamily: "'Inter',sans-serif", fontSize: '0.85rem', fontWeight: 500,
                    color: '#1a1a1a', outline: 'none',
                  }}
                />
              </div>
              <button
                onClick={() => setShowFilters((p) => !p)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.6rem 1rem',
                  background: showFilters ? '#1a1a1a' : '#ffffff',
                  color: showFilters ? '#ffffff' : '#1a1a1a',
                  border: '2px solid #1a1a1a',
                  fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
                  fontSize: '0.76rem', textTransform: 'uppercase', cursor: 'pointer', flexShrink: 0,
                }}
              >
                <Filter size={13} /> Filters
                <ChevronDown size={13} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
              </button>
            </div>

            {showFilters && (
              <div>
                <div className="lb-filter-grid">
                  {([
                    { label: 'State', key: 'state' as const, opts: STATES },
                    { label: 'Sport', key: 'sport' as const, opts: SPORTS },
                    { label: 'Age Group', key: 'ageGroup' as const, opts: AGE_GROUPS },
                    { label: 'Gender', key: 'gender' as const, opts: ['All','Male','Female','Other'] },
                    { label: 'Verification', key: 'verificationStatus' as const, opts: ['All','VERIFIED','PENDING','UNVERIFIED'] },
                    { label: 'Sort By', key: 'sortBy' as const, opts: ['score','improvement','percentile'] },
                  ]).map(({ label, key, opts }) => (
                    <div key={key}>
                      <div style={{ fontSize: '0.65rem', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem', color: '#4a4a4a' }}>{label}</div>
                      <select
                        value={filters[key] as string}
                        onChange={(e) => setFilter(key, e.target.value as any)}
                        style={{
                          width: '100%', padding: '0.5rem 0.7rem',
                          background: '#ffffff', border: '2px solid #1a1a1a',
                          fontFamily: "'Inter',sans-serif", fontSize: '0.82rem', fontWeight: 600,
                          color: '#1a1a1a', outline: 'none', cursor: 'pointer',
                        }}
                      >
                        {opts.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active filter chips */}
            {hasActiveFilters && (
              <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '2px solid #1a1a1a' }}>
                {filters.search && (
                  <span onClick={() => setFilter('search', '')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#1a1a1a', color: '#ffffff', padding: '0.18rem 0.5rem', fontSize: '0.7rem', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}>
                    "{filters.search}" ×
                  </span>
                )}
                {filters.state !== 'All States' && (
                  <span onClick={() => setFilter('state', 'All States')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#1a1a1a', color: '#ffffff', padding: '0.18rem 0.5rem', fontSize: '0.7rem', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}>
                    {filters.state} ×
                  </span>
                )}
                {filters.sport !== 'All Sports' && (
                  <span onClick={() => setFilter('sport', 'All Sports')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#1a1a1a', color: '#ffffff', padding: '0.18rem 0.5rem', fontSize: '0.7rem', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}>
                    {filters.sport} ×
                  </span>
                )}
                <button
                  onClick={() => setFilters({ search: '', state: 'All States', sport: 'All Sports', ageGroup: 'All', gender: 'All', verificationStatus: 'All', metric: filters.metric, sortBy: filters.sortBy })}
                  style={{ background: 'transparent', border: '2px solid #1a1a1a', padding: '0.18rem 0.5rem', fontSize: '0.7rem', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', color: '#1a1a1a' }}
                >Clear All</button>
              </div>
            )}
          </div>

          {/* National Standings */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 900, fontSize: '1.65rem', textTransform: 'uppercase', letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: '0.5rem', lineHeight: 1 }}>
                  <Target size={21} color="#0055ff" /> National Standings
                </h2>
                <p style={{ fontSize: '0.72rem', fontWeight: 600, color: '#4a4a4a', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '0.25rem' }}>
                  AI Verified Biomechanical Rankings · {filteredAthletes.length} athletes shown
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#e8e3da', border: '2px solid #1a1a1a', padding: '0.28rem 0.6rem', fontSize: '0.7rem', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <CheckCircle size={12} color="#16a34a" /> Live Verified
              </div>
            </div>

            {!loading && filteredAthletes.length === 0 && (
              <div style={{ background: '#e8e3da', border: '4px solid #1a1a1a', boxShadow: '4px 4px 0 #1a1a1a', padding: '3rem', textAlign: 'center', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, textTransform: 'uppercase' }}>
                <Users size={40} style={{ marginBottom: '1rem', opacity: 0.35 }} />
                <div style={{ fontSize: '1.15rem', marginBottom: '0.4rem' }}>No Athletes Found</div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#4a4a4a' }}>Try adjusting filters or search</div>
              </div>
            )}

            {!loading && filteredAthletes.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {filteredAthletes.map((athlete, idx) => {
                  const score = getScore(athlete);
                  const firstName = user?.name?.split(' ')[0]?.toLowerCase() || '';
                  const isCurrentUser = !!(firstName && athlete.name.toLowerCase().startsWith(firstName));
                  return (
                    <AthleteRow
                      key={athlete.athleteId}
                      athlete={athlete}
                      displayRank={idx + 1}
                      metric={filters.metric}
                      score={score}
                      isCurrentUser={isCurrentUser}
                    />
                  );
                })}
              </div>
            )}

            {!loading && filteredAthletes.length > 0 && (
              <button style={{
                width: '100%', marginTop: '0.85rem',
                background: '#ffffff', color: '#1a1a1a',
                border: '4px solid #1a1a1a', padding: '0.85rem',
                fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
                fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#e8e3da'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
              >
                Load More Athletes <ChevronDown size={16} />
              </button>
            )}
          </div>

          {/* Your Rankings Cards */}
          <div style={{ marginTop: '2.5rem' }}>
            <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 900, fontSize: '1.35rem', textTransform: 'uppercase', letterSpacing: '-0.03em', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={17} color="#0055ff" /> Your Rankings
            </h2>
            <div className="lb-stats">
              {statsCards.map(({ label, value, icon: Icon, bg }) => (
                <div key={label}
                  style={{ background: bg, border: '4px solid #1a1a1a', boxShadow: '4px 4px 0 #1a1a1a', padding: '1.25rem', transition: 'all 0.12s ease', cursor: 'default' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '6px 6px 0 #1a1a1a'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '4px 4px 0 #1a1a1a'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.65rem' }}>
                    <Icon size={16} color="#1a1a1a" />
                    <span style={{ fontSize: '0.67rem', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                  </div>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 900, fontSize: '2rem', lineHeight: 1, letterSpacing: '-0.03em' }}>{value}</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#4a4a4a', marginTop: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    of {myPosition.totalAthletes.toLocaleString()} athletes
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Methodology */}
          <div style={{ marginTop: '2.5rem', background: '#e8e3da', border: '4px solid #1a1a1a', boxShadow: '4px 4px 0 #1a1a1a', padding: '1.5rem' }}>
            <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 900, fontSize: '1.05rem', textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={16} /> Ranking Methodology
            </h3>
            <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4a4a4a', lineHeight: 1.7 }}>
              Rankings are computed from AI-powered computer vision biomechanical analysis. Each athlete's{' '}
              <strong>Overall Index</strong> is a weighted composite of speed, strength, agility, endurance, and power —
              measured from verified assessment sessions via the KreedAI Pose Studio. Verification requires a proctored
              session. Unverified scores are excluded from official SAI talent identification.
            </p>
          </div>

        </div>
      </div>
    </>
  );
};

