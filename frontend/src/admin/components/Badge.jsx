import React from 'react';
import { Crown, Shield, User, CheckCircle2, AlertOctagon, XCircle, Clock } from 'lucide-react';

export const RoleBadge = ({ role }) => {
  const normalized = (role || 'USER').toUpperCase();

  if (normalized === 'SUPER_ADMIN') {
    return (
      <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F0EDFF] text-[#51419A] border border-[#D6D0E8]">
        <Crown className="w-3 h-3 text-[#7357D9]" />
        <span>Super Admin</span>
      </span>
    );
  }

  if (normalized === 'ADMIN') {
    return (
      <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F7F7FC] text-[#51419A] border border-[#E8E5F0]">
        <Shield className="w-3 h-3 text-[#7357D9]" />
        <span>Admin</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F7F7FC] text-[#77748B] border border-[#E8E5F0]">
      <User className="w-3 h-3 text-[#9692A7]" />
      <span>User</span>
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  const normalized = (status || 'ACTIVE').toUpperCase();

  if (normalized === 'ACTIVE') {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
        <CheckCircle2 className="w-2.5 h-2.5" />
        <span>Active</span>
      </span>
    );
  }

  if (normalized === 'SUSPENDED') {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
        <Clock className="w-2.5 h-2.5" />
        <span>Suspended</span>
      </span>
    );
  }

  if (normalized === 'BANNED') {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
        <AlertOctagon className="w-2.5 h-2.5" />
        <span>Banned</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]">
      <XCircle className="w-2.5 h-2.5" />
      <span>Deleted</span>
    </span>
  );
};
