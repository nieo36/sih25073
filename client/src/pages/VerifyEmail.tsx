import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { AuthService } from '../services/authService';

const T = {
  bg: '#f5f0e8',
  surfaceLowest: '#ffffff',
  primary: '#1a1a1a',
  primaryContainer: '#ffcc00',
  secondary: '#e63b2e',
  onSurfaceVariant: '#4a4a4a',
  fontHeadline: "'Space Grotesk', sans-serif",
  fontBody: "'Inter', sans-serif",
  border3: '3px solid #1a1a1a',
  shadow8: '8px 8px 0px 0px rgba(26,26,26,1)',
};

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided in URL.');
      return;
    }

    AuthService.verifyEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.message || 'Email verified successfully!');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message || 'Email verification link is invalid or expired.');
      });
  }, [token]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: T.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        fontFamily: T.fontBody,
      }}
    >
      <div
        style={{
          background: T.surfaceLowest,
          border: T.border3,
          boxShadow: T.shadow8,
          padding: '2.5rem',
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
        }}
      >
        {status === 'verifying' && (
          <div>
            <div
              style={{
                width: '64px',
                height: '64px',
                background: T.primaryContainer,
                border: T.border3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
              }}
            >
              <Loader2 size={32} color={T.primary} className="vyoma-spin" />
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
              Verifying Email
            </h2>
            <p style={{ color: T.onSurfaceVariant, fontSize: '0.95rem' }}>
              Confirming your email verification with the server…
            </p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div
              style={{
                width: '64px',
                height: '64px',
                background: '#10B981',
                border: T.border3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                color: '#fff',
              }}
            >
              <CheckCircle2 size={36} />
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
              Email Verified!
            </h2>
            <p style={{ color: T.onSurfaceVariant, fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              {message || 'Your email address has been verified successfully. You can now sign in.'}
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
              Sign In to Your Account
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div
              style={{
                width: '64px',
                height: '64px',
                background: T.secondary,
                border: T.border3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                color: '#fff',
              }}
            >
              <AlertCircle size={36} />
            </div>
            <h2
              style={{
                fontFamily: T.fontHeadline,
                fontSize: '1.5rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                color: T.secondary,
                marginBottom: '0.5rem',
              }}
            >
              Verification Failed
            </h2>
            <p style={{ color: T.onSurfaceVariant, fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              {message || 'The verification link is invalid or has expired.'}
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
              Back to Sign In
            </Link>
          </div>
        )}
      </div>

      <style>{`
        @keyframes vyomaSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .vyoma-spin {
          animation: vyomaSpin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};
