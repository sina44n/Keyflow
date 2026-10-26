import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Play, ChevronDown, Check, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useKeyboardSound } from '../../context/SoundContext';

/**
 * SoundSelector — Tactical Keyboard Sound Studio Popover
 * =========================================================
 * Displays a trigger button in place of the existing volume icon.
 * Clicking opens a compact, theme-aware studio popover with:
 * - 16 acoustic switch sound profiles across 3 collections
 * - Category filter tabs (All, Mechanical, Desk Setup, Experimental)
 * - Dedicated preview buttons for every sound profile
 * - Independent master sound enabled/disabled toggle
 * - Explicit Silent Office profile with mute protection
 */
export const SoundSelector = ({
  variant = 'default', // 'navbar' | 'toolbar' | 'compact' | 'default'
  align = 'right', // 'left' | 'right'
  className = '',
}) => {
  const {
    soundEnabled,
    soundProfile,
    currentProfileObj,
    isAudible,
    setSoundEnabled,
    setSoundProfile,
    previewSound,
    profiles,
    categories,
  } = useKeyboardSound();

  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [playingPreviewId, setPlayingPreviewId] = useState(null);
  const containerRef = useRef(null);
  const previewTimerRef = useRef(null);

  // Close on Escape or click outside
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

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
    }, 400);
  };

  // Filter profiles based on selected category tab
  const filteredProfiles = activeCategory === 'all'
    ? profiles
    : profiles.filter((p) => p.category === activeCategory);

  // Render trigger button matching existing UI styling in each context
  const renderTriggerButton = () => {
    if (variant === 'navbar') {
      return (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          title={`Keyboard Sound Studio: ${isAudible ? currentProfileObj.name : 'Muted'} (Click to configure)`}
          aria-label={`Keyboard Sound Studio: ${isAudible ? currentProfileObj.name : 'Muted'}. Click to configure sound profiles.`}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          className={`p-1.5 sm:p-2 rounded-lg transition-colors cursor-pointer hidden sm:flex items-center justify-center relative ${className}`}
          style={{
            color: isAudible ? 'var(--accent, #06b6d4)' : 'var(--text-muted)',
          }}
        >
          {isAudible ? (
            <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          )}
          {isOpen && (
            <span
              className="absolute -bottom-1 w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--accent, #06b6d4)' }}
            />
          )}
        </button>
      );
    }

    if (variant === 'toolbar') {
      return (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`p-1.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
            isAudible
              ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--bg-elevated)]'
              : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          } ${className}`}
          title={`Keyboard Sound Studio: ${isAudible ? currentProfileObj.name : 'Muted'}`}
          aria-label={`Keyboard sound options: ${isAudible ? currentProfileObj.name : 'Muted'}`}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
        >
          {isAudible ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      );
    }

    if (variant === 'compact') {
      return (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`px-2 py-1 rounded-md border text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
            isAudible
              ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--bg-elevated)]'
              : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          } ${className}`}
          title={`Keyboard Sound Studio: ${isAudible ? currentProfileObj.name : 'OFF'}`}
          aria-label={`Keyboard sound options: ${isAudible ? currentProfileObj.name : 'OFF'}`}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
        >
          {isAudible ? (
            <Volume2 className="w-3.5 h-3.5 text-[var(--accent)]" />
          ) : (
            <VolumeX className="w-3.5 h-3.5" />
          )}
          <span className="text-[10px] hidden sm:inline font-mono">
            {isAudible ? currentProfileObj.tag : 'OFF'}
          </span>
          <ChevronDown className={`w-2.5 h-2.5 opacity-60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      );
    }

    // Default trigger
    return (
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--accent)] text-xs font-mono transition-all cursor-pointer ${
          isAudible ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
        } ${className}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="Keyboard sound studio"
      >
        {isAudible ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        <span>{isAudible ? currentProfileObj.name : 'Muted'}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
    );
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      {renderTriggerButton()}

      {/* Popover Flyout Menu */}
      {isOpen && (
        <div
          className={`absolute z-50 ${
            align === 'left' ? 'left-0' : 'right-0'
          } top-full mt-2 w-80 sm:w-96 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xl p-3.5 font-mono animate-in fade-in zoom-in-95 duration-150 select-none text-left`}
          role="dialog"
          aria-label="Keyboard Sound Studio"
        >
          {/* Header with Title and Dedicated Sound Toggle */}
          <div className="flex items-center justify-between pb-3 mb-2.5 border-b border-[var(--border)]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--accent)] shadow-xs">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider font-mono">
                    Sound Studio
                  </h3>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] font-semibold">
                    16 Profiles
                  </span>
                </div>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                  {isAudible ? (
                    <span className="flex items-center gap-1">
                      <span className="text-[var(--text-secondary)] font-medium">{currentProfileObj.name}</span>
                      <span className="opacity-50">•</span>
                      <span>{currentProfileObj.tag}</span>
                    </span>
                  ) : (
                    'Typing Audio Muted'
                  )}
                </p>
              </div>
            </div>

            {/* Dedicated On/Off Toggle Button */}
            <button
              type="button"
              onClick={() => {
                if (!soundEnabled) {
                  setSoundEnabled(true);
                  // If switching ON while currently on silent-office, select Mechanical Blue
                  if (soundProfile === 'silent-office' || soundProfile === 'silent') {
                    setSoundProfile('mechanical-blue');
                  }
                } else {
                  setSoundEnabled(false);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold font-mono transition-all cursor-pointer ${
                isAudible
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)] shadow-xs'
                  : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:border-[var(--text-secondary)]'
              }`}
              aria-label={`Toggle keyboard sound: currently ${isAudible ? 'ON' : 'OFF'}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isAudible ? 'bg-[var(--accent-fg)] animate-pulse' : 'bg-[var(--text-muted)]'
                }`}
              />
              <span>{isAudible ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1 p-1 mb-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-subtle)] text-[10px] font-medium overflow-x-auto">
            {categories.map((cat) => {
              const isCatActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-2 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    isCatActive
                      ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-bold shadow-xs border border-[var(--border)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Sound Profiles Scrollable List */}
          <div className="space-y-1 max-h-[340px] sm:max-h-[380px] overflow-y-auto pr-1">
            {filteredProfiles.map((p) => {
              const isSelected = soundProfile === p.id;
              const isSilent = p.id === 'silent-office' || p.id === 'silent';
              const isPreviewing = playingPreviewId === p.id;

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setSoundProfile(p.id);
                    if (!isSilent) {
                      previewSound(p.id);
                    }
                  }}
                  className={`group flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--bg-elevated)] border-[var(--accent)] text-[var(--text-primary)] shadow-xs'
                      : 'border-transparent hover:bg-[var(--bg-elevated)]/60 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSoundProfile(p.id);
                      if (!isSilent) previewSound(p.id);
                    }
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    {/* Radio indicator */}
                    <div
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'border-[var(--accent)] bg-[var(--accent)]'
                          : 'border-[var(--border)] group-hover:border-[var(--text-muted)]'
                      }`}
                    >
                      {isSelected && (
                        <Check className="w-2.5 h-2.5 text-[var(--accent-fg)] stroke-[3]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold truncate text-[var(--text-primary)]">
                          {p.name}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-medium border uppercase ${
                          isSilent
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-subtle)]'
                        }`}>
                          {p.tag}
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">
                        {p.description}
                      </p>
                    </div>
                  </div>

                  {/* Preview Button or Mute Indicator */}
                  {!isSilent ? (
                    <button
                      type="button"
                      onClick={(e) => handlePreviewClick(e, p.id)}
                      title={`Preview ${p.name}`}
                      aria-label={`Preview ${p.name} sound`}
                      className={`p-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${
                        isPreviewing
                          ? 'bg-[var(--accent)] text-[var(--accent-fg)] scale-110'
                          : 'text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-main)]'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  ) : (
                    <span
                      title="Silent profile — no audio playback"
                      className="text-[10px] text-[var(--text-muted)] px-1.5 py-0.5 rounded bg-[var(--bg-main)] border border-[var(--border-subtle)] shrink-0"
                    >
                      Mute
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer note with keyboard shortcut */}
          <div className="mt-2.5 pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px] text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[var(--accent)]" />
              <span>Plays on valid keystrokes</span>
            </span>
            <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border)] text-[9px]">
              Esc to close
            </kbd>
          </div>
        </div>
      )}
    </div>
  );
};
