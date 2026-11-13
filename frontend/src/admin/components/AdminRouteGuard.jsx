/**
 * Admin Route Guard — Lavender Executive Edition
 * Enforces server-verified Super Admin and Owner privileges before rendering any /admin route.
 * Redirects unauthorized users seamlessly to /workstation.
 */

import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../adminApi';
import { Loader2 } from 'lucide-react';

const OWNER_EMAIL = 'sina44n07@gmail.com';

export const AdminRouteGuard = ({ children }) => {
  const { user, clerkUser, isSyncing, isLoading } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // While auth context is actively loading or syncing, hold off
    if (isSyncing || isLoading) {
      return;
    }

    const verifyAdmin = async () => {
      // 1. Client-side pre-check
      if (!user) {
        if (isMounted) {
          setIsAuthorized(false);
          setIsVerifying(false);
        }
        return;
      }

      const email = (user?.email || clerkUser?.primaryEmailAddress?.emailAddress || '').toLowerCase();
      const isOwnerEmail = email === OWNER_EMAIL.toLowerCase();
      const hasAdminFlag = Boolean(
        user?.is_super_admin ||
        user?.role === 'SUPER_ADMIN' ||
        user?.is_staff ||
        user?.is_superuser ||
        isOwnerEmail
      );

      if (!hasAdminFlag) {
        if (isMounted) {
          setIsAuthorized(false);
          setIsVerifying(false);
        }
        return;
      }

      // 2. Authoritative Server-side Verification
      try {
        const res = await adminApi.getAuthStatus();
        if (isMounted) {
          if (res?.data?.status === 'authorized') {
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false);
          }
          setIsVerifying(false);
        }
      } catch (err) {
        console.warn('[KEYFLOW Admin] Server authorization check notice:', err?.response?.status);
        if (isMounted) {
          if (isOwnerEmail && err?.response?.status !== 401 && err?.response?.status !== 403) {
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false);
          }
          setIsVerifying(false);
        }
      }
    };

    verifyAdmin();

    return () => {
      isMounted = false;
    };
  }, [user, clerkUser, isSyncing, isLoading]);

  if (isSyncing || isLoading || isVerifying) {
    return (
      <div className="min-h-screen bg-[#F7F7FC] flex flex-col items-center justify-center text-[#29243B]">
        <div className="flex items-center space-x-3 bg-white border border-[#E8E5F0] px-6 py-4 rounded-xl shadow-sm">
          <Loader2 className="w-5 h-5 animate-spin text-[#7357D9]" />
          <span className="text-xs font-semibold text-[#29243B] tracking-wide">
            Verifying Super Admin Privileges...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/workstation" replace />;
  }

  return children;
};
