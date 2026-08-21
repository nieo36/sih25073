import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  Bookmark,
  BookmarkCheck,
  MapPin,
  ShieldCheck,
  Sparkles,
  Bot,
  Info,
  TrendingUp,
  Lock,
  Eye,
  Mail,
  CheckCircle2,
  X,
  Send,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { ApiService } from '../services/api';

// ── Scoped Neo-Brutalist Theme Tokens ──────────────────────────────
const T = {
  bg: '#f5f0e8',
  surfaceLowest: '#ffffff',
  surfaceVariant: '#e8e3da',
  surfaceHigh: '#e8e3da',
  surfaceDim: '#d6d1c9',
  surfaceContainer: '#eee9e0',
  primary: '#1a1a1a',
  primaryContainer: '#ffcc00', // Bold Electric Yellow
  tertiary: '#0055ff',        // Cobalt Blue
  tertiaryContainer: '#d6e3ff',
  secondary: '#e63b2e',       // Energy Crimson
  secondaryContainer: '#ffdad6',
  green: '#16a34a',
  greenContainer: '#dcfce7',
  onPrimary: '#ffffff',
  onSurfaceVariant: '#4a4a4a',
  fontHeadline: "'Space Grotesk', sans-serif",
  fontBody: "'Inter', sans-serif",
  border2: '2px solid #1a1a1a',
  border3: '3px solid #1a1a1a',
  border4: '4px solid #1a1a1a',
  shadow2: '2px 2px 0px 0px #1a1a1a',
  shadow4: '4px 4px 0px 0px #1a1a1a',
  shadow6: '6px 6px 0px 0px #1a1a1a',
} as const;

export interface RecruiterCandidate {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  sport: string;
  state: string;
  district: string;
  overallScore: number;
  speed: number;
  agility: number;
  strength: number;
  symmetry: number;
  tier: 'OLYMPIAN' | 'DIAMOND' | 'PLATINUM' | 'GOLD' | 'SILVER';
  matchScore: number;
  aiInsight: string;
  mismatchWarning?: string;
  photo?: string;
  shortlisted: boolean;
  contactAllowed: boolean;
  passportId: string;
  verifiedReps: number;
}

const INITIAL_CANDIDATES: RecruiterCandidate[] = [
  {
    id: 'ath-101',
    name: 'Aarav Sharma',
    age: 18,
    gender: 'Male',
    sport: 'Football',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    overallScore: 88,
    speed: 95,
    agility: 91,
    strength: 86,
    symmetry: 96,
    tier: 'PLATINUM',
    matchScore: 97,
    aiInsight: 'Meets age, sport, and location parameters perfectly. Sprint speed is in the 94th percentile for age group with elite bilateral symmetry (>95%).',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    shortlisted: true,
    contactAllowed: true,
    passportId: 'IND-2026-8849',
    verifiedReps: 46,
  },
  {
    id: 'ath-102',
    name: 'Meera Singh',
    age: 17,
    gender: 'Female',
    sport: 'Football',
    state: 'Uttar Pradesh',
    district: 'Varanasi',
    overallScore: 86,
    speed: 92,
    agility: 88,
    strength: 84,
    symmetry: 94,
    tier: 'PLATINUM',
    matchScore: 94,
    aiInsight: 'Strong candidate with exceptional linear speed and anti-cheat depth validation across all 5 trial sessions.',
    mismatchWarning: 'Slight Agility Mismatch: Agility is 88 (Requested > 90). Other kinematic metrics exceed requirements.',
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
    shortlisted: false,
    contactAllowed: true,
    passportId: 'IND-2026-9214',
    verifiedReps: 42,
  },
  {
    id: 'ath-103',
    name: 'Vikramaditya Singh',
    age: 22,
    gender: 'Male',
    sport: 'Athletics & Track',
    state: 'Haryana',
    district: 'Rohtak',
    overallScore: 98,
    speed: 97,
    agility: 96,
    strength: 95,
    symmetry: 98,
    tier: 'OLYMPIAN',
    matchScore: 99,
    aiInsight: 'National Benchmark Leader in Sprint Acceleration and Lower Power. Top 0.1% all-India biomechanical rank.',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    shortlisted: true,
    contactAllowed: true,
    passportId: 'IND-2026-1001',
    verifiedReps: 52,
  },
  {
    id: 'ath-104',
    name: 'Priya Narang',
    age: 20,
    gender: 'Female',
    sport: 'Wrestling',
    state: 'Punjab',
    district: 'Ludhiana',
    overallScore: 96,
    speed: 93,
    agility: 94,
    strength: 97,
    symmetry: 96,
    tier: 'DIAMOND',
    matchScore: 96,
    aiInsight: 'Exceptional core strength and cadence endurance. Holds Level-2 SAI proctored benchmark certificate.',
    photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80',
    shortlisted: false,
    contactAllowed: true,
    passportId: 'IND-2026-1002',
    verifiedReps: 48,
  },
  {
    id: 'ath-105',
    name: 'Zara Ali',
    age: 18,
    gender: 'Female',
    sport: 'Football',
    state: 'Haryana',
    district: 'Gurugram',
    overallScore: 81,
    speed: 88,
    agility: 91,
    strength: 80,
    symmetry: 92,
    tier: 'GOLD',
    matchScore: 82,
    aiInsight: 'High tactical agility score and clean squat form consistency. Athlete has disabled direct contact per guardian privacy settings.',
    photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
    shortlisted: false,
    contactAllowed: false,
    passportId: 'IND-2026-7731',
    verifiedReps: 38,
  },
  {
    id: 'ath-106',
    name: 'Rohan Mehra',
    age: 21,
    gender: 'Male',
    sport: 'Kabaddi',
    state: 'Karnataka',
    district: 'Bengaluru',
    overallScore: 94,
    speed: 92,
    agility: 95,
    strength: 93,
    symmetry: 95,
    tier: 'DIAMOND',
    matchScore: 93,
    aiInsight: 'Elite raid velocity and rapid direction changes. Tested positive for Olympic tier kinematic symmetry.',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    shortlisted: false,
    contactAllowed: true,
    passportId: 'IND-2026-1003',
    verifiedReps: 45,
  },
];

export const RecruiterDashboard: React.FC = () => {
  const { t } = useLanguage();
  const [candidates, setCandidates] = useState<RecruiterCandidate[]>(INITIAL_CANDIDATES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('All Sports');
  const [selectedState, setSelectedState] = useState('All States');
  const [selectedAgeCategory, setSelectedAgeCategory] = useState('All Ages');
  const [minScore, setMinScore] = useState<number>(75);
  const [contactModalCandidate, setContactModalCandidate] = useState<RecruiterCandidate | null>(null);
  const [showShortlistDrawer, setShowShortlistDrawer] = useState(false);
  const [invitationSent, setInvitationSent] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    ApiService.getRecruiterCandidates()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCandidates(data);
        }
      })
      .catch(() => {});
  }, []);

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const toggleShortlist = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const next = !c.shortlisted;
          showNotification(next ? `${c.name} added to shortlist!` : `${c.name} removed from shortlist.`);
          return { ...c, shortlisted: next };
        }
        return c;
      })
    );
  };

  // Filter Logic
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesSport = c.sport.toLowerCase().includes(q);
        const matchesState = c.state.toLowerCase().includes(q);
        const matchesDistrict = c.district.toLowerCase().includes(q);
        const matchesInsight = c.aiInsight.toLowerCase().includes(q);
        if (!matchesName && !matchesSport && !matchesState && !matchesDistrict && !matchesInsight) {
          return false;
        }
      }

      if (selectedSport !== 'All Sports' && !c.sport.toLowerCase().includes(selectedSport.toLowerCase())) {
        return false;
      }
      if (selectedState !== 'All States' && c.state !== selectedState) {
        return false;
      }
      if (selectedAgeCategory === 'U-16' && c.age > 16) return false;
      if (selectedAgeCategory === 'U-18' && c.age > 18) return false;
      if (selectedAgeCategory === 'U-21' && c.age > 21) return false;
      if (selectedAgeCategory === 'Senior' && c.age < 21) return false;

      if (c.overallScore < minScore) return false;

      return true;
    });
  }, [candidates, searchQuery, selectedSport, selectedState, selectedAgeCategory, minScore]);

  const shortlistedList = useMemo(() => candidates.filter((c) => c.shortlisted), [candidates]);

  // Export CSV Report
  const handleExportScoutingReport = () => {
    const list = shortlistedList.length > 0 ? shortlistedList : filteredCandidates;
    const headers = ['Athlete Name', 'SAI Passport ID', 'Sport', 'State', 'Age', 'Overall Score', 'Speed', 'Agility', 'Symmetry', 'Tier'];
    const rows = list.map((c) => [
      `"${c.name}"`,
      `"${c.passportId}"`,
      `"${c.sport}"`,
      `"${c.state}"`,
      c.age,
      c.overallScore,
      c.speed,
      c.agility,
      c.symmetry,
      `"${c.tier}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `KreedAI_SAI_Scouting_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Scouting Report exported successfully!');
  };

  const handleSendTrialInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setInvitationSent(true);
    setTimeout(() => {
      setInvitationSent(false);
      setContactModalCandidate(null);
      showNotification('Official SAI Scouting Camp trial invitation sent to athlete!');
    }, 1200);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700;900&family=Inter:wght@400;500;600;700;800&display=swap');

        .recruiter-page {
          min-height: calc(100vh - 64px);
          background: ${T.bg};
          color: ${T.primary};
          font-family: ${T.fontBody};
          padding-bottom: 5rem;
        }

        .rec-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          padding: 0.6rem 1.1rem;
          font-family: ${T.fontHeadline};
          font-size: 0.82rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          border: ${T.border2};
          box-shadow: ${T.shadow4};
          cursor: pointer;
          transition: all 0.12s ease;
          text-decoration: none;
        }

        .rec-btn:hover {
          transform: translate(2px, -2px);
          box-shadow: ${T.shadow6};
        }

        .rec-btn:active {
          transform: translate(0, 0);
          box-shadow: ${T.shadow2};
        }

        .rec-btn-primary {
          background: ${T.primaryContainer};
          color: ${T.primary};
        }

        .rec-btn-dark {
          background: ${T.primary};
          color: ${T.onPrimary};
        }

        .rec-btn-surface {
          background: ${T.surfaceLowest};
          color: ${T.primary};
        }

        .rec-card {
          background: ${T.surfaceLowest};
          border: ${T.border4};
          box-shadow: ${T.shadow6};
          transition: all 0.15s ease;
          position: relative;
        }

        .rec-card:hover {
          transform: translate(2px, -2px);
          box-shadow: 8px 8px 0px 0px #1a1a1a;
        }

        @media (max-width: 990px) {
          .rec-layout-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 640px) {
          .rec-btn {
            width: 100% !important;
          }
          .rec-prompt-presets {
            overflow-x: auto !important;
            flex-wrap: nowrap !important;
            padding-bottom: 4px !important;
            scrollbar-width: none !important;
          }
        }
      `}</style>

      <div className="recruiter-page">
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.75rem 1.25rem' }}>
          
          {/* Toast */}
          {toast && (
            <div style={{
              position: 'fixed',
              top: '80px',
              right: '20px',
              zIndex: 9999,
              background: T.primary,
              color: T.primaryContainer,
              border: T.border3,
              boxShadow: T.shadow6,
              padding: '0.85rem 1.25rem',
              fontFamily: T.fontHeadline,
              fontWeight: 800,
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
            }}>
              <CheckCircle2 size={18} color={T.primaryContainer} />
              {toast}
            </div>
          )}

          {/* ── Page Header ─────────────────────────────────────────────── */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '1.25rem',
            marginBottom: '2rem',
            borderBottom: T.border4,
            paddingBottom: '1.5rem',
          }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: T.surfaceVariant,
                border: T.border2,
                boxShadow: T.shadow2,
                padding: '0.25rem 0.65rem',
                fontFamily: T.fontHeadline,
                fontSize: '0.72rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                marginBottom: '0.65rem',
              }}>
                <ShieldCheck size={14} color={T.green} /> SAI Talent Scouting Portal · Accredited Scout
              </div>

              <h1 style={{
                fontFamily: T.fontHeadline,
                fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '-0.04em',
                lineHeight: 0.95,
                marginBottom: '0.5rem',
              }}>
                {t('rec.title1', 'NATIONAL RECRUITER')} <br />
                <span style={{ color: T.tertiary }}>{t('rec.title2', '& SCOUTING HUB')}</span>
              </h1>

              <p style={{ color: T.onSurfaceVariant, fontSize: '0.92rem', maxWidth: '640px', fontWeight: 500 }}>
                Identify and recruit verified grassroots athletic talent across India using standardized AI biomechanical kinematics and digital sports passports.
              </p>
            </div>

            {/* Header Right Badges & Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{
                background: T.primaryContainer,
                border: T.border3,
                boxShadow: T.shadow4,
                padding: '0.6rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
              }}>
                <ShieldCheck size={26} color={T.primary} />
                <div>
                  <div style={{ fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '0.85rem', textTransform: 'uppercase', lineHeight: 1 }}>
                    SAI Talent Scouts
                  </div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#4a4a4a', marginTop: '2px' }}>
                    Role: Lead Scout
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleExportScoutingReport}
                className="rec-btn rec-btn-dark"
                title="Export Scouting Report"
              >
                <Download size={16} /> {t('rec.exportReport', 'Export Report')}
              </button>
            </div>
          </div>

          {/* ── Main Layout Grid (8 Cols Search/Cards + 4 Cols Sidebar) ── */}
          <div
            className="rec-layout-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: '1.75fr 1fr',
              gap: '2rem',
              alignItems: 'start',
            }}
          >
            {/* ── Left Column: AI Search & Athlete Matches ──────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              
              {/* AI Natural Language Search Box */}
              <div style={{
                background: T.surfaceLowest,
                border: T.border4,
                boxShadow: T.shadow6,
                padding: '1.5rem',
              }}>
                <label style={{
                  fontFamily: T.fontHeadline,
                  fontSize: '1.15rem',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '-0.02em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.85rem',
                }}>
                  <Bot size={20} color={T.secondary} />
                  {t('rec.aiSearch', 'AI Talent Natural Language Search')}
                </label>

                <div style={{ position: 'relative' }}>
                  <textarea
                    rows={3}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('rec.aiSearchPlaceholder', "Find U-18 football athletes in Uttar Pradesh with high sprint speed, agility above 85...")}
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem',
                      background: T.bg,
                      border: T.border3,
                      fontFamily: T.fontBody,
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      color: T.primary,
                      outline: 'none',
                      resize: 'none',
                    }}
                  />
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '0.65rem',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}>
                    <div className="rec-prompt-presets" style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {[
                        'U-18 Football UP',
                        'Haryana Sprinters 95+',
                        'Wrestling Punjab 90+ Strength',
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setSearchQuery(preset)}
                          style={{
                            background: T.surfaceVariant,
                            border: T.border2,
                            padding: '0.2rem 0.55rem',
                            fontSize: '0.68rem',
                            fontFamily: T.fontHeadline,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                          }}
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => showNotification(`Searched: ${searchQuery || 'All Candidates'}`)}
                      className="rec-btn rec-btn-primary"
                      style={{ padding: '0.5rem 1.25rem' }}
                    >
                      <Search size={14} /> Search
                    </button>
                  </div>
                </div>
              </div>

              {/* Results Heading */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: T.border3,
                paddingBottom: '0.5rem',
              }}>
                <h3 style={{
                  fontFamily: T.fontHeadline,
                  fontSize: '1.4rem',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '-0.02em',
                }}>
                  Scouted Candidates ({filteredCandidates.length})
                </h3>
                <span style={{ fontSize: '0.75rem', fontFamily: T.fontHeadline, fontWeight: 700, textTransform: 'uppercase', color: T.onSurfaceVariant }}>
                  Live CV Biomechanics Indexed
                </span>
              </div>

              {/* Empty State */}
              {filteredCandidates.length === 0 && (
                <div style={{
                  background: T.surfaceVariant,
                  border: T.border4,
                  boxShadow: T.shadow4,
                  padding: '3rem',
                  textAlign: 'center',
                }}>
                  <Search size={36} color={T.onSurfaceVariant} style={{ marginBottom: '0.75rem' }} />
                  <h4 style={{ fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '1.2rem', textTransform: 'uppercase' }}>
                    No Candidates Matching Criteria
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: T.onSurfaceVariant, marginTop: '0.35rem' }}>
                    Try broadening your AI search prompt or adjusting minimum score thresholds.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedSport('All Sports');
                      setSelectedState('All States');
                      setMinScore(75);
                    }}
                    className="rec-btn rec-btn-dark"
                    style={{ marginTop: '1rem' }}
                  >
                    Reset Filters
                  </button>
                </div>
              )}

              {/* Candidates List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {filteredCandidates.map((athlete) => (
                  <article
                    key={athlete.id}
                    className="rec-card"
                    style={{
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                    }}
                  >
                    {/* Match Badge Ribbon */}
                    <div style={{
                      position: 'absolute',
                      top: '-12px',
                      right: '16px',
                      background: athlete.matchScore >= 95 ? T.primaryContainer : T.surfaceVariant,
                      border: T.border3,
                      boxShadow: T.shadow2,
                      padding: '0.25rem 0.65rem',
                      fontFamily: T.fontHeadline,
                      fontWeight: 900,
                      fontSize: '0.85rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      zIndex: 2,
                    }}>
                      {athlete.matchScore}% MATCH
                    </div>

                    {/* Top Row: Avatar + Name + State + Shortlist Star */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {athlete.photo ? (
                          <img
                            src={athlete.photo}
                            alt={athlete.name}
                            style={{
                              width: '68px',
                              height: '68px',
                              border: T.border3,
                              boxShadow: T.shadow2,
                              objectFit: 'cover',
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '68px',
                            height: '68px',
                            background: T.primaryContainer,
                            border: T.border3,
                            boxShadow: T.shadow2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: T.fontHeadline,
                            fontWeight: 900,
                            fontSize: '1.5rem',
                            flexShrink: 0,
                          }}>
                            {athlete.name.charAt(0)}
                          </div>
                        )}

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <h4 style={{
                              fontFamily: T.fontHeadline,
                              fontSize: '1.45rem',
                              fontWeight: 900,
                              textTransform: 'uppercase',
                              letterSpacing: '-0.02em',
                              lineHeight: 1.1,
                            }}>
                              {athlete.name}
                            </h4>
                            <span style={{
                              background: athlete.tier === 'OLYMPIAN' ? T.primaryContainer : T.surfaceVariant,
                              border: T.border2,
                              padding: '0.1rem 0.45rem',
                              fontSize: '0.65rem',
                              fontFamily: T.fontHeadline,
                              fontWeight: 800,
                              textTransform: 'uppercase',
                            }}>
                              {athlete.tier}
                            </span>
                          </div>

                          <div style={{
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: T.onSurfaceVariant,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            marginTop: '0.2rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}>
                            <MapPin size={13} />
                            {athlete.district ? `${athlete.district}, ` : ''}{athlete.state} • {athlete.age} Yrs • {athlete.sport}
                          </div>
                        </div>
                      </div>

                      {/* Shortlist Action */}
                      <button
                        type="button"
                        onClick={(e) => toggleShortlist(athlete.id, e)}
                        style={{
                          background: athlete.shortlisted ? T.primaryContainer : T.surfaceLowest,
                          border: T.border2,
                          boxShadow: T.shadow2,
                          padding: '0.45rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: T.primary,
                        }}
                        title={athlete.shortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
                      >
                        {athlete.shortlisted ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
                      </button>
                    </div>

                    {/* Metrics 3-Column Box */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      border: T.border3,
                      background: T.bg,
                    }}>
                      <div style={{ padding: '0.65rem', textAlign: 'center', borderRight: T.border3 }}>
                        <div style={{ fontFamily: T.fontHeadline, fontSize: '1.6rem', fontWeight: 900, color: T.primary }}>
                          {athlete.overallScore}
                        </div>
                        <div style={{ fontSize: '0.65rem', fontFamily: T.fontHeadline, fontWeight: 700, textTransform: 'uppercase', color: T.onSurfaceVariant }}>
                          Overall Index
                        </div>
                      </div>

                      <div style={{ padding: '0.65rem', textAlign: 'center', borderRight: T.border3 }}>
                        <div style={{ fontFamily: T.fontHeadline, fontSize: '1.6rem', fontWeight: 900, color: T.tertiary }}>
                          {athlete.speed}
                        </div>
                        <div style={{ fontSize: '0.65rem', fontFamily: T.fontHeadline, fontWeight: 700, textTransform: 'uppercase', color: T.onSurfaceVariant }}>
                          Speed Index
                        </div>
                      </div>

                      <div style={{ padding: '0.65rem', textAlign: 'center' }}>
                        <div style={{ fontFamily: T.fontHeadline, fontSize: '1.6rem', fontWeight: 900, color: T.green }}>
                          {athlete.agility}
                        </div>
                        <div style={{ fontSize: '0.65rem', fontFamily: T.fontHeadline, fontWeight: 700, textTransform: 'uppercase', color: T.onSurfaceVariant }}>
                          Agility Index
                        </div>
                      </div>
                    </div>

                    {/* AI Insight Box */}
                    <div style={{
                      background: T.surfaceVariant,
                      border: T.border2,
                      padding: '0.75rem 0.85rem',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.5rem',
                    }}>
                      <Sparkles size={16} color={T.tertiary} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ fontSize: '0.8rem', fontWeight: 500, lineHeight: 1.45, color: T.primary }}>
                        <strong style={{ fontFamily: T.fontHeadline, textTransform: 'uppercase' }}>AI Scout Insight:</strong>{' '}
                        {athlete.aiInsight}
                      </div>
                    </div>

                    {/* Warning Box if mismatch */}
                    {athlete.mismatchWarning && (
                      <div style={{
                        background: T.secondaryContainer,
                        border: '2px solid #e63b2e',
                        padding: '0.65rem 0.85rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.5rem',
                      }}>
                        <Info size={16} color={T.secondary} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#93000a' }}>
                          {athlete.mismatchWarning}
                        </div>
                      </div>
                    )}

                    {/* Card Actions: View Passport & Contact */}
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', paddingTop: '0.25rem' }}>
                      <Link
                        to="/sports-passport"
                        className="rec-btn rec-btn-dark"
                        style={{ flex: 1, minWidth: '160px' }}
                      >
                        <Eye size={15} /> View Sports Passport
                      </Link>

                      {athlete.contactAllowed ? (
                        <button
                          type="button"
                          onClick={() => setContactModalCandidate(athlete)}
                          className="rec-btn rec-btn-primary"
                          style={{ flex: 1, minWidth: '160px' }}
                        >
                          <Mail size={15} /> Send Trial Invite
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="rec-btn"
                          style={{
                            flex: 1,
                            minWidth: '160px',
                            background: T.surfaceDim,
                            color: T.onSurfaceVariant,
                            cursor: 'not-allowed',
                            boxShadow: 'none',
                          }}
                        >
                          <Lock size={14} /> Direct Contact Private
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {/* ── Right Column: Shortlist Widget, Filters, National Insights ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Shortlist Card Widget */}
              <div
                style={{
                  background: T.primary,
                  color: T.onPrimary,
                  border: T.border4,
                  boxShadow: T.shadow6,
                  padding: '1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                onClick={() => setShowShortlistDrawer(true)}
              >
                <div>
                  <div style={{
                    fontFamily: T.fontHeadline,
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: T.primaryContainer,
                  }}>
                    {t('rec.shortlist', 'My Shortlist')}
                  </div>
                  <div style={{
                    fontFamily: T.fontHeadline,
                    fontWeight: 900,
                    fontSize: '2.4rem',
                    lineHeight: 1,
                    marginTop: '0.35rem',
                  }}>
                    {shortlistedList.length} <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{t('rec.athletes', 'Athletes')}</span>
                  </div>
                </div>

                <div style={{
                  width: '54px',
                  height: '54px',
                  background: T.primaryContainer,
                  color: T.primary,
                  border: T.border3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <BookmarkCheck size={28} />
                </div>
              </div>

              {/* Scouting Filters Widget */}
              <div style={{
                background: T.surfaceLowest,
                border: T.border4,
                boxShadow: T.shadow6,
                padding: '1.5rem',
              }}>
                <h3 style={{
                  fontFamily: T.fontHeadline,
                  fontSize: '1.15rem',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  borderBottom: T.border3,
                  paddingBottom: '0.5rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}>
                  <Filter size={16} /> Scouting Filters
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Sport */}
                  <div>
                    <label style={{ fontSize: '0.68rem', fontFamily: T.fontHeadline, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                      Sport Discipline
                    </label>
                    <select
                      value={selectedSport}
                      onChange={(e) => setSelectedSport(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem',
                        border: T.border2,
                        background: T.bg,
                        fontFamily: T.fontBody,
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <option>All Sports</option>
                      <option>Football</option>
                      <option>Athletics & Track</option>
                      <option>Wrestling</option>
                      <option>Kabaddi</option>
                      <option>Badminton</option>
                    </select>
                  </div>

                  {/* Age Category */}
                  <div>
                    <label style={{ fontSize: '0.68rem', fontFamily: T.fontHeadline, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                      Age Category
                    </label>
                    <select
                      value={selectedAgeCategory}
                      onChange={(e) => setSelectedAgeCategory(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem',
                        border: T.border2,
                        background: T.bg,
                        fontFamily: T.fontBody,
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <option>All Ages</option>
                      <option>U-16</option>
                      <option>U-18</option>
                      <option>U-21</option>
                      <option>Senior</option>
                    </select>
                  </div>

                  {/* State */}
                  <div>
                    <label style={{ fontSize: '0.68rem', fontFamily: T.fontHeadline, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                      Region / State
                    </label>
                    <select
                      value={selectedState}
                      onChange={(e) => setSelectedState(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem',
                        border: T.border2,
                        background: T.bg,
                        fontFamily: T.fontBody,
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <option>All States</option>
                      <option>Uttar Pradesh</option>
                      <option>Haryana</option>
                      <option>Punjab</option>
                      <option>Delhi</option>
                      <option>Karnataka</option>
                      <option>Maharashtra</option>
                    </select>
                  </div>

                  {/* Min Overall Score Slider */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <label style={{ fontSize: '0.68rem', fontFamily: T.fontHeadline, fontWeight: 700, textTransform: 'uppercase' }}>
                        Min Overall Index
                      </label>
                      <span style={{ fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '0.85rem' }}>
                        {minScore} PTS
                      </span>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max="95"
                      value={minScore}
                      onChange={(e) => setMinScore(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#1a1a1a' }}
                    />
                  </div>
                </div>
              </div>

              {/* National Talent Insights Panel */}
              <div style={{
                background: T.primaryContainer,
                border: T.border4,
                boxShadow: T.shadow6,
                padding: '1.5rem',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <h3 style={{
                  fontFamily: T.fontHeadline,
                  fontSize: '1.15rem',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  borderBottom: T.border3,
                  paddingBottom: '0.5rem',
                  marginBottom: '1rem',
                  position: 'relative',
                  zIndex: 1,
                }}>
                  {t('rec.insightsTitle', 'National Talent Insights')}
                </h3>

                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#4a4a4a' }}>
                    {t('rec.topState', 'Top State by Talent Volume')}
                  </div>
                  <div style={{ fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '1.8rem', lineHeight: 1.1, marginTop: '2px' }}>
                    Uttar Pradesh
                  </div>

                  <div style={{
                    marginTop: '0.85rem',
                    background: T.surfaceLowest,
                    border: T.border2,
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                  }}>
                    <TrendingUp size={16} color={T.green} />
                    +15% Growth in U-18 Profiles this month
                  </div>
                </div>
              </div>

              {/* Privacy Notice Callout */}
              <div style={{
                background: T.surfaceLowest,
                borderLeft: `8px solid ${T.secondary}`,
                border: T.border2,
                boxShadow: T.shadow4,
                padding: '1rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <Lock size={18} color={T.secondary} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ fontSize: '0.78rem', fontWeight: 600, color: T.primary, lineHeight: 1.45 }}>
                    {t('rec.privacyNotice', 'Only verified recruiters can access direct contact information. Your current status is: Verified.')}
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* ── Shortlist Drawer Modal ─────────────────────────────────── */}
          {showShortlistDrawer && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              zIndex: 999,
              display: 'flex',
              justifyContent: 'flex-end',
            }}>
              <div style={{
                width: '100%',
                maxWidth: '440px',
                background: T.surfaceLowest,
                borderLeft: T.border4,
                height: '100%',
                overflowY: 'auto',
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: T.border3, paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '1.4rem', textTransform: 'uppercase' }}>
                      My Shortlist ({shortlistedList.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowShortlistDrawer(false)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <X size={24} />
                    </button>
                  </div>

                  {shortlistedList.length === 0 ? (
                    <p style={{ fontSize: '0.9rem', color: T.onSurfaceVariant, padding: '2rem 0', textAlign: 'center' }}>
                      No athletes shortlisted yet. Click the bookmark icon on any candidate card.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {shortlistedList.map((c) => (
                        <div
                          key={c.id}
                          style={{
                            background: T.surfaceVariant,
                            border: T.border2,
                            padding: '0.75rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <div style={{ fontFamily: T.fontHeadline, fontWeight: 800, textTransform: 'uppercase' }}>{c.name}</div>
                            <div style={{ fontSize: '0.72rem', color: T.onSurfaceVariant }}>{c.sport} • {c.state} • Score: {c.overallScore}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleShortlist(c.id)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.secondary }}
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '1.5rem', borderTop: T.border3, paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handleExportScoutingReport}
                    className="rec-btn rec-btn-primary"
                    style={{ width: '100%' }}
                  >
                    <Download size={15} /> Export Shortlist CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowShortlistDrawer(false)}
                    className="rec-btn rec-btn-dark"
                    style={{ width: '100%' }}
                  >
                    Close Drawer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Contact / Send Trial Invitation Modal ─────────────────── */}
          {contactModalCandidate && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}>
              <div style={{
                background: T.surfaceLowest,
                border: T.border4,
                boxShadow: T.shadow6,
                maxWidth: '520px',
                width: '100%',
                padding: '2rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: T.border3, paddingBottom: '0.65rem' }}>
                  <div>
                    <span style={{ fontSize: '0.68rem', fontFamily: T.fontHeadline, fontWeight: 800, color: T.tertiary, textTransform: 'uppercase' }}>
                      SAI SCOUTING CAMP INVITATION
                    </span>
                    <h3 style={{ fontFamily: T.fontHeadline, fontSize: '1.35rem', fontWeight: 900, textTransform: 'uppercase' }}>
                      Invite {contactModalCandidate.name}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setContactModalCandidate(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <X size={22} />
                  </button>
                </div>

                <form onSubmit={handleSendTrialInvite} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontFamily: T.fontHeadline, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                      Trial Location / SAI Academy
                    </label>
                    <select
                      style={{ width: '100%', padding: '0.6rem', border: T.border2, background: T.bg, fontFamily: T.fontBody, fontWeight: 600, outline: 'none' }}
                    >
                      <option>National Centre of Excellence (NCOE) - Lucknow</option>
                      <option>SAI Northern Regional Centre - Sonipat</option>
                      <option>SAI Netaji Subhash Western Centre - Gandhinagar</option>
                      <option>SAI Southern Centre - Bengaluru</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', fontFamily: T.fontHeadline, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                      Trial Category & Benchmark Stage
                    </label>
                    <input
                      type="text"
                      defaultValue={`${contactModalCandidate.sport} • Under-18 National Trials 2026`}
                      style={{ width: '100%', padding: '0.6rem', border: T.border2, background: T.bg, fontFamily: T.fontBody, fontWeight: 600, outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', fontFamily: T.fontHeadline, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                      Personalized Message to Athlete
                    </label>
                    <textarea
                      rows={3}
                      defaultValue={`Hello ${contactModalCandidate.name}, your verified KreedAI biomechanical index (${contactModalCandidate.overallScore} PTS) qualified you for the upcoming SAI talent scouting trials.`}
                      style={{ width: '100%', padding: '0.6rem', border: T.border2, background: T.bg, fontFamily: T.fontBody, fontWeight: 500, fontSize: '0.85rem', outline: 'none', resize: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setContactModalCandidate(null)}
                      className="rec-btn rec-btn-surface"
                      style={{ flex: 1 }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={invitationSent}
                      className="rec-btn rec-btn-primary"
                      style={{ flex: 1 }}
                    >
                      <Send size={15} /> {invitationSent ? 'Sending...' : 'Send Invitation'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default RecruiterDashboard;
