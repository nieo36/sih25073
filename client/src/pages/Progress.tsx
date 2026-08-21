import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  TrendingUp 
} from 'lucide-react';
import { OfflineStorage, StoredAssessment } from '../storage/indexedDB';

// ── Scoped Neo-Brutalist Theme Tokens (from Stitch 16542555991833173009) ──────
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

const CATEGORIES = [
  'All',
  'General Fitness',
  'Athletics',
  'Football',
  'Badminton',
  'Basketball',
  'Volleyball',
  'Boxing',
  'Wrestling',
  'Weightlifting',
  'Hockey',
  'Archery',
];

export const Progress: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [assessments, setAssessments] = useState<StoredAssessment[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = await OfflineStorage.getAllAssessments();
        setAssessments(stored);
      } catch (err) {
        console.warn('Could not load stored assessments:', err);
      }
    };
    loadData();
  }, []);

  // Compute stats based on assessments or default baseline
  const hasAssessments = assessments.length > 0;
  const computedScore = hasAssessments
    ? Math.round(assessments.reduce((acc, a) => acc + (a.totalScore || 0), 0) / assessments.length)
    : 82;
  const completedCount = hasAssessments ? assessments.length : 24;

  // Render Bauhaus Neo-Brutalist Trend Chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    // Clear
    ctx.clearRect(0, 0, w, h);

    const data = [72, 73, 74, 76, 75, 77, 78, 77, 79, 80, 81, computedScore];
    const labels = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'];
    const minVal = 60;
    const maxVal = 100;
    const paddingX = 40;
    const paddingY = 30;

    const plotW = w - paddingX * 2;
    const plotH = h - paddingY * 2;

    // Grid lines
    ctx.strokeStyle = '#e8e3da';
    ctx.lineWidth = 1.5;
    for (let i = 0; i <= 4; i++) {
      const y = paddingY + (plotH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(paddingX, y);
      ctx.lineTo(w - paddingX, y);
      ctx.stroke();

      // Y-axis labels
      ctx.fillStyle = '#4a4a4a';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(String(100 - i * 10), paddingX - 8, y + 4);
    }

    // Chart Line
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 4;
    ctx.beginPath();

    const points: { x: number; y: number; val: number; label: string }[] = [];

    data.forEach((val, idx) => {
      const x = paddingX + (plotW / (data.length - 1)) * idx;
      const y = paddingY + plotH - ((val - minVal) / (maxVal - minVal)) * plotH;
      points.push({ x, y, val, label: labels[idx] });
      if (idx === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Point Markers
    points.forEach((pt, idx) => {
      // Outer square / circle
      ctx.fillStyle = idx === points.length - 1 ? '#ffcc00' : '#ffffff';
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.arc(pt.x, pt.y, idx === points.length - 1 ? 7 : 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // X-axis label (selected intervals)
      if (idx % 2 === 0 || idx === points.length - 1) {
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 11px Space Grotesk, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(pt.label, pt.x, h - 8);
      }
    });
  }, [computedScore]);

  return (
    <div style={{
      minHeight: '100vh',
      background: T.bg,
      color: T.onSurface,
      fontFamily: T.fontBody,
      WebkitFontSmoothing: 'antialiased',
      paddingBottom: '5rem',
    }}>
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;700;900&display=swap"
        rel="stylesheet"
      />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        
        {/* ── Page Header ────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{
              background: T.primaryContainer,
              border: T.border2,
              boxShadow: '2px 2px 0px 0px #1a1a1a',
              padding: '0.2rem 0.5rem',
              fontSize: '0.75rem',
              fontWeight: 800,
              fontFamily: T.fontHeadline,
              textTransform: 'uppercase',
            }}>
              Biomechanical Analytics Hub
            </span>
          </div>
          <h1 style={{
            fontFamily: T.fontHeadline,
            fontWeight: 900,
            fontSize: 'clamp(2.5rem, 6vw, 3.8rem)',
            letterSpacing: '-0.04em',
            textTransform: 'uppercase',
            lineHeight: 1,
            color: T.primary,
          }}>
            ANALYTICS
          </h1>
        </div>

        {/* ── Category Filter Tabs ────────────────────────────────── */}
        <div style={{
          display: 'flex',
          overflowX: 'auto',
          gap: '0.75rem',
          paddingBottom: '0.5rem',
          scrollbarWidth: 'none',
        }}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '0.6rem 1.4rem',
                  fontFamily: T.fontHeadline,
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  border: T.border3,
                  background: isSelected ? T.primary : T.surfaceLowest,
                  color: isSelected ? T.onPrimary : T.primary,
                  boxShadow: isSelected ? 'none' : '3px 3px 0px 0px #1a1a1a',
                  transform: isSelected ? 'translate(2px, 2px)' : 'none',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = T.primaryContainer;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = T.surfaceLowest;
                  }
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* ── Score Header Block (Bento Row) ──────────────────────── */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
        }}>
          {/* Main KreedAI Index Score Card */}
          <div style={{
            gridColumn: 'span 2',
            background: T.primaryContainer,
            border: T.border3,
            boxShadow: T.shadow6,
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '220px',
          }}>
            <h2 style={{
              fontFamily: T.fontHeadline,
              fontWeight: 800,
              fontSize: '1.25rem',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: T.primary,
            }}>
              OVERALL ATHLETE SCORE
            </h2>

            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                <span style={{
                  fontFamily: T.fontHeadline,
                  fontWeight: 900,
                  fontSize: 'clamp(5rem, 10vw, 7.5rem)',
                  lineHeight: 0.9,
                  letterSpacing: '-0.06em',
                  color: T.primary,
                }}>
                  {computedScore}
                </span>
                <span style={{
                  fontFamily: T.fontHeadline,
                  fontWeight: 800,
                  fontSize: '2rem',
                  color: T.primary,
                  marginBottom: '0.75rem',
                }}>
                  /100
                </span>
              </div>

              <div style={{
                background: T.primary,
                color: T.primaryContainer,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                border: T.border2,
                width: 'fit-content',
                fontFamily: T.fontHeadline,
                fontWeight: 700,
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}>
                <TrendingUp size={18} />
                <span>PERFORMANCE TREND: +8.4% OVER LAST 30 DAYS</span>
              </div>
            </div>
          </div>

          {/* Completed Assessments Count */}
          <div style={{
            background: T.surfaceLowest,
            border: T.border3,
            boxShadow: T.shadow6,
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '220px',
          }}>
            <h2 style={{
              fontFamily: T.fontHeadline,
              fontWeight: 800,
              fontSize: '1.25rem',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: T.primary,
            }}>
              Assessments
            </h2>

            <div style={{ marginTop: '1rem' }}>
              <span style={{
                fontFamily: T.fontHeadline,
                fontWeight: 900,
                fontSize: 'clamp(4.5rem, 8vw, 6rem)',
                lineHeight: 0.9,
                letterSpacing: '-0.06em',
                color: T.primary,
                display: 'block',
              }}>
                {completedCount}
              </span>
              <span style={{
                fontFamily: T.fontHeadline,
                fontWeight: 700,
                fontSize: '1.1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: T.onSurfaceVariant,
                marginTop: '0.25rem',
                display: 'block',
              }}>
                Completed & Verified
              </span>
            </div>
          </div>
        </section>

        {/* ── Performance Trend Chart ─────────────────────────────── */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{
            borderBottom: T.border4,
            paddingBottom: '0.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}>
            <h2 style={{
              fontFamily: T.fontHeadline,
              fontWeight: 900,
              fontSize: '1.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              color: T.primary,
            }}>
              Performance Trend
            </h2>
            <span style={{
              fontFamily: T.fontHeadline,
              fontWeight: 700,
              fontSize: '0.85rem',
              color: T.onSurfaceVariant,
              textTransform: 'uppercase',
            }}>
              12-Week Longitudinal Tracking
            </span>
          </div>

          <div style={{
            background: T.surfaceLowest,
            border: T.border3,
            boxShadow: T.shadow6,
            padding: '1.75rem',
          }}>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '2rem',
              alignItems: 'flex-end',
              marginBottom: '1.5rem',
            }}>
              <div>
                <span style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  fontFamily: T.fontHeadline,
                  textTransform: 'uppercase',
                  color: T.onSurfaceVariant,
                  marginBottom: '0.2rem',
                }}>
                  Current Rating
                </span>
                <span style={{
                  fontFamily: T.fontHeadline,
                  fontWeight: 900,
                  fontSize: '2.5rem',
                  lineHeight: 1,
                  color: T.primary,
                }}>
                  {computedScore}
                </span>
              </div>

              <div>
                <span style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  fontFamily: T.fontHeadline,
                  textTransform: 'uppercase',
                  color: T.onSurfaceVariant,
                  marginBottom: '0.2rem',
                }}>
                  Previous Cycle
                </span>
                <span style={{
                  fontFamily: T.fontHeadline,
                  fontWeight: 900,
                  fontSize: '2.5rem',
                  lineHeight: 1,
                  color: T.onSurfaceVariant,
                }}>
                  76
                </span>
              </div>

              <div style={{
                background: T.primaryContainer,
                border: T.border2,
                boxShadow: '3px 3px 0px 0px #1a1a1a',
                padding: '0.5rem 1rem',
                marginBottom: '0.2rem',
              }}>
                <span style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  fontFamily: T.fontHeadline,
                  textTransform: 'uppercase',
                  color: T.primary,
                }}>
                  Progression
                </span>
                <span style={{
                  fontFamily: T.fontHeadline,
                  fontWeight: 900,
                  fontSize: '1.5rem',
                  color: T.primary,
                }}>
                  +7.8%
                </span>
              </div>
            </div>

            {/* Canvas Line Chart */}
            <div style={{ width: '100%', height: '280px', position: 'relative' }}>
              <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '100%', display: 'block' }}
              />
            </div>
          </div>
        </section>

        {/* ── Metric Cards Grid (Speed, Agility, Strength, Endurance) ── */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{
            borderBottom: T.border4,
            paddingBottom: '0.5rem',
          }}>
            <h2 style={{
              fontFamily: T.fontHeadline,
              fontWeight: 900,
              fontSize: '1.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              color: T.primary,
            }}>
              Core Biomechanical Metrics
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.25rem',
          }}>
            {/* Speed */}
            <div
              style={{
                background: T.surfaceLowest,
                border: T.border3,
                boxShadow: T.shadow6,
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                aspectRatio: '1',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translate(-3px, -3px)';
                e.currentTarget.style.boxShadow = T.shadow8;
                e.currentTarget.style.background = '#faf8f5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = T.shadow6;
                e.currentTarget.style.background = T.surfaceLowest;
              }}
            >
              <span style={{
                fontFamily: T.fontHeadline,
                fontWeight: 800,
                fontSize: '1.1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: T.primary,
                marginBottom: '0.75rem',
              }}>
                Speed
              </span>
              <span style={{
                fontFamily: T.fontHeadline,
                fontWeight: 900,
                fontSize: '4.5rem',
                lineHeight: 1,
                letterSpacing: '-0.05em',
                color: T.primary,
              }}>
                95
              </span>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                fontFamily: T.fontHeadline,
                color: T.tertiary,
                textTransform: 'uppercase',
                marginTop: '0.5rem',
              }}>
                Top 4% National
              </span>
            </div>

            {/* Agility */}
            <div
              style={{
                background: T.surfaceLowest,
                border: T.border3,
                boxShadow: T.shadow6,
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                aspectRatio: '1',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translate(-3px, -3px)';
                e.currentTarget.style.boxShadow = T.shadow8;
                e.currentTarget.style.background = '#faf8f5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = T.shadow6;
                e.currentTarget.style.background = T.surfaceLowest;
              }}
            >
              <span style={{
                fontFamily: T.fontHeadline,
                fontWeight: 800,
                fontSize: '1.1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: T.primary,
                marginBottom: '0.75rem',
              }}>
                Agility
              </span>
              <span style={{
                fontFamily: T.fontHeadline,
                fontWeight: 900,
                fontSize: '4.5rem',
                lineHeight: 1,
                letterSpacing: '-0.05em',
                color: T.primary,
              }}>
                89
              </span>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                fontFamily: T.fontHeadline,
                color: T.tertiary,
                textTransform: 'uppercase',
                marginTop: '0.5rem',
              }}>
                Top 8% National
              </span>
            </div>

            {/* Strength */}
            <div
              style={{
                background: T.surfaceLowest,
                border: T.border3,
                boxShadow: T.shadow6,
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                aspectRatio: '1',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translate(-3px, -3px)';
                e.currentTarget.style.boxShadow = T.shadow8;
                e.currentTarget.style.background = '#faf8f5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = T.shadow6;
                e.currentTarget.style.background = T.surfaceLowest;
              }}
            >
              <span style={{
                fontFamily: T.fontHeadline,
                fontWeight: 800,
                fontSize: '1.1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: T.primary,
                marginBottom: '0.75rem',
              }}>
                Strength
              </span>
              <span style={{
                fontFamily: T.fontHeadline,
                fontWeight: 900,
                fontSize: '4.5rem',
                lineHeight: 1,
                letterSpacing: '-0.05em',
                color: T.primary,
              }}>
                76
              </span>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                fontFamily: T.fontHeadline,
                color: T.secondary,
                textTransform: 'uppercase',
                marginTop: '0.5rem',
              }}>
                Needs Target Work
              </span>
            </div>

            {/* Endurance */}
            <div
              style={{
                background: T.surfaceLowest,
                border: T.border3,
                boxShadow: T.shadow6,
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                aspectRatio: '1',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translate(-3px, -3px)';
                e.currentTarget.style.boxShadow = T.shadow8;
                e.currentTarget.style.background = '#faf8f5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = T.shadow6;
                e.currentTarget.style.background = T.surfaceLowest;
              }}
            >
              <span style={{
                fontFamily: T.fontHeadline,
                fontWeight: 800,
                fontSize: '1.1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: T.primary,
                marginBottom: '0.75rem',
              }}>
                Endurance
              </span>
              <span style={{
                fontFamily: T.fontHeadline,
                fontWeight: 900,
                fontSize: '4.5rem',
                lineHeight: 1,
                letterSpacing: '-0.05em',
                color: T.primary,
              }}>
                72
              </span>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                fontFamily: T.fontHeadline,
                color: T.onSurfaceVariant,
                textTransform: 'uppercase',
                marginTop: '0.5rem',
              }}>
                Stable Baseline
              </span>
            </div>
          </div>
        </section>

        {/* ── AI Insights Banner ──────────────────────────────────── */}
        <section style={{
          background: T.primary,
          color: T.onPrimary,
          border: T.border3,
          boxShadow: T.shadow6,
          padding: '2rem',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}>
          <div style={{ flex: '1 1 500px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Sparkles size={22} color={T.primaryContainer} />
              <h2 style={{
                fontFamily: T.fontHeadline,
                fontWeight: 900,
                fontSize: '1.35rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: T.primaryContainer,
              }}>
                AI PERFORMANCE INSIGHT
              </h2>
            </div>
            <p style={{
              fontFamily: T.fontBody,
              fontSize: '1.1rem',
              fontWeight: 500,
              lineHeight: 1.6,
              color: '#f5f0e8',
            }}>
              Your agility has improved <strong>14%</strong> over the last 6 weeks, while endurance has remained almost unchanged. Recommend introducing High-Cadence interval squat sets.
            </p>
          </div>

          <Link
            to="/assessment"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: T.primaryContainer,
              color: T.primary,
              border: T.border3,
              boxShadow: '4px 4px 0px 0px #ffffff',
              padding: '1rem 1.75rem',
              fontFamily: T.fontHeadline,
              fontWeight: 900,
              fontSize: '1rem',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              textDecoration: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translate(2px, 2px)';
              e.currentTarget.style.boxShadow = '2px 2px 0px 0px #ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '4px 4px 0px 0px #ffffff';
            }}
          >
            <span>LAUNCH AI POSE DRILL</span>
            <ArrowRight size={18} />
          </Link>
        </section>

        {/* ── Recent Assessments List ─────────────────────────────── */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{
            borderBottom: T.border4,
            paddingBottom: '0.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}>
            <h2 style={{
              fontFamily: T.fontHeadline,
              fontWeight: 900,
              fontSize: '1.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              color: T.primary,
            }}>
              Recent Assessments
            </h2>
            <Link
              to="/assessment"
              style={{
                fontFamily: T.fontHeadline,
                fontWeight: 700,
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                color: T.primary,
                textDecoration: 'underline',
              }}
            >
              Start New Test
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Real assessments if stored */}
            {assessments.map((a, idx) => (
              <div
                key={a.id || idx}
                style={{
                  background: T.surfaceLowest,
                  border: T.border3,
                  boxShadow: T.shadow4,
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = T.surfaceContainerLow;
                  e.currentTarget.style.transform = 'translate(-2px, -2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = T.surfaceLowest;
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <h3 style={{
                      fontFamily: T.fontHeadline,
                      fontWeight: 800,
                      fontSize: '1.2rem',
                      textTransform: 'uppercase',
                      color: T.primary,
                    }}>
                      {a.exerciseType === 'squat' ? 'Deep Squats' : 'Pushup Biomechanics'}
                    </h3>
                    <span style={{
                      background: T.tertiary,
                      color: '#ffffff',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.5rem',
                      textTransform: 'uppercase',
                      border: '1.5px solid #1a1a1a',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}>
                      <CheckCircle2 size={12} /> AI Verified
                    </span>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: T.onSurfaceVariant, fontWeight: 500 }}>
                    {a.date || 'Today'} • {a.validReps || a.repsCompleted} Valid Reps • {a.symmetryScore}% Symmetry
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: T.onSurfaceVariant }}>
                      Score
                    </span>
                    <span style={{ fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '2rem', color: T.primary }}>
                      {a.totalScore}
                    </span>
                  </div>
                  <ArrowRight size={24} color={T.primary} />
                </div>
              </div>
            ))}

            {/* Standard National Benchmark Items */}
            <div
              style={{
                background: T.surfaceLowest,
                border: T.border3,
                boxShadow: T.shadow4,
                padding: '1.25rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = T.surfaceContainerLow;
                e.currentTarget.style.transform = 'translate(-2px, -2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = T.surfaceLowest;
                e.currentTarget.style.transform = 'none';
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <h3 style={{
                    fontFamily: T.fontHeadline,
                    fontWeight: 800,
                    fontSize: '1.2rem',
                    textTransform: 'uppercase',
                    color: T.primary,
                  }}>
                    5-10-5 Shuttle Run
                  </h3>
                  <span style={{
                    background: T.tertiary,
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.5rem',
                    textTransform: 'uppercase',
                    border: '1.5px solid #1a1a1a',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}>
                    <CheckCircle2 size={12} /> AI Verified
                  </span>
                </div>
                <span style={{ fontSize: '0.85rem', color: T.onSurfaceVariant, fontWeight: 500 }}>
                  Oct 12, 2023 • Agility & Deceleration
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: T.onSurfaceVariant }}>
                    Score
                  </span>
                  <span style={{ fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '2rem', color: T.primary }}>
                    92
                  </span>
                </div>
                <ArrowRight size={24} color={T.primary} />
              </div>
            </div>

            <div
              style={{
                background: T.surfaceLowest,
                border: T.border3,
                boxShadow: T.shadow4,
                padding: '1.25rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = T.surfaceContainerLow;
                e.currentTarget.style.transform = 'translate(-2px, -2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = T.surfaceLowest;
                e.currentTarget.style.transform = 'none';
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <h3 style={{
                    fontFamily: T.fontHeadline,
                    fontWeight: 800,
                    fontSize: '1.2rem',
                    textTransform: 'uppercase',
                    color: T.primary,
                  }}>
                    40-Yard Sprint Acceleration
                  </h3>
                  <span style={{
                    background: T.tertiary,
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.5rem',
                    textTransform: 'uppercase',
                    border: '1.5px solid #1a1a1a',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}>
                    <CheckCircle2 size={12} /> AI Verified
                  </span>
                </div>
                <span style={{ fontSize: '0.85rem', color: T.onSurfaceVariant, fontWeight: 500 }}>
                  Oct 05, 2023 • Top Speed & Cadence
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: T.onSurfaceVariant }}>
                    Score
                  </span>
                  <span style={{ fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '2rem', color: T.primary }}>
                    95
                  </span>
                </div>
                <ArrowRight size={24} color={T.primary} />
              </div>
            </div>

            <div
              style={{
                background: T.surfaceLowest,
                border: T.border3,
                boxShadow: T.shadow4,
                padding: '1.25rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = T.surfaceContainerLow;
                e.currentTarget.style.transform = 'translate(-2px, -2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = T.surfaceLowest;
                e.currentTarget.style.transform = 'none';
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <h3 style={{
                    fontFamily: T.fontHeadline,
                    fontWeight: 800,
                    fontSize: '1.2rem',
                    textTransform: 'uppercase',
                    color: T.primary,
                  }}>
                    Vertical Countermovement Jump
                  </h3>
                </div>
                <span style={{ fontSize: '0.85rem', color: T.onSurfaceVariant, fontWeight: 500 }}>
                  Sep 28, 2023 • Explosive Power & Takeoff
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: T.onSurfaceVariant }}>
                    Score
                  </span>
                  <span style={{ fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '2rem', color: T.primary }}>
                    84
                  </span>
                </div>
                <ArrowRight size={24} color={T.primary} />
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
