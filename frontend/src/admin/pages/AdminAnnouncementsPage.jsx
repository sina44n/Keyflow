/**
 * Module 08: Platform Announcements & Banners
 * Broadcasts system alerts, maintenance schedules, and curriculum updates.
 */

import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { adminApi } from '../adminApi';
import { ConfirmModal } from '../components/ConfirmModal';

export const AdminAnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('INFO');
  const [audience, setAudience] = useState('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Modal
  const [toDelete, setToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getAnnouncements();
      setAnnouncements(res.data?.announcements || []);
    } catch (err) {
      console.error('Failed to load announcements:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setIsSubmitting(true);
    try {
      await adminApi.createAnnouncement({
        title: title.trim(),
        message: message.trim(),
        type,
        target_audience: audience,
      });
      setIsCreateOpen(false);
      setTitle('');
      setMessage('');
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('keyflow-config-updated'));
      }
      fetchAnnouncements();
    } catch (err) {
      alert('Failed to publish announcement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (ann) => {
    try {
      await adminApi.toggleAnnouncement(ann.id, !ann.is_active);
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('keyflow-config-updated'));
      }
      fetchAnnouncements();
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setIsDeleting(true);
    try {
      await adminApi.deleteAnnouncement(toDelete.id);
      setToDelete(null);
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('keyflow-config-updated'));
      }
      fetchAnnouncements();
    } catch (err) {
      alert('Failed to delete announcement.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-[#E8E5F0] p-5 rounded-xl shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-[#29243B] flex items-center space-x-2">
            <Bell className="w-5 h-5 text-amber-500" />
            <span>Platform Announcements & Alerts</span>
          </h2>
          <p className="text-xs text-[#77748B] mt-1">
            Broadcast platform updates, scheduled maintenance notices, and important news.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-3.5 py-2 rounded-lg bg-[#7357D9] hover:bg-[#6246C5] text-white text-xs font-semibold flex items-center space-x-2 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Announcement</span>
        </button>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-12 flex justify-center text-[#77748B] text-xs">
            <Loader2 className="w-6 h-6 animate-spin text-[#7357D9]" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#9692A7] bg-white border border-[#E8E5F0] rounded-xl">
            No announcements created yet.
          </div>
        ) : (
          announcements.map((ann) => (
            <div
              key={ann.id}
              className="rounded-xl bg-white border border-[#E8E5F0] p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center space-x-2.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                      ann.type === 'CRITICAL'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : ann.type === 'WARNING'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-[#F0EDFF] text-[#51419A] border border-[#E8E5F0]'
                    }`}
                  >
                    {ann.type}
                  </span>

                  <h3 className="text-sm font-bold text-[#29243B]">{ann.title}</h3>

                  <button
                    onClick={() => handleToggleActive(ann)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center space-x-1 transition-colors ${
                      ann.is_active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-[#F7F7FC] text-[#77748B] border border-[#E8E5F0]'
                    }`}
                  >
                    {ann.is_active ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                    <span>{ann.is_active ? 'Active' : 'Inactive'}</span>
                  </button>
                </div>

                <p className="text-xs text-[#29243B] leading-relaxed">{ann.message}</p>

                <p className="text-[10px] text-[#9692A7] font-mono">
                  Audience: {ann.target_audience} &bull; Created {new Date(ann.created_at).toLocaleDateString()}
                </p>
              </div>

              <button
                onClick={() => setToDelete(ann)}
                className="p-2 rounded-lg text-[#9692A7] hover:text-rose-600 hover:bg-rose-50 transition-colors self-end md:self-center"
                title="Delete announcement"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-[#E8E5F0] rounded-xl max-w-lg w-full p-6 shadow-2xl relative text-left">
            <h3 className="text-base font-bold text-[#29243B] mb-4">Create Announcement</h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#29243B] block mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Scheduled Infrastructure Maintenance"
                  className="w-full px-3 py-2 rounded-lg bg-[#F7F7FC] border border-[#E8E5F0] text-xs text-[#29243B] focus:outline-none focus:border-[#7357D9]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#29243B] block mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#F7F7FC] border border-[#E8E5F0] text-xs text-[#29243B] focus:outline-none focus:border-[#7357D9]"
                  >
                    <option value="INFO">Informational</option>
                    <option value="WARNING">Warning</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="SUCCESS">Success / Update</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#29243B] block mb-1">Audience</label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#F7F7FC] border border-[#E8E5F0] text-xs text-[#29243B] focus:outline-none focus:border-[#7357D9]"
                  >
                    <option value="ALL">All Users</option>
                    <option value="STUDENTS">Academy Students</option>
                    <option value="ADMINS">Admins Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#29243B] block mb-1">Message</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Details of the announcement..."
                  className="w-full px-3 py-2 rounded-lg bg-[#F7F7FC] border border-[#E8E5F0] text-xs text-[#29243B] focus:outline-none focus:border-[#7357D9]"
                />
              </div>

              <div className="mt-6 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#F0EDFF] hover:bg-[#EEEAFE] text-[#51419A] border border-[#D6D0E8] text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-[#7357D9] hover:bg-[#6246C5] text-white text-xs font-semibold flex items-center space-x-2 shadow-sm"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Publish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Announcement?"
        message={`Delete "${toDelete?.title}"?`}
        confirmText="Delete"
        isDangerous={true}
        isLoading={isDeleting}
      />
    </div>
  );
};

