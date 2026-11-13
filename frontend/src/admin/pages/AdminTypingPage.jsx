/**
 * Module 03: Typing Control Center
 * Manages platform-wide test durations, custom text mode, and practice passage library.
 */

import React, { useState, useEffect } from 'react';
import {
  Keyboard,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Save,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { adminApi } from '../adminApi';
import { DataTable } from '../components/DataTable';
import { ConfirmModal } from '../components/ConfirmModal';

export const AdminTypingPage = () => {
  // Global Config State
  const [, setConfig] = useState(null);
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [allowedDurationsInput, setAllowedDurationsInput] = useState('15, 30, 60, 120, 300');
  const [defaultDuration, setDefaultDuration] = useState(60);
  const [customTextEnabled, setCustomTextEnabled] = useState(true);

  // Passages State
  const [passages, setPassages] = useState([]);
  const [isPassagesLoading, setIsPassagesLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });

  // Create Passage Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('technology');
  const [newDifficulty, setNewDifficulty] = useState('medium');
  const [newContent, setNewContent] = useState('');
  const [isSubmittingPassage, setIsSubmittingPassage] = useState(false);

  // Delete Passage Modal
  const [passageToDelete, setPassageToDelete] = useState(null);
  const [isDeletingPassage, setIsDeletingPassage] = useState(false);

  const fetchConfig = async () => {
    setIsConfigLoading(true);
    try {
      const res = await adminApi.getTypingConfig();
      setConfig(res.data);
      if (res.data.allowed_durations) {
        setAllowedDurationsInput(res.data.allowed_durations.join(', '));
      }
      setDefaultDuration(res.data.default_duration || 60);
      setCustomTextEnabled(res.data.custom_text_enabled !== false);
    } catch (err) {
      console.error('Failed to load typing config:', err);
    } finally {
      setIsConfigLoading(false);
    }
  };

  const fetchPassages = async () => {
    setIsPassagesLoading(true);
    try {
      const res = await adminApi.getPassages({ search: searchTerm, page });
      const data = res.data;
      setPassages(data.results || data);
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
      console.error('Failed to load passages:', err);
    } finally {
      setIsPassagesLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    fetchPassages();
  }, [searchTerm, page]);

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      const parsedDurations = allowedDurationsInput
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n) && n > 0);

      await adminApi.updateTypingConfig({
        allowed_durations: parsedDurations,
        default_duration: parseInt(defaultDuration, 10),
        custom_text_enabled: customTextEnabled,
      });
      alert('Global typing configuration updated successfully!');
      fetchConfig();
    } catch (err) {
      alert('Failed to save configuration.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleCreatePassage = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      alert('Title and content are required.');
      return;
    }
    setIsSubmittingPassage(true);
    try {
      await adminApi.createPassage({
        title: newTitle.trim(),
        category: newCategory,
        difficulty: newDifficulty,
        content: newContent.trim(),
      });
      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewContent('');
      fetchPassages();
    } catch (err) {
      alert('Failed to create passage.');
    } finally {
      setIsSubmittingPassage(false);
    }
  };

  const handleTogglePassageActive = async (passage) => {
    try {
      await adminApi.updatePassage(passage.id, { is_active: !passage.is_active });
      fetchPassages();
    } catch (err) {
      alert('Failed to update passage status.');
    }
  };

  const handleDeletePassage = async () => {
    if (!passageToDelete) return;
    setIsDeletingPassage(true);
    try {
      await adminApi.deletePassage(passageToDelete.id);
      setPassageToDelete(null);
      fetchPassages();
    } catch (err) {
      alert('Failed to delete passage.');
    } finally {
      setIsDeletingPassage(false);
    }
  };

  const passageColumns = [
    {
      title: 'Title & Preview',
      key: 'title',
      render: (p) => (
        <div>
          <span className="font-semibold text-[#29243B] block">{p.title}</span>
          <span className="text-[11px] text-[#77748B] line-clamp-1">{p.content_preview}</span>
        </div>
      ),
    },
    {
      title: 'Category',
      key: 'category',
      render: (p) => (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#F0EDFF] text-[#51419A] border border-[#E8E5F0] uppercase">
          {p.category}
        </span>
      ),
    },
    {
      title: 'Difficulty',
      key: 'difficulty',
      render: (p) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
            p.difficulty === 'hard'
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : p.difficulty === 'medium'
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}
        >
          {p.difficulty}
        </span>
      ),
    },
    {
      title: 'Words',
      key: 'word_count',
      render: (p) => <span className="font-mono text-[#77748B]">{p.word_count} w</span>,
    },
    {
      title: 'Status',
      key: 'is_active',
      render: (p) => (
        <button
          onClick={() => handleTogglePassageActive(p)}
          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
            p.is_active
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-[#F7F7FC] text-[#77748B] border border-[#E8E5F0]'
          }`}
        >
          {p.is_active ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
          <span>{p.is_active ? 'Active' : 'Inactive'}</span>
        </button>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (p) => (
        <button
          onClick={() => setPassageToDelete(p)}
          className="p-1.5 rounded-lg text-[#9692A7] hover:text-rose-600 hover:bg-rose-50 transition-colors"
          title="Delete passage"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Title */}
      <div className="flex items-center justify-between bg-white border border-[#E8E5F0] p-5 rounded-xl shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-[#29243B] flex items-center space-x-2">
            <Keyboard className="w-5 h-5 text-emerald-600" />
            <span>Typing Control Center</span>
          </h2>
          <p className="text-xs text-[#77748B] mt-1">
            Global duration presets, custom text policy, and curated practice passage library.
          </p>
        </div>
      </div>

      {/* Global Configuration Form */}
      <div className="rounded-xl bg-white border border-[#E8E5F0] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-[#EFEDF5] pb-3">
          <h3 className="text-sm font-bold text-[#29243B] flex items-center space-x-2">
            <Clock className="w-4 h-4 text-[#7357D9]" />
            <span>Global Typing Presets</span>
          </h3>
          <span className="text-[11px] text-[#77748B]">Controls typing workstation test modes</span>
        </div>

        {isConfigLoading ? (
          <div className="py-6 flex items-center justify-center space-x-2 text-xs text-[#77748B]">
            <Loader2 className="w-4 h-4 animate-spin text-[#7357D9]" />
            <span>Loading configuration...</span>
          </div>
        ) : (
          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-[#29243B]">
                  Allowed Test Durations (seconds, comma-separated)
                </label>
                <input
                  type="text"
                  value={allowedDurationsInput}
                  onChange={(e) => setAllowedDurationsInput(e.target.value)}
                  placeholder="15, 30, 60, 120, 300"
                  className="w-full px-3 py-2 rounded-lg bg-[#F7F7FC] border border-[#E8E5F0] text-xs font-mono text-[#29243B] focus:outline-none focus:border-[#7357D9]"
                />
                <p className="text-[10px] text-[#77748B]">
                  Defines available duration pills on the consumer Workstation interface.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#29243B]">Default Duration (seconds)</label>
                <input
                  type="number"
                  value={defaultDuration}
                  onChange={(e) => setDefaultDuration(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#F7F7FC] border border-[#E8E5F0] text-xs font-mono text-[#29243B] focus:outline-none focus:border-[#7357D9]"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-[#EFEDF5]">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={customTextEnabled}
                  onChange={(e) => setCustomTextEnabled(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#F7F7FC] border-[#E8E5F0] text-[#7357D9] focus:ring-[#7357D9]"
                />
                <span className="text-xs font-medium text-[#29243B]">
                  Enable Custom Text Mode on Workstation
                </span>
              </label>

              <button
                type="submit"
                disabled={isSavingConfig}
                className="px-4 py-2 rounded-lg bg-[#7357D9] hover:bg-[#6246C5] text-white text-xs font-semibold flex items-center space-x-2 transition-all shadow-sm"
              >
                {isSavingConfig ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Platform Presets</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Practice Passage Library */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-[#7357D9]" />
            <h3 className="text-base font-bold text-[#29243B]">Practice Passage Library</h3>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-2 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Passage</span>
          </button>
        </div>

        <DataTable
          columns={passageColumns}
          data={passages}
          isLoading={isPassagesLoading}
          searchTerm={searchTerm}
          onSearchChange={(val) => {
            setSearchTerm(val);
            setPage(1);
          }}
          searchPlaceholder="Search passages by title or text..."
          pagination={pagination}
          onPageChange={(p) => setPage(p)}
          emptyMessage="No passages found."
        />
      </div>

      {/* Create Passage Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-[#E8E5F0] rounded-xl max-w-xl w-full p-6 shadow-2xl relative text-left">
            <h3 className="text-base font-bold text-[#29243B] mb-4">Add Curated Typing Passage</h3>

            <form onSubmit={handleCreatePassage} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#29243B] block mb-1">Passage Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. The Architecture of Quantum Computing"
                  className="w-full px-3 py-2 rounded-lg bg-[#F7F7FC] border border-[#E8E5F0] text-xs text-[#29243B] focus:outline-none focus:border-[#7357D9]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#29243B] block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#F7F7FC] border border-[#E8E5F0] text-xs text-[#29243B] focus:outline-none focus:border-[#7357D9]"
                  >
                    <option value="technology">Technology</option>
                    <option value="literature">Literature</option>
                    <option value="science">Science</option>
                    <option value="history">History</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#29243B] block mb-1">Difficulty</label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#F7F7FC] border border-[#E8E5F0] text-xs text-[#29243B] focus:outline-none focus:border-[#7357D9]"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#29243B] block mb-1">Text Content</label>
                <textarea
                  required
                  rows={6}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Paste or type the authentic paragraph content..."
                  className="w-full px-3 py-2 rounded-lg bg-[#F7F7FC] border border-[#E8E5F0] text-xs text-[#29243B] font-mono focus:outline-none focus:border-[#7357D9]"
                />
                <span className="text-[10px] text-[#77748B]">
                  Approx. {newContent.trim().split(/\s+/).filter(Boolean).length} words
                </span>
              </div>

              <div className="mt-6 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#F0EDFF] hover:bg-[#EEEAFE] text-[#51419A] border border-[#D6D0E8] text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPassage}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-2 shadow-sm"
                >
                  {isSubmittingPassage && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Passage</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(passageToDelete)}
        onClose={() => setPassageToDelete(null)}
        onConfirm={handleDeletePassage}
        title="Delete Passage?"
        message={`Are you sure you want to permanently delete the passage "${passageToDelete?.title}"?`}
        confirmText="Delete"
        isDangerous={true}
        isLoading={isDeletingPassage}
      />
    </div>
  );
};

