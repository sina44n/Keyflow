/**
 * Module 02: Individual User Profile & Telemetry Deep Dive
 * Complete forensic inspection of a single typist: practice records, academy progress,
 * and individual typing restrictions.
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Shield,
  Keyboard,
  Trophy,
  GraduationCap,
  Gamepad2,
  Clock,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Crown,
  Loader2,
} from 'lucide-react';
import { adminApi } from '../adminApi';
import { StatCard } from '../components/StatCard';
import { RoleBadge, StatusBadge } from '../components/Badge';
import { ConfirmModal } from '../components/ConfirmModal';

const OWNER_EMAIL = 'sina44n07@gmail.com';

export const AdminUserDetailPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reset Stats Modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const fetchUserDetail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.getUserDetail(userId);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load user details:', err);
      setError('User not found or unable to fetch details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserDetail();
    }
  }, [userId]);

  const handleResetStats = async () => {
    setIsResetting(true);
    try {
      await adminApi.resetUserStats(userId);
      setIsResetModalOpen(false);
      fetchUserDetail();
    } catch (err) {
      alert('Failed to reset statistics.');
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3 text-[#77748B]">
        <Loader2 className="w-8 h-8 animate-spin text-[#7357D9]" />
        <span className="text-xs">Loading user profile and telemetry...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-12 text-center space-y-4">
        <p className="text-rose-600 text-sm font-semibold">{error || 'User not found.'}</p>
        <Link
          to="/admin/users"
          className="inline-flex items-center space-x-2 text-xs text-[#7357D9] hover:text-[#51419A] font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to User Directory</span>
        </Link>
      </div>
    );
  }

  const { user, metrics, recent_sessions, typing_restrictions } = data;
  const isOwner = user?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Back Link & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Link
          to="/admin/users"
          className="flex items-center space-x-2 text-xs font-semibold text-[#77748B] hover:text-[#29243B] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to User Directory</span>
        </Link>

        {!isOwner && (
          <button
            onClick={() => setIsResetModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center space-x-2 transition-colors shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            <span>Reset User Statistics</span>
          </button>
        )}
      </div>

      {/* Profile Overview Card */}
      <div className="rounded-xl bg-white border border-[#E8E5F0] p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-[#F0EDFF] border border-[#E8E5F0] flex items-center justify-center font-bold text-2xl text-[#51419A] shadow-sm">
            {user.profile?.display_name ? user.profile.display_name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-[#29243B] tracking-tight">{user.profile?.display_name || user.username}</h2>
              {isOwner && <Crown className="w-4 h-4 text-amber-500" title="Platform Owner" />}
              <RoleBadge role={user.role} />
              <StatusBadge status={user.status} />
            </div>
            <p className="text-xs text-[#77748B] font-mono">@{user.username} &bull; {user.email}</p>
            <p className="text-[11px] text-[#9692A7]">
              Clerk ID: <span className="font-mono text-[#77748B]">{user.clerk_id || 'Not linked'}</span> &bull; Joined{' '}
              {new Date(user.date_joined).toLocaleDateString()}
            </p>
          </div>
        </div>

        {isOwner && (
          <div className="px-4 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800 flex items-center space-x-2">
            <Crown className="w-4 h-4 text-amber-500" />
            <span>Immutable Platform Owner Account</span>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Tests Taken"
          value={metrics.total_tests?.toLocaleString() || '0'}
          subtext="Practice sessions completed"
          icon={Keyboard}
          color="indigo"
        />

        <StatCard
          title="Average WPM"
          value={`${metrics.avg_wpm || 0} WPM`}
          subtext={`Personal best: ${metrics.best_wpm || 0} WPM`}
          icon={Trophy}
          color="emerald"
        />

        <StatCard
          title="Average Accuracy"
          value={`${metrics.avg_accuracy || 0}%`}
          subtext="Authentic gross/net precision"
          icon={CheckCircle2}
          color="amber"
        />

        <StatCard
          title="Academy Units"
          value={metrics.completed_academy_lessons?.toLocaleString() || '0'}
          subtext="Lessons mastered"
          icon={GraduationCap}
          color="rose"
        />
      </div>

      {/* Recent Typing Sessions Table */}
      <div className="rounded-xl bg-white border border-[#E8E5F0] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-[#EFEDF5] pb-3">
          <h3 className="text-sm font-bold text-[#29243B] flex items-center space-x-2">
            <Clock className="w-4 h-4 text-[#7357D9]" />
            <span>Recent Practice Sessions</span>
          </h3>
          <span className="text-[11px] text-[#77748B]">Latest 20 recorded sessions</span>
        </div>

        {recent_sessions.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#9692A7]">No practice sessions recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#EFEDF5] text-[10px] font-semibold text-[#77748B] uppercase tracking-wider bg-[#F7F7FC]">
                  <th className="py-2.5 px-3">Session ID</th>
                  <th className="py-2.5 px-3">Net WPM</th>
                  <th className="py-2.5 px-3">Gross WPM</th>
                  <th className="py-2.5 px-3">Accuracy</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEDF5]">
                {recent_sessions.map((sess) => (
                  <tr key={sess.id} className="hover:bg-[#F9F9FD] text-[#29243B] transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[#9692A7]">#{sess.id}</td>
                    <td className="py-2.5 px-3 font-bold font-mono text-emerald-600">{sess.net_wpm}</td>
                    <td className="py-2.5 px-3 font-mono text-[#77748B]">{sess.gross_wpm}</td>
                    <td className="py-2.5 px-3 font-mono text-amber-600">{sess.accuracy}%</td>
                    <td className="py-2.5 px-3 font-mono text-[#77748B]">{sess.duration_seconds}s</td>
                    <td className="py-2.5 px-3 font-mono text-[#9692A7] text-right">
                      {new Date(sess.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Resetting Stats */}
      <ConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleResetStats}
        title="Reset All User Typing Statistics?"
        message={`Are you sure you want to permanently clear all practice history, academy progress, and arcade records for @${user.username}? This action is irreversible.`}
        confirmText="Reset Statistics"
        confirmPhrase="RESET"
        isDangerous={true}
        isLoading={isResetting}
      />
    </div>
  );
};

