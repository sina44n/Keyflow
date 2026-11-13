/**
 * Module 11: Database & Infrastructure Inspector
 * Reports table sizes, row estimates, PostgreSQL engine version, and connection state.
 */

import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, RefreshCw, Loader2, Server } from 'lucide-react';
import { adminApi } from '../adminApi';
import { StatCard } from '../components/StatCard';

export const AdminDatabasePage = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDatabase = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getDatabaseHealth();
      setData(res.data?.database);
    } catch (err) {
      console.error('Failed to load database stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabase();
  }, []);

  const tables = data?.tables || {};

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between bg-white border border-[#E8E5F0] p-5 rounded-xl shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-[#29243B] flex items-center space-x-2">
            <Database className="w-5 h-5 text-emerald-600" />
            <span>Database & Infrastructure Inspector</span>
          </h2>
          <p className="text-xs text-[#77748B] mt-1">
            Authoritative schema row counts and PostgreSQL connection health.
          </p>
        </div>

        <button
          onClick={fetchDatabase}
          disabled={isLoading}
          className="p-2 rounded-lg bg-[#F0EDFF] hover:bg-[#EEEAFE] text-[#51419A] border border-[#D6D0E8] transition-colors shadow-sm"
          title="Refresh database telemetry"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#7357D9]' : 'text-[#7357D9]'}`} />
        </button>
      </div>

      {/* Engine Status Card */}
      <div className="rounded-xl bg-white border border-[#E8E5F0] p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-[#29243B]">Render PostgreSQL Production Database</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Connected
              </span>
            </div>
            <p className="text-xs text-[#77748B] mt-0.5 font-mono">
              Engine: {data?.engine || 'postgresql'} &bull; Status: {data?.status || 'ok'}
            </p>
          </div>
        </div>
      </div>

      {/* Table Records Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="User Records"
          value={isLoading ? '...' : tables.users?.toLocaleString() || '0'}
          subtext="auth_user table"
          color="indigo"
        />

        <StatCard
          title="Practice Sessions"
          value={isLoading ? '...' : tables.practice_sessions?.toLocaleString() || '0'}
          subtext="practice_sessions table"
          color="emerald"
        />

        <StatCard
          title="Curriculum Levels"
          value={isLoading ? '...' : tables.curriculum_levels?.toLocaleString() || '0'}
          subtext="curriculum_levels table"
          color="amber"
        />

        <StatCard
          title="Level Completions"
          value={isLoading ? '...' : tables.curriculum_progress?.toLocaleString() || '0'}
          subtext="curriculum_progress table"
          color="rose"
        />

        <StatCard
          title="Arcade Sessions"
          value={isLoading ? '...' : tables.game_sessions?.toLocaleString() || '0'}
          subtext="games_gamesession table"
          color="indigo"
        />

        <StatCard
          title="Practice Passages"
          value={isLoading ? '...' : tables.passages?.toLocaleString() || '0'}
          subtext="practice_passage table"
          color="emerald"
        />

        <StatCard
          title="Audit Trail Records"
          value={isLoading ? '...' : tables.audit_logs?.toLocaleString() || '0'}
          subtext="admin_audit_logs table"
          color="amber"
        />
      </div>
    </div>
  );
};

