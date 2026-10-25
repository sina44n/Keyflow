import React, { useMemo } from 'react';

/**
 * HandGuide — Visual left/right hand illustration highlighting recommended finger.
 * Synchronized with typing position and keyboard layout.
 * Theme-aware, independent from KeyboardGuide.
 */

// Finger-to-key mapping (same as FINGER_MAP in curriculumEngine but imported directly)
const FINGER_MAP = {
  a:'left-pinky',q:'left-pinky',z:'left-pinky','1':'left-pinky',
  s:'left-ring',w:'left-ring',x:'left-ring','2':'left-ring',
  d:'left-middle',e:'left-middle',c:'left-middle','3':'left-middle',
  f:'left-index',r:'left-index',v:'left-index','4':'left-index',
  g:'left-index',t:'left-index',b:'left-index','5':'left-index',
  ' ':'thumb',
  h:'right-index',y:'right-index',n:'right-index','6':'right-index',
  j:'right-index',u:'right-index',m:'right-index','7':'right-index',
  k:'right-middle',i:'right-middle',',':'right-middle','8':'right-middle',
  l:'right-ring',o:'right-ring','.':'right-ring','9':'right-ring',
  ';':'right-pinky',p:'right-pinky','/':'right-pinky','0':'right-pinky',
  "'":'right-pinky','[':'right-pinky',']':'right-pinky','\\':'right-pinky',
};

const SHIFT_LOWER = {
  '~':'`','!':'1','@':'2','#':'3','$':'4','%':'5','^':'6','&':'7','*':'8','(':'9',')':'0','_':'-','+':'=',
  '{':'[','}':']','|':'\\',':':';','"':"'",'<':',','>':'.','?':'/',
};

// Finger labels for display
const FINGER_LABELS = {
  'left-pinky': 'Left Pinky', 'left-ring': 'Left Ring',
  'left-middle': 'Left Middle', 'left-index': 'Left Index',
  'thumb': 'Thumb (Space)', 'right-index': 'Right Index',
  'right-middle': 'Right Middle', 'right-ring': 'Right Ring',
  'right-pinky': 'Right Pinky',
};

// SVG Hand component - simplified finger silhouettes
function HandSVG({ hand, activeFinger, activeThumb }) {
  const isLeft = hand === 'left';
  // Finger positions (x offset from palm center)
  const fingerConfigs = [
    { x: isLeft ? 8 : 76, height: 52, label: isLeft ? 'left-pinky' : 'right-pinky' },
    { x: isLeft ? 28 : 56, height: 65, label: isLeft ? 'left-ring' : 'right-ring' },
    { x: isLeft ? 48 : 36, height: 68, label: isLeft ? 'left-middle' : 'right-middle' },
    { x: isLeft ? 64 : 20, height: 62, label: isLeft ? 'left-index' : 'right-index' },
  ];

  const orderedConfigs = isLeft ? fingerConfigs : [...fingerConfigs].reverse();

  return (
    <svg width="120" height="130" viewBox="0 0 120 130" aria-hidden="true">
      {/* Palm */}
      <rect
        x="8" y="72" width="104" height="50"
        rx="14" ry="14"
        fill="var(--bg-elevated)"
        stroke="var(--border)"
        strokeWidth="1.5"
      />
      
      {/* Thumb */}
      <ellipse
        cx={isLeft ? 16 : 104}
        cy="95"
        rx="11" ry="16"
        fill={activeThumb ? 'var(--key-active-bg)' : 'var(--bg-elevated)'}
        stroke={activeThumb ? 'var(--key-active-border)' : 'var(--border)'}
        strokeWidth="1.5"
        style={{ transition: 'all 100ms ease' }}
      />

      {/* Fingers */}
      {orderedConfigs.map((cfg) => {
        const isActive = activeFinger === cfg.label;
        return (
          <rect
            key={cfg.label}
            x={cfg.x}
            y={75 - cfg.height}
            width="18"
            height={cfg.height}
            rx="9" ry="9"
            fill={isActive ? 'var(--key-active-bg)' : 'var(--bg-elevated)'}
            stroke={isActive ? 'var(--key-active-border)' : 'var(--border)'}
            strokeWidth="1.5"
            style={{ transition: 'all 100ms ease', filter: isActive ? 'drop-shadow(0 0 4px var(--key-active-bg))' : 'none' }}
          />
        );
      })}
    </svg>
  );
}

export function HandGuide({ targetChar, isVisible = true }) {
  const activeFinger = useMemo(() => {
    if (!targetChar) return null;
    if (targetChar === ' ') return 'thumb';
    // Handle shifted chars
    const lower = SHIFT_LOWER[targetChar] ?? targetChar.toLowerCase();
    return FINGER_MAP[lower] ?? null;
  }, [targetChar]);

  const isLeftHand = activeFinger?.startsWith('left') ?? false;
  const isRightHand = activeFinger?.startsWith('right') ?? false;
  const isThumb = activeFinger === 'thumb';
  
  const fingerLabel = activeFinger ? (FINGER_LABELS[activeFinger] ?? activeFinger) : 'No key';

  if (!isVisible) return null;

  return (
    <div
      className="flex flex-col items-center gap-3"
      role="img"
      aria-label={`Hand guide: use ${fingerLabel} for key "${targetChar ?? ''}"`}
      aria-live="polite"
    >
      {/* Hands */}
      <div className="flex items-end gap-4 justify-center">
        {/* Left Hand */}
        <div className="flex flex-col items-center gap-1">
          <span
            className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded"
            style={{
              color: isLeftHand ? 'var(--key-active-text)' : 'var(--text-muted)',
              background: isLeftHand ? 'var(--key-active-bg)' : 'transparent',
              transition: 'all 120ms ease',
            }}
          >
            Left
          </span>
          <HandSVG
            hand="left"
            activeFinger={isLeftHand ? activeFinger : null}
            activeThumb={isThumb}
          />
        </div>

        {/* Right Hand */}
        <div className="flex flex-col items-center gap-1">
          <span
            className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded"
            style={{
              color: isRightHand ? 'var(--key-active-text)' : 'var(--text-muted)',
              background: isRightHand ? 'var(--key-active-bg)' : 'transparent',
              transition: 'all 120ms ease',
            }}
          >
            Right
          </span>
          <HandSVG
            hand="right"
            activeFinger={isRightHand ? activeFinger : null}
            activeThumb={isThumb}
          />
        </div>
      </div>

      {/* Finger label */}
      {activeFinger && (
        <div
          className="text-[11px] font-mono font-semibold px-3 py-1 rounded-full border"
          style={{
            color: 'var(--key-active-text)',
            background: 'var(--key-active-bg)',
            borderColor: 'var(--key-active-border)',
            transition: 'all 120ms ease',
          }}
        >
          {fingerLabel}
        </div>
      )}
    </div>
  );
}
