import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Camera,
  Trophy,
  FileCheck,
  Users,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const MobileNav: React.FC = () => {
  const location = useLocation();
  const { t } = useLanguage();

  const isAssessmentActive = location.pathname === '/assessment';
  const isDashboardActive = location.pathname === '/dashboard' || location.pathname === '/';
  const isAnalyticsActive = location.pathname === '/progress';
  const isLeaderboardActive = location.pathname === '/leaderboard';
  const isPassportActive = location.pathname === '/sports-passport' || location.pathname === '/passport';
  const isRecruiterActive = location.pathname === '/recruiter';

  return (
    <>
      <style>{`
        .kreedai-mobile-nav {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 100;
          background: #f5f0e8;
          border-top: 3px solid #1a1a1a;
          box-shadow: 0 -4px 12px rgba(26,26,26,0.08);
          padding: 6px 10px calc(env(safe-area-inset-bottom, 6px) + 6px);
        }
        @media (max-width: 768px) {
          .kreedai-mobile-nav {
            display: flex;
            align-items: center;
            justify-content: space-around;
          }
          /* Add bottom padding to body content so fixed bottom nav doesn't cover page content */
          body {
            padding-bottom: calc(72px + env(safe-area-inset-bottom, 12px)) !important;
          }
        }
        .mob-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          color: #1a1a1a;
          padding: 4px 6px;
          min-width: 52px;
          min-height: 48px;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          border: 2px solid transparent;
          border-radius: 4px;
          transition: all 0.15s ease;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }
        .mob-nav-item.active {
          background: #ffcc00;
          border: 2px solid #1a1a1a;
          box-shadow: 2px 2px 0px 0px #1a1a1a;
          color: #1a1a1a;
        }
        .mob-nav-center-action {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transform: translateY(-14px);
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }
        .mob-nav-center-btn {
          width: 54px;
          height: 54px;
          background: #ffcc00;
          border: 3px solid #1a1a1a;
          box-shadow: 3px 3px 0px 0px #1a1a1a;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1a1a1a;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .mob-nav-center-btn.active,
        .mob-nav-center-action:active .mob-nav-center-btn {
          background: #e63b2e;
          color: #ffffff;
          box-shadow: 1px 1px 0px 0px #1a1a1a;
          transform: translateY(2px);
        }
      `}</style>

      <nav className="kreedai-mobile-nav" aria-label="Mobile Navigation">
        {/* 1. Dashboard */}
        <Link
          to="/dashboard"
          className={`mob-nav-item ${isDashboardActive ? 'active' : ''}`}
          aria-label="Dashboard"
        >
          <LayoutDashboard size={18} />
          <span style={{ marginTop: '2px' }}>{t('nav.dashboard', 'Dash')}</span>
        </Link>

        {/* 2. Analytics */}
        <Link
          to="/progress"
          className={`mob-nav-item ${isAnalyticsActive ? 'active' : ''}`}
          aria-label="Analytics"
        >
          <TrendingUp size={18} />
          <span style={{ marginTop: '2px' }}>{t('nav.analytics', 'Stats')}</span>
        </Link>

        {/* 3. Center Hero Action: AI Camera Assessment */}
        <Link
          to="/assessment"
          className="mob-nav-center-action"
          aria-label="Launch AI Assessment Studio"
        >
          <div className={`mob-nav-center-btn ${isAssessmentActive ? 'active' : ''}`}>
            <Camera size={24} />
          </div>
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '0.62rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: '#1a1a1a',
              marginTop: '2px',
            }}
          >
            {t('nav.assessment', 'AI Studio')}
          </span>
        </Link>

        {/* 4. Leaderboard */}
        <Link
          to="/leaderboard"
          className={`mob-nav-item ${isLeaderboardActive ? 'active' : ''}`}
          aria-label="Leaderboard"
        >
          <Trophy size={18} />
          <span style={{ marginTop: '2px' }}>{t('nav.leaderboard', 'Rank')}</span>
        </Link>

        {/* 5. Sports Passport */}
        <Link
          to="/sports-passport"
          className={`mob-nav-item ${isPassportActive ? 'active' : ''}`}
          aria-label="Sports Passport"
        >
          <FileCheck size={18} />
          <span style={{ marginTop: '2px' }}>{t('nav.passport', 'Passport')}</span>
        </Link>

        {/* 6. Recruiter Hub */}
        <Link
          to="/recruiter"
          className={`mob-nav-item ${isRecruiterActive ? 'active' : ''}`}
          aria-label="Recruiter Hub"
        >
          <Users size={18} />
          <span style={{ marginTop: '2px' }}>{t('nav.recruiter', 'Scout')}</span>
        </Link>
      </nav>
    </>
  );
};
