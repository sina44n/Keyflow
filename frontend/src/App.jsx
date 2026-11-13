/**
 * KEYFLOW Main Application Router
 * ===============================
 * Integrates ThemeProvider, SoundProvider, I18nProvider, and AuthProvider.
 * Enforces ProtectedRoute guards on personal learning & arcade progress routes.
 * Exposes public landing and masterpiece authentication pages.
 */

import React, { Suspense, lazy } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, useParams, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { SoundProvider } from './context/SoundContext';
import { AuthProvider } from './context/AuthContext';
import { I18nProvider } from './i18n/I18nContext';
import { Navbar } from './components/common/Navbar';
import { LandingPage } from './pages/LandingPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PageLoadingFallback } from './components/common/PageLoadingFallback';

// Super Admin Control Center Components
import { AdminRouteGuard } from './admin/components/AdminRouteGuard';
import { AdminLayout } from './admin/layout/AdminLayout';
import { AdminOverviewPage } from './admin/pages/AdminOverviewPage';
import { AdminUsersPage } from './admin/pages/AdminUsersPage';
import { AdminUserDetailPage } from './admin/pages/AdminUserDetailPage';
import { AdminTypingPage } from './admin/pages/AdminTypingPage';
import { AdminAcademyPage } from './admin/pages/AdminAcademyPage';
import { AdminArcadePage } from './admin/pages/AdminArcadePage';
import { AdminLeaderboardPage } from './admin/pages/AdminLeaderboardPage';
import { AdminAnalyticsPage } from './admin/pages/AdminAnalyticsPage';
import { AdminAnnouncementsPage } from './admin/pages/AdminAnnouncementsPage';
import { AdminSettingsPage } from './admin/pages/AdminSettingsPage';
import { AdminDatabasePage } from './admin/pages/AdminDatabasePage';
import { AdminHealthPage } from './admin/pages/AdminHealthPage';
import { AdminAuditLogsPage } from './admin/pages/AdminAuditLogsPage';

// Lazy-loaded routes for performance & split chunks
const AuthPage = lazy(() => import('./pages/AuthPage').then((m) => ({ default: m.AuthPage })));
const AcademyPage = lazy(() => import('./pages/AcademyPage').then((m) => ({ default: m.AcademyPage })));
const WorkstationPage = lazy(() => import('./pages/WorkstationPage').then((m) => ({ default: m.WorkstationPage })));
const ArcadePage = lazy(() => import('./pages/ArcadePage').then((m) => ({ default: m.ArcadePage })));
const TelemetryPage = lazy(() => import('./pages/TelemetryPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const ThemesPage = lazy(() => import('./pages/ThemesPage'));

import { ClerkProvider } from '@clerk/react';
import { AuthenticateWithRedirectCallback } from '@clerk/react';
import { Footer } from './components/common/Footer';
import { getClerkPublishableKey, getClerkEnvironmentStatus } from './utils/clerkEnv';
import { PlatformConfigProvider, usePlatformConfig } from './context/PlatformConfigContext';
import { useAuth } from './context/AuthContext';
import { AnnouncementBanner } from './components/common/AnnouncementBanner';
import { MaintenanceScreen } from './components/common/MaintenanceScreen';
import { MaintenanceAlertBadge } from './components/common/MaintenanceAlertBadge';

const CLERK_PUBLISHABLE_KEY =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_CLERK_PUBLISHABLE_KEY
    ? getClerkPublishableKey(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)
    : '';

const clerkEnvStatus = getClerkEnvironmentStatus(CLERK_PUBLISHABLE_KEY);
const isClerkConfigured = Boolean(CLERK_PUBLISHABLE_KEY) && !clerkEnvStatus.validationError;

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

const AppShell = ({ children }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAuthRoute =
    location.pathname.startsWith('/login') ||
    location.pathname.startsWith('/register') ||
    location.pathname.startsWith('/reset-password') ||
    location.pathname.startsWith('/forgot-password') ||
    location.pathname.startsWith('/sso-callback');

  const { isMaintenanceMode } = usePlatformConfig();
  const { user, clerkUser } = useAuth();

  const isSuperAdmin = Boolean(
    user?.is_super_admin ||
    user?.role === 'SUPER_ADMIN' ||
    (user?.email && user.email.toLowerCase() === 'sina44n07@gmail.com') ||
    (clerkUser?.primaryEmailAddress?.emailAddress && clerkUser.primaryEmailAddress.emailAddress.toLowerCase() === 'sina44n07@gmail.com')
  );

  if (isAdminRoute) {
    return (
      <div className="min-h-screen bg-[#F7F7FC] text-[#29243B]">
        <Suspense fallback={<PageLoadingFallback />}>
          {children}
        </Suspense>
      </div>
    );
  }

  // When Maintenance Mode is active, restrict non-admin users from consumer features
  if (isMaintenanceMode && !isSuperAdmin && !isAuthRoute) {
    return <MaintenanceScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-200">
      {isMaintenanceMode && isSuperAdmin && <MaintenanceAlertBadge />}
      <Navbar />
      <AnnouncementBanner />
      <div className="flex-1">
        <Suspense fallback={<PageLoadingFallback />}>
          {children}
        </Suspense>
      </div>
      <Footer />
    </div>
  );
};

function App() {
  const router = (
    <ThemeProvider>
      <SoundProvider>
        <I18nProvider>
          <PlatformConfigProvider>
            <BrowserRouter>
              <AppShell>
              <Routes>
                {/* Public Pages */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login/*" element={<AuthPage mode="login" />} />
                <Route path="/login" element={<AuthPage mode="login" />} />
                <Route path="/register/*" element={<AuthPage mode="register" />} />
                <Route path="/register" element={<AuthPage mode="register" />} />
                <Route path="/forgot-password/*" element={<AuthPage mode="forgot" />} />
                <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
                <Route path="/reset-password/*" element={<AuthPage mode="reset" />} />
                <Route path="/reset-password" element={<AuthPage mode="reset" />} />
                <Route path="/reset-password/:token" element={<AuthPage mode="reset" />} />
                <Route
                  path="/sso-callback/*"
                  element={
                    isClerkConfigured ? (
                      <AuthenticateWithRedirectCallback
                        signInForceRedirectUrl="/workstation"
                        signUpForceRedirectUrl="/workstation"
                      />
                    ) : (
                      <Navigate to="/login" replace />
                    )
                  }
                />
                <Route
                  path="/sso-callback"
                  element={
                    isClerkConfigured ? (
                      <AuthenticateWithRedirectCallback
                        signInForceRedirectUrl="/workstation"
                        signUpForceRedirectUrl="/workstation"
                      />
                    ) : (
                      <Navigate to="/login" replace />
                    )
                  }
                />
                <Route path="/telemetry" element={<TelemetryPage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
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

                {/* Super Admin Control Center (Strict Server & Client Authentication Guard) */}
                <Route
                  path="/admin"
                  element={
                    <AdminRouteGuard>
                      <AdminLayout />
                    </AdminRouteGuard>
                  }
                >
                  <Route index element={<AdminOverviewPage />} />
                  <Route path="users" element={<AdminUsersPage />} />
                  <Route path="users/:userId" element={<AdminUserDetailPage />} />
                  <Route path="typing" element={<AdminTypingPage />} />
                  <Route path="academy" element={<AdminAcademyPage />} />
                  <Route path="arcade" element={<AdminArcadePage />} />
                  <Route path="leaderboard" element={<AdminLeaderboardPage />} />
                  <Route path="analytics" element={<AdminAnalyticsPage />} />
                  <Route path="announcements" element={<AdminAnnouncementsPage />} />
                  <Route path="settings" element={<AdminSettingsPage />} />
                  <Route path="database" element={<AdminDatabasePage />} />
                  <Route path="health" element={<AdminHealthPage />} />
                  <Route path="audit-logs" element={<AdminAuditLogsPage />} />
                </Route>

                {/* Aliases & Fallbacks */}
                <Route path="/curriculum" element={<Navigate to="/academy" replace />} />
                <Route path="*" element={<LandingPage />} />
              </Routes>
            </AppShell>
          </BrowserRouter>
          </PlatformConfigProvider>
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
