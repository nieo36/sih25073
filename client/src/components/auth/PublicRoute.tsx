import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface PublicRouteProps {
  children?: React.ReactNode;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  // Allow authenticated OAuth users to access /register?oauth=true for onboarding
  const isOAuthOnboarding =
    location.pathname === '/register' &&
    new URLSearchParams(location.search).get('oauth') === 'true';

  if (isAuthenticated && !isOAuthOnboarding) {
    const from = (location.state as any)?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  return children ? <>{children}</> : null;
};
