/**
 * Module 02: Complete User Management Directory
 * Searchable, filterable enterprise data table of all registered users with administrative actions.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  Shield,
  Clock,
  AlertOctagon,
  Trash2,
  ExternalLink,
  Crown,
  CheckCircle2,
  RefreshCw,
  MoreVertical,
} from 'lucide-react';
import { adminApi } from '../adminApi';
import { RoleBadge, StatusBadge } from '../components/Badge';
import { DataTable } from '../components/DataTable';
import { ConfirmModal } from '../components/ConfirmModal';

const OWNER_EMAIL = 'sina44n07@gmail.com';

export const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });

  // Action Modal State
  const [activeUser, setActiveUser] = useState(null);
  const [modalAction, setModalAction] = useState(null); // 'SUSPEND' | 'BAN' | 'RESTORE' | 'DELETE' | 'ROLE'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionReason, setActionReason] = useState('');
  const [targetRole, setTargetRole] = useState('ADMIN');
  const [isExecuting, setIsExecuting] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getUsers({
        search: searchTerm,
        role: selectedRole,
        status: selectedStatus,
        page,
      });
      const data = res.data;
      setUsers(data.results || data);
      if (data.count !== undefined) {
        setPagination({
          page,
          total: data.count,
          totalPages: Math.ceil(data.count / 20) || 1,
          from: (page - 1) * 20 + 1,
          to: Math.min(page * 20, data.count),
        });
      }
    } catch (err) {
      console.error('Failed to load users directory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, selectedRole, selectedStatus, page]);

  const handleOpenAction = (user, action) => {
    setActiveUser(user);
    setModalAction(action);
    setActionReason('');
    if (action === 'ROLE') {
      setTargetRole(user.role === 'ADMIN' ? 'USER' : 'ADMIN');
    }
    setIsModalOpen(true);
  };

  const handleExecuteAction = async () => {
    if (!activeUser || !modalAction) return;
    setIsExecuting(true);
    try {
      if (modalAction === 'ROLE') {
        await adminApi.updateUserRole(activeUser.id, targetRole);
      } else if (modalAction === 'SUSPEND') {
        await adminApi.suspendUser(activeUser.id, actionReason);
      } else if (modalAction === 'BAN') {
        await adminApi.banUser(activeUser.id, actionReason);
      } else if (modalAction === 'RESTORE') {
        await adminApi.restoreUser(activeUser.id);
      } else if (modalAction === 'DELETE') {
        await adminApi.softDeleteUser(activeUser.id);
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed.');
    } finally {
      setIsExecuting(false);
    }
  };

  const columns = [
    {
      title: 'User / Typist',
      key: 'username',
      render: (u) => {
        const isOwner = u.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();
        return (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-[#F0EDFF] border border-[#E8E5F0] flex items-center justify-center font-bold text-xs text-[#51419A]">
              {u.profile?.display_name ? u.profile.display_name.charAt(0).toUpperCase() : u.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-semibold text-[#29243B]">{u.profile?.display_name || u.username}</span>
                {isOwner && <Crown className="w-3.5 h-3.5 text-amber-500" title="Platform Owner" />}
              </div>
              <span className="text-[10px] text-[#77748B]">@{u.username}</span>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Email',
      key: 'email',
      render: (u) => (
        <div className="flex items-center space-x-1.5 font-mono text-[11px] text-[#29243B]">
          <span>{u.email}</span>
          {u.is_email_verified && <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" title="Verified" />}
        </div>
      ),
    },
    {
      title: 'Role',
      key: 'role',
      render: (u) => <RoleBadge role={u.role} />,
    },
    {
      title: 'Status',
      key: 'status',
      render: (u) => <StatusBadge status={u.status} />,
    },
    {
      title: 'Joined Date',
      key: 'date_joined',
      render: (u) => (
        <span className="text-[11px] font-mono text-[#77748B]">
          {new Date(u.date_joined).toLocaleDateString()}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (u) => {
        const isOwner = u.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();

        return (
          <div className="flex items-center justify-end space-x-2">
            <Link
              to={`/admin/users/${u.id}`}
              className="p-1.5 rounded-lg bg-[#F0EDFF] hover:bg-[#EEEAFE] text-[#51419A] hover:text-[#29243B] border border-[#D6D0E8] transition-colors"
              title="Inspect user telemetry and details"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            {isOwner ? (
              <span className="text-[10px] font-mono text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md">
                Owner Protected
              </span>
            ) : (
              <div className="flex items-center space-x-1">
                {u.status === 'ACTIVE' ? (
                  <button
                    onClick={() => handleOpenAction(u, 'SUSPEND')}
                    className="p-1.5 rounded-lg hover:bg-amber-50 text-[#77748B] hover:text-amber-600 transition-colors"
                    title="Suspend User"
                  >
                    <Clock className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenAction(u, 'RESTORE')}
                    className="p-1.5 rounded-lg hover:bg-emerald-50 text-[#77748B] hover:text-emerald-600 transition-colors"
                    title="Restore User to Active"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </button>
                )}

                <button
                  onClick={() => handleOpenAction(u, 'BAN')}
                  className="p-1.5 rounded-lg hover:bg-rose-50 text-[#77748B] hover:text-rose-600 transition-colors"
                  title="Ban User"
                >
                  <AlertOctagon className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleOpenAction(u, 'ROLE')}
                  className="p-1.5 rounded-lg hover:bg-[#F0EDFF] text-[#77748B] hover:text-[#7357D9] transition-colors"
                  title="Change Role"
                >
                  <Shield className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-[#E8E5F0] p-5 rounded-xl shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-[#29243B] flex items-center space-x-2">
            <Users className="w-5 h-5 text-[#7357D9]" />
            <span>User Directory & Permissions</span>
          </h2>
          <p className="text-xs text-[#77748B] mt-1">
            Authoritative directory of all registered KEYFLOW typists, student accounts, and staff admins.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-lg bg-[#F7F7FC] border border-[#E8E5F0] text-xs text-[#29243B] focus:outline-none focus:border-[#7357D9]"
          >
            <option value="">All Roles</option>
            <option value="SUPER_ADMIN">Super Admins</option>
            <option value="ADMIN">Admins</option>
            <option value="USER">Standard Users</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-lg bg-[#F7F7FC] border border-[#E8E5F0] text-xs text-[#29243B] focus:outline-none focus:border-[#7357D9]"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="BANNED">Banned</option>
            <option value="DELETED">Deleted</option>
          </select>

          <button
            onClick={fetchUsers}
            disabled={isLoading}
            className="p-2 rounded-lg bg-[#F0EDFF] hover:bg-[#EEEAFE] text-[#51419A] border border-[#D6D0E8] transition-colors shadow-sm"
            title="Refresh users"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#7357D9]' : 'text-[#7357D9]'}`} />
          </button>
        </div>
      </div>

      {/* User Data Table */}
      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        searchTerm={searchTerm}
        onSearchChange={(val) => {
          setSearchTerm(val);
          setPage(1);
        }}
        searchPlaceholder="Search by username, email, or Clerk ID..."
        pagination={pagination}
        onPageChange={(newPage) => setPage(newPage)}
        emptyMessage="No users found matching current filters."
      />

      {/* Action Confirmation Modal */}
      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleExecuteAction}
        title={
          modalAction === 'ROLE'
            ? `Change Role for @${activeUser?.username}`
            : modalAction === 'SUSPEND'
            ? `Suspend Account @${activeUser?.username}`
            : modalAction === 'BAN'
            ? `Ban Typist @${activeUser?.username}`
            : modalAction === 'RESTORE'
            ? `Restore Account @${activeUser?.username}`
            : `Delete User @${activeUser?.username}`
        }
        message={
          modalAction === 'ROLE' ? (
            <div>
              <p className="mb-3 text-[#29243B]">Select target role for this user account:</p>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#F7F7FC] border border-[#E8E5F0] text-xs text-[#29243B] focus:outline-none focus:border-[#7357D9]"
              >
                <option value="USER">User (Standard typist)</option>
                <option value="ADMIN">Admin (Staff privileges)</option>
                <option value="SUPER_ADMIN">Super Admin (Highest privileges)</option>
              </select>
            </div>
          ) : modalAction === 'RESTORE' ? (
            'This will reinstate all user privileges, allowing them to sign in and record practice sessions.'
          ) : (
            <div>
              <p className="mb-2 text-[#29243B]">Enter optional administrative reason:</p>
              <input
                type="text"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Reason for suspension or disciplinary action..."
                className="w-full px-3 py-1.5 rounded-lg bg-[#F7F7FC] border border-[#E8E5F0] text-xs text-[#29243B] placeholder-[#9692A7] focus:outline-none focus:border-[#7357D9]"
              />
            </div>
          )
        }
        confirmText={
          modalAction === 'ROLE'
            ? 'Update Role'
            : modalAction === 'RESTORE'
            ? 'Restore Account'
            : modalAction === 'SUSPEND'
            ? 'Suspend Account'
            : modalAction === 'BAN'
            ? 'Ban Account'
            : 'Delete Account'
        }
        isDangerous={modalAction === 'BAN' || modalAction === 'DELETE' || modalAction === 'SUSPEND'}
        isLoading={isExecuting}
      />
    </div>
  );
};

