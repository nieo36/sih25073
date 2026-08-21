import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AuthCallback } from './pages/AuthCallback';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { VerifyEmail } from './pages/VerifyEmail';
import { Dashboard } from './pages/Dashboard';
import { Assessment } from './pages/Assessment';
import { Progress } from './pages/Progress';
import { Leaderboard } from './pages/Leaderboard';
import { RecruiterDashboard } from './pages/RecruiterDashboard';
import { Passport } from './pages/Passport';

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Navbar />
          <main style={{ flex: 1, paddingBottom: '3rem' }}>
            <Routes>
              {/* Default Redirect to Dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* Protected Assessment Route */}
              <Route
                path="/assessment"
                element={
                  <ProtectedRoute>
                    <Assessment />
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
        </div>
      </Router>
    </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
