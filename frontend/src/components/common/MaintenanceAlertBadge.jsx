/**
 * KEYFLOW Super Admin Maintenance Alert Badge
 * ============================================
 * Floats at the very top of consumer pages when Maintenance Mode is ON,
 * ensuring the Super Admin is always aware that normal users are restricted.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Settings, ArrowRight } from 'lucide-react';

export const MaintenanceAlertBadge = () => {
  return (
    <div className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white px-4 py-2 text-xs font-mono font-medium shadow-md flex items-center justify-between gap-3 z-50 select-none">
      <div className="flex items-center gap-2 min-w-0">
        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-200 animate-pulse" />
        <span className="truncate">
          <strong className="font-bold">Maintenance Mode Active:</strong> Normal users are blocked. You are viewing as Super Admin.
        </span>
      </div>

      <Link
        to="/admin/settings"
        className="px-3 py-1 rounded-lg bg-black/25 hover:bg-black/35 border border-white/20 text-white font-semibold transition-all flex items-center gap-1.5 shrink-0 text-[11px]"
      >
        <Settings className="w-3 h-3 text-amber-300" />
        <span>Manage Settings</span>
        <ArrowRight className="w-2.5 h-2.5" />
      </Link>
    </div>
  );
};

