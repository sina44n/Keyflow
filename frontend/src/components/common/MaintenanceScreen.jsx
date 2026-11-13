/**
 * KEYFLOW Maintenance Mode Screen
 * ================================
 * Full-screen consumer maintenance screen displayed when maintenance mode is active.
 * Renders the administrator's custom message, animated diagnostics, and owner recovery access.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { usePlatformConfig } from '../../context/PlatformConfigContext';
import { Wrench, RefreshCw, Shield, Keyboard, ArrowRight } from 'lucide-react';

export const MaintenanceScreen = () => {
  const { maintenanceMessage, refreshConfig, isLoading } = usePlatformConfig();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-[#0c0d12] text-white relative overflow-hidden select-none">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#F95700]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Brand Header */}
      <div className="flex items-center gap-2.5 mb-8 z-10">
        <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center shadow-lg shadow-orange-500/20">
          <Keyboard className="w-4 h-4 text-orange-400" />
        </div>
        <span className="font-mono text-base font-black tracking-widest uppercase text-white">
          KEY<span className="text-orange-500">FLOW</span>
        </span>
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-lg bg-[#14161f] border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-2xl text-center space-y-6">
        {/* Animated Badge Icon */}
        <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 flex items-center justify-center">
          <Wrench className="w-7 h-7 text-amber-400 animate-pulse" />
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 ring-4 ring-[#14161f]" />
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <div className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 font-mono text-[11px] uppercase tracking-wider font-semibold">
            Scheduled Platform Maintenance
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            System Upgrades in Progress
          </h1>
        </div>

        {/* Custom Message from Super Admin */}
        <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 text-xs sm:text-sm text-gray-300 leading-relaxed font-mono">
          {maintenanceMessage}
        </div>

        {/* Live Status indicator */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>PostgreSQL & Telemetry Services Under Optimization</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={refreshConfig}
            disabled={isLoading}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-orange-400' : ''}`} />
            <span>Check Platform Status</span>
          </button>

          <Link
            to="/admin"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-xs font-semibold text-orange-300 transition-all flex items-center justify-center gap-2"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin Recovery</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Footer Info */}
      <p className="mt-8 text-xs text-gray-500 font-mono z-10">
        KEYFLOW Precision Typing Engine • All user statistics & practice records safely preserved.
      </p>
    </div>
  );
};
