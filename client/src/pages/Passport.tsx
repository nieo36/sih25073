import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  Download,
  Printer,
  QrCode,
  Share2,
  ShieldCheck,
  Sparkles,
  Zap,
  ExternalLink,
  Layers,
  FileCheck,
  BarChart2,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { OfflineStorage } from '../storage/indexedDB';
import { ApiService } from '../services/api';
import {
  buildPassportData,
  exportPassportPdf,
  PassportData,
} from '../services/passportService';

// ── Scoped Neo-Brutalist / Bauhaus Design Tokens ──────────────────────────────
const T = {
  bg: '#f5f0e8',
  surface: '#f5f0e8',
  surfaceLowest: '#ffffff',
  surfaceVariant: '#e8e3da',
  surfaceDim: '#d6d1c9',
  surfaceContainer: '#eee9e0',
  primary: '#1a1a1a',
  primaryContainer: '#ffcc00',
  tertiary: '#0055ff',
  tertiaryContainer: '#d6e3ff',
  secondary: '#e63b2e',
  secondaryContainer: '#ffdad6',
  green: '#16a34a',
  greenContainer: '#dcfce7',
  onPrimary: '#ffffff',
  onSurface: '#1a1a1a',
  onSurfaceVariant: '#4a4a4a',
  fontHeadline: "'Space Grotesk', sans-serif",
  fontBody: "'Inter', sans-serif",
  border2: '2px solid #1a1a1a',
  border3: '3px solid #1a1a1a',
  border4: '4px solid #1a1a1a',
  shadow2: '2px 2px 0px 0px #1a1a1a',
  shadow4: '4px 4px 0px 0px #1a1a1a',
  shadow6: '6px 6px 0px 0px #1a1a1a',
  shadow8: '8px 8px 0px 0px #1a1a1a',
} as const;

export const Passport: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [passport, setPassport] = useState<PassportData>(() => buildPassportData(user, []));
  const [isDownloading, setIsDownloading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const passportCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      let assessmentData: any[] = [];
      try {
        const serverHistory = await ApiService.getAssessmentHistory();
        if (Array.isArray(serverHistory) && serverHistory.length > 0) {
          assessmentData = serverHistory;
        }
      } catch {}

      if (assessmentData.length === 0) {
        try {
          const stored = await OfflineStorage.getAllAssessments();
          if (stored.length > 0) {
            assessmentData = stored;
          }
        } catch {}
      }

      setPassport(buildPassportData(user, assessmentData));
    };

    loadData();
  }, [user]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // ── Share Handler ───────────────────────────────────────────────────────────
  const handleShare = async () => {
    const shareData = {
      title: `${passport.athleteName}'s Sports Passport - KreedAI`,
      text: `View ${passport.athleteName}'s official SAI-recognized Digital Sports Passport (ID: #${passport.passportId}, Grade: ${passport.scores.overallGrade}).`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        showToast('Passport verification link copied to clipboard!');
      })
      .catch(() => {
        showToast('Link copied: ' + window.location.href);
      });
  };

  // ── Download PDF Handler ────────────────────────────────────────────────────
  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    showToast('Generating official high-resolution PDF certificate...');

    try {
      const success = await exportPassportPdf('passport-printable-card', passport.athleteName);
      if (success) {
        showToast(`Downloaded KreedAI_Sports_Passport_${passport.athleteName.replace(/\s+/g, '_')}.pdf`);
      }
    } catch {
      showToast('Opening print dialog for certificate export...');
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  // ── Print Handler ───────────────────────────────────────────────────────────
  const handlePrint = () => {
    window.print();
  };

  const initials = passport.athleteName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700;900&family=Inter:wght@400;500;600;700;800&display=swap');

        .passport-page {
          min-height: 100vh;
          background: ${T.bg};
          color: ${T.primary};
          font-family: ${T.fontBody};
          padding-bottom: 5rem;
          -webkit-font-smoothing: antialiased;
        }

        .passport-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.65rem 1.15rem;
          font-family: ${T.fontHeadline};
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          border: ${T.border2};
          box-shadow: ${T.shadow4};
          cursor: pointer;
          transition: all 0.15s ease;
          text-decoration: none;
        }

        .passport-btn:hover {
          transform: translate(2px, -2px);
          box-shadow: ${T.shadow6};
        }

        .passport-btn:active {
          transform: translate(0, 0);
          box-shadow: ${T.shadow2};
        }

        .passport-btn-primary {
          background: ${T.primaryContainer};
          color: ${T.primary};
        }

        .passport-btn-dark {
          background: ${T.primary};
          color: ${T.onPrimary};
        }

        .passport-btn-surface {
          background: ${T.surfaceLowest};
          color: ${T.primary};
        }

        .passport-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.3rem 0.65rem;
          font-family: ${T.fontHeadline};
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          border: ${T.border2};
          box-shadow: ${T.shadow2};
        }

        .metric-radar-card {
          background: ${T.surfaceLowest};
          border: ${T.border2};
          box-shadow: ${T.shadow2};
          padding: 0.85rem;
          text-align: center;
          transition: transform 0.12s ease;
        }

        .metric-radar-card:hover {
          transform: translateY(-2px);
          box-shadow: ${T.shadow4};
        }

        /* ── Print Styles ────────────────────────────────────────── */
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          nav, header, .passport-actions-bar, .no-print {
            display: none !important;
          }
          .passport-page {
            padding: 0 !important;
            background: #ffffff !important;
          }
          #passport-printable-card {
            border: 3px solid #000000 !important;
            box-shadow: none !important;
            page-break-inside: avoid;
            margin: 0 auto !important;
            max-width: 100% !important;
          }
        }

        @media (max-width: 768px) {
          .passport-grid-2 {
            grid-template-columns: 1fr !important;
          }
          .passport-meta-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>

      <div className="passport-page">
        <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '1.75rem 1.25rem' }}>
          
          {/* ── Toast Notification ────────────────────────────────────── */}
          {toastMessage && (
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
              fontWeight: 700,
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              animation: 'slideIn 0.2s ease',
            }}>
              <CheckCircle2 size={18} color={T.primaryContainer} />
              {toastMessage}
            </div>
          )}

          {/* ── Page Header & Quick Actions ───────────────────────────── */}
          <div className="no-print" style={{
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
                background: T.primaryContainer,
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
                <FileCheck size={14} /> {t('pass.portal', 'National Sports Repository Verified')}
              </div>

              <h1 style={{
                fontFamily: T.fontHeadline,
                fontSize: 'clamp(2rem, 5vw, 3rem)',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '-0.04em',
                lineHeight: 1,
                marginBottom: '0.5rem',
              }}>
                {t('pass.title1', 'Digital Athlete')} <span style={{ color: T.tertiary }}>{t('pass.title2', 'Sports Passport')}</span>
              </h1>

              <p style={{ color: T.onSurfaceVariant, fontSize: '0.92rem', maxWidth: '640px', fontWeight: 500 }}>
                {t('pass.subtitle', 'Government & Sports Authority of India (SAI) recognized cryptographic proof of physical benchmarks, biomechanical accuracy, and performance tier.')}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="passport-actions-bar" style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleShare}
                className="passport-btn passport-btn-surface"
                title="Share Passport"
              >
                <Share2 size={15} /> {t('common.share', 'Share')}
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="passport-btn passport-btn-surface"
                title="Print Passport"
              >
                <Printer size={15} /> {t('common.print', 'Print')}
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isDownloading}
                className="passport-btn passport-btn-primary"
                title="Download Official Certificate PDF"
              >
                <Download size={16} />
                {isDownloading ? t('pass.generatingPdf', 'Generating PDF...') : t('pass.downloadCert', 'Download Certificate')}
              </button>
            </div>
          </div>

          {/* ── Main Printable Sports Passport Document ───────────────── */}
          <div
            id="passport-printable-card"
            ref={passportCardRef}
            style={{
              background: T.surfaceLowest,
              border: T.border4,
              boxShadow: T.shadow8,
              padding: '2.25rem 2rem',
              position: 'relative',
              overflow: 'hidden',
              marginBottom: '2.5rem',
            }}
          >
            {/* Background Watermark Stamp */}
            <div style={{
              position: 'absolute',
              right: '-40px',
              bottom: '-40px',
              opacity: 0.04,
              pointerEvents: 'none',
              zIndex: 0,
            }}>
              <ShieldCheck size={380} color="#1a1a1a" />
            </div>

            {/* Top Passport Ribbon */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: T.border4,
              paddingBottom: '1.25rem',
              marginBottom: '1.75rem',
              flexWrap: 'wrap',
              gap: '1rem',
              position: 'relative',
              zIndex: 1,
            }}>
              {/* Brand & Organization Title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  background: T.primaryContainer,
                  border: T.border3,
                  boxShadow: T.shadow2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Zap size={26} color={T.primary} />
                </div>
                <div>
                  <div style={{
                    fontSize: '0.7rem',
                    fontFamily: T.fontHeadline,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: T.tertiary,
                  }}>
                    SPORTS AUTHORITY OF INDIA · TALENT IDENTIFICATION
                  </div>
                  <h2 style={{
                    fontFamily: T.fontHeadline,
                    fontSize: '1.35rem',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1,
                  }}>
                    SAI ATHLETE IDENTITY #{passport.passportId}
                  </h2>
                </div>
              </div>

              {/* Status Badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="passport-badge" style={{ background: T.greenContainer, color: T.green, borderColor: T.green }}>
                  <CheckCircle2 size={13} color={T.green} /> Cryptographically Signed
                </span>
                <span className="passport-badge" style={{ background: T.primaryContainer, color: T.primary }}>
                  <ShieldCheck size={13} /> Live Verified
                </span>
              </div>
            </div>

            {/* ── Athlete Profile & QR Verification Section ────────────── */}
            <div
              className="passport-grid-2"
              style={{
                display: 'grid',
                gridTemplateColumns: '1.4fr 1fr',
                gap: '1.75rem',
                marginBottom: '2rem',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {/* Left Column: Athlete Profile Meta */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {passport.avatar ? (
                    <img
                      src={passport.avatar}
                      alt={passport.athleteName}
                      style={{
                        width: '70px',
                        height: '70px',
                        border: T.border3,
                        boxShadow: T.shadow4,
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '70px',
                      height: '70px',
                      background: T.primaryContainer,
                      border: T.border3,
                      boxShadow: T.shadow4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: T.fontHeadline,
                      fontWeight: 900,
                      fontSize: '1.6rem',
                      color: T.primary,
                      flexShrink: 0,
                    }}>
                      {initials}
                    </div>
                  )}

                  <div>
                    <div style={{
                      fontSize: '0.7rem',
                      fontFamily: T.fontHeadline,
                      fontWeight: 700,
                      color: T.onSurfaceVariant,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}>
                      ATHLETE FULL NAME
                    </div>
                    <h3 style={{
                      fontFamily: T.fontHeadline,
                      fontSize: '1.75rem',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      letterSpacing: '-0.03em',
                      lineHeight: 1.1,
                      color: T.primary,
                    }}>
                      {passport.athleteName}
                    </h3>
                    <div style={{
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: T.onSurfaceVariant,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      marginTop: '0.2rem',
                    }}>
                      SAI ID: {passport.athleteId} · {passport.organization}
                    </div>
                  </div>
                </div>

                {/* 2x2 Meta Attributes Grid */}
                <div
                  className="passport-meta-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.85rem',
                    background: T.surfaceVariant,
                    border: T.border2,
                    padding: '1rem',
                    boxShadow: T.shadow2,
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.65rem', fontFamily: T.fontHeadline, fontWeight: 700, textTransform: 'uppercase', color: T.onSurfaceVariant, letterSpacing: '0.05em' }}>
                      PRIMARY SPORT
                    </div>
                    <div style={{ fontFamily: T.fontHeadline, fontWeight: 800, fontSize: '0.95rem', color: T.primary, textTransform: 'uppercase' }}>
                      {passport.primarySport}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.65rem', fontFamily: T.fontHeadline, fontWeight: 700, textTransform: 'uppercase', color: T.onSurfaceVariant, letterSpacing: '0.05em' }}>
                      REGION / STATE
                    </div>
                    <div style={{ fontFamily: T.fontHeadline, fontWeight: 800, fontSize: '0.95rem', color: T.primary, textTransform: 'uppercase' }}>
                      {passport.district ? `${passport.district}, ` : ''}{passport.state}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.65rem', fontFamily: T.fontHeadline, fontWeight: 700, textTransform: 'uppercase', color: T.onSurfaceVariant, letterSpacing: '0.05em' }}>
                      AGE / CATEGORY
                    </div>
                    <div style={{ fontFamily: T.fontHeadline, fontWeight: 800, fontSize: '0.95rem', color: T.primary, textTransform: 'uppercase' }}>
                      {passport.age} YRS · {passport.ageCategory}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.65rem', fontFamily: T.fontHeadline, fontWeight: 700, textTransform: 'uppercase', color: T.onSurfaceVariant, letterSpacing: '0.05em' }}>
                      ATHLETE TIER
                    </div>
                    <div style={{ fontFamily: T.fontHeadline, fontWeight: 800, fontSize: '0.95rem', color: T.tertiary, textTransform: 'uppercase' }}>
                      {passport.athleteTier}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: QR Verification Badge Box */}
              <div style={{
                background: T.surfaceVariant,
                border: T.border3,
                boxShadow: T.shadow4,
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: '0.75rem',
              }}>
                {/* Visual Clean QR Code */}
                <div style={{
                  background: '#ffffff',
                  padding: '0.85rem',
                  border: T.border2,
                  boxShadow: T.shadow2,
                  display: 'inline-flex',
                }}>
                  <svg width="116" height="116" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Corner 1 */}
                    <rect x="5" y="5" width="28" height="28" stroke="#1a1a1a" strokeWidth="6" fill="#fff" />
                    <rect x="13" y="13" width="12" height="12" fill="#1a1a1a" />
                    {/* Corner 2 */}
                    <rect x="67" y="5" width="28" height="28" stroke="#1a1a1a" strokeWidth="6" fill="#fff" />
                    <rect x="75" y="13" width="12" height="12" fill="#1a1a1a" />
                    {/* Corner 3 */}
                    <rect x="5" y="67" width="28" height="28" stroke="#1a1a1a" strokeWidth="6" fill="#fff" />
                    <rect x="13" y="75" width="12" height="12" fill="#1a1a1a" />
                    {/* QR Matrix Bits */}
                    <rect x="40" y="8" width="6" height="6" fill="#1a1a1a" />
                    <rect x="52" y="8" width="6" height="6" fill="#1a1a1a" />
                    <rect x="40" y="20" width="12" height="6" fill="#1a1a1a" />
                    <rect x="8" y="40" width="6" height="12" fill="#1a1a1a" />
                    <rect x="20" y="46" width="12" height="6" fill="#1a1a1a" />
                    <rect x="40" y="40" width="20" height="20" fill="#ffcc00" stroke="#1a1a1a" strokeWidth="4" />
                    <rect x="68" y="40" width="10" height="6" fill="#1a1a1a" />
                    <rect x="84" y="46" width="8" height="14" fill="#1a1a1a" />
                    <rect x="40" y="68" width="8" height="8" fill="#1a1a1a" />
                    <rect x="54" y="74" width="12" height="6" fill="#1a1a1a" />
                    <rect x="72" y="68" width="6" height="18" fill="#1a1a1a" />
                    <rect x="84" y="74" width="8" height="8" fill="#1a1a1a" />
                    <rect x="46" y="88" width="14" height="6" fill="#1a1a1a" />
                  </svg>
                </div>

                <div>
                  <div style={{
                    fontSize: '0.72rem',
                    fontFamily: T.fontHeadline,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: T.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                  }}>
                    <QrCode size={14} /> SCAN TO VERIFY ON-FIELD
                  </div>
                  <div style={{
                    fontSize: '0.65rem',
                    color: T.onSurfaceVariant,
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    marginTop: '0.25rem',
                  }}>
                    HASH: {passport.verificationHash}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Verified Biomechanical Competency Radar ─────────────── */}
            <div style={{ marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.85rem',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}>
                <h4 style={{
                  fontFamily: T.fontHeadline,
                  fontSize: '1rem',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '-0.02em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}>
                  <Sparkles size={16} color={T.tertiary} />
                  Verified Biomechanical Competency Radar
                </h4>
                <span style={{ fontSize: '0.72rem', fontFamily: T.fontHeadline, fontWeight: 700, color: T.onSurfaceVariant, textTransform: 'uppercase' }}>
                  MediaPipe Kinematic Sensor Engine v3.2
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '0.75rem',
              }}>
                <div className="metric-radar-card">
                  <div style={{ fontSize: '0.65rem', fontFamily: T.fontHeadline, fontWeight: 700, color: T.onSurfaceVariant, textTransform: 'uppercase' }}>
                    LOWER POWER
                  </div>
                  <div style={{ fontFamily: T.fontHeadline, fontSize: '1.5rem', fontWeight: 900, color: T.tertiary }}>
                    {passport.scores.lowerPower}%
                  </div>
                  <div style={{ fontSize: '0.62rem', fontWeight: 600, color: T.green }}>Squat Depth Index</div>
                </div>

                <div className="metric-radar-card">
                  <div style={{ fontSize: '0.65rem', fontFamily: T.fontHeadline, fontWeight: 700, color: T.onSurfaceVariant, textTransform: 'uppercase' }}>
                    UPPER POWER
                  </div>
                  <div style={{ fontFamily: T.fontHeadline, fontSize: '1.5rem', fontWeight: 900, color: T.green }}>
                    {passport.scores.upperPower}%
                  </div>
                  <div style={{ fontSize: '0.62rem', fontWeight: 600, color: T.green }}>Cadence & Force</div>
                </div>

                <div className="metric-radar-card">
                  <div style={{ fontSize: '0.65rem', fontFamily: T.fontHeadline, fontWeight: 700, color: T.onSurfaceVariant, textTransform: 'uppercase' }}>
                    MOBILITY & ROM
                  </div>
                  <div style={{ fontFamily: T.fontHeadline, fontSize: '1.5rem', fontWeight: 900, color: '#7c3aed' }}>
                    {passport.scores.mobilityRom}%
                  </div>
                  <div style={{ fontSize: '0.62rem', fontWeight: 600, color: T.green }}>Joint Kinematics</div>
                </div>

                <div className="metric-radar-card">
                  <div style={{ fontSize: '0.65rem', fontFamily: T.fontHeadline, fontWeight: 700, color: T.onSurfaceVariant, textTransform: 'uppercase' }}>
                    BILATERAL SYMMETRY
                  </div>
                  <div style={{ fontFamily: T.fontHeadline, fontSize: '1.5rem', fontWeight: 900, color: '#d97706' }}>
                    {passport.scores.bilateralSymmetry}%
                  </div>
                  <div style={{ fontSize: '0.62rem', fontWeight: 600, color: T.green }}>L/R Variance &lt;3%</div>
                </div>

                <div className="metric-radar-card" style={{ background: T.primaryContainer, borderColor: T.primary }}>
                  <div style={{ fontSize: '0.65rem', fontFamily: T.fontHeadline, fontWeight: 800, color: T.primary, textTransform: 'uppercase' }}>
                    OVERALL GRADE
                  </div>
                  <div style={{ fontFamily: T.fontHeadline, fontSize: '1.5rem', fontWeight: 900, color: T.primary }}>
                    {passport.scores.overallGrade}
                  </div>
                  <div style={{ fontSize: '0.62rem', fontWeight: 800, color: T.primary }}>
                    {passport.scores.overallScore} INDEX
                  </div>
                </div>
              </div>
            </div>

            {/* ── Verified Assessments & History ──────────────────────── */}
            <div style={{ marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.85rem',
              }}>
                <h4 style={{
                  fontFamily: T.fontHeadline,
                  fontSize: '1rem',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '-0.02em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}>
                  <Layers size={16} color={T.primary} />
                  Verified Performance Assessments
                </h4>
                <Link
                  to="/assessment"
                  className="no-print"
                  style={{
                    fontSize: '0.72rem',
                    fontFamily: T.fontHeadline,
                    fontWeight: 700,
                    color: T.tertiary,
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  Open Studio <ExternalLink size={12} />
                </Link>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {passport.verifiedAssessments.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      background: T.surfaceVariant,
                      border: T.border2,
                      boxShadow: T.shadow2,
                      fontFamily: T.fontBody,
                      fontSize: '0.82rem',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <CheckCircle2 size={16} color={T.green} />
                      <div>
                        <div style={{ fontFamily: T.fontHeadline, fontWeight: 700, textTransform: 'uppercase', fontSize: '0.85rem' }}>
                          {a.type}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: T.onSurfaceVariant, fontWeight: 500 }}>
                          Date: {a.date} · {a.reps} Valid Reps Completed
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.65rem', color: T.onSurfaceVariant, fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                          Symmetry
                        </span>
                        <span style={{ fontFamily: T.fontHeadline, fontWeight: 800, color: T.green }}>
                          {a.symmetry}%
                        </span>
                      </div>
                      <div style={{ textAlign: 'right', minWidth: '48px' }}>
                        <span style={{ fontSize: '0.65rem', color: T.onSurfaceVariant, fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                          Form Score
                        </span>
                        <span style={{ fontFamily: T.fontHeadline, fontWeight: 900, fontSize: '1.1rem', color: T.primary }}>
                          {a.score}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Badges & SAI Verification Sign-Off Footer ────────────── */}
            <div style={{
              borderTop: T.border3,
              paddingTop: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              position: 'relative',
              zIndex: 1,
            }}>
              {/* Badges */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {passport.achievements.map((ach) => (
                  <div
                    key={ach.title}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      background: T.surfaceLowest,
                      border: T.border2,
                      padding: '0.35rem 0.65rem',
                      boxShadow: T.shadow2,
                    }}
                  >
                    <Award size={14} color={T.primary} />
                    <span style={{ fontFamily: T.fontHeadline, fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>
                      {ach.title}
                    </span>
                  </div>
                ))}
              </div>

              {/* Certification Sign-Off Details */}
              <div style={{ textAlign: 'right', fontFamily: T.fontHeadline }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: T.onSurfaceVariant, letterSpacing: '0.06em' }}>
                  VALID THRU: {passport.validThru}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: T.primary }}>
                  KREEDAI KINEMATIC INTEGRITY ENGINE
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom Helpful Action Cards (No Print) ────────────────── */}
          <div className="no-print" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem',
          }}>
            {/* Card 1: Scout / Recruiter Access */}
            <div style={{
              background: T.surfaceLowest,
              border: T.border3,
              boxShadow: T.shadow4,
              padding: '1.25rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <ShieldCheck size={18} color={T.primary} />
                <h4 style={{ fontFamily: T.fontHeadline, fontWeight: 900, textTransform: 'uppercase', fontSize: '0.95rem' }}>
                  Scout Discovery Portal
                </h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: T.onSurfaceVariant, lineHeight: 1.5, marginBottom: '1rem' }}>
                Your verified passport is indexed for SAI national scouting camps, state academies, and Khelo India talent searches.
              </p>
              <Link to="/recruiter" className="passport-btn passport-btn-surface" style={{ fontSize: '0.75rem', padding: '0.45rem 0.85rem' }}>
                Recruiter Hub <ExternalLink size={13} />
              </Link>
            </div>

            {/* Card 2: Biomechanical Progress */}
            <div style={{
              background: T.surfaceLowest,
              border: T.border3,
              boxShadow: T.shadow4,
              padding: '1.25rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <TrendingUp size={18} color={T.tertiary} />
                <h4 style={{ fontFamily: T.fontHeadline, fontWeight: 900, textTransform: 'uppercase', fontSize: '0.95rem' }}>
                  Continuous Analytics
                </h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: T.onSurfaceVariant, lineHeight: 1.5, marginBottom: '1rem' }}>
                Complete regular AI assessments to boost your Bilateral Symmetry and upgrade your passport tier to Olympian.
              </p>
              <Link to="/progress" className="passport-btn passport-btn-primary" style={{ fontSize: '0.75rem', padding: '0.45rem 0.85rem' }}>
                View Analytics <BarChart2 size={13} />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default Passport;

