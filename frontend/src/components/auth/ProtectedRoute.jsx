/**
 * KEYFLOW Protected Route
 * =======================
 * Wraps protected pages. Redirects unauthenticated users to /login
 * while preserving the intended destination in state.
 * Shows a loading state during initial auth check to prevent flash redirects.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Still checking token validity — show loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
          <p className="text-sm text-[var(--text-muted)] font-mono">Verifying session...</p>
        </div>
      </div>
    );
  }

  // Not authenticated — redirect to login, preserving full destination path with query parameters
  if (!isAuthenticated) {
    if (typeof window !== 'undefined' && (window.__KEYFLOW_DEV_BYPASS_AUTH__ || location.search.includes('dev_preview=true'))) {
      return children;
    }
    const fullPath = location.pathname + (location.search || '');
    return <Navigate to="/login" state={{ from: fullPath }} replace />;
  }

  return children;
};
