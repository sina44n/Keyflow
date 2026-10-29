/**
 * KEYFLOW Text Utilities & Generation Engine
 * ==========================================
 * Provides predictable, lossless, and safe text sanitization,
 * delimiter transformations, and custom typing test prompt generators.
 */

// Zero-width & invisible character regex
const ZERO_WIDTH_REGEX = /[\u200B-\u200D\uFEFF\u2060\u200E\u200F\u202A-\u202E\u00AD]/g;

// Control characters (except standard newline and tab)
const CONTROL_CHARS_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

// Curated vocabulary for random mode (common touch typing words)
export const DEFAULT_TYPING_VOCABULARY = [
  'the', 'be', 'of', 'and', 'a', 'to', 'in', 'he', 'have', 'it', 'that', 'for', 'they',
  'with', 'as', 'not', 'on', 'she', 'at', 'by', 'this', 'we', 'you', 'do', 'but', 'his',
  'from', 'they', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would',
  'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go',
  'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people',
  'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now',
  'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how',
  'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give',
  'day', 'most', 'us', 'flow', 'key', 'rhythm', 'focus', 'cadence', 'velocity', 'precision'
];

/**
 * Remove zero-width, non-printable, and hidden formatting characters.
 */
export const removeZeroWidth = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text.replace(ZERO_WIDTH_REGEX, '').replace(CONTROL_CHARS_REGEX, '');
};

/**
 * Normalize curly/smart quotes, apostrophes, and typographical dashes.
 */
export const normalizeSmartQuotes = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/[\u2018\u2019\u201A\u201B']/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F"]/g, '"')
    .replace(/[\u00AB\u00BB]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...');
};

/**
 * Collapse repeated whitespace into single delimiter while preserving linebreaks if needed.
 */
export const normalizeWhitespace = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/[ \t]+/g, ' ').trim();
};

/**
 * Convert all line breaks to single space.
 */
export const normalizeLineBreaks = (text, replacement = ' ') => {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/\r\n|\r|\n/g, replacement).replace(/\s+/g, ' ').trim();
};

/**
 * Live character counter.
 */
export const countCharacters = (text) => {
  if (!text || typeof text !== 'string') return 0;
  return text.length;
};

/**
 * Live word counter supporting arbitrary delimiter (space or pipe).
 */
export const countWords = (text, delimiter = ' ') => {
  if (!text || typeof text !== 'string') return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  if (delimiter === '|') {
    return trimmed.split('|').map((w) => w.trim()).filter(Boolean).length;
  }
  return trimmed.split(/\s+/).filter(Boolean).length;
};

/**
 * Deterministic or seeded Fisher-Yates array shuffle.
 */
export const shuffleArray = (arr, seed = null) => {
  const result = [...arr];
  let randomFn = Math.random;
  if (seed !== null && typeof seed === 'number') {
    let s = seed;
    randomFn = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/**
 * Process and format custom text according to selected mode, delimiter, and limits.
 *
 * @param {Object} options
 * @param {string} options.sourceText - Original text
 * @param {'simple'|'repeat'|'shuffle'|'random'} options.generationMode - Generation mode
 * @param {' ' | '|'} options.delimiter - Word separator
 * @param {'timed'|'words'|'passage'|'unlimited'} options.limitType - Limit type
 * @param {number} options.limitValue - Limit count (words or seconds)
 * @param {boolean} options.includePunctuation - Include punctuation
 * @param {boolean} options.includeNumbers - Include numbers
 * @param {Array<string>} [options.vocabulary] - Optional custom vocabulary for random mode
 * @returns {string} Processed text ready for typing test
 */
export const generateCustomTypingPrompt = ({
  sourceText = '',
  generationMode = 'simple',
  delimiter = ' ',
  limitType = 'words',
  limitValue = 25,
  includePunctuation = true,
  includeNumbers = true,
  vocabulary = DEFAULT_TYPING_VOCABULARY,
}) => {
  let cleaned = removeZeroWidth(sourceText || '').trim();

  // If random mode and source text is empty, generate from vocabulary
  if (generationMode === 'random') {
    const pool = (cleaned.length > 0 ? cleaned.split(/\s+/) : vocabulary).filter(Boolean);
    const targetWordCount = limitType === 'words' ? Math.max(5, limitValue || 25) : 30;
    const generated = [];
    for (let i = 0; i < targetWordCount; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      generated.push(pool[idx]);
    }
    cleaned = generated.join(delimiter);
  } else if (!cleaned) {
    return '';
  }

  // Handle delimiter splitting
  let words = [];
  if (delimiter === '|') {
    words = cleaned.split('|').map((w) => w.trim()).filter(Boolean);
  } else {
    words = cleaned.split(/\s+/).filter(Boolean);
  }

  if (words.length === 0) return '';

  // Mode transformations
  let processedWords = [...words];

  if (generationMode === 'shuffle') {
    processedWords = shuffleArray(words);
  } else if (generationMode === 'repeat') {
    const targetWordCount = limitType === 'words' ? Math.max(words.length, limitValue || 25) : words.length * 3;
    processedWords = [];
    while (processedWords.length < targetWordCount) {
      for (const w of words) {
        if (processedWords.length >= targetWordCount) break;
        processedWords.push(w);
      }
    }
  }

  // Optional punctuation and number filtering if explicitly disabled
  if (!includePunctuation) {
    processedWords = processedWords.map((w) => w.replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, ''));
  }
  if (!includeNumbers) {
    processedWords = processedWords.map((w) => w.replace(/[0-9]/g, ''));
  }

  // Filter out any empty words resulted from stripping
  processedWords = processedWords.filter(Boolean);
  if (processedWords.length === 0) return cleaned;

  // Word limit trimming if words mode
  if (limitType === 'words' && limitValue > 0) {
    processedWords = processedWords.slice(0, limitValue);
  }

  return processedWords.join(delimiter);
};
