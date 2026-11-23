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
import { CapsLockNotification } from '../common/CapsLockNotification';
import { SoundSelector } from '../common/SoundSelector';
import { useKeyboardSound } from '../../context/SoundContext';
import { useI18n } from '../../i18n/I18nContext';
import { getGuidePreferences, saveGuidePreferences } from '../../utils/lessonProgress';
import {
  getCharacterFeedback,
  countCorrectChars,
  calculateGrossWpm,
  calculateNetWpm,
  calculateRawAccuracy,
  countUncorrectedErrors,
} from '../../utils/typingFeedback';
import { useUniversalTypingFocus } from '../../utils/useUniversalTypingFocus';
import { STAGE_META } from '../../data/curriculumEngine';

const SAMPLE_TEXT = 'the quick brown fox jumps over the lazy dog and flows with speed';

export const HeroSection = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const totalStages = STAGE_META?.length ?? 0;
  const [inputVal, setInputVal] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [wpm, setWpm] = useState(0);
  const [grossWpm, setGrossWpm] = useState(0);
  const [netWpm, setNetWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [correctStrokes, setCorrectStrokes] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [backspaces, setBackspaces] = useState(0);
  const [correctedIndices, setCorrectedIndices] = useState(() => new Set());
  const [isCompleted, setIsCompleted] = useState(false);
  const { playClick } = useKeyboardSound();
  const [keyboardGuideOn, setKeyboardGuideOn] = useState(() => getGuidePreferences().keyboardGuide);
  const [handGuideOn, setHandGuideOn] = useState(() => getGuidePreferences().handGuide);
  const [lastKeystroke, setLastKeystroke] = useState(null);
  const inputRef = useRef(null);

  const targetChars = useMemo(() => SAMPLE_TEXT.split(''), []);

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
    let addedCorrect = 0;
    let addedMistakes = 0;

    if (val.length > inputVal.length) {
      for (let i = inputVal.length; i < val.length; i++) {
        const actualChar = val[i];
        const isError = actualChar !== SAMPLE_TEXT[i];
        if (isError) {
          addedMistakes += 1;
          setCorrectedIndices((prev) => new Set(prev).add(i));
        } else {
          addedCorrect += 1;
        }
      }
      playClick(addedMistakes > 0);
      setLastKeystroke({ key: val[val.length - 1], code: '', id: performance.now() });
    } else if (val.length < inputVal.length) {
      const addedBackspaces = inputVal.length - val.length;
      playClick(false);
      setBackspaces((b) => b + addedBackspaces);
      setLastKeystroke({ key: 'backspace', code: 'Backspace', id: performance.now() });
    }

    const now = Date.now();
    const effectiveStart = startTime || now;
    if (!startTime && val.length > 0) {
      setStartTime(now);
    }

    const newCorrect = correctStrokes + addedCorrect;
    const newMistakes = mistakes + addedMistakes;
    if (addedCorrect > 0) setCorrectStrokes(newCorrect);
    if (addedMistakes > 0) setMistakes(newMistakes);

    setInputVal(val);

    const totalValid = newCorrect + newMistakes;
    const elapsedSec = (now - effectiveStart) / 1000;

    if (totalValid > 0 && elapsedSec >= 0.5) {
      const gross = calculateGrossWpm(totalValid, elapsedSec);
      const uncorrected = countUncorrectedErrors(val, SAMPLE_TEXT);
      const net = calculateNetWpm(gross, uncorrected, elapsedSec);
      setGrossWpm(gross);
      setNetWpm(net);
      setWpm(gross);

      const acc = calculateRawAccuracy(newCorrect, newMistakes);
      setAccuracy(acc);
    } else if (totalValid > 0) {
      const acc = calculateRawAccuracy(newCorrect, newMistakes);
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
    setGrossWpm(0);
    setNetWpm(0);
    setAccuracy(100);
    setCorrectStrokes(0);
    setMistakes(0);
    setBackspaces(0);
    setCorrectedIndices(new Set());
    setIsCompleted(false);
    setLastKeystroke(null);
    if (inputRef.current) inputRef.current.focus();
  };

  // Universal Typing Input Focus: immediate typing readiness without requiring a click
  useUniversalTypingFocus({
    inputRef,
    isActive: !isCompleted,
    disabled: isCompleted,
    onKeystroke: (k) => setLastKeystroke(k),
    onDirectInput: (val) => handleInputChange({ target: { value: val } }),
  });

  return (
    <section className="section-spacing pt-8 sm:pt-12 pb-16 relative overflow-hidden">
      {/* Background ambient radial glow */}
      <div
        className="absolute top-1/4 right-1/4 w-[480px] h-[320px] rounded-full blur-[140px] pointer-events-none opacity-15"
        style={{ backgroundColor: 'var(--accent)' }}
        aria-hidden="true"
      />

      <div className="container-app relative z-10 space-y-12 sm:space-y-16">
        {/* Main Balanced 2-Column Hero Grid (anchored with items-start to eliminate vertical layout shift when typing results appear) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-start">
          {/* Left Column: Value Proposition & CTAs */}
          <div className="lg:col-span-5 space-y-6 text-left lg:pt-[112px] xl:pt-[135px]">
            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.12] text-[var(--text-primary)]">
              {t('hero.title', 'Type with intuition.')}<br />
              <span className="text-[var(--accent)]">{t('hero.titleAccent', 'Flow without friction.')}</span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed max-w-lg">
              {t('hero.subtitle', 'A masterclass typing education platform engineered to rewire neuromuscular memory, eliminate keyboard glancing, and achieve effortless 100+ WPM velocity.')}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button
                variant="primary"
                size="md"
                icon={ArrowRight}
                onClick={() => navigate('/workstation')}
              >
                {t('hero.launchWorkstation', 'Launch Workstation')}
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate('/academy')}
              >
                {t('hero.exploreAcademy', { count: totalStages }, `Explore ${totalStages}-Stage Academy`)}
              </Button>
            </div>
          </div>

          {/* Right Column: Integrated Tactile Typing Workstation */}
          <div className="lg:col-span-7">
            <div
              id="sandbox"
              className="card-panel p-4 sm:p-6 shadow-xl relative overflow-visible transition-all duration-280 ease-[cubic-bezier(0.22,1,0.36,1)]"
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
                    <span>{t('hero.kbGuide', 'KB')} {keyboardGuideOn ? t('common.on', 'ON') : t('common.off', 'OFF')}</span>
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
                    <span>{t('hero.handGuide', 'Hand')} {handGuideOn ? t('common.on', 'ON') : t('common.off', 'OFF')}</span>
                  </button>

                  {/* Sound Selector Popover */}
                  <SoundSelector variant="compact" align="auto" />

                  <Button variant="outline" size="sm" icon={RotateCcw} onClick={handleReset}>
                    {t('common.restart', 'Reset')}
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
                {targetChars.map((char, idx) => {
                  const feedback = getCharacterFeedback(idx, inputVal, SAMPLE_TEXT, false, correctedIndices);
                  return (
                    <span key={idx} className={`${feedback.className} typing-char`}>
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
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') return;
                    if (e.key === 'Tab') return;
                    setLastKeystroke({ key: e.key, code: e.code, id: performance.now() });
                  }}
                  className="absolute inset-0 opacity-0 cursor-default"
                  autoFocus
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  aria-label="Type the text passage above"
                />
              </div>

              {/* Synchronized Live Visual Guides */}
              {(keyboardGuideOn || handGuideOn) && (
                <div className="mt-3 p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] space-y-3 animate-in fade-in duration-240 ease-[cubic-bezier(0.22,1,0.36,1)]">
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
                    <div className="w-full flex justify-center pt-2 relative">
                      <div className="relative w-full max-w-[820px]">
                        <CapsLockNotification
                          className="left-0 -top-2.5 sm:-top-3"
                          id="hero-capslock-notification"
                          data-testid="hero-capslock-notification"
                        />
                        <KeyboardGuide
                          targetChar={currentTargetChar}
                          lastKeystroke={lastKeystroke}
                          isVisible={keyboardGuideOn}
                          handGuideVisible={handGuideOn}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Sprint Completed Feedback Card */}
              {isCompleted && (
                <div className="mt-3 p-3.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--accent)] flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-240 ease-[cubic-bezier(0.22,1,0.36,1)]">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[var(--accent)] shrink-0" />
                    <span className="text-xs font-semibold text-[var(--text-primary)]">
                      Sprint finished: <strong>{netWpm > 0 && netWpm !== grossWpm ? `${netWpm} Net WPM (${grossWpm} Gross)` : `${wpm} WPM`}</strong> at <strong>{accuracy}% accuracy</strong>!
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
                <span>{t('workstation.clickToFocus', 'Click inside terminal to type directly')}</span>
                <span className="hidden sm:inline">{t('footer.shortcuts', 'Shortcuts:')} Tab + Enter</span>
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
            <h3 className="text-sm font-bold text-[var(--text-primary)]">{t('features.card2.title', 'Sub-Millisecond Engine')}</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {t('features.card2.desc', 'Native keydown event processing with sub-millisecond precision and instant caret repositioning.')}
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] text-[var(--ui-success)] flex items-center justify-center">
              <Keyboard className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">{t('features.card1.title', { count: totalStages }, `${totalStages}-Stage Academy`)}</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {t('features.card1.desc', 'Progressive multi-tiered curriculum targeting finger isolation, spatial mapping, and blind motor confidence.')}
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] text-[var(--accent)] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">{t('nav.themes', 'Studio Themes')}</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {t('features.card4.desc', 'Tailored palettes tested for high-contrast legibility and zero visual fatigue during prolonged 3-hour focus sprints.')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
