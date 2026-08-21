import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Activity, AlertTriangle, RefreshCw } from 'lucide-react';
import { AuthService } from '../../services/authService';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requireVerification?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireVerification = false }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const [resending, setResending] = useState(false);
  const [resentSuccess, setResentSuccess] = useState(false);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          color: '#1a1a1a',
          fontFamily: "'Space Grotesk', sans-serif",
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            background: '#ffcc00',
            border: '3px solid #1a1a1a',
            boxShadow: '4px 4px 0px 0px #1a1a1a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Activity size={28} color="#1a1a1a" />
        </div>
        <p style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '0.05em' }}>
          VERIFYING ATHLETE SESSION…
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user signed in via OAuth but hasn't completed their athlete profile preferences,
  // redirect them to the onboarding form to fill in their details.
  if (user && !user.profile?.age && !user.profile?.primarySport) {
    // Only gate if they're not already on the onboarding page
    if (location.pathname !== '/register') {
      return <Navigate to="/register?oauth=true" replace />;
    }
  }

  // Check email verification status if required
  if (requireVerification && user && !user.isEmailVerified) {
    const handleResend = async () => {
      setResending(true);
      try {
        await AuthService.forgotPassword(user.email);
        setResentSuccess(true);
      } catch {
        // handle gracefully
      } finally {
        setResending(false);
      }
    };

    return (
      <div
        style={{
          minHeight: '75vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1.5rem',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: '520px',
            width: '100%',
            background: '#fff',
            border: '4px solid #1a1a1a',
            boxShadow: '8px 8px 0px 0px #1a1a1a',
            padding: '2.5rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              background: '#ffcc00',
              border: '3px solid #1a1a1a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}
          >
            <AlertTriangle size={32} color="#1a1a1a" />
          </div>

          <h2
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 900,
              fontSize: '1.6rem',
              textTransform: 'uppercase',
              marginBottom: '0.75rem',
              color: '#1a1a1a',
            }}
          >
            Email Verification Required
          </h2>

          <p style={{ color: '#4a4a4a', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
            To access protected athlete features, please verify your email address (<strong>{user.email}</strong>). Check your inbox for the link we sent.
          </p>

          {resentSuccess ? (
            <div style={{ background: '#ECFDF5', borderLeft: '4px solid #059669', padding: '0.75rem', fontSize: '0.85rem', color: '#059669', fontWeight: 600, marginBottom: '1.5rem' }}>
              A new verification link has been sent to your email address!
            </div>
          ) : null}

          <button
            onClick={handleResend}
            disabled={resending}
            style={{
              width: '100%',
              background: '#1a1a1a',
              color: '#fff',
              border: '3px solid #1a1a1a',
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: '0.95rem',
              textTransform: 'uppercase',
              padding: '0.85rem',
              cursor: resending ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <RefreshCw size={16} />
            {resending ? 'Sending Email…' : 'Resend Verification Email'}
          </button>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : null;
};
