/**
 * Touch Typing Calibration & Finger Mapping Engine for KEYFLOW.
 * 
 * Symmetrical 15.0 Unit calibration across all 5 rows (ViewBox: 0 0 900 350).
 * Matches ANSI 60% standard touch-typing finger assignments.
 */

export const ROW_START_Y = 16;
export const ROW_HEIGHT = 46;
export const ROW_GAP = 7;
export const KEY_GAP = 7;
export const UNIT = (860 - 14 * KEY_GAP) / 15; // ~50.8px

export function computeKeyWidth(u) {
  return u * UNIT + (u - 1) * KEY_GAP;
}

export const ROW_DEFS = [
  {
    y: ROW_START_Y, // cy = 39
    keys: [
      { id: '`', label: 'Esc', top: '~', bot: '`', u: 1.0, isModifier: true, color: 'black' },
      { id: '1', top: '!', bot: '1', u: 1.0, color: 'white' },
      { id: '2', top: '@', bot: '2', u: 1.0, color: 'white' },
      { id: '3', top: '#', bot: '3', u: 1.0, color: 'white' },
      { id: '4', top: '$', bot: '4', u: 1.0, color: 'white' },
      { id: '5', top: '%', bot: '5', u: 1.0, color: 'white' },
      { id: '6', top: '^', bot: '6', u: 1.0, color: 'white' },
      { id: '7', top: '&', bot: '7', u: 1.0, color: 'white' },
      { id: '8', top: '*', bot: '8', u: 1.0, color: 'white' },
      { id: '9', top: '(', bot: '9', u: 1.0, color: 'white' },
      { id: '0', top: ')', bot: '0', u: 1.0, color: 'white' },
      { id: '-', top: '_', bot: '-', u: 1.0, color: 'white' },
      { id: '=', top: '+', bot: '=', u: 1.0, color: 'white' },
      { id: 'backspace', label: '←', u: 2.0, isSpecial: true, isModifier: true, color: 'black' },
    ],
  },
  {
    y: ROW_START_Y + (ROW_HEIGHT + ROW_GAP), // cy = 92
    keys: [
      { id: 'tab', label: '⇥', u: 1.5, isSpecial: true, isModifier: true, color: 'black' },
      { id: 'q', label: 'Q', u: 1.0, color: 'white' },
      { id: 'w', label: 'W', u: 1.0, color: 'white' },
      { id: 'e', label: 'E', u: 1.0, color: 'white' },
      { id: 'r', label: 'R', u: 1.0, color: 'white' },
      { id: 't', label: 'T', u: 1.0, color: 'white' },
      { id: 'y', label: 'Y', u: 1.0, color: 'white' },
      { id: 'u', label: 'U', u: 1.0, color: 'white' },
      { id: 'i', label: 'I', u: 1.0, color: 'white' },
      { id: 'o', label: 'O', u: 1.0, color: 'white' },
      { id: 'p', label: 'P', u: 1.0, color: 'white' },
      { id: '[', top: '{', bot: '[', u: 1.0, color: 'white' },
      { id: ']', top: '}', bot: ']', u: 1.0, color: 'white' },
      { id: '\\', top: '|', bot: '\\', u: 1.5, isSpecial: true, isModifier: true, color: 'black' },
    ],
  },
  {
    y: ROW_START_Y + 2 * (ROW_HEIGHT + ROW_GAP), // cy = 145
    keys: [
      { id: 'caps', label: '⇩', u: 1.75, isSpecial: true, isModifier: true, color: 'black' },
      { id: 'a', label: 'A', u: 1.0, isHome: true, color: 'white' },
      { id: 's', label: 'S', u: 1.0, isHome: true, color: 'white' },
      { id: 'd', label: 'D', u: 1.0, isHome: true, color: 'white' },
      { id: 'f', label: 'F', u: 1.0, isHome: true, hasBump: true, color: 'white' },
      { id: 'g', label: 'G', u: 1.0, color: 'white' },
      { id: 'h', label: 'H', u: 1.0, color: 'white' },
      { id: 'j', label: 'J', u: 1.0, isHome: true, hasBump: true, color: 'white' },
      { id: 'k', label: 'K', u: 1.0, isHome: true, color: 'white' },
      { id: 'l', label: 'L', u: 1.0, isHome: true, color: 'white' },
      { id: ';', top: ':', bot: ';', u: 1.0, isHome: true, color: 'white' },
      { id: "'", top: '"', bot: "'", u: 1.0, color: 'white' },
      { id: 'enter', label: '↵', u: 2.25, isSpecial: true, isModifier: true, color: 'black' },
    ],
  },
  {
    y: ROW_START_Y + 3 * (ROW_HEIGHT + ROW_GAP), // cy = 198
    keys: [
      { id: 'shift-left', label: '⇧', u: 2.25, isSpecial: true, isModifier: true, color: 'black' },
      { id: 'z', label: 'Z', u: 1.0, color: 'white' },
      { id: 'x', label: 'X', u: 1.0, color: 'white' },
      { id: 'c', label: 'C', u: 1.0, color: 'white' },
      { id: 'v', label: 'V', u: 1.0, color: 'white' },
      { id: 'b', label: 'B', u: 1.0, color: 'white' },
      { id: 'n', label: 'N', u: 1.0, color: 'white' },
      { id: 'm', label: 'M', u: 1.0, color: 'white' },
      { id: ',', top: '<', bot: ',', u: 1.0, color: 'white' },
      { id: '.', top: '>', bot: '.', u: 1.0, color: 'white' },
      { id: '/', top: '?', bot: '/', u: 1.0, color: 'white' },
      { id: 'shift-right', label: '⇧', u: 2.75, isSpecial: true, isModifier: true, color: 'black' },
    ],
  },
  {
    y: ROW_START_Y + 4 * (ROW_HEIGHT + ROW_GAP), // cy = 251
    keys: [
      { id: 'control-left', label: 'Ctrl', u: 1.25, isSpecial: true, isModifier: true, color: 'black' },
      { id: 'meta-left', label: 'Code', u: 1.25, isSpecial: true, isModifier: true, color: 'black' },
      { id: 'alt-left', label: 'Alt', u: 1.25, isSpecial: true, isModifier: true, color: 'black' },
      { id: 'space', label: '', u: 6.25, isSpecial: true, isSpace: true, color: 'white' },
      { id: 'alt-right', label: 'Alt', u: 1.25, isSpecial: true, isModifier: true, color: 'black' },
      { id: 'menu', label: 'Code', u: 1.25, isSpecial: true, isModifier: true, color: 'black' },
      { id: 'fn', label: 'Fn', u: 1.25, isSpecial: true, isModifier: true, color: 'black' },
      { id: 'control-right', label: 'Ctrl', u: 1.25, isSpecial: true, isModifier: true, color: 'black' },
    ],
  },
];

// Dual-character shift map: shifted symbol -> base key
export const SHIFT_MAP = {
  '~':'`', '!':'1', '@':'2', '#':'3', '$':'4', '%':'5', '^':'6', '&':'7', '*':'8', '(':'9', ')':'0',
  '_':'-', '+':'=', '{':'[', '}':']', '|':'\\', ':':';', '"':"'", '<':',', '>':'.', '?':'/',
};

// Compute exact key centers
export const KEY_COORDS = {};
ROW_DEFS.forEach((r) => {
  let curX = 20;
  r.keys.forEach((k) => {
    const width = computeKeyWidth(k.u);
    KEY_COORDS[k.id] = {
      x: curX,
      y: r.y,
      w: width,
      h: ROW_HEIGHT,
      cx: +(curX + width / 2).toFixed(1),
      cy: +(r.y + ROW_HEIGHT / 2).toFixed(1),
    };
    curX += width + KEY_GAP;
  });
});

// Backward compatibility aliases for option keys
if (KEY_COORDS['alt-left'] && !KEY_COORDS['option-left']) {
  KEY_COORDS['option-left'] = KEY_COORDS['alt-left'];
}
if (KEY_COORDS['alt-right'] && !KEY_COORDS['option-right']) {
  KEY_COORDS['option-right'] = KEY_COORDS['alt-right'];
}

export function generateLayout() {
  const allKeys = [];
  ROW_DEFS.forEach((r) => {
    let currentX = 20;
    r.keys.forEach((k) => {
      const w = computeKeyWidth(k.u);
      allKeys.push({
        ...k,
        x: currentX,
        y: r.y,
        w,
        h: ROW_HEIGHT,
        cx: currentX + w / 2,
        cy: r.y + ROW_HEIGHT / 2,
      });
      currentX += w + KEY_GAP;
    });
  });
  return allKeys;
}

export const CALIBRATED_KEYS = generateLayout();

// Touch-typing finger assignments
export const ALLOWED_FINGER_ANIMATION_KEYS = new Set([
  // Top letter row
  'q', 'w', 'e', 'r', 't',
  'y', 'u', 'i', 'o', 'p',

  // Apostrophe and quotation mark
  "'", '"',

  // Semicolon and colon
  ';', ':',

  // Home letter row
  'l', 'k', 'j', 'h', 'g',
  'f', 'd', 's', 'a',

  // Bottom letter row
  'z', 'x', 'c', 'v', 'b',
  'n', 'm',

  // Approved punctuation
  ',', '<', '.', '>', '/', '?',

  // Spacebar
  ' '
]);

/**
 * Strict Authoritative 1:1 Mapping of Approved Characters to Physical Keys & Fingers.
 * Follows clinical touch-typing standard:
 * - Left Pinky: Q, A, Z
 * - Left Ring: W, S, X
 * - Left Middle: E, D, C
 * - Left Index: R, F, V, T, G, B
 * - Right Index: Y, H, N, U, J, M
 * - Right Middle: I, K, ',', '<'
 * - Right Ring: O, L, '.', '>'
 * - Right Pinky: P, ';', ':', "'", '"', '/', '?'
 * - Assigned Thumb: Spacebar
 */
export const APPROVED_KEY_FINGER_MAP = {
  // Left Pinky
  'q': { finger: 'left-pinky', keyId: 'q' },
  'Q': { finger: 'left-pinky', keyId: 'q' },
  'a': { finger: 'left-pinky', keyId: 'a' },
  'A': { finger: 'left-pinky', keyId: 'a' },
  'z': { finger: 'left-pinky', keyId: 'z' },
  'Z': { finger: 'left-pinky', keyId: 'z' },

  // Left Ring
  'w': { finger: 'left-ring', keyId: 'w' },
  'W': { finger: 'left-ring', keyId: 'w' },
  's': { finger: 'left-ring', keyId: 's' },
  'S': { finger: 'left-ring', keyId: 's' },
  'x': { finger: 'left-ring', keyId: 'x' },
  'X': { finger: 'left-ring', keyId: 'x' },

  // Left Middle
  'e': { finger: 'left-middle', keyId: 'e' },
  'E': { finger: 'left-middle', keyId: 'e' },
  'd': { finger: 'left-middle', keyId: 'd' },
  'D': { finger: 'left-middle', keyId: 'd' },
  'c': { finger: 'left-middle', keyId: 'c' },
  'C': { finger: 'left-middle', keyId: 'c' },

  // Left Index
  'r': { finger: 'left-index', keyId: 'r' },
  'R': { finger: 'left-index', keyId: 'r' },
  'f': { finger: 'left-index', keyId: 'f' },
  'F': { finger: 'left-index', keyId: 'f' },
  'v': { finger: 'left-index', keyId: 'v' },
  'V': { finger: 'left-index', keyId: 'v' },
  't': { finger: 'left-index', keyId: 't' },
  'T': { finger: 'left-index', keyId: 't' },
  'g': { finger: 'left-index', keyId: 'g' },
  'G': { finger: 'left-index', keyId: 'g' },
  'b': { finger: 'left-index', keyId: 'b' },
  'B': { finger: 'left-index', keyId: 'b' },

  // Right Index
  'y': { finger: 'right-index', keyId: 'y' },
  'Y': { finger: 'right-index', keyId: 'y' },
  'h': { finger: 'right-index', keyId: 'h' },
  'H': { finger: 'right-index', keyId: 'h' },
  'n': { finger: 'right-index', keyId: 'n' },
  'N': { finger: 'right-index', keyId: 'n' },
  'u': { finger: 'right-index', keyId: 'u' },
  'U': { finger: 'right-index', keyId: 'u' },
  'j': { finger: 'right-index', keyId: 'j' },
  'J': { finger: 'right-index', keyId: 'j' },
  'm': { finger: 'right-index', keyId: 'm' },
  'M': { finger: 'right-index', keyId: 'm' },

  // Right Middle
  'i': { finger: 'right-middle', keyId: 'i' },
  'I': { finger: 'right-middle', keyId: 'i' },
  'k': { finger: 'right-middle', keyId: 'k' },
  'K': { finger: 'right-middle', keyId: 'k' },
  ',': { finger: 'right-middle', keyId: ',' },
  '<': { finger: 'right-middle', keyId: ',' },

  // Right Ring
  'o': { finger: 'right-ring', keyId: 'o' },
  'O': { finger: 'right-ring', keyId: 'o' },
  'l': { finger: 'right-ring', keyId: 'l' },
  'L': { finger: 'right-ring', keyId: 'l' },
  '.': { finger: 'right-ring', keyId: '.' },
  '>': { finger: 'right-ring', keyId: '.' },

  // Right Pinky
  'p': { finger: 'right-pinky', keyId: 'p' },
  'P': { finger: 'right-pinky', keyId: 'p' },
  ';': { finger: 'right-pinky', keyId: ';' },
  ':': { finger: 'right-pinky', keyId: ';' },
  "'": { finger: 'right-pinky', keyId: "'" },
  '"': { finger: 'right-pinky', keyId: "'" },
  '/': { finger: 'right-pinky', keyId: '/' },
  '?': { finger: 'right-pinky', keyId: '/' },

  // Spacebar
  ' ': { finger: 'thumb', keyId: 'space' },
};

export const KEY_FINGER_MAP = {
  // Left Pinky
  '`': { finger: 'left-pinky', x: KEY_COORDS['`'].cx, y: KEY_COORDS['`'].cy },
  '~': { finger: 'left-pinky', x: KEY_COORDS['`'].cx, y: KEY_COORDS['`'].cy },
  '1': { finger: 'left-pinky', x: KEY_COORDS['1'].cx, y: KEY_COORDS['1'].cy },
  '!': { finger: 'left-pinky', x: KEY_COORDS['1'].cx, y: KEY_COORDS['1'].cy },
  'tab': { finger: 'left-pinky', x: KEY_COORDS['tab'].cx, y: KEY_COORDS['tab'].cy },
  'q': { finger: 'left-pinky', x: KEY_COORDS['q'].cx, y: KEY_COORDS['q'].cy },
  'Q': { finger: 'left-pinky', x: KEY_COORDS['q'].cx, y: KEY_COORDS['q'].cy },
  'caps': { finger: 'left-pinky', x: KEY_COORDS['caps'].cx, y: KEY_COORDS['caps'].cy },
  'a': { finger: 'left-pinky', x: KEY_COORDS['a'].cx, y: KEY_COORDS['a'].cy },
  'A': { finger: 'left-pinky', x: KEY_COORDS['a'].cx, y: KEY_COORDS['a'].cy },
  'shift-left': { finger: 'left-pinky', x: KEY_COORDS['shift-left'].cx, y: KEY_COORDS['shift-left'].cy },
  'z': { finger: 'left-pinky', x: KEY_COORDS['z'].cx, y: KEY_COORDS['z'].cy },
  'Z': { finger: 'left-pinky', x: KEY_COORDS['z'].cx, y: KEY_COORDS['z'].cy },

  // Left Ring
  '2': { finger: 'left-ring', x: KEY_COORDS['2'].cx, y: KEY_COORDS['2'].cy },
  '@': { finger: 'left-ring', x: KEY_COORDS['2'].cx, y: KEY_COORDS['2'].cy },
  'w': { finger: 'left-ring', x: KEY_COORDS['w'].cx, y: KEY_COORDS['w'].cy },
  'W': { finger: 'left-ring', x: KEY_COORDS['w'].cx, y: KEY_COORDS['w'].cy },
  's': { finger: 'left-ring', x: KEY_COORDS['s'].cx, y: KEY_COORDS['s'].cy },
  'S': { finger: 'left-ring', x: KEY_COORDS['s'].cx, y: KEY_COORDS['s'].cy },
  'x': { finger: 'left-ring', x: KEY_COORDS['x'].cx, y: KEY_COORDS['x'].cy },
  'X': { finger: 'left-ring', x: KEY_COORDS['x'].cx, y: KEY_COORDS['x'].cy },

  // Left Middle
  '3': { finger: 'left-middle', x: KEY_COORDS['3'].cx, y: KEY_COORDS['3'].cy },
  '#': { finger: 'left-middle', x: KEY_COORDS['3'].cx, y: KEY_COORDS['3'].cy },
  'e': { finger: 'left-middle', x: KEY_COORDS['e'].cx, y: KEY_COORDS['e'].cy },
  'E': { finger: 'left-middle', x: KEY_COORDS['e'].cx, y: KEY_COORDS['e'].cy },
  'd': { finger: 'left-middle', x: KEY_COORDS['d'].cx, y: KEY_COORDS['d'].cy },
  'D': { finger: 'left-middle', x: KEY_COORDS['d'].cx, y: KEY_COORDS['d'].cy },
  'c': { finger: 'left-middle', x: KEY_COORDS['c'].cx, y: KEY_COORDS['c'].cy },
  'C': { finger: 'left-middle', x: KEY_COORDS['c'].cx, y: KEY_COORDS['c'].cy },

  // Left Index
  '4': { finger: 'left-index', x: KEY_COORDS['4'].cx, y: KEY_COORDS['4'].cy },
  '$': { finger: 'left-index', x: KEY_COORDS['4'].cx, y: KEY_COORDS['4'].cy },
  '5': { finger: 'left-index', x: KEY_COORDS['5'].cx, y: KEY_COORDS['5'].cy },
  '%': { finger: 'left-index', x: KEY_COORDS['5'].cx, y: KEY_COORDS['5'].cy },
  'r': { finger: 'left-index', x: KEY_COORDS['r'].cx, y: KEY_COORDS['r'].cy },
  'R': { finger: 'left-index', x: KEY_COORDS['r'].cx, y: KEY_COORDS['r'].cy },
  't': { finger: 'left-index', x: KEY_COORDS['t'].cx, y: KEY_COORDS['t'].cy },
  'T': { finger: 'left-index', x: KEY_COORDS['t'].cx, y: KEY_COORDS['t'].cy },
  'f': { finger: 'left-index', x: KEY_COORDS['f'].cx, y: KEY_COORDS['f'].cy },
  'F': { finger: 'left-index', x: KEY_COORDS['f'].cx, y: KEY_COORDS['f'].cy },
  'g': { finger: 'left-index', x: KEY_COORDS['g'].cx, y: KEY_COORDS['g'].cy },
  'G': { finger: 'left-index', x: KEY_COORDS['g'].cx, y: KEY_COORDS['g'].cy },
  'v': { finger: 'left-index', x: KEY_COORDS['v'].cx, y: KEY_COORDS['v'].cy },
  'V': { finger: 'left-index', x: KEY_COORDS['v'].cx, y: KEY_COORDS['v'].cy },
  'b': { finger: 'left-index', x: KEY_COORDS['b'].cx, y: KEY_COORDS['b'].cy },
  'B': { finger: 'left-index', x: KEY_COORDS['b'].cx, y: KEY_COORDS['b'].cy },

  // Thumbs
  ' ': { finger: 'thumb', x: KEY_COORDS['space'].cx, y: KEY_COORDS['space'].cy },
  'space': { finger: 'thumb', x: KEY_COORDS['space'].cx, y: KEY_COORDS['space'].cy },

  // Right Index
  '6': { finger: 'right-index', x: KEY_COORDS['6'].cx, y: KEY_COORDS['6'].cy },
  '^': { finger: 'right-index', x: KEY_COORDS['6'].cx, y: KEY_COORDS['6'].cy },
  '7': { finger: 'right-index', x: KEY_COORDS['7'].cx, y: KEY_COORDS['7'].cy },
  '&': { finger: 'right-index', x: KEY_COORDS['7'].cx, y: KEY_COORDS['7'].cy },
  'y': { finger: 'right-index', x: KEY_COORDS['y'].cx, y: KEY_COORDS['y'].cy },
  'Y': { finger: 'right-index', x: KEY_COORDS['y'].cx, y: KEY_COORDS['y'].cy },
  'u': { finger: 'right-index', x: KEY_COORDS['u'].cx, y: KEY_COORDS['u'].cy },
  'U': { finger: 'right-index', x: KEY_COORDS['u'].cx, y: KEY_COORDS['u'].cy },
  'h': { finger: 'right-index', x: KEY_COORDS['h'].cx, y: KEY_COORDS['h'].cy },
  'H': { finger: 'right-index', x: KEY_COORDS['h'].cx, y: KEY_COORDS['h'].cy },
  'j': { finger: 'right-index', x: KEY_COORDS['j'].cx, y: KEY_COORDS['j'].cy },
  'J': { finger: 'right-index', x: KEY_COORDS['j'].cx, y: KEY_COORDS['j'].cy },
  'n': { finger: 'right-index', x: KEY_COORDS['n'].cx, y: KEY_COORDS['n'].cy },
  'N': { finger: 'right-index', x: KEY_COORDS['n'].cx, y: KEY_COORDS['n'].cy },
  'm': { finger: 'right-index', x: KEY_COORDS['m'].cx, y: KEY_COORDS['m'].cy },
  'M': { finger: 'right-index', x: KEY_COORDS['m'].cx, y: KEY_COORDS['m'].cy },

  // Right Middle
  '8': { finger: 'right-middle', x: KEY_COORDS['8'].cx, y: KEY_COORDS['8'].cy },
  '*': { finger: 'right-middle', x: KEY_COORDS['8'].cx, y: KEY_COORDS['8'].cy },
  'i': { finger: 'right-middle', x: KEY_COORDS['i'].cx, y: KEY_COORDS['i'].cy },
  'I': { finger: 'right-middle', x: KEY_COORDS['i'].cx, y: KEY_COORDS['i'].cy },
  'k': { finger: 'right-middle', x: KEY_COORDS['k'].cx, y: KEY_COORDS['k'].cy },
  'K': { finger: 'right-middle', x: KEY_COORDS['k'].cx, y: KEY_COORDS['k'].cy },
  ',': { finger: 'right-middle', x: KEY_COORDS[','].cx, y: KEY_COORDS[','].cy },
  '<': { finger: 'right-middle', x: KEY_COORDS[','].cx, y: KEY_COORDS[','].cy },

  // Right Ring
  '9': { finger: 'right-ring', x: KEY_COORDS['9'].cx, y: KEY_COORDS['9'].cy },
  '(': { finger: 'right-ring', x: KEY_COORDS['9'].cx, y: KEY_COORDS['9'].cy },
  'o': { finger: 'right-ring', x: KEY_COORDS['o'].cx, y: KEY_COORDS['o'].cy },
  'O': { finger: 'right-ring', x: KEY_COORDS['o'].cx, y: KEY_COORDS['o'].cy },
  'l': { finger: 'right-ring', x: KEY_COORDS['l'].cx, y: KEY_COORDS['l'].cy },
  'L': { finger: 'right-ring', x: KEY_COORDS['l'].cx, y: KEY_COORDS['l'].cy },
  '.': { finger: 'right-ring', x: KEY_COORDS['.'].cx, y: KEY_COORDS['.'].cy },
  '>': { finger: 'right-ring', x: KEY_COORDS['.'].cx, y: KEY_COORDS['.'].cy },

  // Right Pinky
  '0': { finger: 'right-pinky', x: KEY_COORDS['0'].cx, y: KEY_COORDS['0'].cy },
  ')': { finger: 'right-pinky', x: KEY_COORDS['0'].cx, y: KEY_COORDS['0'].cy },
  '-': { finger: 'right-pinky', x: KEY_COORDS['-'].cx, y: KEY_COORDS['-'].cy },
  '_': { finger: 'right-pinky', x: KEY_COORDS['-'].cx, y: KEY_COORDS['-'].cy },
  '=': { finger: 'right-pinky', x: KEY_COORDS['='].cx, y: KEY_COORDS['='].cy },
  '+': { finger: 'right-pinky', x: KEY_COORDS['='].cx, y: KEY_COORDS['='].cy },
  'backspace': { finger: 'right-pinky', x: KEY_COORDS['backspace'].cx, y: KEY_COORDS['backspace'].cy },
  'p': { finger: 'right-pinky', x: KEY_COORDS['p'].cx, y: KEY_COORDS['p'].cy },
  'P': { finger: 'right-pinky', x: KEY_COORDS['p'].cx, y: KEY_COORDS['p'].cy },
  '[': { finger: 'right-pinky', x: KEY_COORDS['['].cx, y: KEY_COORDS['['].cy },
  '{': { finger: 'right-pinky', x: KEY_COORDS['['].cx, y: KEY_COORDS['['].cy },
  ']': { finger: 'right-pinky', x: KEY_COORDS[']'].cx, y: KEY_COORDS[']'].cy },
  '}': { finger: 'right-pinky', x: KEY_COORDS[']'].cx, y: KEY_COORDS[']'].cy },
  '\\': { finger: 'right-pinky', x: KEY_COORDS['\\'].cx, y: KEY_COORDS['\\'].cy },
  '|': { finger: 'right-pinky', x: KEY_COORDS['\\'].cx, y: KEY_COORDS['\\'].cy },
  ';': { finger: 'right-pinky', x: KEY_COORDS[';'].cx, y: KEY_COORDS[';'].cy },
  ':': { finger: 'right-pinky', x: KEY_COORDS[';'].cx, y: KEY_COORDS[';'].cy },
  "'": { finger: 'right-pinky', x: KEY_COORDS["'"].cx, y: KEY_COORDS["'"].cy },
  '"': { finger: 'right-pinky', x: KEY_COORDS["'"].cx, y: KEY_COORDS["'"].cy },
  'enter': { finger: 'right-pinky', x: KEY_COORDS['enter'].cx, y: KEY_COORDS['enter'].cy },
  'Enter': { finger: 'right-pinky', x: KEY_COORDS['enter'].cx, y: KEY_COORDS['enter'].cy },
  '\n': { finger: 'right-pinky', x: KEY_COORDS['enter'].cx, y: KEY_COORDS['enter'].cy },
  '/': { finger: 'right-pinky', x: KEY_COORDS['/'].cx, y: KEY_COORDS['/'].cy },
  '?': { finger: 'right-pinky', x: KEY_COORDS['/'].cx, y: KEY_COORDS['/'].cy },
  'shift-right': { finger: 'right-pinky', x: KEY_COORDS['shift-right'].cx, y: KEY_COORDS['shift-right'].cy },
  'ShiftRight': { finger: 'right-pinky', x: KEY_COORDS['shift-right'].cx, y: KEY_COORDS['shift-right'].cy },
  'control-left': { finger: 'left-pinky', x: KEY_COORDS['control-left'].cx, y: KEY_COORDS['control-left'].cy },
  'meta-left': { finger: 'left-pinky', x: KEY_COORDS['meta-left'].cx, y: KEY_COORDS['meta-left'].cy },
  'win': { finger: 'left-pinky', x: KEY_COORDS['meta-left'].cx, y: KEY_COORDS['meta-left'].cy },
  'Win': { finger: 'left-pinky', x: KEY_COORDS['meta-left'].cx, y: KEY_COORDS['meta-left'].cy },
  'code': { finger: 'left-pinky', x: KEY_COORDS['meta-left'].cx, y: KEY_COORDS['meta-left'].cy },
  'Code': { finger: 'left-pinky', x: KEY_COORDS['meta-left'].cx, y: KEY_COORDS['meta-left'].cy },
  'alt-left': { finger: 'left-thumb', x: KEY_COORDS['alt-left'].cx, y: KEY_COORDS['alt-left'].cy },
  'option-left': { finger: 'left-thumb', x: KEY_COORDS['alt-left'].cx, y: KEY_COORDS['alt-left'].cy },
  'Alt': { finger: 'left-thumb', x: KEY_COORDS['alt-left'].cx, y: KEY_COORDS['alt-left'].cy },
  'alt-right': { finger: 'right-thumb', x: KEY_COORDS['alt-right'].cx, y: KEY_COORDS['alt-right'].cy },
  'option-right': { finger: 'right-thumb', x: KEY_COORDS['alt-right'].cx, y: KEY_COORDS['alt-right'].cy },
  'fn': { finger: 'right-pinky', x: KEY_COORDS['fn'].cx, y: KEY_COORDS['fn'].cy },
  'Fn': { finger: 'right-pinky', x: KEY_COORDS['fn'].cx, y: KEY_COORDS['fn'].cy },
  'menu': { finger: 'right-pinky', x: KEY_COORDS['menu'].cx, y: KEY_COORDS['menu'].cy },
  'Menu': { finger: 'right-pinky', x: KEY_COORDS['menu'].cx, y: KEY_COORDS['menu'].cy },
  'control-right': { finger: 'right-pinky', x: KEY_COORDS['control-right'].cx, y: KEY_COORDS['control-right'].cy },
  'CapsLock': { finger: 'left-pinky', x: KEY_COORDS['caps'].cx, y: KEY_COORDS['caps'].cy },
  'capslock': { finger: 'left-pinky', x: KEY_COORDS['caps'].cx, y: KEY_COORDS['caps'].cy },
  'Tab': { finger: 'left-pinky', x: KEY_COORDS['tab'].cx, y: KEY_COORDS['tab'].cy },
  'Shift': { finger: 'left-pinky', x: KEY_COORDS['shift-left'].cx, y: KEY_COORDS['shift-left'].cy },
  'ShiftLeft': { finger: 'left-pinky', x: KEY_COORDS['shift-left'].cx, y: KEY_COORDS['shift-left'].cy },
  'Backspace': { finger: 'right-pinky', x: KEY_COORDS['backspace'].cx, y: KEY_COORDS['backspace'].cy },
  'Space': { finger: 'thumb', x: KEY_COORDS['space'].cx, y: KEY_COORDS['space'].cy },
};

/**
 * Physical ANSI 60% keyboard codes mapping to internal key IDs.
 */
export const CODE_TO_KEY_ID = {
  Backquote: '`',
  Digit1: '1',
  Digit2: '2',
  Digit3: '3',
  Digit4: '4',
  Digit5: '5',
  Digit6: '6',
  Digit7: '7',
  Digit8: '8',
  Digit9: '9',
  Digit0: '0',
  Minus: '-',
  Equal: '=',
  Backspace: 'backspace',

  Tab: 'tab',
  KeyQ: 'q',
  KeyW: 'w',
  KeyE: 'e',
  KeyR: 'r',
  KeyT: 't',
  KeyY: 'y',
  KeyU: 'u',
  KeyI: 'i',
  KeyO: 'o',
  KeyP: 'p',
  BracketLeft: '[',
  BracketRight: ']',
  Backslash: '\\',

  CapsLock: 'caps',
  KeyA: 'a',
  KeyS: 's',
  KeyD: 'd',
  KeyF: 'f',
  KeyG: 'g',
  KeyH: 'h',
  KeyJ: 'j',
  KeyK: 'k',
  KeyL: 'l',
  Semicolon: ';',
  Quote: "'",
  Enter: 'enter',

  ShiftLeft: 'shift-left',
  KeyZ: 'z',
  KeyX: 'x',
  KeyC: 'c',
  KeyV: 'v',
  KeyB: 'b',
  KeyN: 'n',
  KeyM: 'm',
  Comma: ',',
  Period: '.',
  Slash: '/',
  ShiftRight: 'shift-right',

  ControlLeft: 'control-left',
  MetaLeft: 'meta-left',
  OSLeft: 'meta-left',
  AltLeft: 'alt-left',
  Space: 'space',
  AltRight: 'alt-right',
  Fn: 'fn',
  ContextMenu: 'menu',
  ControlRight: 'control-right',
};

/**
 * Exact anatomical fingertip contact coordinates calibrated to the photographic
 * hand asset positioned at x=64, y=96, w=750, h=364 in the 900x350 viewBox.
 */
export const FINGERTIP_POSITIONS = {
  'left-pinky':  { x: 147, y: 146, homeKey: 'a' },
  'left-ring':   { x: 210, y: 148, homeKey: 's' },
  'left-middle': { x: 265, y: 146, homeKey: 'd' },
  'left-index':  { x: 320, y: 152, homeKey: 'f' },
  'left-thumb':  { x: 380, y: 255, homeKey: 'space' },
  'right-thumb': { x: 460, y: 255, homeKey: 'space' },
  'right-index': { x: 492, y: 148, homeKey: 'j' },
  'right-middle':{ x: 550, y: 145, homeKey: 'k' },
  'right-ring':  { x: 605, y: 146, homeKey: 'l' },
  'right-pinky': { x: 665, y: 142, homeKey: ';' },
};

/**
 * Resolves an approved key string or event object to its authoritative finger assignment
 * and calibrated target coordinates.
 * 
 * STRICT DIRECTIVE ENFORCEMENT:
 * - Only keys in ALLOWED_FINGER_ANIMATION_KEYS (and their uppercase equivalents) are permitted.
 * - Any unsupported character (numbers 0-9, special symbols, Backspace, Enter, Tab, Shift, Esc, arrows, etc.)
 *   strictly returns null (zero finger movement).
 * - Shift is never an independent target.
 */
export function resolveKeyToFinger(keyOrEvent, options = {}) {
  if (!keyOrEvent) return null;

  // Extract raw character
  let char = typeof keyOrEvent === 'string' ? keyOrEvent : keyOrEvent.key;

  // Support Spacebar from KeyboardEvent code if key is missing or ' '
  if (!char && typeof keyOrEvent === 'object' && keyOrEvent.code === 'Space') {
    char = ' ';
  } else if (char === 'space' || char === 'Space') {
    char = ' ';
  }

  if (!char) return null;

  // 1. Strict Allowlist Verification
  const isApproved =
    ALLOWED_FINGER_ANIMATION_KEYS.has(char) ||
    (char.length === 1 && ALLOWED_FINGER_ANIMATION_KEYS.has(char.toLowerCase()));

  if (!isApproved) {
    // Unsupported character = absolutely NO finger movement
    return null;
  }

  // 2. Resolve mapped finger and physical key ID from authoritative touch-typing map
  const entry = APPROVED_KEY_FINGER_MAP[char] || APPROVED_KEY_FINGER_MAP[char.toLowerCase()];
  if (!entry) return null;

  let finger = entry.finger;
  if (finger === 'thumb') {
    finger = options.spaceThumb || 'right-thumb';
  }

  const keyId = entry.keyId;
  const restingTip = FINGERTIP_POSITIONS[finger];
  let targetCoord = KEY_COORDS[keyId];

  // Ergonomic spacebar contact: typist thumbs strike their respective side of the 6.25u bar
  if (keyId === 'space' && targetCoord) {
    const thumbX = finger === 'left-thumb' ? 380 : 460;
    targetCoord = { ...targetCoord, cx: thumbX, cy: 251 };
  }

  let reachX = 0;
  let reachY = 0;
  if (restingTip && targetCoord) {
    reachX = +(targetCoord.cx - restingTip.x).toFixed(1);
    reachY = +(targetCoord.cy - restingTip.y).toFixed(1);
  }

  return {
    keyId,
    char,
    finger,
    targetCoord,
    restingTip,
    reachX,
    reachY,
  };
}
