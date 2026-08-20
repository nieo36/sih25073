import React, { useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Mail, ChevronDown, Globe, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* ─────────────────────────────────────────────
   KreedAI Login — Bauhaus V2 / Neo-Brutalist
   Stitch project 16542555991833173009
   ───────────────────────────────────────────── */

// ── Design tokens (scoped inline) ──────────────────────
const T = {
  bg: '#f5f0e8',
  surface: '#f5f0e8',
  surfaceLowest: '#ffffff',
  surfaceVariant: '#e8e3da',
  surfaceDim: '#d6d1c9',
  primary: '#1a1a1a',
  primaryContainer: '#ffcc00',
  tertiary: '#0055ff',
  secondary: '#e63b2e',
  onSurface: '#1a1a1a',
  onSurfaceVariant: '#4a4a4a',
  onPrimary: '#ffffff',
  fontHeadline: "'Space Grotesk', sans-serif",
  fontBody: "'Inter', sans-serif",
  border3: '3px solid #1a1a1a',
  border4: '4px solid #1a1a1a',
  shadow4: '4px 4px 0px 0px rgba(26,26,26,1)',
  shadow6: '6px 6px 0px 0px rgba(26,26,26,1)',
  shadow8: '8px 8px 0px 0px rgba(26,26,26,1)',
} as const;

// ── Inline style helpers ──────────────────────
const brutalInput: React.CSSProperties = {
  border: 'none',
  borderBottom: `3px solid ${T.primary}`,
  background: 'transparent',
  borderRadius: 0,
  padding: '0.75rem 0',
  fontFamily: T.fontBody,
  fontSize: '1.125rem',
  color: T.primary,
  width: '100%',
  outline: 'none',
  transition: 'border-color 0.15s ease',
};

const brutalInputFocus: React.CSSProperties = {
  borderColor: T.tertiary,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: T.fontHeadline,
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  fontSize: '0.8rem',
  letterSpacing: '0.02em',
  color: T.primary,
  marginBottom: '0.25rem',
};

// ── Google SVG ──────────────────────
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);


// ── Bauhaus decorative element ──────────────────────
const BauhausDecor = () => (
  <svg
    width="100%"
    height="100%"
    viewBox="0 0 400 400"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ opacity: 0.08 }}
  >
    <rect x="20" y="20" width="360" height="360" stroke={T.primary} strokeWidth="8" />
    <circle cx="200" cy="200" r="100" fill={T.primary} />
    <path d="M20 20 L380 380 M380 20 L20 380" stroke={T.primary} strokeWidth="4" />
    <rect x="100" y="100" width="200" height="200" stroke={T.primary} strokeWidth="6" />
    <circle cx="200" cy="200" r="50" stroke={T.primaryContainer} strokeWidth="6" fill="none" />
  </svg>
);

// ══════════════════════════════════════════════
//  LOGIN COMPONENT
// ══════════════════════════════════════════════
export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [showTwoFactorInput, setShowTwoFactorInput] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [langOpen, setLangOpen] = useState(false);
  const [error, setError] = useState('');
  const [infoNotice, setInfoNotice] = useState<string | null>(null);

  const { login, loginWithGoogle, isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  React.useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setInfoNotice('Your email address has been verified successfully! Please sign in.');
    } else if (searchParams.get('resetSuccess') === 'true') {
      setInfoNotice('Password updated successfully! Please sign in with your new password.');
    }
    const errParam = searchParams.get('error');
    if (errParam) {
      setError(decodeURIComponent(errParam));
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoNotice(null);

    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      await login({
        email,
        password,
        twoFactorCode: showTwoFactorInput ? twoFactorCode : undefined,
      });
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err: any) {
      const errMsg = err?.message || 'Login failed. Please check your credentials.';
      const lower = errMsg.toLowerCase();
      if (lower.includes('two factor') || lower.includes('2fa')) {
        setShowTwoFactorInput(true);
        setError('Please enter your 6-digit Authenticator 2FA code to continue.');
      } else if (lower.includes('user not found') || lower.includes('no account')) {
        setError('No athlete account found with this email address. Please create an account.');
      } else if (lower.includes('invalid password')) {
        setError('Invalid password. Please double-check your password or click "Forgot password?".');
      } else if (lower.includes('verify your email')) {
        setError('Your email address is not verified. Please check your email inbox to verify.');
      } else {
        setError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: T.bg,
        color: T.onSurface,
        fontFamily: T.fontBody,
        display: 'flex',
        flexDirection: 'column',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {/* ── Google Fonts ───────────────── */}
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@400;700;900&display=swap"
        rel="stylesheet"
      />

      {/* ── Top Bar ───────────────── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 1.5rem',
          borderBottom: `4px solid ${T.primary}`,
          background: T.bg,
        }}
      >
        <div
          style={{
            fontFamily: T.fontHeadline,
            fontWeight: 900,
            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            letterSpacing: '-0.04em',
            textTransform: 'uppercase',
            color: T.primary,
          }}
        >
          KREEDAI
        </div>

        {/* Language Selector */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setLangOpen(!langOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontFamily: T.fontHeadline,
              fontWeight: 700,
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              border: T.border3,
              padding: '0.45rem 0.85rem',
              background: 'transparent',
              color: T.primary,
              cursor: 'pointer',
              transition: 'all 0.1s',
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'translate(1px,1px)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'none'}
            type="button"
          >
            <Globe size={16} />
            {lang === 'en' ? 'EN' : 'हिन्दी'}
            <ChevronDown size={14} style={{ transform: langOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {langOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                right: 0,
                border: T.border3,
                background: T.surfaceLowest,
                boxShadow: T.shadow4,
                zIndex: 60,
                minWidth: '120px',
              }}
            >
              {(['en', 'hi'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => { setLang(l); setLangOpen(false); }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '0.6rem 1rem',
                    fontFamily: T.fontHeadline,
                    fontWeight: lang === l ? 700 : 400,
                    fontSize: '0.85rem',
                    textAlign: 'left',
                    border: 'none',
                    borderBottom: l === 'en' ? `2px solid ${T.primary}` : 'none',
                    background: lang === l ? T.primaryContainer : 'transparent',
                    color: T.primary,
                    cursor: 'pointer',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => { if (lang !== l) e.currentTarget.style.background = T.surfaceVariant; }}
                  onMouseLeave={(e) => { if (lang !== l) e.currentTarget.style.background = 'transparent'; }}
                  type="button"
                >
                  {l === 'en' ? 'English' : 'हिन्दी'}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ── Main Layout ───────────────── */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1.5rem',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '1100px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
            gap: '3rem',
            alignItems: 'center',
          }}
        >
          {/* ── Left: Hero / Branding ───────────────── */}
          <div style={{ maxWidth: '520px' }}>
            <h1
              style={{
                fontFamily: T.fontHeadline,
                fontWeight: 900,
                fontSize: 'clamp(2.5rem, 6vw, 3.75rem)',
                letterSpacing: '-0.04em',
                textTransform: 'uppercase',
                lineHeight: 1,
                marginBottom: '1.25rem',
                color: T.primary,
              }}
            >
              Your potential
              <br />
              starts here.
            </h1>

            <p
              style={{
                fontFamily: T.fontBody,
                fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
                fontWeight: 500,
                color: T.onSurfaceVariant,
                borderLeft: `4px solid ${T.primary}`,
                paddingLeft: '1rem',
                maxWidth: '22rem',
                lineHeight: 1.5,
              }}
            >
              Sign in to continue your athletic journey.
            </p>

            {/* Bauhaus decorative graphic — desktop only */}
            <div
              style={{
                marginTop: '2rem',
                width: '200px',
                height: '200px',
                display: 'none',  // hidden on mobile by default
              }}
              className="kreedai-decor-desktop"
            >
              <BauhausDecor />
            </div>
          </div>

          {/* ── Right: Login Card ───────────────── */}
          <div
            style={{
              background: T.surfaceLowest,
              border: T.border3,
              padding: 'clamp(1.5rem, 4vw, 2.5rem)',
              position: 'relative',
              maxWidth: '480px',
              width: '100%',
            }}
          >
            {/* Corner decoration */}
            <div
              style={{
                position: 'absolute',
                top: '-12px',
                right: '-12px',
                width: '24px',
                height: '24px',
                background: T.primaryContainer,
                border: T.border3,
              }}
            />

            {isAuthenticated && user && (
              <div
                style={{
                  background: T.primaryContainer,
                  border: T.border3,
                  padding: '0.85rem 1rem',
                  marginBottom: '1.5rem',
                  fontFamily: T.fontBody,
                  fontSize: '0.85rem',
                  color: T.primary,
                  fontWeight: 600,
                  lineHeight: 1.4,
                }}
              >
                You are currently signed in as <strong>{user.name || user.email}</strong>.{' '}
                <button
                  type="button"
                  onClick={() => logout()}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: T.tertiary,
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontWeight: 700,
                    padding: 0,
                    fontFamily: T.fontHeadline,
                  }}
                >
                  Sign Out
                </button>{' '}
                to change accounts, or go to{' '}
                <Link to="/dashboard" style={{ color: T.tertiary, fontWeight: 700 }}>
                  Dashboard
                </Link>.
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Email */}
              <div>
                <label htmlFor="kreedai-email" style={labelStyle}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={18}
                    color={T.onSurfaceVariant}
                    style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    id="kreedai-email"
                    type="email"
                    placeholder="athlete@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    style={{
                      ...brutalInput,
                      paddingRight: '2rem',
                      ...(focusedField === 'email' ? brutalInputFocus : {}),
                    }}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.25rem' }}>
                  <label htmlFor="kreedai-password" style={{ ...labelStyle, marginBottom: 0 }}>
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    style={{
                      fontFamily: T.fontHeadline,
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      color: T.tertiary,
                      textDecoration: 'none',
                      letterSpacing: '0.01em',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                    onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                  >
                    Forgot password?
                  </Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    id="kreedai-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    style={{
                      ...brutalInput,
                      paddingRight: '2.5rem',
                      ...(focusedField === 'password' ? brutalInputFocus : {}),
                    }}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: T.primary,
                      padding: '0.25rem',
                      display: 'flex',
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* 2FA Code Input (Conditional) */}
              {showTwoFactorInput && (
                <div>
                  <label htmlFor="kreedai-2fa" style={{ ...labelStyle, color: T.tertiary }}>
                    Two-Factor Authentication Code (2FA)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <KeyRound
                      size={18}
                      color={T.tertiary}
                      style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }}
                    />
                    <input
                      id="kreedai-2fa"
                      type="text"
                      inputMode="numeric"
                      placeholder="6-digit Authenticator Code"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      onFocus={() => setFocusedField('2fa')}
                      onBlur={() => setFocusedField(null)}
                      style={{
                        ...brutalInput,
                        paddingRight: '2rem',
                        borderColor: T.tertiary,
                        fontWeight: 700,
                        letterSpacing: '0.15em',
                      }}
                      autoComplete="one-time-code"
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {/* Info Notice */}
              {infoNotice && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontFamily: T.fontBody,
                    fontSize: '0.85rem',
                    color: '#059669',
                    fontWeight: 600,
                    borderLeft: `3px solid #059669`,
                    background: '#ECFDF5',
                    padding: '0.6rem 0.75rem',
                    marginTop: '-0.75rem',
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>{infoNotice}</span>
                </div>
              )}

              {/* Error */}
              {error && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontFamily: T.fontBody,
                    fontSize: '0.85rem',
                    color: T.secondary,
                    fontWeight: 600,
                    borderLeft: `3px solid ${T.secondary}`,
                    background: '#FEF2F2',
                    padding: '0.6rem 0.75rem',
                    marginTop: '-0.75rem',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Sign In CTA */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  background: loading ? T.onSurfaceVariant : T.primary,
                  color: T.surface,
                  fontFamily: T.fontHeadline,
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  textTransform: 'uppercase',
                  padding: '1rem',
                  border: T.border3,
                  boxShadow: T.shadow4,
                  cursor: loading ? 'wait' : 'pointer',
                  transition: 'all 0.1s',
                  letterSpacing: '-0.01em',
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = T.primaryContainer;
                    e.currentTarget.style.color = T.primary;
                    e.currentTarget.style.transform = 'translate(-2px, -2px)';
                    e.currentTarget.style.boxShadow = T.shadow6;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = loading ? T.onSurfaceVariant : T.primary;
                  e.currentTarget.style.color = T.surface;
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = T.shadow4;
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'translate(2px, 2px)';
                  e.currentTarget.style.boxShadow = '2px 2px 0px 0px rgba(26,26,26,1)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'translate(-2px, -2px)';
                  e.currentTarget.style.boxShadow = T.shadow6;
                }}
              >
                {loading ? 'Signing In…' : 'Sign In'}
              </button>
            </form>

            {/* ── Divider ───────────────── */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                margin: '2rem 0',
                gap: '0.75rem',
              }}
            >
              <div style={{ flex: 1, height: '2px', background: T.primary }} />
              <span
                style={{
                  fontFamily: T.fontHeadline,
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  color: T.onSurfaceVariant,
                  background: T.surfaceLowest,
                  padding: '0.15rem 0.5rem',
                  border: `2px solid ${T.primary}`,
                  letterSpacing: '0.02em',
                }}
              >
                OR
              </span>
              <div style={{ flex: 1, height: '2px', background: T.primary }} />
            </div>

            {/* ── OAuth Buttons ───────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={loginWithGoogle}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.65rem',
                  background: T.surfaceLowest,
                  color: T.primary,
                  fontFamily: T.fontHeadline,
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  padding: '0.8rem',
                  border: T.border3,
                  boxShadow: T.shadow4,
                  cursor: 'pointer',
                  transition: 'all 0.1s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = T.surfaceVariant;
                  e.currentTarget.style.transform = 'translate(-1px, -1px)';
                  e.currentTarget.style.boxShadow = '5px 5px 0px 0px rgba(26,26,26,1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = T.surfaceLowest;
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = T.shadow4;
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'translate(2px, 2px)';
                  e.currentTarget.style.boxShadow = '2px 2px 0px 0px rgba(26,26,26,1)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'translate(-1px, -1px)';
                  e.currentTarget.style.boxShadow = '5px 5px 0px 0px rgba(26,26,26,1)';
                }}
              >
                <GoogleIcon />
                Continue with Google
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer Link ───────────────── */}
      <div
        style={{
          textAlign: 'center',
          padding: '1.5rem 1rem 2rem',
        }}
      >
        <Link
          to="/register"
          style={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            textDecoration: 'none',
            color: T.onSurfaceVariant,
          }}
        >
          <span style={{ fontFamily: T.fontBody, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
            New to KreedAI?
          </span>
          <span
            style={{
              fontFamily: T.fontHeadline,
              fontWeight: 700,
              fontSize: '0.9rem',
              textTransform: 'uppercase',
              color: T.primary,
              borderBottom: `2px solid ${T.primary}`,
              paddingBottom: '0.15rem',
              transition: 'color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = T.tertiary;
              e.currentTarget.style.borderColor = T.tertiary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = T.primary;
              e.currentTarget.style.borderColor = T.primary;
            }}
          >
            Create your athlete profile
          </span>
        </Link>
      </div>

      {/* ── Bottom Decoration ───────────────── */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '6px',
          background: T.primaryContainer,
          borderTop: `3px solid ${T.primary}`,
          zIndex: -1,
        }}
      />

      {/* ── Responsive style inject ───────────────── */}
      <style>{`
        @media (min-width: 900px) {
          .kreedai-decor-desktop { display: block !important; }
        }
      `}</style>
    </div>
  );
};
