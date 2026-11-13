import React, { useState } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  confirmPhrase = '', // If provided, user must type this exact string
  isDangerous = false,
  isLoading = false,
}) => {
  const [typedPhrase, setTypedPhrase] = useState('');

  if (!isOpen) return null;

  const requiresTyping = Boolean(confirmPhrase);
  const isMatch = !requiresTyping || typedPhrase.trim() === confirmPhrase.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#29243B]/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-[#E8E5F0] rounded-xl max-w-md w-full p-6 shadow-xl relative text-left">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-[#9692A7] hover:text-[#29243B] p-1 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start space-x-4">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isDangerous
                ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
                : 'bg-[#F0EDFF] text-[#7357D9] border border-[#E8E5F0]'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div className="flex-1">
            <h3 className="text-base font-bold text-[#29243B]">{title}</h3>
            <div className="mt-2 text-xs text-[#77748B] leading-relaxed">{message}</div>
          </div>
        </div>

        {requiresTyping && (
          <div className="mt-4 p-3 rounded-lg bg-[#F7F7FC] border border-[#E8E5F0] space-y-2">
            <label className="text-[11px] font-medium text-[#77748B] block">
              Please type <span className="font-mono text-[#DC2626] font-bold">{confirmPhrase}</span> to confirm:
            </label>
            <input
              type="text"
              value={typedPhrase}
              onChange={(e) => setTypedPhrase(e.target.value)}
              placeholder={confirmPhrase}
              className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E8E5F0] text-xs font-mono text-[#29243B] focus:outline-none focus:border-[#7357D9]"
            />
          </div>
        )}

        <div className="mt-6 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-[#F7F7FC] hover:bg-[#F0EDFF] text-[#77748B] hover:text-[#29243B] border border-[#E8E5F0] text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm()}
            disabled={!isMatch || isLoading}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all ${
              isDangerous
                ? 'bg-[#DC2626] hover:bg-[#B91C1C] text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-sm'
                : 'bg-[#7357D9] hover:bg-[#6246C5] text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-sm'
            }`}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
