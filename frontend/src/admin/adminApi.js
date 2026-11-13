/**
 * KEYFLOW Super Admin API Client
 * Wraps all /api/admin/* endpoints with authentication and error handling.
 */

import api from '../utils/api';

export const adminApi = {
  // Auth Verification
  getAuthStatus: () => api.get('/admin/auth/status/'),

  // Module 01: Overview / Command Center
  getOverviewMetrics: () => api.get('/admin/overview/'),

  // Module 02: User Management
  getUsers: (params = {}) => api.get('/admin/users/', { params }),
  getUserDetail: (userId) => api.get(`/admin/users/${userId}/`),
  updateUserRole: (userId, role) => api.post(`/admin/users/${userId}/action/`, { action: 'UPDATE_ROLE', role }),
  suspendUser: (userId, reason) => api.post(`/admin/users/${userId}/action/`, { action: 'SUSPEND', reason }),
  banUser: (userId, reason) => api.post(`/admin/users/${userId}/action/`, { action: 'BAN', reason }),
  restoreUser: (userId) => api.post(`/admin/users/${userId}/action/`, { action: 'RESTORE' }),
  softDeleteUser: (userId) => api.post(`/admin/users/${userId}/action/`, { action: 'DELETE' }),
  resetUserStats: (userId) => api.post(`/admin/users/${userId}/action/`, { action: 'RESET_STATS' }),

  // Module 03: Typing Controls
  getTypingConfig: () => api.get('/admin/typing/config/'),
  updateTypingConfig: (data) => api.put('/admin/typing/config/', data),
  getPassages: (params = {}) => api.get('/admin/typing/passages/', { params }),
  createPassage: (data) => api.post('/admin/typing/passages/', data),
  updatePassage: (passageId, data) => api.put(`/admin/typing/passages/${passageId}/`, data),
  deletePassage: (passageId) => api.delete(`/admin/typing/passages/${passageId}/`),
  getUserTypingRestrictions: (userId) => api.get(`/admin/typing/restrictions/${userId}/`),
  updateUserTypingRestrictions: (userId, data) => api.put(`/admin/typing/restrictions/${userId}/`, data),

  // Module 04: Academy Management
  getAcademyCurriculum: () => api.get('/admin/academy/curriculum/'),
  toggleLevelStatus: (levelId, isPublished) => api.put(`/admin/academy/level/${levelId}/`, { is_published: isPublished }),

  // Module 05: Arcade Management
  getArcadeOverview: () => api.get('/admin/arcade/games/'),

  // Module 06: Leaderboard Management
  getLeaderboardAdmin: (params = {}) => api.get('/admin/leaderboard/', { params }),
  recalculateLeaderboard: () => api.post('/admin/leaderboard/recalculate/'),

  // Module 07: Analytics
  getPlatformAnalytics: (range = '30d') => api.get('/admin/analytics/', { params: { range } }),

  // Module 08: Announcements
  getAnnouncements: () => api.get('/admin/announcements/'),
  createAnnouncement: (data) => api.post('/admin/announcements/', data),
  toggleAnnouncement: (id, isActive) => api.put(`/admin/announcements/${id}/`, { is_active: isActive }),
  deleteAnnouncement: (id) => api.delete(`/admin/announcements/${id}/`),

  // Module 09, 10, 11, 12: Settings, Security, Database, Health
  getPlatformSettings: () => api.get('/admin/settings/'),
  updatePlatformSettings: (data) => api.put('/admin/settings/', data),
  getDatabaseHealth: () => api.get('/admin/database/'),
  getSystemHealth: () => api.get('/admin/health/'),

  // Module 13: Audit Logs
  getAuditLogs: (params = {}) => api.get('/admin/audit-logs/', { params }),
};
