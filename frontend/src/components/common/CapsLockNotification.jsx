import React, { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/**
 * useCapsLock
 * Custom hook providing real-time, browser-native Caps Lock modifier detection.
 * Uses KeyboardEvent.getModifierState('CapsLock') on window keydown and keyup.
 * Also checks MouseEvent/PointerEvent modifier state on interactions.
 */
export function useCapsLock() {
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);

  useEffect(() => {
    const updateState = (e) => {
      if (e && typeof e.getModifierState === 'function') {
        const state = Boolean(e.getModifierState('CapsLock'));
        setIsCapsLockOn((prev) => (prev !== state ? state : prev));
      }
    };

    const handleCustomSync = (e) => {
      if (e && e.detail !== undefined) {
        const state = Boolean(e.detail);
        setIsCapsLockOn((prev) => (prev !== state ? state : prev));
      }
    };

    window.addEventListener('keydown', updateState, { capture: true, passive: true });
    window.addEventListener('keyup', updateState, { capture: true, passive: true });
    window.addEventListener('pointerdown', updateState, { capture: true, passive: true });
    window.addEventListener('keyflow-capslock-sync', handleCustomSync);

    return () => {
      window.removeEventListener('keydown', updateState, { capture: true });
      window.removeEventListener('keyup', updateState, { capture: true });
      window.removeEventListener('pointerdown', updateState, { capture: true });
      window.removeEventListener('keyflow-capslock-sync', handleCustomSync);
    };
  }, []);

  return isCapsLockOn;
}

/**
 * CapsLockNotification
 * Reusable, theme-aware floating Caps Lock notification pill.
 * Follows exact Reference Image 5 design:
 * - Compact pill-shaped container (`rounded-full`)
 * - Small lock icon with solid fill
 * - Clear, readable typography ("Caps Lock ON")
 * - Zero layout shift guaranteed via absolute positioning and pointer-events-none
 * - Dynamic theme adaptation for all 16 dark, light, and colored KEYFLOW themes
 */
export const CapsLockNotification = React.memo(function CapsLockNotification({
  className = '',
  forceShow = false,
  id = 'caps-lock-notification',
  'data-testid': testId = 'caps-lock-notification',
}) {
  const systemCapsLock = useCapsLock();
  const isCapsLockOn = forceShow || systemCapsLock;
  const { currentThemeObj } = useTheme();
  const isDark = currentThemeObj?.mode === 'dark';

  return (
    <div
      id={id}
      data-testid={testId}
      data-active={isCapsLockOn ? 'true' : 'false'}
      role="status"
      aria-live="polite"
      aria-hidden={!isCapsLockOn}
      className={`absolute z-30 pointer-events-none select-none transition-all duration-200 ease-out ${
        isCapsLockOn
          ? 'opacity-100 scale-100 translate-y-0'
          : 'opacity-0 scale-95 translate-y-1'
      } ${className}`}
      style={{
        pointerEvents: 'none',
      }}
    >
      <div
        className={`capslock-notification-pill inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold tracking-wide shadow-md transition-colors duration-200 ${
          isDark
            ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border)] shadow-black/50'
            : 'bg-[var(--text-primary)] text-[var(--bg-main)] border border-transparent shadow-black/25'
        }`}
      >
        <Lock
          className={`w-3.5 h-3.5 shrink-0 stroke-[2.4] ${
            isDark ? 'text-[var(--accent)] fill-current' : 'text-[var(--bg-main)] fill-current'
          }`}
          aria-hidden="true"
        />
        <span className="font-sans leading-none pt-0.5 whitespace-nowrap">Caps Lock ON</span>
      </div>
    </div>
  );
});

export default CapsLockNotification;
