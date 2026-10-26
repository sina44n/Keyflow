import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../common/Button';
import {
  ArrowRight,
  Zap,
  Gauge,
  Target,
  RotateCcw,
  Keyboard,
  HandMetal,
  Sparkles,
} from 'lucide-react';
import { KeyboardGuide } from '../academy/KeyboardGuide';
import { SoundSelector } from '../common/SoundSelector';
import { useKeyboardSound } from '../../context/SoundContext';
import { getGuidePreferences, saveGuidePreferences } from '../../utils/lessonProgress';
import { getCharacterFeedback, countCorrectChars } from '../../utils/typingFeedback';

const SAMPLE_TEXT = 'the quick brown fox jumps over the lazy dog and flows with speed';

export const HeroSection = () => {
  const navigate = useNavigate();
  const [inputVal, setInputVal] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [isCompleted, setIsCompleted] = useState(false);
  const { playClick } = useKeyboardSound();
  const [keyboardGuideOn, setKeyboardGuideOn] = useState(() => getGuidePreferences().keyboardGuide);
  const [handGuideOn, setHandGuideOn] = useState(false);
  const inputRef = useRef(null);

  const currentTargetChar = useMemo(() => {
    if (inputVal.length >= SAMPLE_TEXT.length) return null;
    return SAMPLE_TEXT[inputVal.length];
  }, [inputVal]);

  const toggleKeyboardGuide = () => {
    setKeyboardGuideOn((prev) => {
      const next = !prev;
      saveGuidePreferences(next, handGuideOn);
      return next;
    });
  };

  const toggleHandGuide = () => {
    setHandGuideOn((prev) => {
      const next = !prev;
      saveGuidePreferences(keyboardGuideOn, next);
      return next;
    });
  };

  const handleInputChange = (e) => {
    const val = e.target.value;

    if (val.length > inputVal.length) {
      const charIndex = val.length - 1;
      const isError = val[charIndex] !== SAMPLE_TEXT[charIndex];
      playClick(isError);
    }

    if (!startTime && val.length > 0) {
      setStartTime(Date.now());
    }

    setInputVal(val);

    if (val.length > 0) {
      const elapsedMinutes = startTime ? (Date.now() - startTime) / 60000 : 0.01;
      const wordsTyped = val.length / 5;
      const calculatedWpm = Math.round(wordsTyped / Math.max(elapsedMinutes, 0.01));
      setWpm(calculatedWpm);

      const correctChars = countCorrectChars(val, SAMPLE_TEXT);
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
    <section className="section-spacing pt-8 sm:pt-12 pb-16 relative overflow-hidden">
      {/* Background ambient radial glow */}
      <div
        className="absolute top-1/4 right-1/4 w-[480px] h-[320px] rounded-full blur-[140px] pointer-events-none opacity-15"
        style={{ backgroundColor: 'var(--accent)' }}
        aria-hidden="true"
      />

      <div className="container-app relative z-10 space-y-12 sm:space-y-16">
        {/* Main Balanced 2-Column Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-center">
          {/* Left Column: Value Proposition & CTAs */}
          <div className="lg:col-span-5 space-y-5 text-left">
            {/* Status Chip */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--text-secondary)] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
              <span>Studio Engine v1.0 • 7 Levels</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.12] text-[var(--text-primary)]">
              Type with intuition.<br />
              <span className="text-[var(--accent)]">Flow without friction.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed max-w-lg">
              A masterclass typing education platform engineered to rewire neuromuscular memory, eliminate keyboard glancing, and achieve effortless 100+ WPM velocity.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button
                variant="primary"
                size="md"
                icon={ArrowRight}
                onClick={() => navigate('/workstation')}
              >
                Launch Workstation
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate('/academy')}
              >
                Explore 7-Stage Academy
              </Button>
            </div>

            {/* Micro Highlights */}
            <div className="pt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-mono text-[var(--text-muted)]">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--ui-success)]" />
                <span>0ms Input Latency</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                <span>Zero-Glance Anchoring</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)]" />
                <span>12 Studio Themes</span>
              </span>
            </div>
          </div>

          {/* Right Column: Integrated Tactile Typing Workstation */}
          <div className="lg:col-span-7">
            <div
              id="sandbox"
              className="card-panel p-5 sm:p-6 shadow-xl relative overflow-hidden transition-all duration-200"
            >
              {/* Terminal Titlebar & Metrics Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--border)]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--border)]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--border)]" />
                    <span className="ml-1 text-[11px] font-mono text-[var(--text-muted)] hidden sm:inline">
                      sandbox.terminal
                    </span>
                  </div>

                  <div className="h-4 w-px bg-[var(--border)] hidden sm:block" />

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <span className="text-[10px] uppercase font-mono text-[var(--text-muted)]">WPM</span>
                      <span className="text-base font-bold font-mono text-[var(--text-primary)]">
                        {wpm}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-[var(--ui-success)]" />
                      <span className="text-[10px] uppercase font-mono text-[var(--text-muted)]">ACC</span>
                      <span className="text-base font-bold font-mono text-[var(--text-primary)]">
                        {accuracy}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right controls: KB Guide, Hand Guide, Audio & Reset */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={toggleKeyboardGuide}
                    className={`px-2 py-1 rounded-md border text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer ${
                      keyboardGuideOn
                        ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--bg-elevated)]'
                        : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                    title={keyboardGuideOn ? 'Keyboard Guide ON' : 'Keyboard Guide OFF'}
                    aria-pressed={keyboardGuideOn}
                  >
                    <Keyboard className="w-3 h-3" />
                    <span>KB {keyboardGuideOn ? 'ON' : 'OFF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={toggleHandGuide}
                    className={`px-2 py-1 rounded-md border text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer ${
                      handGuideOn
                        ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--bg-elevated)]'
                        : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                    title={handGuideOn ? 'Hand Guide ON' : 'Hand Guide OFF'}
                    aria-pressed={handGuideOn}
                  >
                    <HandMetal className="w-3 h-3" />
                    <span>Hand {handGuideOn ? 'ON' : 'OFF'}</span>
                  </button>

                  {/* Sound Selector Popover */}
                  <SoundSelector variant="compact" />

                  <Button variant="outline" size="sm" icon={RotateCcw} onClick={handleReset}>
                    Reset
                  </Button>
                </div>
              </div>

              {/* Typing Passage Stream */}
              <div
                onClick={() => inputRef.current && inputRef.current.focus()}
                className="p-4 sm:p-5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] font-mono text-base sm:text-lg leading-relaxed tracking-wide select-none cursor-text min-h-[96px] relative transition-colors"
                role="region"
                aria-label="Live interactive typing passage"
              >
                {SAMPLE_TEXT.split('').map((char, idx) => {
                  const feedback = getCharacterFeedback(idx, inputVal, SAMPLE_TEXT, false);
                  return (
                    <span key={idx} className={feedback.className}>
                      {char}
                    </span>
                  );
                })}

                {/* Invisible input capturing keystrokes */}
                <input
                  ref={inputRef}
                  type="text"
                  value={inputVal}
                  onChange={handleInputChange}
                  className="absolute inset-0 opacity-0 cursor-default"
                  autoFocus
                  aria-label="Type the text passage above"
                />
              </div>

              {/* Synchronized Live Visual Guides */}
              {(keyboardGuideOn || handGuideOn) && (
                <div className="mt-3 p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)] border-b border-[var(--border)] pb-2">
                    <span>Target Key: <strong className="text-[var(--accent)] text-xs font-bold">{currentTargetChar === ' ' ? '⎵ Space' : currentTargetChar ?? '—'}</strong></span>
                    <button
                      type="button"
                      onClick={() => navigate('/workstation')}
                      className="text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Open Full Workstation</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {(keyboardGuideOn || handGuideOn) && (
                    <div className="w-full flex justify-center pt-2">
                      <KeyboardGuide
                        targetChar={currentTargetChar}
                        isVisible={keyboardGuideOn}
                        handGuideVisible={handGuideOn}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Sprint Completed Feedback Card */}
              {isCompleted && (
                <div className="mt-3 p-3.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--accent)] flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[var(--accent)] shrink-0" />
                    <span className="text-xs font-semibold text-[var(--text-primary)]">
                      Sprint finished: <strong>{wpm} WPM</strong> at <strong>{accuracy}% accuracy</strong>!
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleReset}>
                      Retry Sprint
                    </Button>
                    <Button variant="primary" size="sm" icon={ArrowRight} onClick={() => navigate('/workstation')}>
                      Open Full Workstation
                    </Button>
                  </div>
                </div>
              )}

              {/* Workstation Footer Hint */}
              <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
                <span>Click inside terminal to type directly</span>
                <span className="hidden sm:inline">Shortcuts: Tab + Enter to reset</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Core Architecture Pillars Aligned to Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
          <div className="p-4 sm:p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] text-[var(--accent)] flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">0ms Input Latency</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Native keydown event processing with sub-millisecond precision and instant caret repositioning.
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] text-[var(--ui-success)] flex items-center justify-center">
              <Keyboard className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">7-Stage Academy</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Progressive stages from tactile Home Row anchors to programmer bracket syntax and high-speed endurance.
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] text-[var(--accent)] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">12 Studio Themes</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Engineered with CSS custom properties for instant zero-flash switching and persistent profile sync.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
