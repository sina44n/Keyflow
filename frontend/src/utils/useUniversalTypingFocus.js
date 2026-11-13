/**
 * KEYFLOW — Universal Typing Input Focus Hook
 * ============================================
 * Provides reliable, immediate typing readiness across all typing environments
 * (Workstation, Academy LessonPlayer, Home HeroSection) without requiring users
 * to click inside the typing area first.
 *
 * Design Principles:
 * 1. Proactive Readiness: Focuses the typing input automatically on mount and window focus.
 * 2. Non-Disruptive Background Focus: Restores focus when user clicks non-interactive areas.
 * 3. Keystroke Interception: Instantly routes typing keys to the input if not already focused.
 * 4. Zero Interference: Respects user focus when typing into real form fields, modals, or dropdowns.
 * 5. Shortcut Preservation: Never steals or blocks Ctrl, Alt, Meta, Escape, or function key shortcuts.
 */

import { useEffect, useCallback, useRef } from 'react';

/**
 * Determines whether a DOM element is an interactive control that should retain focus.
 * @param {Element|null} el
 * @returns {boolean}
 */
export function isInteractiveElement(el) {
  if (!el || typeof el !== 'object') return false;
  if (typeof Element !== 'undefined' && !(el instanceof Element)) return false;

  const tag = (el.tagName || '').toUpperCase();

  // Form controls & text inputs
  if (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    el.isContentEditable ||
    el.getAttribute('role') === 'textbox' ||
    el.getAttribute('role') === 'searchbox' ||
    el.getAttribute('role') === 'combobox'
  ) {
    return true;
  }

  // Buttons, links, menu items, tabs, dialogs
  if (
    tag === 'BUTTON' ||
    tag === 'A' ||
    el.closest('button, a, [role="button"], [role="menuitem"], [role="tab"], [role="option"]')
  ) {
    return true;
  }

  // Inside modal containers or dialogs
  if (el.closest('dialog, [role="dialog"], [aria-modal="true"], .modal-container')) {
    return true;
  }

  return false;
}

/**
 * Universal typing focus hook.
 *
 * @param {Object} options
 * @param {React.RefObject} options.inputRef - Ref pointing to the underlying input/textarea element
 * @param {boolean} [options.isActive=true] - Whether the typing environment is currently active
 * @param {boolean} [options.disabled=false] - Whether typing is currently disabled (e.g. paused/completed)
 * @param {Function} [options.onFocusStateChange] - Optional callback when focus changes
 */
export function useUniversalTypingFocus({
  inputRef,
  isActive = true,
  disabled = false,
  onFocusStateChange = null,
}) {
  const isFocusedRef = useRef(false);

  // Safe helper to focus input without unwanted page scroll jumps
  const focusInput = useCallback(() => {
    if (!isActive || disabled || !inputRef?.current) return;

    const activeEl = document.activeElement;
    // Do not steal focus if user is intentionally inside another input or interactive element
    if (activeEl && activeEl !== inputRef.current && isInteractiveElement(activeEl)) {
      return;
    }

    try {
      inputRef.current.focus({ preventScroll: true });
      isFocusedRef.current = true;
      if (onFocusStateChange) onFocusStateChange(true);
    } catch {
      // Ignore any transient browser focus errors
    }
  }, [isActive, disabled, inputRef, onFocusStateChange]);

  // 1. Proactive auto-focus on mount and state change
  useEffect(() => {
    if (!isActive || disabled) return;

    // Small delay ensures DOM paint has settled
    const timer = setTimeout(() => {
      focusInput();
    }, 40);

    return () => clearTimeout(timer);
  }, [isActive, disabled, focusInput]);

  // 2. Restore focus when browser window/tab regains focus
  useEffect(() => {
    if (!isActive || disabled) return;

    const handleWindowFocus = () => {
      // Defer slightly so browser activeElement resolves
      setTimeout(() => {
        focusInput();
      }, 30);
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [isActive, disabled, focusInput]);

  // 3. Restore focus on pointerdown/click on non-interactive page areas
  useEffect(() => {
    if (!isActive || disabled) return;

    const handlePointerDown = (e) => {
      // If clicking interactive element (button, link, form input), leave focus alone
      if (isInteractiveElement(e.target)) return;

      // Click is on background, margins, headers, or viewport canvas
      // Focus typing input on the next animation frame so default mouse event settles
      requestAnimationFrame(() => {
        focusInput();
      });
    };

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [isActive, disabled, focusInput]);

  // 4. Universal keydown router: start typing immediately anywhere on the page
  useEffect(() => {
    if (!isActive || disabled) return;

    const handleGlobalKeyDown = (e) => {
      if (!inputRef?.current) return;

      // Already focused: standard native typing event cycle handles it
      if (document.activeElement === inputRef.current) return;

      // If user is currently focused on another input or interactive modal: DO NOT INTERCEPT
      if (document.activeElement && isInteractiveElement(document.activeElement)) {
        return;
      }

      // Preserve browser shortcuts (Ctrl, Alt, Meta)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // Ignore function keys (F1 - F12) and Escape
      if (/^F\d+$/.test(e.key) || e.key === 'Escape') return;

      // Printable single-character keys or Backspace
      const isPrintable = e.key.length === 1;
      const isBackspace = e.key === 'Backspace';

      if (isPrintable || isBackspace) {
        // Focus the input immediately so typing captures without needing a click
        focusInput();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isActive, disabled, inputRef, focusInput]);

  return {
    focusInput,
    isFocused: isFocusedRef.current,
  };
}
