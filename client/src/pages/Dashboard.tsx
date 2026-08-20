import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, 
  ArrowRight, 
  Award, 
  CheckCircle2, 
  Flame, 
  Play, 
  ShieldCheck, 
  TrendingUp, 
  Zap, 
  Brain, 
  Lightbulb, 
  Target, 
  ChevronRight, 
  Dumbbell, 
  Sparkles,
  Lock,
  Medal,
  Timer
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ProgressChart } from '../components/ProgressChart';
import { Leaderboard } from '../components/Leaderboard';

// ── Scoped Neo-Brutalist / Bauhaus Theme Tokens (from Stitch 16542555991833173009) ──────
const T = {
  bg: '#f5f0e8',
  surface: '#f5f0e8',
  surfaceLowest: '#ffffff',
  surfaceVariant: '#e8e3da',
  surfaceDim: '#d6d1c9',
  surfaceContainer: '#eee9e0',
  surfaceContainerLow: '#f2ede5',
  primary: '#1a1a1a',
  primaryContainer: '#ffcc00', // Bold Electric Yellow
  tertiary: '#0055ff',        // Cobalt Blue
  tertiaryContainer: '#d6e3ff',
  secondary: '#e63b2e',       // Energy Crimson
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

  const athleteName = user?.name || 'Aarav Sharma';
  const firstName = athleteName.split(' ')[0];

  return (
    <div style={{
      minHeight: '100vh',
      background: T.bg,
      color: T.onSurface,
      fontFamily: T.fontBody,
      WebkitFontSmoothing: 'antialiased',
      paddingBottom: '4rem',
    }}>
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;600;700;900&display=swap"
        rel="stylesheet"
      />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* ── 1. Top Welcome & Status Banner ────────────────────────────── */}
        <header style={{
          borderBottom: T.border4,
          paddingBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
              <span style={{
                background: T.primary,
                color: T.primaryContainer,
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
                <ShieldCheck size={14} color={T.primaryContainer} /> SAI Verified Athlete
              </span>
              <span style={{
                background: T.primaryContainer,
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
                <Flame size={14} color={T.secondary} /> 12 Day Streak
              </span>
            </div>

            <h1 style={{
              fontFamily: T.fontHeadline,
              fontWeight: 900,
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              letterSpacing: '-0.04em',
              textTransform: 'uppercase',
              lineHeight: 1.05,
              color: T.primary,
            }}>
              Good Day, {firstName}.<br />
              <span style={{ color: T.secondary }}>Your performance is your proof.</span>
            </h1>
          </div>

          <div style={{
            background: T.primary,
            color: T.onPrimary,
            padding: '0.75rem 1.25rem',
            fontFamily: T.fontHeadline,
            fontWeight: 800,
            fontSize: 'clamp(0.85rem, 2vw, 1.1rem)',
            textTransform: 'uppercase',
            border: T.border3,
            boxShadow: T.shadow6,
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
          }}>
            <Sparkles size={18} color={T.primaryContainer} />
            TOP 8% AMONG U-18 ATHLETES
          </div>
        </header>

        {/* ── 2. Asymmetric Hero Bento Grid (Hero CTA + KreedAI Index) ────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
          gap: '1.75rem',
          alignItems: 'stretch',
        }}>
          
          {/* Main Hero AI Assessment Card */}
          <div style={{
            gridColumn: 'span 1',
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
            {/* Geometric motion pattern */}
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
                READY TO TEST YOURSELF?<br />AI ASSESSMENT
              </h2>

              <p style={{
                fontFamily: T.fontBody,
                fontSize: '1.05rem',
                fontWeight: 500,
                color: T.onSurface,
                maxWidth: '520px',
                lineHeight: 1.5,
              }}>
                Launch your camera session. Our MediaPipe vision engine tracks joint angles, squat depth, and pushup cadence in real-time. Verified scores are added to your Sports Passport.
              </p>
            </div>

            {/* Assessment Quick Actions */}
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
                  transition: 'all 0.1s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translate(-2px, -2px)';
                  e.currentTarget.style.boxShadow = T.shadow8;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = T.shadow6;
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'translate(2px, 2px)';
                  e.currentTarget.style.boxShadow = '2px 2px 0px 0px #1a1a1a';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'translate(-2px, -2px)';
                  e.currentTarget.style.boxShadow = T.shadow8;
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
                  transition: 'all 0.1s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = T.surfaceVariant;
                  e.currentTarget.style.transform = 'translate(-1px, -1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = T.surfaceLowest;
                  e.currentTarget.style.transform = 'none';
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
                background: T.secondaryContainer,
                color: T.secondary,
                border: T.border2,
                fontFamily: T.fontHeadline,
                fontWeight: 700,
                fontSize: '0.75rem',
                padding: '0.25rem 0.5rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}>
                <TrendingUp size={14} /> +8 THIS MONTH
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '1.5rem 0' }}>
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
                82
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
                National Athlete Percentile
              </div>
            </div>

            {/* Brutalist Progress Bar */}
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
                  width: '82%',
                  background: `linear-gradient(90deg, ${T.primary}, ${T.primaryContainer})`,
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginTop: '0.4rem', fontFamily: T.fontHeadline }}>
                <span>0 BASE</span>
                <span>82 ELITE TIER</span>
                <span>100 PRO</span>
              </div>
            </div>
          </div>

        </div>

        {/* ── 3. Performance Core Stats Bento Grid ──────────────────────── */}
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
              transition: 'transform 0.15s ease, background 0.15s ease',
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
                  95 <span style={{ fontSize: '1rem', color: T.onSurfaceVariant, fontWeight: 700 }}>/100</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600, marginTop: '0.25rem' }}>
                  +5.4% fast-twitch response
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
                  89 <span style={{ fontSize: '1rem', color: T.onSurfaceVariant, fontWeight: 700 }}>/100</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: T.onSurfaceVariant, fontWeight: 600, marginTop: '0.25rem' }}>
                  Top 6% hip & knee mobility
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
                  94.2%
                </div>
                <p style={{ fontSize: '0.8rem', color: T.onSurfaceVariant, fontWeight: 600, marginTop: '0.25rem' }}>
                  348 valid reps logged
                </p>
              </div>
            </div>

            {/* ELO & Tier Stat */}
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
                  Athlete ELO
                </span>
                <div style={{ background: T.primaryContainer, padding: '0.35rem', border: T.border2 }}>
                  <Award size={18} color={T.primary} />
                </div>
              </div>
              <div style={{ margin: '1rem 0 0.5rem' }}>
                <div style={{ fontFamily: T.fontHeadline, fontSize: '2.5rem', fontWeight: 900, lineHeight: 1 }}>
                  1,850
                </div>
                <p style={{ fontSize: '0.8rem', color: T.tertiary, fontWeight: 700, marginTop: '0.25rem' }}>
                  Platinum Tier • Rank #5 Delhi
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. AI Coach Insights & Form Correction Card ───────────────── */}
        <div style={{
          background: T.tertiaryContainer,
          border: T.border4,
          boxShadow: T.shadow6,
          padding: '1.5rem 1.75rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1.25rem',
          flexWrap: 'wrap',
        }}>
          <div style={{
            background: T.surfaceLowest,
            border: T.border3,
            padding: '0.75rem',
            boxShadow: '3px 3px 0px 0px #1a1a1a',
          }}>
            <Lightbulb size={28} color={T.tertiary} />
          </div>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span style={{
                fontFamily: T.fontHeadline,
                fontWeight: 900,
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                background: T.primary,
                color: T.onPrimary,
                padding: '0.2rem 0.5rem',
              }}>
                AI COACH INSIGHT
              </span>
              <h3 style={{ fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '1.15rem', textTransform: 'uppercase', margin: 0 }}>
                Kinetic Form Correction
              </h3>
            </div>
            <p style={{ fontFamily: T.fontBody, fontSize: '0.95rem', lineHeight: 1.5, color: T.onSurface, maxWidth: '800px' }}>
              Your squat depth symmetry improved to <strong>94%</strong>, but knee valgus was detected on late reps (reps 8-10). Focus on keeping your knees tracking inline with your second toe.
            </p>
          </div>
          <Link
            to="/assessment"
            style={{
              background: T.primary,
              color: T.onPrimary,
              fontFamily: T.fontHeadline,
              fontWeight: 800,
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              padding: '0.75rem 1.25rem',
              border: T.border3,
              boxShadow: '3px 3px 0px 0px #1a1a1a',
              textDecoration: 'none',
              alignSelf: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            Launch Squat Drill
          </Link>
        </div>

        {/* ── 5. Standard Physical Benchmark Tests (Drills) ─────────────── */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{
              fontFamily: T.fontHeadline,
              fontSize: '1.5rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
            }}>
              National Standard Benchmark Tests
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
                  <span style={{
                    background: T.surfaceVariant,
                    border: T.border2,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.45rem',
                    fontFamily: T.fontHeadline,
                  }}>
                    LOWER BODY ROM
                  </span>
                </div>
                <p style={{ fontSize: '0.9rem', color: T.onSurfaceVariant, lineHeight: 1.5 }}>
                  Evaluates quad power, hip hinge mobility, knee tracking symmetry, and depth compliance below 90 degrees with real-time pose skeleton.
                </p>
              </div>

              <Link
                to="/assessment"
                style={{
                  width: '100%',
                  background: T.primary,
                  color: T.onPrimary,
                  fontFamily: T.fontHeadline,
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  textTransform: 'uppercase',
                  padding: '0.85rem',
                  border: T.border3,
                  boxShadow: T.shadow4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  textDecoration: 'none',
                }}
              >
                <Play size={16} fill="#fff" /> Begin Test
              </Link>
            </div>

            {/* Pushup Biomechanics Card */}
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
                    <div style={{ background: T.secondaryContainer, border: T.border2, padding: '0.4rem' }}>
                      <Activity size={20} color={T.secondary} />
                    </div>
                    <h3 style={{ fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '1.2rem', textTransform: 'uppercase' }}>
                      Pushup Biomechanics
                    </h3>
                  </div>
                  <span style={{
                    background: T.surfaceVariant,
                    border: T.border2,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.45rem',
                    fontFamily: T.fontHeadline,
                  }}>
                    UPPER BODY & CORE
                  </span>
                </div>
                <p style={{ fontSize: '0.9rem', color: T.onSurfaceVariant, lineHeight: 1.5 }}>
                  Measures pectoral power, elbow flexion angle, shoulder stabilization, and anti-sagging trunk alignment across continuous cadenced repetitions.
                </p>
              </div>

              <Link
                to="/assessment"
                style={{
                  width: '100%',
                  background: T.primary,
                  color: T.onPrimary,
                  fontFamily: T.fontHeadline,
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  textTransform: 'uppercase',
                  padding: '0.85rem',
                  border: T.border3,
                  boxShadow: T.shadow4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  textDecoration: 'none',
                }}
              >
                <Play size={16} fill="#fff" /> Begin Test
              </Link>
            </div>
          </div>
        </div>

        {/* ── 6. Achievements Showcase ─────────────────────────────────── */}
        <div>
          <h2 style={{
            fontFamily: T.fontHeadline,
            fontSize: '1.5rem',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
            marginBottom: '1rem',
          }}>
            Athlete Badges & Achievements
          </h2>

          <div style={{
            display: 'flex',
            gap: '1rem',
            overflowX: 'auto',
            paddingBottom: '0.75rem',
          }}>
            <div style={{
              minWidth: '160px',
              background: T.surfaceLowest,
              border: T.border3,
              padding: '1.25rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              boxShadow: T.shadow4,
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                background: T.primaryContainer,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: T.border2,
                marginBottom: '0.75rem',
              }}>
                <Medal size={28} color={T.primary} />
              </div>
              <span style={{ fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '0.9rem', textTransform: 'uppercase' }}>
                Sprint King
              </span>
              <span style={{ fontSize: '0.7rem', color: T.onSurfaceVariant, marginTop: '0.2rem' }}>
                Sub-11.5s 100m Pace
              </span>
            </div>

            <div style={{
              minWidth: '160px',
              background: T.surfaceLowest,
              border: T.border3,
              padding: '1.25rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              boxShadow: T.shadow4,
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                background: T.secondaryContainer,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: T.border2,
                marginBottom: '0.75rem',
              }}>
                <Award size={28} color={T.secondary} />
              </div>
              <span style={{ fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '0.9rem', textTransform: 'uppercase' }}>
                Top 8% National
              </span>
              <span style={{ fontSize: '0.7rem', color: T.onSurfaceVariant, marginTop: '0.2rem' }}>
                Verified SAI Ranking
              </span>
            </div>

            <div style={{
              minWidth: '160px',
              background: T.surfaceLowest,
              border: T.border3,
              padding: '1.25rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              boxShadow: T.shadow4,
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                background: T.tertiaryContainer,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: T.border2,
                marginBottom: '0.75rem',
              }}>
                <Timer size={28} color={T.tertiary} />
              </div>
              <span style={{ fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '0.9rem', textTransform: 'uppercase' }}>
                12-Day Streak
              </span>
              <span style={{ fontSize: '0.7rem', color: T.onSurfaceVariant, marginTop: '0.2rem' }}>
                Consistency Master
              </span>
            </div>

            <div style={{
              minWidth: '160px',
              background: T.surfaceLowest,
              border: T.border3,
              padding: '1.25rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              opacity: 0.6,
              borderStyle: 'dashed',
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                background: T.surfaceVariant,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed #1a1a1a',
                marginBottom: '0.75rem',
              }}>
                <Lock size={24} color={T.onSurfaceVariant} />
              </div>
              <span style={{ fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '0.9rem', textTransform: 'uppercase' }}>
                Iron Core
              </span>
              <span style={{ fontSize: '0.7rem', color: T.onSurfaceVariant, marginTop: '0.2rem' }}>
                Locked (Score &gt; 90)
              </span>
            </div>
          </div>
        </div>

        {/* ── 7. Charts & Leaderboard Integration ───────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 450px), 1fr))',
          gap: '1.5rem',
          marginTop: '0.5rem',
        }}>
          <div style={{
            background: T.surfaceLowest,
            border: T.border3,
            boxShadow: T.shadow6,
            padding: '1rem',
            overflow: 'hidden',
          }}>
            <ProgressChart />
          </div>

          <div style={{
            background: T.surfaceLowest,
            border: T.border3,
            boxShadow: T.shadow6,
            padding: '1rem',
            overflow: 'hidden',
          }}>
            <Leaderboard compact={true} />
          </div>
        </div>

      </div>
    </div>
  );
};
