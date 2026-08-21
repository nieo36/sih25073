import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Award, 
  BarChart2, 
  Camera, 
  FileCheck, 
  LayoutDashboard, 
  LogOut, 
  ShieldAlert, 
  User,
  LogIn,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

// ── Scoped Neo-Brutalist Theme Tokens ──────────────────────────────
const T = {
  bg: '#f5f0e8',
  surface: '#f5f0e8',
  surfaceLowest: '#ffffff',
  surfaceVariant: '#e8e3da',
  primary: '#1a1a1a',
  primaryContainer: '#ffcc00', // Yellow
  tertiary: '#0055ff',        // Blue
  secondary: '#e63b2e',       // Red
  onPrimary: '#ffffff',
  fontHeadline: "'Space Grotesk', sans-serif",
  fontBody: "'Inter', sans-serif",
  border2: '2px solid #1a1a1a',
  border3: '3px solid #1a1a1a',
  border4: '4px solid #1a1a1a',
  shadow2: '2px 2px 0px 0px #1a1a1a',
  shadow4: '4px 4px 0px 0px #1a1a1a',
} as const;

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const navLinks = [
    { to: '/dashboard', label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard },
    { to: '/assessment', label: t('nav.assessment', 'AI Assessment'), icon: Camera },
    { to: '/progress', label: t('nav.analytics', 'Analytics'), icon: BarChart2 },
    { to: '/leaderboard', label: t('nav.leaderboard', 'Leaderboard'), icon: Award },
    { to: '/sports-passport', label: t('nav.passport', 'Sports Passport'), icon: FileCheck },
    { to: '/recruiter', label: t('nav.recruiter', 'Recruiter Hub'), icon: ShieldAlert },
  ];

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await logout();
    navigate('/login');
  };

  // Get user avatar or profile photo if uploaded
  const userAvatar = user?.profile?.profilePhoto || user?.profilePhoto || user?.avatar;

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: T.bg,
      borderBottom: T.border4,
      padding: '0.65rem 1.25rem',
      fontFamily: T.fontBody,
      boxShadow: '0 2px 0px 0px rgba(26,26,26,0.1)',
    }}>
      <div style={{
        maxWidth: '1380px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'nowrap',
        gap: '1rem',
      }}>
        {/* Brand Logo */}
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none', flexShrink: 0 }}>
          <div style={{
            background: T.primaryContainer,
            width: '36px',
            height: '36px',
            border: T.border3,
            boxShadow: T.shadow2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Zap size={20} color={T.primary} />
          </div>
          <div>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: 900,
              letterSpacing: '-0.04em',
              fontFamily: T.fontHeadline,
              textTransform: 'uppercase',
              color: T.primary,
              lineHeight: 1,
            }}>
              KREED<span style={{ color: T.secondary }}>AI</span>
            </div>
            <div style={{
              fontSize: '0.65rem',
              color: T.primary,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontFamily: T.fontHeadline,
              marginTop: '0.1rem',
            }}>
              Pose Studio & Analytics
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          padding: '0.2rem 0',
          flex: '1 1 auto',
          justifyContent: 'center',
        }}>
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.to ||
              (item.to === '/sports-passport' && location.pathname === '/passport');
            return (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  fontFamily: T.fontHeadline,
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  color: T.primary,
                  background: isActive ? T.primaryContainer : 'transparent',
                  border: isActive ? T.border2 : '2px solid transparent',
                  boxShadow: isActive ? T.shadow2 : 'none',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = T.surfaceVariant;
                    e.currentTarget.style.borderColor = T.primary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                  }
                }}
              >
                <Icon size={15} color={T.primary} />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Language Switcher & User Account / Auth Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
          {/* Fixed-Width Language Toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            border: T.border2,
            boxShadow: T.shadow2,
            background: T.surfaceLowest,
            height: '34px',
            boxSizing: 'border-box',
          }}>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              style={{
                width: '42px',
                height: '100%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontFamily: T.fontHeadline,
                fontWeight: 800,
                textTransform: 'uppercase',
                background: language === 'en' ? T.primaryContainer : 'transparent',
                color: T.primary,
                border: 'none',
                borderRight: T.border2,
                cursor: 'pointer',
                transition: 'background 0.1s ease',
                boxSizing: 'border-box',
              }}
              title="Switch to English"
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('hi')}
              style={{
                width: '42px',
                height: '100%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontFamily: T.fontHeadline,
                fontWeight: 800,
                textTransform: 'uppercase',
                background: language === 'hi' ? T.primaryContainer : 'transparent',
                color: T.primary,
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.1s ease',
                boxSizing: 'border-box',
              }}
              title="हिंदी में बदलें"
            >
              हिन्दी
            </button>
          </div>

          {isAuthenticated && user ? (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.35rem 0.65rem',
                  background: T.surfaceLowest,
                  border: T.border2,
                  boxShadow: T.shadow2,
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  fontFamily: T.fontHeadline,
                  color: T.primary,
                }}
              >
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={user.name || 'User'}
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      border: '1.5px solid #1a1a1a',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: T.primaryContainer,
                      border: '1.5px solid #1a1a1a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: T.primary,
                    }}
                  >
                    {user.name ? user.name.charAt(0).toUpperCase() : <User size={13} />}
                  </div>
                )}
                <span>{user.name || user.email.split('@')[0]}</span>
                {user.twoFactorEnabled && (
                  <span title="2FA Active" style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <ShieldCheck size={14} color={T.tertiary} />
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                title="Sign Out"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.45rem 0.6rem',
                  color: T.primary,
                  border: T.border2,
                  background: T.surfaceLowest,
                  boxShadow: T.shadow2,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = T.secondary;
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = T.surfaceLowest;
                  e.currentTarget.style.color = T.primary;
                }}
              >
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link
                to="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.8rem',
                  fontFamily: T.fontHeadline,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  background: T.surfaceLowest,
                  color: T.primary,
                  border: T.border2,
                  boxShadow: T.shadow2,
                }}
              >
                <LogIn size={14} />
                <span>Sign In</span>
              </Link>
              <Link
                to="/register"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.8rem',
                  fontFamily: T.fontHeadline,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  background: T.primaryContainer,
                  color: T.primary,
                  border: T.border2,
                  boxShadow: T.shadow2,
                }}
              >
                <span>Register</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
