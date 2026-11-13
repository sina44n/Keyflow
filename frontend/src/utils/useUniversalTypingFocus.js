/**
 * KEYFLOW — Universal Typing Input Focus Hook
 * ============================================
 * Provides reliable, immediate typing readiness across all typing environments
 * (Workstation, Academy LessonPlayer, Home HeroSection) without requiring users
 * to click inside the typing area first.
 *
 * Design Principles:
 * 1. Proactive Readiness: Focuses the typing input synchronously on mount, window focus, and background click.
 * 2. Non-Disruptive Background Focus: Restores focus when user interacts with non-interactive areas.
 * 3. Exact First-Keystroke Delivery: Routes typing keys to the input without loss or duplication when unfocused.
 * 4. Zero Interference: Respects user focus when typing into real form fields, modals, or dropdowns.
 * 5. Shortcut Preservation: Never steals or blocks Ctrl, Alt, Meta, Tab, Escape, or function key shortcuts.
 * 6. Accessibility & IME: Preserves Tab navigation, dialog containment, and IME composition.
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
    (typeof el.getAttribute === 'function' && (
      el.getAttribute('role') === 'textbox' ||
      el.getAttribute('role') === 'searchbox' ||
      el.getAttribute('role') === 'combobox'
    ))
  ) {
    return true;
  }

  // Buttons, links, menu items, tabs, dialogs
  if (
    tag === 'BUTTON' ||
    tag === 'A' ||
    (typeof el.closest === 'function' && el.closest('button, a, [role="button"], [role="menuitem"], [role="tab"], [role="option"]'))
  ) {
    return true;
  }

  // Inside modal containers or dialogs
  if (typeof el.closest === 'function' && el.closest('dialog, [role="dialog"], [aria-modal="true"], .modal-container')) {
    return true;
  }

  return false;
}

/**
 * Safely dispatches a character or backspace into a controlled React input element,
 * triggering React's synthetic onChange without losing the first keystroke.
 *
 * @param {HTMLInputElement|null} inputEl
 * @param {string} key
 * @returns {boolean} Whether the key was accepted and dispatched
 */
export function dispatchTypingCharacter(inputEl, key) {
  if (!inputEl) return false;

  const currentVal = inputEl.value || '';
  let nextVal = currentVal;

  if (key === 'Backspace') {
    if (currentVal.length > 0) {
      nextVal = currentVal.slice(0, -1);
    } else {
      return false;
    }
  } else if (typeof key === 'string' && key.length === 1) {
    nextVal = currentVal + key;
  } else if (key === 'Enter') {
    nextVal = currentVal + '\n';
  } else {
    return false;
  }

  if (nextVal !== currentVal) {
    // Utilize HTMLInputElement value property descriptor to notify React's internal tracker
    const prototype = typeof window !== 'undefined' && window.HTMLInputElement ? window.HTMLInputElement.prototype : null;
    const nativeSetter = prototype ? Object.getOwnPropertyDescriptor(prototype, 'value')?.set : null;

    if (nativeSetter) {
      nativeSetter.call(inputEl, nextVal);
    } else {
      inputEl.value = nextVal;
    }

    const EventCtor = typeof InputEvent !== 'undefined'
      ? InputEvent
      : typeof Event !== 'undefined'
      ? Event
      : null;

    if (EventCtor) {
      const inputEvent = new EventCtor('input', { bubbles: true, cancelable: false });
      inputEl.dispatchEvent(inputEvent);
    }
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
 * @param {Function} [options.onKeystroke] - Optional callback when an intercepted keystroke is processed
 */
export function useUniversalTypingFocus({
  inputRef,
  isActive = true,
  disabled = false,
  onFocusStateChange = null,
  onKeystroke = null,
}) {
  const isFocusedRef = useRef(false);

  // Safe helper to focus input without unwanted page scroll jumps
  const focusInput = useCallback(() => {
    if (!isActive || disabled || !inputRef?.current) return;

    if (typeof document === 'undefined') return;
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

  // 1. Proactive auto-focus on mount and state change (synchronous + fallback frame)
  useEffect(() => {
    if (!isActive || disabled) return;

    // Synchronous immediate focus
    focusInput();

    // Deferred fallback ensures focus after any asynchronous layout/transitions
    const timer = setTimeout(() => {
      focusInput();
    }, 40);

    return () => clearTimeout(timer);
  }, [isActive, disabled, focusInput]);

  // 2. Restore focus when browser window/tab regains focus
  useEffect(() => {
    if (!isActive || disabled) return;
    if (typeof window === 'undefined') return;

    const handleWindowFocus = () => {
      focusInput();
      const timer = setTimeout(() => {
        focusInput();
      }, 30);
      return () => clearTimeout(timer);
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [isActive, disabled, focusInput]);

  // 3. Restore focus on pointerdown/click on non-interactive page areas
  useEffect(() => {
    if (!isActive || disabled) return;
    if (typeof window === 'undefined') return;

    const handlePointerDown = (e) => {
      // If clicking interactive element (button, link, form input, modal), leave focus alone
      if (isInteractiveElement(e.target)) return;

      // Click is on background, margins, headers, or canvas
      focusInput();
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => {
          focusInput();
        });
      }
    };

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [isActive, disabled, focusInput]);

  // 4. Universal keydown router: start typing immediately anywhere on the page
  // Ensures the first keystroke is NEVER lost and NEVER duplicated
  useEffect(() => {
    if (!isActive || disabled) return;
    if (typeof window === 'undefined') return;

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

      // Ignore function keys (F1 - F12), Escape, and Tab (never hijack accessibility Tab navigation)
      if (/^F\d+$/.test(e.key) || e.key === 'Escape' || e.key === 'Tab') return;

      // Ignore IME composition
      if (e.isComposing || e.keyCode === 229) return;

      // Printable single-character keys, Backspace, or Enter
      const isPrintable = typeof e.key === 'string' && e.key.length === 1;
      const isBackspace = e.key === 'Backspace';
      const isEnter = e.key === 'Enter';

      if (isPrintable || isBackspace || isEnter) {
        // Prevent default browser behavior on the unfocused target (e.g. Space scrolling the page)
        e.preventDefault();

        // Focus the input immediately
        focusInput();

        // Deliver the keystroke directly into the input so the character is not dropped
        const dispatched = dispatchTypingCharacter(inputRef.current, e.key);

        if (dispatched && typeof onKeystroke === 'function') {
          const perfNow = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
          onKeystroke({ key: e.key, code: e.code, id: perfNow });
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isActive, disabled, inputRef, focusInput, onKeystroke]);

  return {
    focusInput,
    isFocused: isFocusedRef.current,
  };
}
