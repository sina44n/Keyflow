/**
 * KEYFLOW Sound System Modal
 * ==========================
 * Professional-grade keyboard audio studio settings panel.
 * Displays all 20 switch sound profiles, master audio toggle, volume slider,
 * category filters, search, previews, and live selection.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  Volume1,
  Play,
  Check,
  Sparkles,
  Search,
  Command,
} from 'lucide-react';
import { useKeyboardSound } from '../../context/SoundContext';
import { useI18n } from '../../i18n/I18nContext';

export const SoundSystemModal = ({ isOpen, onClose }) => {
  const { t } = useI18n();
  const {
    soundEnabled,
    soundProfile,
    volume = 0.75,
    currentProfileObj,
    isAudible,
    setSoundEnabled,
    setSoundProfile,
    setVolume,
    toggleSound,
    previewSound,
    profiles,
    categories,
  } = useKeyboardSound();

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingPreviewId, setPlayingPreviewId] = useState(null);
  const previewTimerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Clean up preview playing animation timeout
  useEffect(() => {
    return () => {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    };
  }, []);

  const handlePreviewClick = (e, profileId) => {
    e.stopPropagation();
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    setPlayingPreviewId(profileId);
    previewSound(profileId);
    previewTimerRef.current = setTimeout(() => {
      setPlayingPreviewId(null);
    }, 450);
  };

  const handleSelectProfile = (profileId) => {
    setSoundProfile(profileId);
    if (profileId !== 'silent-office' && profileId !== 'silent') {
      previewSound(profileId);
    }
  };

  // Filter profiles based on selected category and search query
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [profiles, activeCategory, searchQuery]);

  if (!isOpen) return null;

  const currentVolumePercent = Math.round((volume ?? 0.75) * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sound-system-title"
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xl overflow-hidden font-mono text-left animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--bg-elevated)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--accent)] shadow-xs">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="sound-system-title"
                  className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] font-mono"
                >
                  {t('sound.systemTitle', 'KEYFLOW Sound System')}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] font-semibold">
                  {profiles.length} Profiles
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {t('sound.systemSubtitle', 'Tactile acoustic switch profiles & physical typing feedback')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors cursor-pointer"
            aria-label="Close Sound System"
            title="Close Sound System (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Master Controls Strip: Master Audio Toggle + Output Volume Slider */}
        <div className="p-4 bg-[var(--bg-main)] border-b border-[var(--border)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 shrink-0">
          {/* Master Sound On/Off Toggle Button */}
          <button
            type="button"
            onClick={() => {
              if (!soundEnabled) {
                setSoundEnabled(true);
                if (soundProfile === 'silent-office' || soundProfile === 'silent') {
                  setSoundProfile('mechanical-blue');
                }
              } else {
                setSoundEnabled(false);
              }
            }}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none shrink-0 ${
              isAudible
                ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)] shadow-xs'
                : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:border-[var(--text-secondary)]'
            }`}
            aria-label={`Toggle keyboard sound: currently ${isAudible ? 'ENABLED' : 'MUTED'}`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isAudible ? 'bg-[var(--accent-fg)] animate-pulse' : 'bg-[var(--text-muted)]'
              }`}
            />
            <span>
              {isAudible
                ? t('sound.statusEnabled', 'Sound: ENABLED')
                : t('sound.statusMuted', 'Sound: MUTED')}
            </span>
          </button>

          {/* Volume Control Slider */}
          <div className="flex items-center gap-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-3.5 py-1.5 flex-1 min-w-[200px]">
            {isAudible ? (
              volume > 0.5 ? (
                <Volume2 className="w-4 h-4 text-[var(--accent)] shrink-0" />
              ) : (
                <Volume1 className="w-4 h-4 text-[var(--accent)] shrink-0" />
              )
            ) : (
              <VolumeX className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
            )}

            <div className="flex-1 flex flex-col justify-center">
              <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] mb-0.5">
                <span>{t('sound.outputVolume', 'Master Volume')}</span>
                <span className="font-bold text-[var(--text-primary)]">{currentVolumePercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume ?? 0.75}
                onChange={(e) => {
                  const newVol = parseFloat(e.target.value);
                  setVolume(newVol);
                }}
                className="w-full accent-[var(--accent)] cursor-pointer h-1.5 bg-[var(--border)] rounded-lg appearance-none"
                aria-label="Master volume level"
              />
            </div>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="p-3.5 border-b border-[var(--border)] bg-[var(--bg-surface)] flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[11px] overflow-x-auto scrollbar-none">
            {categories.map((cat) => {
              const isCatActive = activeCategory === cat.id;
              const count = cat.id === 'all'
                ? profiles.length
                : profiles.filter((p) => p.category === cat.id).length;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    isCatActive
                      ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-bold shadow-xs border border-[var(--border)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`text-[9px] px-1 rounded-md ${isCatActive ? 'bg-[var(--accent)]/15 text-[var(--accent)]' : 'opacity-60'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[140px] flex-1 sm:max-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search switches..."
              className="w-full pl-8 pr-7 py-1 text-xs rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-[var(--accent)] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Active Switch Status Banner */}
        <div className="px-4 py-2.5 bg-[var(--bg-elevated)]/60 border-b border-[var(--border)] flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider shrink-0">
              Active Switch:
            </span>
            <span className="font-bold text-[var(--text-primary)] truncate">
              {currentProfileObj.name}
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded font-medium border bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-subtle)] shrink-0 uppercase">
              {currentProfileObj.tag}
            </span>
          </div>

          <span className="text-[10px] text-[var(--text-muted)] hidden sm:inline shrink-0">
            {isAudible ? 'Synchronized across all typing interfaces' : 'Muted'}
          </span>
        </div>

        {/* 20 Switch Profiles Scrollable Grid */}
        <div className="p-3.5 overflow-y-auto space-y-1.5 flex-1 [scrollbar-width:thin]">
          {filteredProfiles.length === 0 ? (
            <div className="py-12 text-center text-[var(--text-muted)] text-xs">
              No keyboard sound profiles match "{searchQuery}" in this category.
            </div>
          ) : (
            filteredProfiles.map((p) => {
              const isSelected = soundProfile === p.id;
              const isSilent = p.id === 'silent-office' || p.id === 'silent';
              const isPreviewing = playingPreviewId === p.id;

              return (
                <div
                  key={p.id}
                  onClick={() => handleSelectProfile(p.id)}
                  className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--bg-elevated)] border-[var(--accent)] text-[var(--text-primary)] shadow-xs'
                      : 'border-[var(--border-subtle)] hover:border-[var(--border)] hover:bg-[var(--bg-elevated)]/40 text-[var(--text-secondary)]'
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectProfile(p.id);
                    }
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-3 flex-1">
                    {/* Radio Indicator */}
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'border-[var(--accent)] bg-[var(--accent)]'
                          : 'border-[var(--border)] group-hover:border-[var(--text-muted)]'
                      }`}
                    >
                      {isSelected && (
                        <Check className="w-2.5 h-2.5 text-[var(--accent-fg)] stroke-[3]" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-[var(--text-primary)]">
                          {p.name}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-semibold border uppercase ${
                            isSilent
                              ? 'bg-red-500/10 text-red-400 border-red-500/20'
                              : isSelected
                              ? 'bg-[var(--accent)]/15 text-[var(--accent)] border-[var(--accent)]/30'
                              : 'bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-subtle)]'
                          }`}
                        >
                          {p.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5 line-clamp-1">
                        {p.description}
                      </p>
                    </div>
                  </div>

                  {/* Preview Button or Mute Label */}
                  {!isSilent ? (
                    <button
                      type="button"
                      onClick={(e) => handlePreviewClick(e, p.id)}
                      title={`Preview ${p.name}`}
                      aria-label={`Preview ${p.name} sound`}
                      className={`w-8 h-8 rounded-xl transition-all shrink-0 flex items-center justify-center cursor-pointer border ${
                        isPreviewing
                          ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)] scale-110 shadow-xs'
                          : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] hover:bg-[var(--bg-main)]'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  ) : (
                    <span
                      title="Silent profile — produces no sound"
                      className="text-[10px] text-[var(--text-muted)] px-2 py-1 rounded-md bg-[var(--bg-main)] border border-[var(--border-subtle)] shrink-0 font-semibold"
                    >
                      Mute
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-[var(--border)] bg-[var(--bg-elevated)] flex flex-wrap items-center justify-between text-xs text-[var(--text-muted)] shrink-0">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="text-[11px]">
              {t('sound.realtimePhysical', 'Physical acoustic modeling with zero latency')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border)] text-[10px] font-mono">
              Alt + U to toggle
            </kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border)] text-[10px] font-mono">
              Esc to close
            </kbd>
          </div>
        </div>
      </div>
    </div>
  );
};
