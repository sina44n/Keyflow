/**
 * Independent Top Header for KEYFLOW Super Admin Control Center.
 * Houses global command search trigger, live system health indicators, and owner profile.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Crown,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../adminApi';

export const AdminHeader = ({ title = 'Command Center' }) => {
  const { user } = useAuth();
  const [dbStatus, setDbStatus] = useState('checking');

  useEffect(() => {
    let isMounted = true;
    adminApi.getDatabaseHealth()
      .then((res) => {
        if (isMounted && res?.data?.database?.status === 'ok') {
          setDbStatus('healthy');
        } else if (isMounted) {
          setDbStatus('warning');
        }
      })
      .catch(() => {
        if (isMounted) setDbStatus('warning');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <header className="h-16 bg-white/95 backdrop-blur border-b border-[#E8E5F0] px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Left: Page Title / Breadcrumbs */}
      <div className="flex items-center space-x-3">
        <h1 className="text-base font-semibold text-[#29243B] tracking-tight">{title}</h1>
      </div>

      {/* Right: Actions, Health & Owner Profile */}
      <div className="flex items-center space-x-4">
        {/* Live System Health Badge */}
        <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-[#F0EDFF] border border-[#E8E5F0] text-[11px] font-medium text-[#51419A]">
          <span
            className={`w-2 h-2 rounded-full ${
              dbStatus === 'healthy'
                ? 'bg-emerald-500 animate-pulse'
                : dbStatus === 'warning'
                ? 'bg-amber-500'
                : 'bg-[#9692A7]'
            }`}
          />
          <span className="hidden sm:inline">Production Postgres</span>
          <span className="text-[#77748B] font-mono text-[10px] hidden md:inline">v1.0</span>
        </div>

        {/* Quick Link to Consumer App */}
        <Link
          to="/workstation"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#F0EDFF] hover:bg-[#EEEAFE] text-[#51419A] hover:text-[#29243B] border border-[#D6D0E8] text-xs font-medium transition-colors"
          title="Open typing practice workstation"
        >
          <span>View Site</span>
          <ExternalLink className="w-3.5 h-3.5 text-[#7357D9]" />
        </Link>

        {/* Owner Profile Badge */}
        <div className="flex items-center space-x-2 pl-2 border-l border-[#E8E5F0]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#7357D9] to-[#9079EC] p-[1.5px] flex items-center justify-center shadow-sm">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-xs font-bold text-[#51419A]">
              {user?.display_name ? user.display_name.charAt(0).toUpperCase() : 'S'}
            </div>
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-semibold text-[#29243B] leading-tight flex items-center space-x-1">
              <span>{user?.display_name || user?.username || 'Sinan'}</span>
              <Crown className="w-3 h-3 text-amber-500" />
            </span>
            <span className="text-[10px] text-[#7357D9] font-mono font-medium">Platform Owner</span>
          </div>
        </div>
      </div>
    </header>
  );
};

