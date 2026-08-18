import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const T = {
  bg: '#f5f0e8',
  surface: '#f5f0e8',
  surfaceLowest: '#ffffff',
  surfaceVariant: '#e8e3da',
  primary: '#1a1a1a',
  primaryContainer: '#ffcc00',
  tertiary: '#0055ff',
  secondary: '#e63b2e',
  onSurface: '#1a1a1a',
  onSurfaceVariant: '#4a4a4a',
  fontHeadline: "'Space Grotesk', sans-serif",
  fontBody: "'Inter', sans-serif",
  border3: '3px solid #1a1a1a',
  shadow4: '4px 4px 0px 0px rgba(26,26,26,1)',
  shadow8: '8px 8px 0px 0px rgba(26,26,26,1)',
};

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

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: T.fontHeadline,
  fontWeight: 700,
  textTransform: 'uppercase',
  fontSize: '0.8rem',
  letterSpacing: '0.02em',
  color: T.primary,
  marginBottom: '0.25rem',
};

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to send password reset email. Please try again.');
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
      }}
    >
      {/* Top Header */}
      <header
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 1.5rem',
          borderBottom: `4px solid ${T.primary}`,
          background: T.bg,
        }}
      >
        <Link
          to="/login"
          style={{
            fontFamily: T.fontHeadline,
            fontWeight: 900,
            fontSize: '1.5rem',
            letterSpacing: '-0.04em',
            textTransform: 'uppercase',
            color: T.primary,
            textDecoration: 'none',
          }}
        >
          VYOMA
        </Link>
        <Link
          to="/login"
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
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={16} /> Back to Sign In
        </Link>
      </header>

      {/* Main Content */}
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
            background: T.surfaceLowest,
            border: T.border3,
            boxShadow: T.shadow8,
            padding: 'clamp(1.5rem, 4vw, 2.5rem)',
            position: 'relative',
            maxWidth: '480px',
            width: '100%',
          }}
        >
          {/* Accent decoration */}
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

          {!submitted ? (
            <>
              <div style={{ marginBottom: '2rem' }}>
                <span
                  style={{
                    display: 'inline-block',
                    background: T.primaryContainer,
                    color: T.primary,
                    fontFamily: T.fontHeadline,
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    padding: '0.2rem 0.5rem',
                    border: `2px solid ${T.primary}`,
                    marginBottom: '0.75rem',
                  }}
                >
                  ACCOUNT RECOVERY
                </span>
                <h1
                  style={{
                    fontFamily: T.fontHeadline,
                    fontSize: '1.75rem',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    lineHeight: 1.1,
                    color: T.primary,
                    marginBottom: '0.5rem',
                  }}
                >
                  Forgot Password
                </h1>
                <p style={{ color: T.onSurfaceVariant, fontSize: '0.95rem' }}>
                  Enter your verified email address and we'll send you instructions to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                <div>
                  <label htmlFor="recovery-email" style={labelStyle}>
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail
                      size={18}
                      color={T.onSurfaceVariant}
                      style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }}
                    />
                    <input
                      id="recovery-email"
                      type="email"
                      placeholder="athlete@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={brutalInput}
                      required
                    />
                  </div>
                </div>

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
                      paddingLeft: '0.75rem',
                    }}
                  >
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    background: loading ? T.onSurfaceVariant : T.primary,
                    color: '#ffffff',
                    fontFamily: T.fontHeadline,
                    fontWeight: 700,
                    fontSize: '1rem',
                    textTransform: 'uppercase',
                    padding: '0.9rem',
                    border: T.border3,
                    boxShadow: T.shadow4,
                    cursor: loading ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="vyoma-spin" />
                      Sending Link…
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  background: '#10B981',
                  border: T.border3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                  color: '#fff',
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <h2
                style={{
                  fontFamily: T.fontHeadline,
                  fontSize: '1.5rem',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  marginBottom: '0.5rem',
                }}
              >
                Reset Link Sent
              </h2>
              <p style={{ color: T.onSurfaceVariant, fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                If an account exists for <strong style={{ color: T.primary }}>{email}</strong>, you will receive an email with password reset instructions shortly.
              </p>
              <Link
                to="/login"
                style={{
                  display: 'inline-block',
                  background: T.primary,
                  color: '#fff',
                  border: T.border3,
                  fontFamily: T.fontHeadline,
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  textTransform: 'uppercase',
                  padding: '0.75rem 1.5rem',
                  textDecoration: 'none',
                }}
              >
                Return to Sign In
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
