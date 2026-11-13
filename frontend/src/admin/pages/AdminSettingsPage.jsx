/**
 * Module 09: Website Configuration & Feature Flags
 * Controls global platform settings, toggles modules, and manages maintenance messages.
 */

import React, { useState, useEffect } from 'react';
import { Settings, Save, Loader2, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { adminApi } from '../adminApi';

export const AdminSettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getPlatformSettings();
      setSettings(res.data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await adminApi.updatePlatformSettings(settings);
      setSaveSuccess(true);
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('keyflow-config-updated'));
      }
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between bg-white border border-[#E8E5F0] p-5 rounded-xl shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-[#29243B] flex items-center space-x-2">
            <Settings className="w-5 h-5 text-[#7357D9]" />
            <span>Platform Settings & Feature Flags</span>
          </h2>
          <p className="text-xs text-[#77748B] mt-1">
            Toggle platform capabilities, enforce global maintenance, and configure operational behavior.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center text-[#77748B] text-xs">
          <Loader2 className="w-6 h-6 animate-spin text-[#7357D9]" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Feature Flags Card */}
          <div className="rounded-xl bg-white border border-[#E8E5F0] p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#29243B] border-b border-[#EFEDF5] pb-3">
              Core Feature Flags
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-start space-x-3 p-3.5 rounded-lg bg-[#F7F7FC] border border-[#E8E5F0] cursor-pointer hover:border-[#D6D0E8] hover:bg-[#F0EDFF]/30 transition-colors">
                <input
                  type="checkbox"
                  checked={Boolean(settings.registration_enabled)}
                  onChange={(e) => setSettings({ ...settings, registration_enabled: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded bg-white border-[#E8E5F0] text-[#7357D9] focus:ring-[#7357D9]"
                />
                <div>
                  <span className="text-xs font-semibold text-[#29243B] block">New User Registration</span>
                  <span className="text-[11px] text-[#77748B]">Allow new students and typists to create accounts</span>
                </div>
              </label>

              <label className="flex items-start space-x-3 p-3.5 rounded-lg bg-[#F7F7FC] border border-[#E8E5F0] cursor-pointer hover:border-[#D6D0E8] hover:bg-[#F0EDFF]/30 transition-colors">
                <input
                  type="checkbox"
                  checked={Boolean(settings.custom_text_enabled)}
                  onChange={(e) => setSettings({ ...settings, custom_text_enabled: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded bg-white border-[#E8E5F0] text-[#7357D9] focus:ring-[#7357D9]"
                />
                <div>
                  <span className="text-xs font-semibold text-[#29243B] block">Custom Text Practice</span>
                  <span className="text-[11px] text-[#77748B]">Allow users to paste custom paragraphs in Workstation</span>
                </div>
              </label>

              <label className="flex items-start space-x-3 p-3.5 rounded-lg bg-[#F7F7FC] border border-[#E8E5F0] cursor-pointer hover:border-[#D6D0E8] hover:bg-[#F0EDFF]/30 transition-colors">
                <input
                  type="checkbox"
                  checked={Boolean(settings.competition_enabled)}
                  onChange={(e) => setSettings({ ...settings, competition_enabled: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded bg-white border-[#E8E5F0] text-[#7357D9] focus:ring-[#7357D9]"
                />
                <div>
                  <span className="text-xs font-semibold text-[#29243B] block">Live Competitions</span>
                  <span className="text-[11px] text-[#77748B]">Enable real-time typing challenges & tournaments</span>
                </div>
              </label>

              <label className="flex items-start space-x-3 p-3.5 rounded-lg bg-[#F7F7FC] border border-[#E8E5F0] cursor-pointer hover:border-[#D6D0E8] hover:bg-[#F0EDFF]/30 transition-colors">
                <input
                  type="checkbox"
                  checked={Boolean(settings.arcade_enabled)}
                  onChange={(e) => setSettings({ ...settings, arcade_enabled: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded bg-white border-[#E8E5F0] text-[#7357D9] focus:ring-[#7357D9]"
                />
                <div>
                  <span className="text-xs font-semibold text-[#29243B] block">Arcade Games Access</span>
                  <span className="text-[11px] text-[#77748B]">Enable 3D Nitro Racing and Stickman Warrior Combat</span>
                </div>
              </label>

              <label className="flex items-start space-x-3 p-3.5 rounded-lg bg-[#F7F7FC] border border-[#E8E5F0] cursor-pointer hover:border-[#D6D0E8] hover:bg-[#F0EDFF]/30 transition-colors">
                <input
                  type="checkbox"
                  checked={Boolean(settings.academy_enabled)}
                  onChange={(e) => setSettings({ ...settings, academy_enabled: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded bg-white border-[#E8E5F0] text-[#7357D9] focus:ring-[#7357D9]"
                />
                <div>
                  <span className="text-xs font-semibold text-[#29243B] block">Academy Curriculum</span>
                  <span className="text-[11px] text-[#77748B]">Enable 7-stage neuromuscular touch typing academy</span>
                </div>
              </label>

              <label className="flex items-start space-x-3 p-3.5 rounded-lg bg-[#F7F7FC] border border-[#E8E5F0] cursor-pointer hover:border-[#D6D0E8] hover:bg-[#F0EDFF]/30 transition-colors">
                <input
                  type="checkbox"
                  checked={Boolean(settings.leaderboard_enabled)}
                  onChange={(e) => setSettings({ ...settings, leaderboard_enabled: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded bg-white border-[#E8E5F0] text-[#7357D9] focus:ring-[#7357D9]"
                />
                <div>
                  <span className="text-xs font-semibold text-[#29243B] block">Global Leaderboard</span>
                  <span className="text-[11px] text-[#77748B]">Display podium rankings and typist telemetry scores</span>
                </div>
              </label>

              <label className="flex items-start space-x-3 p-3.5 rounded-lg bg-[#F7F7FC] border border-[#E8E5F0] cursor-pointer hover:border-[#D6D0E8] hover:bg-[#F0EDFF]/30 transition-colors">
                <input
                  type="checkbox"
                  checked={Boolean(settings.guest_typing_enabled)}
                  onChange={(e) => setSettings({ ...settings, guest_typing_enabled: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded bg-white border-[#E8E5F0] text-[#7357D9] focus:ring-[#7357D9]"
                />
                <div>
                  <span className="text-xs font-semibold text-[#29243B] block">Guest Practice Sessions</span>
                  <span className="text-[11px] text-[#77748B]">Allow unauthenticated typists to practice without signing in</span>
                </div>
              </label>

              <label className="flex items-start space-x-3 p-3.5 rounded-lg bg-[#F7F7FC] border border-[#E8E5F0] cursor-pointer hover:border-[#D6D0E8] hover:bg-[#F0EDFF]/30 transition-colors">
                <input
                  type="checkbox"
                  checked={Boolean(settings.announcements_enabled)}
                  onChange={(e) => setSettings({ ...settings, announcements_enabled: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded bg-white border-[#E8E5F0] text-[#7357D9] focus:ring-[#7357D9]"
                />
                <div>
                  <span className="text-xs font-semibold text-[#29243B] block">Platform Announcements Banner</span>
                  <span className="text-[11px] text-[#77748B]">Display active administrative announcements to visitors</span>
                </div>
              </label>
            </div>
          </div>

          {/* Typing Controls & Durations Card */}
          <div className="rounded-xl bg-white border border-[#E8E5F0] p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#29243B] border-b border-[#EFEDF5] pb-3 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-[#7357D9]" />
              <span>Typing Controls & Allowed Durations</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#29243B] block mb-1">
                  Default Test Duration (Seconds)
                </label>
                <input
                  type="number"
                  min="5"
                  max="600"
                  value={settings.default_duration || 60}
                  onChange={(e) => setSettings({ ...settings, default_duration: parseInt(e.target.value, 10) || 60 })}
                  className="w-full px-3 py-2 rounded-lg bg-[#F7F7FC] border border-[#E8E5F0] text-xs text-[#29243B] focus:outline-none focus:border-[#7357D9]"
                />
                <span className="text-[11px] text-[#77748B] mt-1 block">Default duration loaded for new sessions</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#29243B] block mb-1">
                  Allowed Durations (Comma Separated Seconds)
                </label>
                <input
                  type="text"
                  value={Array.isArray(settings.allowed_durations) ? settings.allowed_durations.join(', ') : (settings.allowed_durations || '15, 30, 60, 120, 300')}
                  onChange={(e) => {
                    const parsed = e.target.value.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n) && n > 0);
                    setSettings({ ...settings, allowed_durations: parsed });
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-[#F7F7FC] border border-[#E8E5F0] text-xs text-[#29243B] font-mono focus:outline-none focus:border-[#7357D9]"
                />
                <span className="text-[11px] text-[#77748B] mt-1 block">Durations permitted for timed practice (e.g. 15, 30, 60, 120, 300)</span>
              </div>
            </div>
          </div>

          {/* Maintenance Mode Card */}
          <div className="rounded-xl bg-white border border-[#E8E5F0] p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#29243B] border-b border-[#EFEDF5] pb-3 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Platform Maintenance Protocol</span>
            </h3>

            <div className="space-y-4">
              <label className="flex items-start space-x-3 p-3.5 rounded-lg bg-[#F7F7FC] border border-[#E8E5F0] cursor-pointer hover:border-[#D6D0E8]">
                <input
                  type="checkbox"
                  checked={Boolean(settings.maintenance_mode)}
                  onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded bg-white border-[#E8E5F0] text-amber-500 focus:ring-amber-500"
                />
                <div>
                  <span className="text-xs font-semibold text-[#29243B] block">Activate Maintenance Mode</span>
                  <span className="text-[11px] text-[#77748B]">
                    Restricts non-admin users from taking practice sessions while upgrades run.
                  </span>
                </div>
              </label>

              <div>
                <label className="text-xs font-semibold text-[#29243B] block mb-1">
                  Public Maintenance Banner Message
                </label>
                <input
                  type="text"
                  value={settings.maintenance_message || ''}
                  onChange={(e) => setSettings({ ...settings, maintenance_message: e.target.value })}
                  placeholder="KEYFLOW is currently undergoing scheduled optimization..."
                  className="w-full px-3 py-2 rounded-lg bg-[#F7F7FC] border border-[#E8E5F0] text-xs text-[#29243B] focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Save Bar */}
          <div className="flex items-center justify-between p-4 bg-white border border-[#E8E5F0] rounded-xl shadow-sm">
            {saveSuccess ? (
              <span className="text-xs font-semibold text-emerald-600 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Configuration changes saved and active!</span>
              </span>
            ) : <div />}

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-lg bg-[#7357D9] hover:bg-[#6246C5] text-white text-xs font-semibold flex items-center space-x-2 shadow-sm transition-all"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Configuration</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

