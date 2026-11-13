/**
 * KEYFLOW Platform Announcement Banner
 * =====================================
 * Renders live administrative announcements on consumer website pages.
 * Supports dismissal per announcement ID, color-coded alert levels,
 * and responsive layout matching the KEYFLOW design system.
 */

import React from 'react';
import { usePlatformConfig } from '../../context/PlatformConfigContext';
import {
  Info,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  X,
  Bell,
} from 'lucide-react';

const TYPE_CONFIG = {
  INFO: {
    bg: 'bg-indigo-950/40 border-indigo-500/30 text-indigo-200',
    badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    icon: Info,
    iconColor: 'text-indigo-400',
  },
  WARNING: {
    bg: 'bg-amber-950/40 border-amber-500/30 text-amber-200',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
  },
  CRITICAL: {
    bg: 'bg-rose-950/50 border-rose-500/40 text-rose-200',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    icon: AlertOctagon,
    iconColor: 'text-rose-400',
  },
  ALERT: {
    bg: 'bg-rose-950/50 border-rose-500/40 text-rose-200',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    icon: AlertOctagon,
    iconColor: 'text-rose-400',
  },
  SUCCESS: {
    bg: 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    icon: CheckCircle2,
    iconColor: 'text-emerald-400',
  },
};

export const AnnouncementBanner = () => {
  const { activeAnnouncements, dismissAnnouncement } = usePlatformConfig();

  if (!activeAnnouncements || activeAnnouncements.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-2 px-3 sm:px-6 pt-3 select-none">
      {activeAnnouncements.map((ann) => {
        const typeStyle = TYPE_CONFIG[ann.type?.toUpperCase()] || TYPE_CONFIG.INFO;
        const IconComponent = typeStyle.icon;

        return (
          <div
            key={ann.id}
            className={`w-full max-w-7xl mx-auto rounded-xl p-3 sm:p-3.5 border backdrop-blur-md shadow-lg transition-all animate-in fade-in duration-200 flex items-start sm:items-center justify-between gap-3 ${typeStyle.bg}`}
            role="alert"
          >
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="p-1 rounded-lg bg-black/20 shrink-0 mt-0.5 sm:mt-0">
                <IconComponent className={`w-4 h-4 ${typeStyle.iconColor}`} />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5 min-w-0">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider border shrink-0 w-fit ${typeStyle.badge}`}
                >
                  {ann.type}
                </span>

                <div className="flex items-baseline gap-2 min-w-0">
                  <span className="font-semibold text-xs sm:text-sm text-white shrink-0">
                    {ann.title}
                  </span>
                  <span className="text-xs opacity-90 truncate font-mono">
                    {ann.message}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => dismissAnnouncement(ann.id)}
              className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
              title="Dismiss announcement"
              aria-label="Dismiss announcement"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
