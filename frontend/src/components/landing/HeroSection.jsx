import React, { useState, useRef } from 'react';
import { Button } from '../common/Button';
import {
  Sparkles,
  ArrowRight,
  Zap,
  Gauge,
  Target,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';

const SAMPLE_TEXT = 'the quick brown fox jumps over the lazy dog and flows with speed';

export const HeroSection = () => {
  const [inputVal, setInputVal] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [isCompleted, setIsCompleted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const inputRef = useRef(null);

  // Play subtle mechanical click audio using Web Audio API
  const playClick = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } catch {
      // Audio context not allowed or failed
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    playClick();

    if (!startTime && val.length > 0) {
      setStartTime(Date.now());
    }

    setInputVal(val);

    // Calculate real-time metrics
    if (val.length > 0) {
      const elapsedMinutes = startTime ? (Date.now() - startTime) / 60000 : 0.01;
      const wordsTyped = val.length / 5;
      const calculatedWpm = Math.round(wordsTyped / Math.max(elapsedMinutes, 0.01));
      setWpm(calculatedWpm);

      let correctChars = 0;
      for (let i = 0; i < val.length; i++) {
        if (val[i] === SAMPLE_TEXT[i]) correctChars++;
      }
      const acc = Math.round((correctChars / val.length) * 100);
      setAccuracy(acc);
    }

    if (val.length >= SAMPLE_TEXT.length) {
      setIsCompleted(true);
    }
  };

  const handleReset = () => {
    setInputVal('');
    setStartTime(null);
    setWpm(0);
    setAccuracy(100);
    setIsCompleted(false);
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <section className="relative pt-12 pb-20 overflow-hidden">
      {/* Background radial gradient glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] rounded-full blur-[120px] pointer-events-none opacity-20"
        style={{ backgroundColor: 'var(--accent)' }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Top Pill Announcement */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--text-secondary)] shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping" />
            <span className="font-medium text-[var(--text-primary)]">KEYFLOW v1.0 Live</span>
            <span className="text-[var(--border)]">|</span>
            <span className="text-[var(--text-muted)]">7 Levels • 3 Arcade Games • 12 Themes</span>
          </div>
        </div>

        {/* Main Headline */}
        <div className="text-center max-w-4xl mx-auto mb-10 space-y-4">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] text-[var(--text-primary)]">
            Type with intuition.{' '}
            <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] bg-clip-text text-transparent underline decoration-[var(--accent)]/40 decoration-wavy decoration-2">
              Flow without friction.
            </span>
          </h1>
          <p className="text-base sm:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
            The next-generation typing academy designed to rewire motor memory, eliminate
            glance habits, and reach 100+ WPM through deliberate neuromuscular conditioning.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <Button
              variant="primary"
              size="lg"
              icon={ArrowRight}
              onClick={() => {
                if (inputRef.current) inputRef.current.focus();
              }}
            >
              Test Your Speed Now
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                const el = document.getElementById('curriculum');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Explore 7-Level Academy
            </Button>
          </div>
        </div>

        {/* Interactive Typing Sandbox Teaser */}
        <div
          id="sandbox"
          className="max-w-3xl mx-auto rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xl p-6 sm:p-8 transition-all hover:border-[var(--accent)]/60"
        >
          {/* Teaser Header & Metrics Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-[var(--border)]">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-[var(--accent)]" />
                <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-mono">
                  WPM:
                </span>
                <span className="text-xl font-bold font-mono text-[var(--text-primary)]">
                  {wpm}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[var(--ui-success)]" />
                <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-mono">
                  Accuracy:
                </span>
                <span className="text-xl font-bold font-mono text-[var(--text-primary)]">
                  {accuracy}%
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                  soundEnabled
                    ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--bg-elevated)]'
                    : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
                title={soundEnabled ? 'Mechanical audio ON' : 'Mechanical audio OFF'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span className="text-[10px] hidden sm:inline">Audio</span>
              </button>
              <Button variant="outline" size="sm" icon={RotateCcw} onClick={handleReset}>
                Reset
              </Button>
            </div>
          </div>

          {/* Typing Stream Display */}
          <div
            onClick={() => inputRef.current && inputRef.current.focus()}
            className="p-5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] font-mono text-lg sm:text-xl leading-relaxed tracking-wider select-none cursor-text min-h-[100px] relative transition-colors"
          >
            {SAMPLE_TEXT.split('').map((char, idx) => {
              let charClass = 'text-[var(--typing-untyped)]';
              if (idx < inputVal.length) {
                if (inputVal[idx] === char) {
                  charClass = 'text-[var(--typing-correct)]';
                } else {
                  charClass = 'text-[var(--typing-incorrect)] bg-[var(--typing-incorrect)]/20 rounded-xs';
                }
              } else if (idx === inputVal.length) {
                charClass = 'text-[var(--text-primary)] border-b-2 border-[var(--typing-caret)] animate-pulse';
              }
              return (
                <span key={idx} className={charClass}>
                  {char}
                </span>
              );
            })}

            {/* Hidden Input field for capture */}
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={handleInputChange}
              className="absolute inset-0 opacity-0 cursor-default"
              autoFocus
              aria-label="Live typing sandbox"
            />
          </div>

          {/* Completion Banner */}
          {isCompleted && (
            <div className="mt-4 p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--accent)] flex items-center justify-between gap-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--accent)]" />
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  Sprint Complete! {wpm} WPM at {accuracy}% precision.
                </span>
              </div>
              <Button variant="primary" size="sm" onClick={handleReset}>
                Try Again
              </Button>
            </div>
          )}

          {/* Instruction hint */}
          <div className="mt-4 flex items-center justify-between text-xs text-[var(--text-muted)] font-mono">
            <span>Click inside to test real-time tactile response</span>
            <span className="hidden sm:inline">Supports mechanical key audio feedback</span>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] text-[var(--accent)] flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">0ms Input Latency</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Native keydown event processing with sub-millisecond precision and instant caret repositioning.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] text-[var(--ui-success)] flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Neuromuscular Curriculum</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              7 scientific stages from Home Row foundation to programmer bracket ergonomics and blind endurance.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] text-[var(--accent)] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">12 Curated Themes</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Engineered with CSS custom properties for instant zero-flash switching and persistent profile sync.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
