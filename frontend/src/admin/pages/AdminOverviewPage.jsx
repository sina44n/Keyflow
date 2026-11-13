/**
 * Module 01: Super Admin Command Center / Overview Page
 * High-density operational dashboard featuring key platform KPIs, real-time activity stream,
 * platform quick actions, and health monitors.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Keyboard,
  Trophy,
  GraduationCap,
  Gamepad2,
  Activity,
  Flame,
  AlertTriangle,
  RefreshCw,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Settings,
} from 'lucide-react';
import { adminApi } from '../adminApi';
import { StatCard } from '../components/StatCard';
import { ConfirmModal } from '../components/ConfirmModal';

export const AdminOverviewPage = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Maintenance Toggle State
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isUpdatingConfig, setIsUpdatingConfig] = useState(false);

  const fetchOverview = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.getOverviewMetrics();
      setData(res.data);
    } catch (err) {
      console.error('Failed to load admin overview metrics:', err);
      setError('Unable to fetch platform metrics from the backend. Verify database connection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleToggleMaintenance = async () => {
    if (!data?.platform_config) return;
    setIsUpdatingConfig(true);
    const newMaintenanceState = !data.platform_config.maintenance_mode;
    try {
      await adminApi.updateTypingConfig({
        maintenance_mode: newMaintenanceState,
      });
      setData((prev) => ({
        ...prev,
        platform_config: {
          ...prev.platform_config,
          maintenance_mode: newMaintenanceState,
        },
      }));
      setIsMaintenanceModalOpen(false);
    } catch (err) {
      alert('Failed to update maintenance mode setting.');
    } finally {
      setIsUpdatingConfig(false);
    }
  };

  const kpis = data?.kpis || {};
  const platformConfig = data?.platform_config || {};
  const activities = data?.recent_activities || [];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner & Quick Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-[#E8E5F0] p-5 rounded-xl shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-[#29243B] flex items-center space-x-2">
            <span>Platform Command Center</span>
            {platformConfig.maintenance_mode && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                MAINTENANCE MODE ACTIVE
              </span>
            )}
          </h2>
          <p className="text-xs text-[#77748B] mt-1">
            Real-time analytics, user telemetry, and operational controls for KEYFLOW production.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={() => setIsMaintenanceModalOpen(true)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all shadow-sm ${
              platformConfig.maintenance_mode
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-[#F0EDFF] hover:bg-[#EEEAFE] text-[#51419A] border border-[#D6D0E8]'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>{platformConfig.maintenance_mode ? 'Disable Maintenance' : 'Toggle Maintenance'}</span>
          </button>

          <button
            onClick={fetchOverview}
            disabled={isLoading}
            className="p-2 rounded-lg bg-[#F0EDFF] hover:bg-[#EEEAFE] text-[#51419A] border border-[#D6D0E8] transition-colors shadow-sm"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#7357D9]' : 'text-[#7357D9]'}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between shadow-sm">
          <span>{error}</span>
          <button onClick={fetchOverview} className="underline font-semibold hover:text-rose-900">
            Retry
          </button>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={isLoading ? '...' : kpis.total_users?.toLocaleString() || '0'}
          subtext={`+${kpis.new_users_today || 0} registered today`}
          icon={Users}
          trend={kpis.active_today ? `${kpis.active_today} active today` : undefined}
          trendDirection="up"
          color="indigo"
        />

        <StatCard
          title="Practice Sessions"
          value={isLoading ? '...' : kpis.total_sessions?.toLocaleString() || '0'}
          subtext={`+${kpis.sessions_today || 0} completed today`}
          icon={Keyboard}
          color="emerald"
        />

        <StatCard
          title="Avg Platform WPM"
          value={isLoading ? '...' : `${kpis.avg_wpm || 0} WPM`}
          subtext={`Platform record: ${kpis.max_wpm || 0} WPM`}
          icon={Flame}
          color="amber"
        />

        <StatCard
          title="Academy Completions"
          value={isLoading ? '...' : kpis.completed_lessons?.toLocaleString() || '0'}
          subtext={`Across ${kpis.total_levels || 120} curriculum levels`}
          icon={GraduationCap}
          color="rose"
        />
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Arcade Activity */}
        <div className="rounded-xl bg-white border border-[#E8E5F0] p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#77748B] uppercase tracking-wider">Arcade Engagement</span>
            <Gamepad2 className="w-5 h-5 text-[#7357D9]" />
          </div>
          <div className="my-4">
            <span className="text-3xl font-mono font-bold text-[#29243B]">{kpis.total_games_played || 0}</span>
            <p className="text-xs text-[#77748B] mt-1">Total 3D racing & stickman sessions recorded</p>
          </div>
          <Link
            to="/admin/arcade"
            className="text-xs font-semibold text-[#7357D9] hover:text-[#51419A] flex items-center space-x-1"
          >
            <span>Inspect arcade stats</span>
            <span>&rarr;</span>
          </Link>
        </div>

        {/* Database & Infrastructure */}
        <div className="rounded-xl bg-white border border-[#E8E5F0] p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#77748B] uppercase tracking-wider">PostgreSQL Engine</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="my-4">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-base font-bold text-[#29243B]">Online & Healthy</span>
            </div>
            <p className="text-xs text-[#77748B] mt-1">Render Managed PostgreSQL</p>
          </div>
          <Link
            to="/admin/database"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1"
          >
            <span>View table records</span>
            <span>&rarr;</span>
          </Link>
        </div>

        {/* Clerk Auth Integration */}
        <div className="rounded-xl bg-white border border-[#E8E5F0] p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#77748B] uppercase tracking-wider">Clerk Authentication</span>
            <ShieldCheck className="w-5 h-5 text-[#7357D9]" />
          </div>
          <div className="my-4">
            <span className="text-base font-bold text-[#29243B]">JWT / JWKS Active</span>
            <p className="text-xs text-[#77748B] mt-1">Owner verified: sina44n07@gmail.com</p>
          </div>
          <Link
            to="/admin/users"
            className="text-xs font-semibold text-[#7357D9] hover:text-[#51419A] flex items-center space-x-1"
          >
            <span>Manage user directory</span>
            <span>&rarr;</span>
          </Link>
        </div>
      </div>

      {/* Real-time Activity Stream & Quick Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <div className="lg:col-span-2 rounded-xl bg-white border border-[#E8E5F0] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-[#EFEDF5] pb-3">
            <h3 className="text-sm font-bold text-[#29243B] flex items-center space-x-2">
              <Activity className="w-4 h-4 text-[#7357D9]" />
              <span>Real-Time Activity Feed</span>
            </h3>
            <span className="text-[11px] text-[#77748B]">Live platform events</span>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-[#9692A7]">Loading live activity stream...</div>
            ) : activities.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#9692A7]">No recent activity detected.</div>
            ) : (
              activities.map((act) => (
                <div
                  key={act.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#F7F7FC] border border-[#EFEDF5] hover:border-[#D6D0E8] hover:bg-[#F0EDFF]/30 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-[#F0EDFF] border border-[#E8E5F0] flex items-center justify-center text-xs font-bold text-[#51419A]">
                      {act.type === 'USER_REGISTRATION' ? 'U' : 'W'}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#29243B]">{act.title}</p>
                      <p className="text-[10px] text-[#77748B]">
                        {act.user} &bull; {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-[#9692A7]">
                    {new Date(act.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Operations Sidebar */}
        <div className="rounded-xl bg-white border border-[#E8E5F0] p-5 shadow-sm space-y-4">
          <div className="border-b border-[#EFEDF5] pb-3">
            <h3 className="text-sm font-bold text-[#29243B]">Administrative Shortcuts</h3>
            <p className="text-xs text-[#77748B] mt-0.5">Instant operational access</p>
          </div>

          <div className="space-y-2">
            <Link
              to="/admin/users"
              className="flex items-center justify-between p-3 rounded-lg bg-[#F0EDFF] hover:bg-[#EEEAFE] text-xs font-medium text-[#29243B] border border-[#D6D0E8] transition-all"
            >
              <div className="flex items-center space-x-2.5">
                <Users className="w-4 h-4 text-[#7357D9]" />
                <span>Search & Filter Users</span>
              </div>
              <span className="text-[#7357D9] font-mono text-[11px]">&rarr;</span>
            </Link>

            <Link
              to="/admin/typing"
              className="flex items-center justify-between p-3 rounded-lg bg-[#F0EDFF] hover:bg-[#EEEAFE] text-xs font-medium text-[#29243B] border border-[#D6D0E8] transition-all"
            >
              <div className="flex items-center space-x-2.5">
                <Keyboard className="w-4 h-4 text-emerald-600" />
                <span>Manage Typing Durations</span>
              </div>
              <span className="text-[#7357D9] font-mono text-[11px]">&rarr;</span>
            </Link>

            <Link
              to="/admin/announcements"
              className="flex items-center justify-between p-3 rounded-lg bg-[#F0EDFF] hover:bg-[#EEEAFE] text-xs font-medium text-[#29243B] border border-[#D6D0E8] transition-all"
            >
              <div className="flex items-center space-x-2.5">
                <Activity className="w-4 h-4 text-amber-600" />
                <span>Create Platform Banner</span>
              </div>
              <span className="text-[#7357D9] font-mono text-[11px]">&rarr;</span>
            </Link>

            <Link
              to="/admin/audit-logs"
              className="flex items-center justify-between p-3 rounded-lg bg-[#F0EDFF] hover:bg-[#EEEAFE] text-xs font-medium text-[#29243B] border border-[#D6D0E8] transition-all"
            >
              <div className="flex items-center space-x-2.5">
                <Clock className="w-4 h-4 text-rose-500" />
                <span>Audit Action Trail</span>
              </div>
              <span className="text-[#7357D9] font-mono text-[11px]">&rarr;</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Maintenance Confirmation Modal */}
      <ConfirmModal
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
        onConfirm={handleToggleMaintenance}
        title={platformConfig.maintenance_mode ? 'Disable Maintenance Mode?' : 'Activate Maintenance Mode?'}
        message={
          platformConfig.maintenance_mode
            ? 'Disabling maintenance mode will restore standard user access to all typing practice, academy, and arcade features.'
            : 'Activating maintenance mode will display a platform maintenance banner to standard users. Admins retain full access.'
        }
        confirmText={platformConfig.maintenance_mode ? 'Disable Maintenance' : 'Activate Maintenance'}
        isDangerous={!platformConfig.maintenance_mode}
        isLoading={isUpdatingConfig}
      />
    </div>
  );
};

