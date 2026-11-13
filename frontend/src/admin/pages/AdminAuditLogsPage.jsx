/**
 * Module 13: Immutable Administrative Audit Logs
 * Comprehensive chronological activity log tracking all sensitive administrative actions.
 */

import React, { useState, useEffect } from 'react';
import { History, Search, RefreshCw, Shield, Clock } from 'lucide-react';
import { adminApi } from '../adminApi';
import { DataTable } from '../components/DataTable';

export const AdminAuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getAuditLogs({ search: searchTerm, page });
      const data = res.data;
      setLogs(data.results || data);
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
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [searchTerm, page]);

  const columns = [
    {
      title: 'Timestamp',
      key: 'created_at',
      render: (l) => (
        <span className="font-mono text-[11px] text-[#77748B]">
          {new Date(l.created_at).toLocaleString()}
        </span>
      ),
    },
    {
      title: 'Administrator',
      key: 'admin_username',
      render: (l) => (
        <div className="flex items-center space-x-2">
          <Shield className="w-3.5 h-3.5 text-[#7357D9]" />
          <span className="font-semibold text-[#29243B]">{l.admin_username}</span>
        </div>
      ),
    },
    {
      title: 'Action Performed',
      key: 'action',
      render: (l) => (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#F0EDFF] text-[#51419A] border border-[#E8E5F0]">
          {l.action}
        </span>
      ),
    },
    {
      title: 'Target Resource',
      key: 'target_repr',
      render: (l) => (
        <span className="text-xs text-[#77748B]">
          {l.target_model ? `${l.target_model}: ` : ''}
          <span className="font-semibold text-[#29243B]">{l.target_repr || l.target_id || 'System'}</span>
        </span>
      ),
    },
    {
      title: 'Details',
      key: 'details',
      render: (l) => (
        <span className="font-mono text-[10px] text-[#77748B] block max-w-xs truncate">
          {l.details && Object.keys(l.details).length > 0 ? JSON.stringify(l.details) : '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between bg-white border border-[#E8E5F0] p-5 rounded-xl shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-[#29243B] flex items-center space-x-2">
            <History className="w-5 h-5 text-[#7357D9]" />
            <span>Immutable Administrative Audit Trail</span>
          </h2>
          <p className="text-xs text-[#77748B] mt-1">
            Tamper-proof event log of every role update, disciplinary suspension, and configuration modification.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="p-2 rounded-lg bg-[#F0EDFF] hover:bg-[#EEEAFE] text-[#51419A] border border-[#D6D0E8] transition-colors shadow-sm"
          title="Refresh audit logs"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#7357D9]' : 'text-[#7357D9]'}`} />
        </button>
      </div>

      {/* Logs Table */}
      <DataTable
        columns={columns}
        data={logs}
        isLoading={isLoading}
        searchTerm={searchTerm}
        onSearchChange={(val) => {
          setSearchTerm(val);
          setPage(1);
        }}
        searchPlaceholder="Filter logs by admin, action, or target..."
        pagination={pagination}
        onPageChange={(p) => setPage(p)}
        emptyMessage="No administrative actions logged yet."
      />
    </div>
  );
};

