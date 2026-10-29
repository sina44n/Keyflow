import React, { useState, useEffect, useMemo } from 'react';
import {
  User,
  Lock,
  Target,
  Eye,
  EyeOff,
  AlertCircle,
  X,
  Shield,
  Download,
  CreditCard,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../utils/api';
import {
  getPracticeGoal,
  setPracticeGoal,
  getWeeklyPracticeGoal,
  setWeeklyPracticeGoal,
  getWeekStartPreference,
  setWeekStartPreference,
  DAY_HEADERS,
  downloadCSV,
} from '../../utils/telemetryStorage';

// Standard common IANA Timezones
const IANA_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Australia/Sydney',
  'Pacific/Auckland',
];

const DAILY_GOAL_OPTIONS = [5, 10, 15, 20, 30, 45, 60, 90];
const WEEKLY_GOAL_OPTIONS = [
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' },
  { value: 300, label: '5 hours' },
  { value: 420, label: '7 hours' },
  { value: 600, label: '10 hours' },
];

/**
 * TelemetryProfileModal
 * 
 * Comprehensive Profile and Settings experience embedded directly within Telemetry.
 * Features 2-column responsive layout (Desktop: Form left, Navigation card right; Mobile: single-column).
 */
export default function TelemetryProfileModal({ isOpen, onClose, sessions = [], initialTab = 'profile' }) {
  const { user, applyUserSession, logout } = useAuth();
  const userId = user?.id || null;

  // Active navigation tab
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Form states
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [timezone, setTimezone] = useState(user?.profile?.timezone || 'UTC');
  const [bio, setBio] = useState(user?.profile?.bio || '');

  // Goals & Preferences state
  const [dailyGoal, setDailyGoalState] = useState(() => getPracticeGoal(userId));
  const [weeklyGoal, setWeeklyGoalState] = useState(() => getWeeklyPracticeGoal(userId));
  const [weekStart, setWeekStartState] = useState(() => getWeekStartPreference(userId));
  const [customDaily, setCustomDaily] = useState('');
  const [customWeekly, setCustomWeekly] = useState('');

  // Accessibility state
  const [reducedMotion, setReducedMotion] = useState(() => {
    try {
      return localStorage.getItem('keyflow_reduced_motion') === 'true' || Boolean(user?.preferences?.reduced_motion);
    } catch {
      return false;
    }
  });
  const [textSize, setTextSize] = useState(() => {
    try {
      return localStorage.getItem('keyflow_text_size') || 'default';
    } catch {
      return 'default';
    }
  });
  const [highContrast, setHighContrast] = useState(() => {
    try {
      return localStorage.getItem('keyflow_high_contrast') === 'true';
    } catch {
      return false;
    }
  });

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Delete account state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Status & feedback
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Initialize display name into first/last name
  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
      setTimezone(user.profile?.timezone || 'UTC');
      setBio(user.profile?.bio || '');

      const dispName = user.profile?.display_name || '';
      const parts = dispName.split(' ');
      if (parts.length > 1) {
        setFirstName(parts[0]);
        setLastName(parts.slice(1).join(' '));
      } else {
        setFirstName(dispName);
        setLastName('');
      }
    }
  }, [user]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (deleteModalOpen) {
          setDeleteModalOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, deleteModalOpen, onClose]);

  // Apply Accessibility to document root
  const handleToggleReducedMotion = (enabled) => {
    setReducedMotion(enabled);
    setUnsavedChanges(true);
    try {
      localStorage.setItem('keyflow_reduced_motion', String(enabled));
      if (enabled) {
        document.documentElement.classList.add('reduce-motion');
      } else {
        document.documentElement.classList.remove('reduce-motion');
      }
    } catch {}
  };

  const handleTextSizeChange = (size) => {
    setTextSize(size);
    setUnsavedChanges(true);
    try {
      localStorage.setItem('keyflow_text_size', size);
      document.documentElement.setAttribute('data-text-size', size);
    } catch {}
  };

  const handleToggleHighContrast = (enabled) => {
    setHighContrast(enabled);
    setUnsavedChanges(true);
    try {
      localStorage.setItem('keyflow_high_contrast', String(enabled));
      if (enabled) {
        document.documentElement.classList.add('high-contrast');
      } else {
        document.documentElement.classList.remove('high-contrast');
      }
    } catch {}
  };

  // Save profile and preferences
  const handleSaveAll = async () => {
    setSaveLoading(true);
    setSaveSuccess('');
    setSaveError('');

    try {
      // 1. Save local preferences immediately
      setPracticeGoal(dailyGoal, userId);
      setWeeklyPracticeGoal(weeklyGoal, userId);
      setWeekStartPreference(weekStart, userId);

      // 2. Persist to backend if authenticated
      if (user && authAPI.updateMe) {
        const payload = {
          username: username.trim(),
          email: email.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          timezone,
          bio: bio.trim(),
          daily_goal_minutes: dailyGoal,
          reduced_motion: reducedMotion,
        };
        const res = await authAPI.updateMe(payload);
        if (res?.data && applyUserSession) {
          applyUserSession(res.data);
        }
      }

      setSaveSuccess('Settings and telemetry preferences saved successfully.');
      setUnsavedChanges(false);
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err) {
      const msg = err.response?.data
        ? Object.entries(err.response.data)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`)
            .join(' | ')
        : 'Failed to save settings. Please verify inputs.';
      setSaveError(msg);
    } finally {
      setSaveLoading(false);
    }
  };

  // Change password handler
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    setPasswordLoading(true);
    try {
      await authAPI.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        new_password2: confirmPassword,
      });
      setPasswordSuccess('Password successfully updated.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 5000);
    } catch (err) {
      const msg = err.response?.data?.old_password?.[0] ||
        err.response?.data?.new_password?.[0] ||
        err.response?.data?.detail ||
        'Failed to change password. Please verify your current password.';
      setPasswordError(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Delete account handler
  const handleDeleteAccount = async () => {
    setDeleteError('');
    setDeleteLoading(true);

    try {
      if (authAPI.deleteAccount) {
        await authAPI.deleteAccount(deletePassword);
      }
      setDeleteModalOpen(false);
      onClose();
      if (logout) {
        await logout();
      }
      window.location.href = '/';
    } catch (err) {
      const msg = err.response?.data?.password?.[0] ||
        err.response?.data?.error ||
        'Account deletion failed. Ensure password is correct.';
      setDeleteError(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Telemetry CSV Export
  const handleExportData = () => {
    const filename = `keyflow_full_telemetry_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCSV(sessions, filename);
  };

  // Profile completion score
  const completionPercent = useMemo(() => {
    let score = 0;
    if (username) score += 20;
    if (email) score += 20;
    if (firstName) score += 20;
    if (lastName) score += 20;
    if (bio) score += 10;
    if (timezone) score += 10;
    return Math.min(100, score);
  }, [username, email, firstName, lastName, bio, timezone]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-settings-title"
    >
      {/* Modal Container */}
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-[var(--border)] bg-[var(--bg-elevated)]/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)]">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 id="profile-settings-title" className="text-base sm:text-lg font-bold font-mono text-[var(--text-primary)]">
                Telemetry Profile & Settings
              </h2>
              <p className="text-[11px] text-[var(--text-muted)]">
                Personalization, biomechanical practice targets, and security preferences.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {unsavedChanges && (
              <span className="text-[11px] font-mono text-amber-500 font-semibold hidden sm:inline">
                ● Unsaved changes
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all cursor-pointer"
              title="Close Profile (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback banners */}
        {saveSuccess && (
          <div className="px-6 py-2.5 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 font-mono">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saveSuccess}</span>
          </div>
        )}
        {saveError && (
          <div className="px-6 py-2.5 bg-rose-500/15 border-b border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {/* Main Content: Desktop 2-column (Left form, Right navigation) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left Column: Active Settings Form (lg:col-span-8) */}
            <div className="lg:col-span-8 space-y-6">
              {/* TAB 1: Profile (Personal Information) */}
              {activeTab === 'profile' && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="border-b border-[var(--border)] pb-3">
                    <h3 className="text-sm font-bold font-mono text-[var(--text-primary)]">
                      Personal Information
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Update your account details and typing identity.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Username */}
                    <div>
                      <label className="block text-xs font-mono font-medium text-[var(--text-secondary)] mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value);
                          setUnsavedChanges(true);
                        }}
                        className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all"
                        placeholder="Username"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-mono font-medium text-[var(--text-secondary)] mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setUnsavedChanges(true);
                        }}
                        className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all"
                        placeholder="email@example.com"
                      />
                    </div>

                    {/* First Name */}
                    <div>
                      <label className="block text-xs font-mono font-medium text-[var(--text-secondary)] mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value);
                          setUnsavedChanges(true);
                        }}
                        className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all"
                        placeholder="First Name"
                      />
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-xs font-mono font-medium text-[var(--text-secondary)] mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => {
                          setLastName(e.target.value);
                          setUnsavedChanges(true);
                        }}
                        className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all"
                        placeholder="Last Name"
                      />
                    </div>

                    {/* Timezone */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-mono font-medium text-[var(--text-secondary)] mb-1">
                        Time Zone (IANA)
                      </label>
                      <select
                        value={timezone}
                        onChange={(e) => {
                          setTimezone(e.target.value);
                          setUnsavedChanges(true);
                        }}
                        className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all"
                      >
                        {IANA_TIMEZONES.map((tz) => (
                          <option key={tz} value={tz}>
                            {tz}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1">
                        Ensures calendar activity and daily typing session boundaries align with your local clock.
                      </p>
                    </div>

                    {/* Bio */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-mono font-medium text-[var(--text-secondary)] mb-1">
                        Bio & Typing Aspirations
                      </label>
                      <textarea
                        rows={2}
                        value={bio}
                        onChange={(e) => {
                          setBio(e.target.value);
                          setUnsavedChanges(true);
                        }}
                        className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all resize-none"
                        placeholder="Passionate touch typist reaching for 100+ WPM."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Personal Goals & Preferences */}
              {activeTab === 'goals' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="border-b border-[var(--border)] pb-3">
                    <h3 className="text-sm font-bold font-mono text-[var(--text-primary)]">
                      Personal Practice Targets & Calendar Alignment
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Configure authoritative practice targets used across all telemetry reports.
                    </p>
                  </div>

                  {/* Daily Goal */}
                  <div>
                    <label className="block text-xs font-mono font-semibold text-[var(--text-primary)] mb-2">
                      Daily Practice Goal (minutes)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DAILY_GOAL_OPTIONS.map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => {
                            setDailyGoalState(mins);
                            setCustomDaily('');
                            setUnsavedChanges(true);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold border transition-all cursor-pointer ${
                            dailyGoal === mins && !customDaily
                              ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-xs'
                              : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]'
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                      <input
                        type="number"
                        min="1"
                        max="300"
                        placeholder="Custom"
                        value={customDaily}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setCustomDaily(e.target.value);
                          if (!isNaN(val) && val > 0) {
                            setDailyGoalState(val);
                            setUnsavedChanges(true);
                          }
                        }}
                        className="w-20 px-2.5 py-1.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] text-center"
                      />
                    </div>
                  </div>

                  {/* Weekly Goal */}
                  <div>
                    <label className="block text-xs font-mono font-semibold text-[var(--text-primary)] mb-2">
                      Weekly Practice Goal
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {WEEKLY_GOAL_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setWeeklyGoalState(opt.value);
                            setCustomWeekly('');
                            setUnsavedChanges(true);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold border transition-all cursor-pointer ${
                            weeklyGoal === opt.value && !customWeekly
                              ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-xs'
                              : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                      <input
                        type="number"
                        min="15"
                        max="1440"
                        placeholder="Custom mins"
                        value={customWeekly}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setCustomWeekly(e.target.value);
                          if (!isNaN(val) && val > 0) {
                            setWeeklyGoalState(val);
                            setUnsavedChanges(true);
                          }
                        }}
                        className="w-28 px-2.5 py-1.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] text-center"
                      />
                    </div>
                  </div>

                  {/* First Day of Week */}
                  <div>
                    <label className="block text-xs font-mono font-semibold text-[var(--text-primary)] mb-2">
                      First Day of the Week (Calendar & Weekly Reports)
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {DAY_HEADERS.map((dayName, idx) => (
                        <button
                          key={dayName}
                          type="button"
                          onClick={() => {
                            setWeekStartState(idx);
                            setUnsavedChanges(true);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold border transition-all cursor-pointer ${
                            weekStart === idx
                              ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-xs'
                              : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]'
                          }`}
                        >
                          {dayName}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
                      Determines which day starts your 7-day reporting cycle and 12-month calendar column alignment.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 3: Accessibility Settings */}
              {activeTab === 'accessibility' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="border-b border-[var(--border)] pb-3">
                    <h3 className="text-sm font-bold font-mono text-[var(--text-primary)]">
                      Accessibility & Ergonomic Preferences
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Customize motion, contrast, and visual sizing for maximum typing comfort.
                    </p>
                  </div>

                  {/* Reduced Motion Toggle */}
                  <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-mono font-bold text-[var(--text-primary)]">
                        Reduced Motion
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5 max-w-md">
                        Minimizes non-essential animations, key transitions, and pulse indicators across Telemetry and Workstation.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleReducedMotion(!reducedMotion)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        reducedMotion ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          reducedMotion ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Text Size Scale */}
                  <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-3">
                    <div>
                      <div className="text-xs font-mono font-bold text-[var(--text-primary)]">
                        Text Size Scale
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        Adjust text scaling for metrics, keystroke cards, and charts.
                      </p>
                    </div>
                    <div className="flex gap-2 font-mono text-xs">
                      {[
                        { id: 'default', label: 'Default (100%)' },
                        { id: 'large', label: 'Large (110%)' },
                        { id: 'extra-large', label: 'Extra Large (125%)' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleTextSizeChange(item.id)}
                          className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                            textSize === item.id
                              ? 'bg-[var(--accent)] text-white border-[var(--accent)] font-bold shadow-xs'
                              : 'bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* High Contrast Mode */}
                  <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-mono font-bold text-[var(--text-primary)]">
                        Enhanced Contrast
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5 max-w-md">
                        Increases border definition and text contrast for better readability in high-ambient-light environments.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleHighContrast(!highContrast)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        highContrast ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          highContrast ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: Change Password */}
              {activeTab === 'password' && (
                <form onSubmit={handleChangePassword} className="space-y-4 animate-in fade-in">
                  <div className="border-b border-[var(--border)] pb-3">
                    <h3 className="text-sm font-bold font-mono text-[var(--text-primary)]">
                      Change Account Password
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Secure your KEYFLOW account with a strong password.
                    </p>
                  </div>

                  {passwordSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 font-mono">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{passwordSuccess}</span>
                    </div>
                  )}

                  {passwordError && (
                    <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 font-mono">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  {/* Current Password */}
                  <div>
                    <label className="block text-xs font-mono font-medium text-[var(--text-secondary)] mb-1">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showOldPass ? 'text' : 'password'}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        required
                        className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] pr-10"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPass(!showOldPass)}
                        className="absolute right-3 top-2.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                      >
                        {showOldPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-mono font-medium text-[var(--text-secondary)] mb-1">
                      New Password (min 8 characters)
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                        className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] pr-10"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-2.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                      >
                        {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-mono font-medium text-[var(--text-secondary)] mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={passwordLoading || !oldPassword || !newPassword}
                      className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-mono font-bold hover:opacity-95 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      {passwordLoading ? 'Updating Password...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 5: Billing (Honest State) */}
              {activeTab === 'billing' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="border-b border-[var(--border)] pb-3">
                    <h3 className="text-sm font-bold font-mono text-[var(--text-primary)]">
                      Subscription & Billing
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Account tier and community access status.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-sm font-bold font-mono text-[var(--text-primary)]">
                          Free Community Tier
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-mono font-bold">
                        ACTIVE
                      </span>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      All KEYFLOW features are 100% unlocked for your account:
                    </p>
                    <ul className="text-xs font-mono text-[var(--text-muted)] space-y-1 list-disc list-inside">
                      <li>Complete 7-Stage, 4,200-Level Curriculum</li>
                      <li>Scientific Keystroke Telemetry & Biomechanical Analytics</li>
                      <li>Tactile Audio Studio (20 Sound Profiles)</li>
                      <li>Full 16-Theme Studio Showcase</li>
                      <li>Arcade Hub (7 Typing Games)</li>
                    </ul>

                    <div className="pt-3 border-t border-[var(--border)] text-[11px] text-[var(--text-muted)] italic">
                      No payment methods or invoices are configured on this server.
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: Security & Data Export */}
              {activeTab === 'security' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="border-b border-[var(--border)] pb-3">
                    <h3 className="text-sm font-bold font-mono text-[var(--text-primary)]">
                      Account Security & Personal Telemetry Export
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Export your typing activity or permanently delete your account.
                    </p>
                  </div>

                  {/* Telemetry Data Export */}
                  <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-mono font-bold text-[var(--text-primary)]">
                        Export Personal Telemetry History
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        Download all recorded sessions, keystroke counts, velocity records, and timestamps in standard CSV format.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportData}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--accent)] text-xs font-mono text-[var(--text-primary)] transition-all cursor-pointer shrink-0 shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <span>Download CSV</span>
                    </button>
                  </div>

                  {/* Protected Account Deletion */}
                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-mono font-bold text-rose-400">
                        Delete Account Permanently
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        Irreversibly delete your account, authentication tokens, and profile data from the database.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteModalOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono font-bold transition-all cursor-pointer shrink-0 shadow-xs"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Compact Settings Navigation Card (lg:col-span-4) */}
            <div className="lg:col-span-4 space-y-4">
              {/* User Identity Card */}
              <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[var(--accent)] text-white flex items-center justify-center font-mono font-bold text-base shadow-sm">
                    {user?.username ? user.username.slice(0, 2).toUpperCase() : 'GS'}
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-mono font-bold text-[var(--text-primary)] truncate">
                      {user?.profile?.display_name || user?.username || 'Guest Typist'}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] truncate">
                      {user?.email || 'Local browser session'}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-[10px] text-emerald-400 font-mono">
                        {user ? 'Authenticated' : 'Guest Mode'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Profile Completion Bar */}
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)] mb-1">
                    <span>Profile Setup</span>
                    <span className="font-bold text-[var(--text-primary)]">{completionPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[var(--bg-surface)] overflow-hidden">
                    <div
                      className="h-full bg-[var(--accent)] transition-all duration-300"
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Navigation Menu Links */}
              <div className="p-2 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-1 shadow-xs">
                {[
                  { id: 'profile', label: 'Profile Information', icon: User },
                  { id: 'goals', label: 'Practice Targets & Week', icon: Target },
                  { id: 'accessibility', label: 'Accessibility & Motion', icon: Sliders },
                  { id: 'password', label: 'Change Password', icon: Lock },
                  { id: 'billing', label: 'Subscription & Tier', icon: CreditCard },
                  { id: 'security', label: 'Export & Account Deletion', icon: Shield },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-mono transition-all text-left cursor-pointer ${
                        isActive
                          ? 'bg-[var(--accent)] text-white font-bold shadow-xs'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Quick Save and Cancel Actions */}
              <div className="p-3 rounded-2xl bg-[var(--bg-elevated)]/50 border border-[var(--border)] space-y-2">
                <button
                  type="button"
                  onClick={handleSaveAll}
                  disabled={saveLoading}
                  className="w-full py-2 px-3 rounded-xl bg-[var(--accent)] text-white text-xs font-mono font-bold hover:opacity-95 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {saveLoading ? 'Saving Settings...' : 'Save Settings'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 px-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all cursor-pointer text-center"
                >
                  Close Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-md rounded-2xl bg-[var(--bg-surface)] border border-rose-500/40 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-rose-500">
              <AlertCircle className="w-5 h-5" />
              <h4 className="text-sm font-bold font-mono">Confirm Account Deletion</h4>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              This action is permanent and cannot be undone. All your practice sessions, milestones, lesson progress, and personal preferences will be removed.
            </p>

            {deleteError && (
              <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-mono">
                {deleteError}
              </div>
            )}

            <div>
              <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
                Enter your password to confirm
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Current password"
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl border border-[var(--border)] text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteLoading || !deletePassword}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {deleteLoading ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
