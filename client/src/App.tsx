import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { PWAProvider } from './context/PWAContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { MobileNav } from './components/navigation/MobileNav';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { InstallBanner } from './components/pwa/InstallBanner';
import { UpdateBanner } from './components/pwa/UpdateBanner';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AuthCallback } from './pages/AuthCallback';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { VerifyEmail } from './pages/VerifyEmail';
import { Dashboard } from './pages/Dashboard';
import { Assessment } from './pages/Assessment';
import { Calibration } from './pages/Calibration';
import { Progress } from './pages/Progress';
import { Leaderboard } from './pages/Leaderboard';
import { RecruiterDashboard } from './pages/RecruiterDashboard';
import { Passport } from './pages/Passport';

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <PWAProvider>
          <Router>
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <OfflineIndicator />
              <Navbar />
              <main style={{ flex: 1, position: 'relative' }}>
                <Routes>
              {/* Default Redirect to Dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* Protected Assessment & Calibration Routes */}
              <Route
                path="/assessment"
                element={
                  <ProtectedRoute>
                    <Assessment />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/calibration"
                element={
                  <ProtectedRoute>
                    <Calibration />
                  </ProtectedRoute>
                }
              />

              {/* Public-only Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* Protected Athlete / Recruiter Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/progress"
                element={
                  <ProtectedRoute>
                    <Progress />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leaderboard"
                element={
                  <ProtectedRoute>
                    <Leaderboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruiter"
                element={
                  <ProtectedRoute>
                    <RecruiterDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sports-passport"
                element={
                  <ProtectedRoute>
                    <Passport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/passport"
                element={
                  <ProtectedRoute>
                    <Passport />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
          <InstallBanner />
          <UpdateBanner />
          <MobileNav />
        </div>
      </Router>
    </PWAProvider>
    </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
