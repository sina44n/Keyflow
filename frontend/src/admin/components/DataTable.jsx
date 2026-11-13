import React from 'react';
import { Search, ChevronLeft, ChevronRight, Loader2, Inbox } from 'lucide-react';

export const DataTable = ({
  columns = [],
  data = [],
  isLoading = false,
  searchTerm = '',
  onSearchChange,
  searchPlaceholder = 'Search records...',
  pagination,
  onPageChange,
  emptyMessage = 'No records found matching criteria.',
  actions,
}) => {
  return (
    <div className="rounded-xl bg-white border border-[#E8E5F0] overflow-hidden shadow-sm">
      {/* Table Toolbar */}
      {(onSearchChange || actions) && (
        <div className="p-4 border-b border-[#EFEDF5] flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
          {onSearchChange ? (
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#9692A7] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#F7F7FC] border border-[#E8E5F0] text-xs text-[#29243B] placeholder-[#9692A7] focus:outline-none focus:border-[#7357D9] transition-colors"
              />
            </div>
          ) : <div />}

          {actions && <div className="flex items-center space-x-2 w-full sm:w-auto">{actions}</div>}
        </div>
      )}

      {/* Table Element */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#E8E5F0] bg-[#F7F7FC] text-[11px] font-semibold text-[#77748B] uppercase tracking-wider">
              {columns.map((col, idx) => (
                <th key={col.key || idx} className={`py-3 px-4 ${col.className || ''}`}>
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EFEDF5]">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-[#77748B]">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[#7357D9]" />
                    <span className="text-xs">Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-[#9692A7]">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Inbox className="w-8 h-8 text-[#D6D0E8]" />
                    <span className="text-xs">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr
                  key={row.id || rowIdx}
                  className="hover:bg-[#F9F9FD] transition-colors duration-150 group text-[#29243B]"
                >
                  {columns.map((col, colIdx) => (
                    <td key={col.key || colIdx} className={`py-3.5 px-4 ${col.cellClassName || ''}`}>
                      {col.render ? col.render(row, rowIdx) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Pagination */}
      {pagination && (
        <div className="p-3 border-t border-[#EFEDF5] flex items-center justify-between text-xs text-[#77748B] bg-white">
          <span>
            Showing <span className="font-mono text-[#29243B] font-semibold">{pagination.from || 1}</span> to{' '}
            <span className="font-mono text-[#29243B] font-semibold">{pagination.to || data.length}</span> of{' '}
            <span className="font-mono text-[#29243B] font-semibold">{pagination.total || data.length}</span> entries
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange && onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1 rounded bg-[#F7F7FC] hover:bg-[#F0EDFF] border border-[#E8E5F0] text-[#77748B] hover:text-[#51419A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-xs text-[#29243B] font-semibold">
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>
            <button
              onClick={() => onPageChange && onPageChange(pagination.page + 1)}
              disabled={pagination.page >= (pagination.totalPages || 1)}
              className="p-1 rounded bg-[#F7F7FC] hover:bg-[#F0EDFF] border border-[#E8E5F0] text-[#77748B] hover:text-[#51419A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
