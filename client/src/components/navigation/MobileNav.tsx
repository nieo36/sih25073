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

export const MobileNav: React.FC = () => {
  const location = useLocation();

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
          z-index: 999;
          background: #f5f0e8;
          border-top: 3px solid #1a1a1a;
          box-shadow: 0 -4px 16px rgba(26,26,26,0.12);
          padding: 4px 4px max(env(safe-area-inset-bottom, 8px), 8px);
        }
        @media (max-width: 768px) {
          .kreedai-mobile-nav {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            align-items: end;
            gap: 2px;
          }
          /* Ensure fixed bottom nav doesn't cover page content */
          body {
            padding-bottom: calc(64px + env(safe-area-inset-bottom, 8px)) !important;
          }
        }
        .mob-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          color: #1a1a1a;
          padding: 4px 2px;
          width: 100%;
          min-width: 0;
          border-radius: 4px;
          border: 1.5px solid transparent;
          transition: all 0.15s ease;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
          text-align: center;
        }
        .mob-nav-item span {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.58rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: -0.02em;
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
          line-height: 1.1;
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
          color: #1a1a1a;
          padding: 0 2px 2px;
          width: 100%;
          min-width: 0;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
          text-align: center;
          position: relative;
        }
        .mob-nav-center-btn {
          width: 44px;
          height: 44px;
          background: #ffcc00;
          border: 2.5px solid #1a1a1a;
          box-shadow: 2px 2px 0px 0px #1a1a1a;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1a1a1a;
          margin-top: -14px;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .mob-nav-center-btn.active,
        .mob-nav-center-action:active .mob-nav-center-btn {
          background: #e63b2e;
          color: #ffffff;
          box-shadow: 1px 1px 0px 0px #1a1a1a;
          transform: translateY(2px);
        }
        .mob-nav-center-action span {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.58rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: -0.02em;
          margin-top: 2px;
          color: #1a1a1a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
          line-height: 1.1;
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
          <span>Dash</span>
        </Link>

        {/* 2. Analytics */}
        <Link
          to="/progress"
          className={`mob-nav-item ${isAnalyticsActive ? 'active' : ''}`}
          aria-label="Analytics"
        >
          <TrendingUp size={18} />
          <span>Stats</span>
        </Link>

        {/* 3. Center Hero Action: AI Camera Assessment */}
        <Link
          to="/assessment"
          className="mob-nav-center-action"
          aria-label="Launch AI Assessment Studio"
        >
          <div className={`mob-nav-center-btn ${isAssessmentActive ? 'active' : ''}`}>
            <Camera size={22} />
          </div>
          <span>AI Studio</span>
        </Link>

        {/* 4. Leaderboard */}
        <Link
          to="/leaderboard"
          className={`mob-nav-item ${isLeaderboardActive ? 'active' : ''}`}
          aria-label="Leaderboard"
        >
          <Trophy size={18} />
          <span>Ranks</span>
        </Link>

        {/* 5. Sports Passport */}
        <Link
          to="/sports-passport"
          className={`mob-nav-item ${isPassportActive ? 'active' : ''}`}
          aria-label="Sports Passport"
        >
          <FileCheck size={18} />
          <span>Passport</span>
        </Link>

        {/* 6. Recruiter Hub */}
        <Link
          to="/recruiter"
          className={`mob-nav-item ${isRecruiterActive ? 'active' : ''}`}
          aria-label="Recruiter Hub"
        >
          <Users size={18} />
          <span>Scouts</span>
        </Link>
      </nav>
    </>
  );
};
export default MobileNav;
