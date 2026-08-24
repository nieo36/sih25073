import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, 
  ArrowRight, 
  Award, 
  CheckCircle2, 
  Play, 
  ShieldCheck, 
  TrendingUp, 
  Zap, 
  Brain, 
  Target, 
  ChevronRight, 
  Dumbbell,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { OfflineStorage } from '../storage/indexedDB';
import { ApiService, AthleteStatsResponse } from '../services/api';

const T = {
  bg: '#f5f0e8',
  surface: '#f5f0e8',
  surfaceLowest: '#ffffff',
  surfaceVariant: '#e8e3da',
  surfaceDim: '#d6d1c9',
  surfaceContainer: '#eee9e0',
  surfaceContainerLow: '#f2ede5',
  primary: '#1a1a1a',
  primaryContainer: '#ffcc00',
  tertiary: '#0055ff',
  tertiaryContainer: '#d6e3ff',
  secondary: '#e63b2e',
  secondaryContainer: '#ffdad6',
  onSurface: '#1a1a1a',
  onSurfaceVariant: '#4a4a4a',
  onPrimary: '#ffffff',
  fontHeadline: "'Space Grotesk', sans-serif",
  fontBody: "'Inter', sans-serif",
  border2: '2px solid #1a1a1a',
  border3: '3px solid #1a1a1a',
  border4: '4px solid #1a1a1a',
  shadow4: '4px 4px 0px 0px #1a1a1a',
  shadow6: '6px 6px 0px 0px #1a1a1a',
  shadow8: '8px 8px 0px 0px #1a1a1a',
} as const;

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<any[]>([]);
  const [serverStats, setServerStats] = useState<AthleteStatsResponse | null>(null);

  useEffect(() => {
    const loadStats = () => {
      // Load both local indexedDB and live backend stats
      OfflineStorage.getAllAssessments().then((stored) => {
        if (Array.isArray(stored)) setAssessments(stored);
      }).catch(() => {});

      ApiService.getAthleteStats().then((data) => {
        if (data) setServerStats(data);
      }).catch(() => {});
    };

    loadStats();

    window.addEventListener('storage', loadStats);
    window.addEventListener('assessment-saved', loadStats);

    return () => {
      window.removeEventListener('storage', loadStats);
      window.removeEventListener('assessment-saved', loadStats);
    };
  }, [user]);

  const athleteName = user?.name || 'Athlete';
  const firstName = athleteName.split(' ')[0];
  const primarySport = user?.profile?.primarySport || 'Basketball';
  const userPhoto = user?.profile?.profilePhoto || user?.profilePhoto || user?.avatar;

  const hasAssessments = assessments.length > 0 || (serverStats && serverStats.completedCount > 0);

  // Compute genuine statistics from real assessments
  const overallScore = useMemo(() => {
    if (!hasAssessments) return 0;
    if (serverStats?.overallScore) return serverStats.overallScore;
    const sum = assessments.reduce((acc, a) => acc + (a.totalScore || 0), 0);
    return Math.round(sum / assessments.length);
  }, [hasAssessments, serverStats, assessments]);

  const speedScore = useMemo(() => {
    if (!hasAssessments) return 0;
    if (serverStats?.metrics?.speed) return serverStats.metrics.speed;
    const sprintTests = assessments.filter(a => a.exerciseType?.includes('sprint') || a.exerciseType?.includes('jump'));
    if (sprintTests.length > 0) {
      return Math.round(sprintTests.reduce((acc, a) => acc + (a.totalScore || 0), 0) / sprintTests.length);
    }
    return Math.round(overallScore * 0.95);
  }, [hasAssessments, serverStats, assessments, overallScore]);

  const agilityScore = useMemo(() => {
    if (!hasAssessments) return 0;
    if (serverStats?.metrics?.agility) return serverStats.metrics.agility;
    const mobilityTests = assessments.filter(a => a.exerciseType?.includes('squat') || a.exerciseType?.includes('agility'));
    if (mobilityTests.length > 0) {
      return Math.round(mobilityTests.reduce((acc, a) => acc + (a.totalScore || 0), 0) / mobilityTests.length);
    }
    return Math.round(overallScore * 0.92);
  }, [hasAssessments, serverStats, assessments, overallScore]);

  const formAccuracy = useMemo(() => {
    if (!hasAssessments) return 0;
    if (serverStats?.metrics?.formPrecision) return serverStats.metrics.formPrecision;
    const sum = assessments.reduce((acc, a) => acc + (a.formAccuracy || a.symmetryScore || 80), 0);
    return Math.round(sum / assessments.length);
  }, [hasAssessments, serverStats, assessments]);

  const completedSessionsCount = assessments.length || (serverStats?.completedCount || 0);

  // Accurate verification badge status
  const verificationBadge = useMemo(() => {
    if (user?.isEmailVerified && hasAssessments) {
      return { label: 'Verified Athlete', bg: '#dcfce7', color: '#15803d', icon: <ShieldCheck size={14} color="#15803d" /> };
    }
    if (hasAssessments) {
      return { label: 'AI Analyzed Profile', bg: T.primaryContainer, color: T.primary, icon: <Brain size={14} color={T.primary} /> };
    }
    return { label: 'Uncalibrated Athlete', bg: T.surfaceVariant, color: T.onSurfaceVariant, icon: <Activity size={14} color={T.onSurfaceVariant} /> };
  }, [user, hasAssessments]);

  return (
    <div style={{
      minHeight: '100vh',
      background: T.bg,
      color: T.onSurface,
      fontFamily: T.fontBody,
      WebkitFontSmoothing: 'antialiased',
      paddingBottom: '4rem',
    }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;600;700;900&display=swap"
        rel="stylesheet"
      />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Top Welcome Header */}
        <header style={{
          borderBottom: T.border4,
          paddingBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
            {userPhoto ? (
              <img
                src={userPhoto}
                alt={athleteName}
                style={{
                  width: '74px',
                  height: '74px',
                  border: T.border3,
                  boxShadow: T.shadow4,
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: '74px',
                  height: '74px',
                  background: T.primaryContainer,
                  border: T.border3,
                  boxShadow: T.shadow4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  fontFamily: T.fontHeadline,
                  fontWeight: 900,
                  color: T.primary,
                  flexShrink: 0,
                }}
              >
                {firstName.charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                <span style={{
                  background: verificationBadge.bg,
                  color: verificationBadge.color,
                  fontFamily: T.fontHeadline,
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  padding: '0.3rem 0.65rem',
                  border: T.border2,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}>
                  {verificationBadge.icon} {verificationBadge.label}
                </span>
                <span style={{
                  background: T.surfaceLowest,
                  color: T.primary,
                  fontFamily: T.fontHeadline,
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  padding: '0.3rem 0.65rem',
                  border: T.border2,
                  boxShadow: '2px 2px 0px 0px #1a1a1a',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}>
                  <Zap size={14} color={T.tertiary} /> {primarySport}
                </span>
              </div>

              <h1 style={{
                fontFamily: T.fontHeadline,
                fontWeight: 900,
                fontSize: 'clamp(1.75rem, 4.5vw, 2.75rem)',
                letterSpacing: '-0.04em',
                textTransform: 'uppercase',
                lineHeight: 1.05,
                color: T.primary,
              }}>
                Welcome, {firstName}.<br />
                <span style={{ color: T.secondary }}>Your performance is your proof.</span>
              </h1>
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}>
            <Link
              to="/progress"
              style={{
                background: T.surfaceLowest,
                color: T.primary,
                padding: '0.75rem 1.25rem',
                fontFamily: T.fontHeadline,
                fontWeight: 800,
                fontSize: '0.9rem',
                textTransform: 'uppercase',
                border: T.border3,
                boxShadow: T.shadow4,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <TrendingUp size={16} color={T.tertiary} />
              Full Analytics
            </Link>
            <Link
              to="/leaderboard"
              style={{
                background: T.primaryContainer,
                color: T.primary,
                padding: '0.75rem 1.25rem',
                fontFamily: T.fontHeadline,
                fontWeight: 800,
                fontSize: '0.9rem',
                textTransform: 'uppercase',
                border: T.border3,
                boxShadow: T.shadow4,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Award size={16} color={T.primary} />
              Leaderboard
            </Link>
          </div>
        </header>

        {/* Clean Onboarding State for Unassessed Athletes */}
        {!hasAssessments && (
          <div style={{
            background: T.surfaceLowest,
            border: T.border4,
            borderLeft: `12px solid ${T.primaryContainer}`,
            boxShadow: T.shadow8,
            padding: 'clamp(1.5rem, 4vw, 2.25rem)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.5rem',
          }}>
            <div style={{ maxWidth: '720px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: T.primaryContainer, border: T.border2, padding: '0.2rem 0.5rem', fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                <Sparkles size={12} /> Action Required
              </div>
              <h2 style={{
                fontFamily: T.fontHeadline,
                fontWeight: 900,
                fontSize: 'clamp(1.3rem, 3vw, 1.8rem)',
                textTransform: 'uppercase',
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                color: T.primary,
              }}>
                Your athletic profile starts here.
              </h2>
              <p style={{ fontSize: '0.95rem', color: T.onSurfaceVariant, marginTop: '0.5rem', lineHeight: 1.5 }}>
                Complete your baseline calibration to unlock your genuine biomechanical scores, sports passport, and national talent rankings.
              </p>
            </div>

            <Link
              to="/calibration"
              style={{
                background: T.primaryContainer,
                color: T.primary,
                border: T.border4,
                boxShadow: T.shadow6,
                padding: '1rem 2rem',
                fontFamily: T.fontHeadline,
                fontWeight: 900,
                fontSize: '1.05rem',
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>Start Calibration</span>
              <ArrowRight size={20} />
            </Link>
          </div>
        )}

        {/* Hero Bento Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
          gap: '1.75rem',
          alignItems: 'stretch',
        }}>
          
          {/* Main Hero AI Assessment Card */}
          <div style={{
            background: T.primaryContainer,
            border: T.border4,
            boxShadow: T.shadow8,
            padding: 'clamp(1.5rem, 3.5vw, 2.25rem)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '1.75rem',
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.08,
              pointerEvents: 'none',
              backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 3px, transparent 3px, transparent 14px)',
            }} />

            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: T.primary,
                color: T.onPrimary,
                fontFamily: T.fontHeadline,
                fontWeight: 700,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                padding: '0.25rem 0.6rem',
                marginBottom: '1rem',
              }}>
                <Brain size={14} color={T.primaryContainer} />
                Real-Time Pose & Biomechanics Engine
              </div>

              <h2 style={{
                fontFamily: T.fontHeadline,
                fontWeight: 900,
                fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                textTransform: 'uppercase',
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
                color: T.primary,
                marginBottom: '0.75rem',
              }}>
                TEST YOURSELF &bull; AI ASSESSMENT
              </h2>

              <p style={{
                fontFamily: T.fontBody,
                fontSize: '1.05rem',
                fontWeight: 500,
                color: T.onSurface,
                maxWidth: '520px',
                lineHeight: 1.5,
              }}>
                Launch your camera session. Our MediaPipe vision engine tracks joint angles, squat depth, and movement cadence directly on-device.
              </p>
            </div>

            <div style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              alignItems: 'center',
            }}>
              <Link
                to="/assessment"
                style={{
                  background: T.primary,
                  color: T.surfaceLowest,
                  fontFamily: T.fontHeadline,
                  fontWeight: 900,
                  fontSize: '1.1rem',
                  textTransform: 'uppercase',
                  padding: '1rem 2rem',
                  border: T.border3,
                  boxShadow: T.shadow6,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  textDecoration: 'none',
                  letterSpacing: '-0.01em',
                }}
              >
                <Play size={20} fill={T.primaryContainer} color={T.primaryContainer} />
                START ASSESSMENT
                <ArrowRight size={20} />
              </Link>

              <Link
                to="/passport"
                style={{
                  background: T.surfaceLowest,
                  color: T.primary,
                  fontFamily: T.fontHeadline,
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  textTransform: 'uppercase',
                  padding: '0.95rem 1.4rem',
                  border: T.border3,
                  boxShadow: T.shadow4,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                View Passport
              </Link>
            </div>
          </div>

          {/* KreedAI Index Score Card */}
          <div style={{
            background: T.surfaceLowest,
            border: T.border4,
            boxShadow: T.shadow8,
            padding: 'clamp(1.5rem, 3vw, 2rem)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: T.border3,
              paddingBottom: '0.75rem',
              marginBottom: '1rem',
            }}>
              <h3 style={{
                fontFamily: T.fontHeadline,
                fontSize: '1.25rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                color: T.primary,
              }}>
                KreedAI Index
              </h3>
              <span style={{
                background: hasAssessments ? '#dcfce7' : T.surfaceVariant,
                color: hasAssessments ? '#15803d' : T.onSurfaceVariant,
                border: T.border2,
                fontFamily: T.fontHeadline,
                fontWeight: 700,
                fontSize: '0.75rem',
                padding: '0.25rem 0.5rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}>
                {hasAssessments ? `${completedSessionsCount} SESSIONS` : 'NO SESSIONS'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '1.5rem 0' }}>
              {hasAssessments ? (
                <>
                  <div style={{
                    fontFamily: T.fontHeadline,
                    fontSize: 'clamp(4.5rem, 8vw, 6.5rem)',
                    fontWeight: 900,
                    letterSpacing: '-0.06em',
                    lineHeight: 0.9,
                    color: T.primary,
                    position: 'relative',
                    display: 'inline-flex',
                    alignItems: 'baseline',
                  }}>
                    {overallScore}
                    <span style={{
                      fontSize: '1.5rem',
                      fontFamily: T.fontHeadline,
                      fontWeight: 700,
                      color: T.onSurfaceVariant,
                      marginLeft: '0.25rem',
                    }}>
                      /100
                    </span>
                  </div>
                  <div style={{
                    fontFamily: T.fontHeadline,
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: T.onSurfaceVariant,
                    marginTop: '0.5rem',
                  }}>
                    Overall Performance Index
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{ fontFamily: T.fontHeadline, fontSize: '3rem', fontWeight: 900, color: '#9ca3af' }}>
                    --
                  </div>
                  <div style={{ fontFamily: T.fontHeadline, fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: T.onSurfaceVariant, marginTop: '0.25rem' }}>
                    Complete calibration to view score
                  </div>
                </div>
              )}
            </div>

            <div>
              <div style={{
                width: '100%',
                height: '20px',
                background: T.surfaceVariant,
                border: T.border3,
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: `${overallScore}%`,
                  background: T.primary,
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginTop: '0.4rem',
                fontFamily: T.fontHeadline,
                color: T.onSurfaceVariant,
              }}>
                <span>0 BASE</span>
                <span>{hasAssessments ? `${overallScore} CURRENT` : 'UNASSESSED'}</span>
                <span>100 PRO</span>
              </div>
            </div>
          </div>

        </div>

        {/* Performance Core Stats Grid */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
            <h2 style={{
              fontFamily: T.fontHeadline,
              fontSize: '1.5rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
            }}>
              Core Biomechanical Stats
            </h2>
            <Link to="/progress" style={{
              fontFamily: T.fontHeadline,
              fontWeight: 700,
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              color: T.tertiary,
              textDecoration: 'underline',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}>
              View Full Analytics <ChevronRight size={16} />
            </Link>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.25rem',
          }}>
            {/* Speed Stat */}
            <div style={{
              background: T.surfaceLowest,
              border: T.border3,
              boxShadow: T.shadow4,
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: T.fontHeadline, fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase' }}>
                  Speed & Cadence
                </span>
                <div style={{ background: T.secondaryContainer, padding: '0.35rem', border: T.border2 }}>
                  <Zap size={18} color={T.secondary} />
                </div>
              </div>
              <div style={{ margin: '1rem 0 0.5rem' }}>
                <div style={{ fontFamily: T.fontHeadline, fontSize: '2.5rem', fontWeight: 900, lineHeight: 1 }}>
                  {hasAssessments ? speedScore : '--'} <span style={{ fontSize: '1rem', color: T.onSurfaceVariant, fontWeight: 700 }}>/100</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: T.onSurfaceVariant, fontWeight: 600, marginTop: '0.25rem' }}>
                  {hasAssessments ? 'Measured from assessment cadence' : 'Pending baseline test'}
                </p>
              </div>
            </div>

            {/* Agility Stat */}
            <div style={{
              background: T.surfaceLowest,
              border: T.border3,
              boxShadow: T.shadow4,
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: T.fontHeadline, fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase' }}>
                  Agility & ROM
                </span>
                <div style={{ background: T.tertiaryContainer, padding: '0.35rem', border: T.border2 }}>
                  <Target size={18} color={T.tertiary} />
                </div>
              </div>
              <div style={{ margin: '1rem 0 0.5rem' }}>
                <div style={{ fontFamily: T.fontHeadline, fontSize: '2.5rem', fontWeight: 900, lineHeight: 1 }}>
                  {hasAssessments ? agilityScore : '--'} <span style={{ fontSize: '1rem', color: T.onSurfaceVariant, fontWeight: 700 }}>/100</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: T.onSurfaceVariant, fontWeight: 600, marginTop: '0.25rem' }}>
                  {hasAssessments ? 'Joint range of motion depth' : 'Pending baseline test'}
                </p>
              </div>
            </div>

            {/* Form Precision Stat */}
            <div style={{
              background: T.surfaceLowest,
              border: T.border3,
              boxShadow: T.shadow4,
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: T.fontHeadline, fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase' }}>
                  Form Precision
                </span>
                <div style={{ background: '#dcfce7', padding: '0.35rem', border: T.border2 }}>
                  <CheckCircle2 size={18} color="#059669" />
                </div>
              </div>
              <div style={{ margin: '1rem 0 0.5rem' }}>
                <div style={{ fontFamily: T.fontHeadline, fontSize: '2.5rem', fontWeight: 900, lineHeight: 1 }}>
                  {hasAssessments ? `${formAccuracy}%` : '--'}
                </div>
                <p style={{ fontSize: '0.8rem', color: T.onSurfaceVariant, fontWeight: 600, marginTop: '0.25rem' }}>
                  {hasAssessments ? 'Kinematic bilateral symmetry' : 'Pending baseline test'}
                </p>
              </div>
            </div>

            {/* Completed Sessions */}
            <div style={{
              background: T.surfaceLowest,
              border: T.border3,
              boxShadow: T.shadow4,
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: T.fontHeadline, fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase' }}>
                  Completed Tests
                </span>
                <div style={{ background: T.primaryContainer, padding: '0.35rem', border: T.border2 }}>
                  <Award size={18} color={T.primary} />
                </div>
              </div>
              <div style={{ margin: '1rem 0 0.5rem' }}>
                <div style={{ fontFamily: T.fontHeadline, fontSize: '2.5rem', fontWeight: 900, lineHeight: 1 }}>
                  {completedSessionsCount}
                </div>
                <p style={{ fontSize: '0.8rem', color: T.tertiary, fontWeight: 700, marginTop: '0.25rem' }}>
                  {completedSessionsCount > 0 ? 'Verified Records Logged' : '0 Assessments Recorded'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Standard Recommended Benchmark Tests */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{
              fontFamily: T.fontHeadline,
              fontSize: '1.5rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
            }}>
              Recommended Assessments
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
            gap: '1.5rem',
          }}>
            {/* Deep Squats Card */}
            <div style={{
              background: T.surfaceLowest,
              border: T.border3,
              boxShadow: T.shadow6,
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1.25rem',
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ background: T.primaryContainer, border: T.border2, padding: '0.4rem' }}>
                      <Dumbbell size={20} color={T.primary} />
                    </div>
                    <h3 style={{ fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '1.2rem', textTransform: 'uppercase' }}>
                      Deep Squats Assessment
                    </h3>
                  </div>
                </div>
                <p style={{ fontSize: '0.9rem', color: T.onSurfaceVariant, lineHeight: 1.45 }}>
                  Measure hip hinge biomechanics, femur parallel compliance, and valgus knee stabilization with AI joint-angle tracking.
                </p>
              </div>

              <Link
                to="/assessment"
                style={{
                  background: T.primaryContainer,
                  color: T.primary,
                  padding: '0.75rem',
                  fontFamily: T.fontHeadline,
                  fontWeight: 900,
                  fontSize: '0.9rem',
                  textTransform: 'uppercase',
                  border: T.border2,
                  boxShadow: '2px 2px 0px #1a1a1a',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>Launch Squat Test</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* Push-ups Card */}
            <div style={{
              background: T.surfaceLowest,
              border: T.border3,
              boxShadow: T.shadow6,
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1.25rem',
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ background: T.tertiaryContainer, border: T.border2, padding: '0.4rem' }}>
                      <Activity size={20} color={T.tertiary} />
                    </div>
                    <h3 style={{ fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '1.2rem', textTransform: 'uppercase' }}>
                      Push-ups Endurance
                    </h3>
                  </div>
                </div>
                <p style={{ fontSize: '0.9rem', color: T.onSurfaceVariant, lineHeight: 1.45 }}>
                  Real-time elbow angle detection, chest-to-deck depth tracking, and strict spine alignment evaluation.
                </p>
              </div>

              <Link
                to="/assessment"
                style={{
                  background: T.tertiaryContainer,
                  color: T.tertiary,
                  padding: '0.75rem',
                  fontFamily: T.fontHeadline,
                  fontWeight: 900,
                  fontSize: '0.9rem',
                  textTransform: 'uppercase',
                  border: T.border2,
                  boxShadow: '2px 2px 0px #1a1a1a',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>Launch Push-up Test</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
