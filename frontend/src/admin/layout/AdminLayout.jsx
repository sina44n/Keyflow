/**
 * Master Enterprise Layout for KEYFLOW Super Admin Control Center.
 * Houses collapsible vertical sidebar, top header, and dedicated Lavender Executive canvas.
 */

import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import '../adminTheme.css';

const routeTitleMap = {
  '/admin': 'Command Center & Overview',
  '/admin/users': 'User Management & Directory',
  '/admin/typing': 'Typing Control Center',
  '/admin/academy': 'Academy Curriculum Management',
  '/admin/arcade': 'Arcade Engine & High Scores',
  '/admin/leaderboard': 'Global Leaderboard Administration',
  '/admin/analytics': 'Platform Analytics & Telemetry',
  '/admin/announcements': 'Platform Announcements & Banners',
  '/admin/settings': 'Platform & Website Settings',
  '/admin/database': 'Database & Infrastructure Inspector',
  '/admin/health': 'System Health & Runtime Probes',
  '/admin/audit-logs': 'Immutable Administrative Audit Logs',
};

export const AdminLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const currentTitle =
    routeTitleMap[location.pathname] ||
    (location.pathname.startsWith('/admin/users/') ? 'User Profile & Telemetry Deep Dive' : 'Super Admin Control Center');

  return (
    <div className="min-h-screen bg-[#F7F7FC] text-[#29243B] flex font-sans selection:bg-[#7357D9] selection:text-white">
      {/* Vertical Collapsible Sidebar */}
      <AdminSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          isCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {/* Top Header */}
        <AdminHeader title={currentTitle} />

        {/* Page Content Container */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

