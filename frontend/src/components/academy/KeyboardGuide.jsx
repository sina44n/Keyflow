import React, { useMemo } from 'react';

/**
 * KeyboardGuide — Visual keyboard highlighting the next expected key.
 * Theme-aware using CSS variables. Updates in real-time with typing position.
 */

// Standard QWERTY layout rows
const KB_ROWS = [
  ['`','1','2','3','4','5','6','7','8','9','0','-','=','Backspace'],
  ['Tab','q','w','e','r','t','y','u','i','o','p','[',']','\\'],
  ['Caps','a','s','d','f','g','h','j','k','l',';',"'",'Enter'],
  ['Shift','z','x','c','v','b','n','m',',','.','/','Shift'],
  ['Ctrl','Win','Alt','Space','Alt','Fn','Ctrl'],
];

// Key width multipliers for realistic layout
const KEY_WIDTHS = {
  'Backspace': 2, 'Tab': 1.5, '\\': 1.5,
  'Caps': 1.75, 'Enter': 2.25,
  'Shift': 2.5,
  'Space': 6.5, 'Ctrl': 1.5, 'Win': 1.25, 'Alt': 1.25, 'Fn': 1.25,
};

const SHIFT_PAIRS = {
  '~':'`', '!':'1', '@':'2', '#':'3', '$':'4', '%':'5', '^':'6', '&':'7', '*':'8', '(':'9', ')':'0', '_':'-', '+':'=',
  '{':'[', '}':']', '|':'\\', ':':';', '"':"'", '<':',', '>':'.', '?':'/',
};

export function KeyboardGuide({ targetChar, isVisible = true }) {
  const targetLower = useMemo(() => {
    if (!targetChar) return null;
    if (targetChar === ' ') return 'Space';
    const shift = SHIFT_PAIRS[targetChar];
    if (shift) return shift.toLowerCase();
    return targetChar.toLowerCase();
  }, [targetChar]);

  const needsShift = useMemo(() => {
    if (!targetChar) return false;
    if (targetChar === ' ') return false;
    if (SHIFT_PAIRS[targetChar]) return true;
    if (targetChar >= 'A' && targetChar <= 'Z') return true;
    return false;
  }, [targetChar]);

  if (!isVisible) return null;

  return (
    <div
      className="w-full overflow-x-auto"
      role="img"
      aria-label={`Keyboard guide highlighting key: ${targetChar ?? 'none'}`}
      aria-live="polite"
    >
      <div
        className="inline-flex flex-col gap-[3px] p-3 rounded-xl border select-none"
        style={{
          background: 'var(--key-bg)',
          borderColor: 'var(--border)',
          minWidth: '500px',
        }}
      >
        {KB_ROWS.map((row, rowIdx) => (
          <div key={rowIdx} className="flex gap-[3px] items-center">
            {row.map((key) => {
              const isTarget = key.toLowerCase() === targetLower;
              const isShiftKey = (key === 'Shift') && needsShift;
              const isHomeRow = rowIdx === 2 && ['a','s','d','f','g','h','j','k','l',';',"'"].includes(key);
              const width = KEY_WIDTHS[key] ?? 1;

              return (
                <div
                  key={key}
                  className="flex items-center justify-center rounded text-[10px] font-mono font-semibold transition-all duration-100"
                  style={{
                    width: `${width * 32}px`,
                    height: '30px',
                    flexShrink: 0,
                    background: (isTarget || isShiftKey)
                      ? 'var(--key-active-bg)'
                      : isHomeRow
                      ? 'var(--key-home-row)'
                      : 'var(--key-bg)',
                    color: (isTarget || isShiftKey) ? 'var(--key-active-text)' : 'var(--key-text)',
                    border: (isTarget || isShiftKey)
                      ? '1px solid var(--key-active-border)'
                      : '1px solid var(--key-border)',
                    borderBottom: (isTarget || isShiftKey)
                      ? '2px solid var(--key-active-border)'
                      : isHomeRow
                      ? '2px solid color-mix(in srgb, var(--key-border) 80%, black)'
                      : '2px solid color-mix(in srgb, var(--key-border) 80%, black)',
                    boxShadow: (isTarget || isShiftKey) ? '0 0 6px color-mix(in srgb, var(--key-active-bg) 60%, transparent)' : 'none',
                    transform: (isTarget || isShiftKey) ? 'translateY(1px)' : 'none',
                  }}
                  aria-hidden="true"
                >
                  {key === 'Space' ? '' : key === 'Backspace' ? '⌫' : key === 'Enter' ? '↵' : key.length === 1 ? key.toUpperCase() : key.slice(0,4)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
