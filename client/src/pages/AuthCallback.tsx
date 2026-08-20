import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const T = {
  bg: '#f5f0e8',
  primary: '#1a1a1a',
  primaryContainer: '#ffcc00',
  tertiary: '#0055ff',
  secondary: '#e63b2e',
  surfaceLowest: '#ffffff',
  fontHeadline: "'Space Grotesk', sans-serif",
  fontBody: "'Inter', sans-serif",
  border3: '3px solid #1a1a1a',
  shadow8: '8px 8px 0px 0px rgba(26,26,26,1)',
};

export const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleOAuthSuccess, refreshSession } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    let timer: NodeJS.Timeout;

    const processOAuth = async () => {
      const token = searchParams.get('token');
      const email = searchParams.get('email');
      const name = searchParams.get('name') || 'Athlete';
      const role = searchParams.get('role') || 'user';
      const id = searchParams.get('id') || `usr-${Date.now()}`;
      const isEmailVerified = searchParams.get('isEmailVerified') === 'true';
      const error = searchParams.get('error');

      if (error) {
        if (isMounted) {
          setStatus('error');
          setErrorMessage(decodeURIComponent(error));
        }
        return;
      }

      if (token && email) {
        try {
          handleOAuthSuccess(token, {
            id,
            email: decodeURIComponent(email),
            name: decodeURIComponent(name),
            role,
            isEmailVerified,
          });
          if (isMounted) {
            setStatus('success');
            timer = setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 1200);
          }
        } catch (err: any) {
          if (isMounted) {
            setStatus('error');
            setErrorMessage(err?.message || 'Failed to process authentication');
          }
        }
      } else {
        // Fallback: try refreshing session via httpOnly cookie set by OAuth callback
        const refreshed = await refreshSession();
        if (refreshed && isMounted) {
          setStatus('success');
          timer = setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 1200);
        } else if (isMounted) {
          setStatus('error');
          setErrorMessage('Missing authentication tokens in callback response.');
        }
      }
    };

    processOAuth();

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [searchParams, handleOAuthSuccess, refreshSession, navigate]);

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
        {status === 'processing' && (
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
              <Loader2 size={32} color={T.primary} className="kreedai-spin" />
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
              Authorizing Account
            </h2>
            <p style={{ color: '#4a4a4a', fontSize: '0.95rem' }}>
              Finalizing your OAuth sign-in and securing session…
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
              Authentication Success
            </h2>
            <p style={{ color: '#4a4a4a', fontSize: '0.95rem' }}>
              Welcome back! Redirecting you to your athlete dashboard…
            </p>
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
              OAuth Failed
            </h2>
            <p style={{ color: '#4a4a4a', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              {errorMessage || 'Unable to complete OAuth authentication.'}
            </p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              style={{
                background: T.primary,
                color: '#fff',
                border: T.border3,
                fontFamily: T.fontHeadline,
                fontWeight: 700,
                fontSize: '0.9rem',
                textTransform: 'uppercase',
                padding: '0.75rem 1.5rem',
                cursor: 'pointer',
              }}
            >
              Back to Sign In
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes kreedaiSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .kreedai-spin {
          animation: kreedaiSpin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};
