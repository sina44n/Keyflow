/**
 * Independent Vertical Sidebar Navigation — Lavender Executive Edition
 * Clean White + Soft Lavender + Deep Purple navigation with collapsible groups.
 */

import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Keyboard,
  GraduationCap,
  Gamepad2,
  Trophy,
  BarChart3,
  Bell,
  Settings,
  Database,
  Activity,
  History,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Shield,
  Crown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminSidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { user } = useAuth();

  const navigationGroups = [
    {
      label: 'OVERVIEW',
      items: [
        { name: 'Command Center', path: '/admin', icon: LayoutDashboard, exact: true },
        { name: 'Platform Analytics', path: '/admin/analytics', icon: BarChart3 },
        { name: 'System Health', path: '/admin/health', icon: Activity },
      ],
    },
    {
      label: 'USER MANAGEMENT',
      items: [
        { name: 'User Directory', path: '/admin/users', icon: Users },
        { name: 'Audit Logs', path: '/admin/audit-logs', icon: History },
      ],
    },
    {
      label: 'PLATFORM CONTROLS',
      items: [
        { name: 'Typing Controls', path: '/admin/typing', icon: Keyboard },
        { name: 'Academy Curriculum', path: '/admin/academy', icon: GraduationCap },
        { name: 'Arcade Engine', path: '/admin/arcade', icon: Gamepad2 },
        { name: 'Leaderboard Manager', path: '/admin/leaderboard', icon: Trophy },
      ],
    },
    {
      label: 'OPERATIONS',
      items: [
        { name: 'Announcements', path: '/admin/announcements', icon: Bell },
        { name: 'Platform Settings', path: '/admin/settings', icon: Settings },
        { name: 'Database Inspector', path: '/admin/database', icon: Database },
      ],
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out bg-white border-r border-[#E8E5F0] flex flex-col justify-between ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Header / Branding */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#E8E5F0] bg-white">
          {!isCollapsed ? (
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-[#F0EDFF] border border-[#E8E5F0] flex items-center justify-center text-[#7357D9]">
                <Crown className="w-4 h-4 text-[#7357D9]" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-wider text-[#29243B] font-mono">KEYFLOW</span>
                <span className="text-[10px] uppercase font-semibold text-[#7357D9] tracking-wider">Super Admin</span>
              </div>
            </div>
          ) : (
            <div className="mx-auto w-8 h-8 rounded-lg bg-[#F0EDFF] border border-[#E8E5F0] flex items-center justify-center text-[#7357D9]">
              <Crown className="w-4 h-4" />
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-[#77748B] hover:text-[#29243B] hover:bg-[#F0EDFF] transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Groups */}
        <div className="py-4 px-3 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)] scrollbar-thin scrollbar-thumb-slate-200">
          {navigationGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 text-[10px] font-bold text-[#9692A7] tracking-wider uppercase">
                  {group.label}
                </div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.exact}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                        isActive
                          ? 'bg-[#EEEAFE] text-[#51419A] border border-[#D6D0E8] font-semibold shadow-xs'
                          : 'text-[#77748B] hover:text-[#29243B] hover:bg-[#F7F7FC]'
                      }`
                    }
                    title={isCollapsed ? item.name : undefined}
                  >
                    <Icon className="w-4 h-4 shrink-0 text-[#7357D9]" />
                    {!isCollapsed && <span className="truncate">{item.name}</span>}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Footer / Account & Exit to KEYFLOW */}
      <div className="p-3 border-t border-[#E8E5F0] space-y-2 bg-white">
        {/* Back to Website Button */}
        <Link
          to="/workstation"
          className="flex items-center justify-center space-x-2 w-full py-2 px-3 rounded-lg bg-[#F0EDFF] hover:bg-[#EEEAFE] text-[#51419A] border border-[#D6D0E8] text-xs font-semibold transition-colors"
          title="Return to KEYFLOW typing workstation"
        >
          <ArrowLeft className="w-4 h-4 shrink-0 text-[#7357D9]" />
          {!isCollapsed && <span>Back to KEYFLOW</span>}
        </Link>

        {/* Admin Identity pill */}
        {!isCollapsed && (
          <div className="pt-2 px-2 flex items-center space-x-2 text-[11px] text-[#77748B]">
            <Shield className="w-3.5 h-3.5 text-[#7357D9] shrink-0" />
            <div className="truncate flex-1">
              <p className="text-[#29243B] font-semibold truncate">{user?.display_name || user?.username || 'Super Admin'}</p>
              <p className="text-[10px] text-[#9692A7] truncate">{user?.email || 'sina44n07@gmail.com'}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
