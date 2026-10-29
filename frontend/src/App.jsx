/**
 * KEYFLOW Main Application Router
 * ===============================
 * Integrates ThemeProvider, SoundProvider, I18nProvider, and AuthProvider.
 * Enforces ProtectedRoute guards on personal learning & arcade progress routes.
 * Exposes public landing and masterpiece authentication pages.
 */

import React from 'react';
import { BrowserRouter, Routes, Route, useParams, useNavigate, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { SoundProvider } from './context/SoundContext';
import { AuthProvider } from './context/AuthContext';
import { I18nProvider } from './i18n/I18nContext';
import { Navbar } from './components/common/Navbar';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { AcademyPage } from './pages/AcademyPage';
import { WorkstationPage } from './pages/WorkstationPage';
import { ArcadePage } from './pages/ArcadePage';
import TelemetryPage from './pages/TelemetryPage';
import { ThemesPage } from './pages/ThemesPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

import { ClerkProvider } from '@clerk/react';
import { Footer } from './components/common/Footer';

const CLERK_PUBLISHABLE_KEY =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_CLERK_PUBLISHABLE_KEY
    ? String(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY).trim()
    : '';

const isClerkConfigured = Boolean(CLERK_PUBLISHABLE_KEY);

const AcademyStageRoute = () => {
  const { stageId } = useParams();
  const navigate = useNavigate();
  return (
    <AcademyPage
      initialLevelId={parseInt(stageId, 10) || 1}
      onExit={() => navigate('/')}
    />
  );
};

const AcademyHomeRoute = () => {
  const navigate = useNavigate();
  return (
    <AcademyPage
      initialLevelId={1}
      onExit={() => navigate('/')}
    />
  );
};

function App() {
  const router = (
    <ThemeProvider>
      <SoundProvider>
        <I18nProvider>
          <BrowserRouter>
            <div className="min-h-screen flex flex-col bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-200">
              <Navbar />
              <div className="flex-1">
                <Routes>
                  {/* Public Pages */}
                  <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<AuthPage mode="login" />} />
                    <Route path="/register" element={<AuthPage mode="register" />} />
                    <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
                    <Route path="/reset-password" element={<AuthPage mode="reset" />} />
                    <Route path="/reset-password/:token" element={<AuthPage mode="reset" />} />
                    <Route path="/telemetry" element={<TelemetryPage />} />
                    <Route path="/analytics" element={<Navigate to="/telemetry" replace />} />
                    <Route path="/themes" element={<ThemesPage />} />


                    {/* Core Protected Learning, Practice & Arcade Routes */}
                    <Route
                      path="/workstation"
                      element={
                        <ProtectedRoute>
                          <WorkstationPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/practice"
                      element={
                        <ProtectedRoute>
                          <WorkstationPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/academy"
                      element={
                        <ProtectedRoute>
                          <AcademyHomeRoute />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/academy/stage/:stageId"
                      element={
                        <ProtectedRoute>
                          <AcademyStageRoute />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/arcade"
                      element={
                        <ProtectedRoute>
                          <ArcadePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/arcade/:gameId"
                      element={
                        <ProtectedRoute>
                          <ArcadePage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Aliases & Fallbacks */}
                    <Route path="/curriculum" element={<Navigate to="/academy" replace />} />
                    <Route path="*" element={<LandingPage />} />
                  </Routes>
                </div>
                <Footer />
            </div>
          </BrowserRouter>
        </I18nProvider>
      </SoundProvider>
    </ThemeProvider>
  );

  if (isClerkConfigured) {
    return (
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        <AuthProvider isClerkConfigured={true}>{router}</AuthProvider>
      </ClerkProvider>
    );
  }

  return <AuthProvider isClerkConfigured={false}>{router}</AuthProvider>;
}

export default App;
