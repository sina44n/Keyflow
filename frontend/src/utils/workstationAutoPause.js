/**
 * KEYFLOW Workstation — Smart Inactivity Auto-Pause & Auto-Resume Utilities
 * =========================================================================
 * Provides authoritative inactivity threshold constants and key event validation
 * for both Workstation Page A (Standard) and Page B (Switch mode).
 */

export const AUTO_PAUSE_INACTIVITY_MS = 7000;

/**
 * Validates whether a keydown event represents an intentional typing key
 * that should automatically resume the session and be delivered to the typing engine.
 *
 * Rules:
 * - Rejects modifier keys alone (Shift, Control, Alt, Meta, CapsLock, NumLock, etc.)
 * - Rejects shortcut combinations (Ctrl+*, Alt+*, Meta+*)
 * - Rejects function keys (F1 - F12)
 * - Rejects navigation & window keys (Escape, Tab, Arrow keys, PageUp/Down, etc.)
 * - Accepts single printable characters (letters, numbers, symbols, space)
 * - Accepts Backspace
 * - Accepts Enter
 *
 * @param {KeyboardEvent|Object} e
 * @returns {boolean}
 */
export function isValidTypingKey(e) {
  if (!e) return false;

  // Ignore shortcut combinations with modifier keys
  if (e.ctrlKey || e.metaKey || e.altKey) return false;

  const key = e.key;
  if (!key) return false;

  // Modifier-only keys and locks
  if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'NumLock', 'ScrollLock', 'Fn', 'Symbol'].includes(key)) {
    return false;
  }

  // Navigation, function, window, and media keys
  if (
    (/^F\d+$/.test(key)) ||
    ['Escape', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
     'PageUp', 'PageDown', 'Home', 'End', 'Insert', 'ContextMenu',
     'AudioVolumeUp', 'AudioVolumeDown', 'AudioVolumeMute', 'MediaPlayPause'].includes(key)
  ) {
    return false;
  }

  // Backspace is a valid typing action
  if (key === 'Backspace') return true;

  // Enter is a valid typing action
  if (key === 'Enter') return true;

  // Printable single characters (letters, numbers, symbols, space)
  if (typeof key === 'string' && key.length === 1) return true;

  return false;
}
