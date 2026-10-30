/**
 * KEYFLOW Global Game Performance System — Global Game Settings Modal
 * ===================================================================
 * Accessible, responsive settings interface for arcade graphics, audio,
 * accessibility (reduced motion), and performance telemetry.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Sparkles,
  Volume2,
  VolumeX,
  Gauge,
  Eye,
  BatteryCharging,
  RotateCcw,
  Check,
  ShieldCheck,
} from 'lucide-react';
import {
  GRAPHICS_PRESETS,
  PRESET_METADATA,
  getStoredGraphicsSettings,
  setUserGraphicsPreset,
  saveGraphicsSettings,
  resetGraphicsSettingsToDefault,
  detectDeviceCapabilities,
  GlobalAudioLifecycleManager,
} from '../../../utils/performance/GlobalGameManager';

export const GlobalGameSettingsModal = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState(getStoredGraphicsSettings);
  const [audioSettings, setAudioSettings] = useState(GlobalAudioLifecycleManager.getSettings);
  const [capabilities, setCapabilities] = useState(detectDeviceCapabilities);

  useEffect(() => {
    if (isOpen) {
      setSettings(getStoredGraphicsSettings());
      setAudioSettings(GlobalAudioLifecycleManager.getSettings());
      setCapabilities(detectDeviceCapabilities());
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePresetSelect = (presetKey) => {
    const updated = setUserGraphicsPreset(presetKey);
    setSettings(updated);
  };

  const handleTogglePerfHud = () => {
    const updated = saveGraphicsSettings({ showPerfHud: !settings.showPerfHud });
    setSettings(updated);
  };

  const handleToggleReducedMotion = () => {
    const updated = saveGraphicsSettings({ reducedMotion: !settings.reducedMotion });
    setSettings(updated);
  };

  const handleToggleBatterySaver = () => {
    const updated = saveGraphicsSettings({ batterySaver: !settings.batterySaver });
    setSettings(updated);
  };

  const handleAudioChange = (key, value) => {
    const updated = GlobalAudioLifecycleManager.saveSettings({ [key]: value });
    setAudioSettings(updated);
  };

  const handleResetDefaults = () => {
    const updated = resetGraphicsSettingsToDefault();
    setSettings(updated);
    setAudioSettings(
      GlobalAudioLifecycleManager.saveSettings({
        masterVolume: 0.8,
        sfxVolume: 0.9,
        isMuted: false,
      })
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-settings-title"
    >
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl shadow-2xl text-[var(--text-primary)] p-6 space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--accent)]/15 text-[var(--accent)]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 id="game-settings-title" className="text-lg font-bold">
                Game Graphics & Performance
              </h2>
              <p className="text-xs text-[var(--text-muted)] font-mono">
                Platform-wide performance & accessibility controls
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]/40 transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Device Capability Banner */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-xs font-mono">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-[var(--text-secondary)]">Detected Hardware:</span>
          </div>
          <span className="font-bold text-[var(--accent)]">{capabilities.tierLabel}</span>
        </div>

        {/* Graphics Quality Presets */}
        <div className="space-y-3">
          <label className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] block">
            Graphics Quality Preset
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {Object.values(GRAPHICS_PRESETS).map((presetKey) => {
              const meta = PRESET_METADATA[presetKey];
              const isSelected = settings.preset === presetKey;
              return (
                <button
                  key={presetKey}
                  type="button"
                  onClick={() => handlePresetSelect(presetKey)}
                  className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[var(--accent)] bg-[var(--accent)]/10 ring-1 ring-[var(--accent)]'
                      : 'border-[var(--border)] bg-[var(--bg-main)] hover:border-[var(--accent)]/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs">{meta.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[var(--accent)]" />}
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-snug">
                    {meta.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Audio Volume Controls */}
        <div className="space-y-3 border-t border-[var(--border)] pt-4">
          <label className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] block">
            Sound & Audio Engine
          </label>
          <div className="space-y-3 bg-[var(--bg-main)] p-4 rounded-xl border border-[var(--border)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Master Sound</span>
              <button
                type="button"
                onClick={() => handleAudioChange('isMuted', !audioSettings.isMuted)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--border)] text-xs font-mono cursor-pointer"
              >
                {audioSettings.isMuted ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                    <span>Muted</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Active</span>
                  </>
                )}
              </button>
            </div>

            {!audioSettings.isMuted && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-[var(--text-secondary)]">
                  <span>Effects Volume</span>
                  <span>{Math.round((audioSettings.sfxVolume || 0.9) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={audioSettings.sfxVolume ?? 0.9}
                  onChange={(e) => handleAudioChange('sfxVolume', parseFloat(e.target.value))}
                  className="w-full accent-[var(--accent)] cursor-pointer"
                  aria-label="Sound effects volume"
                />
              </div>
            )}
          </div>
        </div>

        {/* Accessibility & Toggles */}
        <div className="space-y-3 border-t border-[var(--border)] pt-4">
          <label className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] block">
            Accessibility & Display
          </label>
          <div className="space-y-2">
            {/* Reduced Motion */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] cursor-pointer hover:border-[var(--accent)]/40">
              <div className="flex items-center gap-3">
                <Eye className="w-4 h-4 text-cyan-400" />
                <div>
                  <span className="text-xs font-bold block">Reduced Motion</span>
                  <span className="text-[11px] text-[var(--text-secondary)] block">
                    Disables screen shake, camera rumble, and high-frequency flashing.
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(settings.reducedMotion)}
                onChange={handleToggleReducedMotion}
                className="w-4 h-4 rounded accent-[var(--accent)] cursor-pointer"
              />
            </label>

            {/* Performance Telemetry HUD */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] cursor-pointer hover:border-[var(--accent)]/40">
              <div className="flex items-center gap-3">
                <Gauge className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="text-xs font-bold block">Live Performance HUD</span>
                  <span className="text-[11px] text-[var(--text-secondary)] block">
                    Displays real-time FPS and frame-time latency during gameplay.
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(settings.showPerfHud)}
                onChange={handleTogglePerfHud}
                className="w-4 h-4 rounded accent-[var(--accent)] cursor-pointer"
              />
            </label>

            {/* Battery Saver */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] cursor-pointer hover:border-[var(--accent)]/40">
              <div className="flex items-center gap-3">
                <BatteryCharging className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="text-xs font-bold block">Battery Saver Mode</span>
                  <span className="text-[11px] text-[var(--text-secondary)] block">
                    Caps particle generation and reduces shadow complexity on mobile/laptops.
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(settings.batterySaver)}
                onChange={handleToggleBatterySaver}
                className="w-4 h-4 rounded accent-[var(--accent)] cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between border-t border-[var(--border)] pt-4">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]/30 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Auto</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-fg)] font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer shadow-md"
          >
            Apply & Done
          </button>
        </div>
      </div>
    </div>
  );
};
