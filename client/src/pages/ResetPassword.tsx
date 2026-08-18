import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
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

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid or missing password reset token.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login?resetSuccess=true');
      }, 2000);
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password. The link may have expired.');
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
      </header>

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
          {!token ? (
            <div style={{ textAlign: 'center' }}>
              <AlertCircle size={48} color={T.secondary} style={{ margin: '0 auto 1rem' }} />
              <h2
                style={{
                  fontFamily: T.fontHeadline,
                  fontSize: '1.5rem',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  marginBottom: '0.5rem',
                }}
              >
                Invalid Reset Link
              </h2>
              <p style={{ color: T.onSurfaceVariant, fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                No reset token provided. Please request a new password reset link.
              </p>
              <Link
                to="/forgot-password"
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
                Request Reset Link
              </Link>
            </div>
          ) : !success ? (
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
                  NEW CREDENTIALS
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
                  Set New Password
                </h1>
                <p style={{ color: T.onSurfaceVariant, fontSize: '0.95rem' }}>
                  Choose a secure password for your athlete profile.
                </p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                {/* New Password */}
                <div>
                  <label htmlFor="new-password" style={labelStyle}>
                    New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ ...brutalInput, paddingRight: '2.5rem' }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
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

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirm-password" style={labelStyle}>
                    Confirm Password
                  </label>
                  <input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={brutalInput}
                    required
                  />
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
                      Updating Password…
                    </>
                  ) : (
                    'Save New Password'
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
                Password Updated!
              </h2>
              <p style={{ color: T.onSurfaceVariant, fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                Your password has been changed successfully. Redirecting you to Sign In…
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
                Sign In Now
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
