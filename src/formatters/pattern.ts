import { Transformer, type Selection } from '../Transformer';

export type PatternDefinitions = {
  [char: string]: RegExp;
};

export type PatternTransformerOptions = {
  /**
   * The pattern string where placeholder characters are replaced with user input.
   * Default placeholders: # (digit), A (letter), * (any alphanumeric)
   * All other characters are treated as literals.
   * @example '+1 (###) ###-####' for US phone
   * @example '##/##/####' for date
   */
  pattern: string;
  /**
   * Custom definitions for placeholder characters.
   * Each key is a placeholder char, value is a RegExp that matches valid input.
   * @default { '#': /\d/, 'A': /[a-zA-Z]/, '*': /[a-zA-Z0-9]/ }
   */
  definitions?: PatternDefinitions;
  /**
   * Show trailing literal characters after the last entered character.
   * When true, typing "555" with pattern "(###) ###-####" shows "(555) "
   * When false, it shows "(555"
   * @default false
   */
  showTrailingLiterals?: boolean;
  /**
   * Enable debug logging.
   * @default false
   */
  debug?: boolean;
};

type PatternPart =
  | { type: 'literal'; char: string }
  | { type: 'placeholder'; char: string; regex: RegExp };

// Parse pattern string into parts
const parsePattern = (
  pattern: string,
  definitions: PatternDefinitions,
): PatternPart[] => {
  const parts: PatternPart[] = [];
  for (const char of pattern) {
    if (definitions[char]) {
      parts.push({ type: 'placeholder', char, regex: definitions[char] });
    } else {
      parts.push({ type: 'literal', char });
    }
  }
  return parts;
};

// Count placeholders in pattern
const countPlaceholders = (parts: PatternPart[]): number => {
  return parts.filter((p) => p.type === 'placeholder').length;
};

// Check if char matches any of the used definitions
const isValidChar = (char: string, usedDefinitions: RegExp[]): boolean => {
  'worklet';
  for (const regex of usedDefinitions) {
    if (regex.test(char)) return true;
  }
  return false;
};

// Count valid chars before a position in text
const countValidCharsBefore = (
  text: string,
  pos: number,
  usedDefinitions: RegExp[],
): number => {
  'worklet';
  let count = 0;
  for (let i = 0; i < Math.min(pos, text.length); i++) {
    const char = text[i];
    if (char !== undefined && isValidChar(char, usedDefinitions)) {
      count++;
    }
  }
  return count;
};

// Find position in formatted text after N valid chars
const positionAfterNChars = (
  formattedText: string,
  targetCount: number,
  parts: PatternPart[],
): number => {
  'worklet';
  if (targetCount <= 0) {
    // Find first placeholder position
    for (let i = 0; i < parts.length; i++) {
      if (parts[i]!.type === 'placeholder') {
        return i;
      }
    }
    return 0;
  }

  let count = 0;
  for (let i = 0; i < formattedText.length; i++) {
    // Check if this position is a placeholder in the pattern
    if (i < parts.length && parts[i]!.type === 'placeholder') {
      count++;
      if (count === targetCount) {
        return i + 1;
      }
    }
  }
  return formattedText.length;
};

// Extract valid characters from input
const extractValidChars = (
  value: string,
  usedDefinitions: RegExp[],
): string => {
  'worklet';
  let extracted = '';
  for (const char of value) {
    if (isValidChar(char, usedDefinitions)) {
      extracted += char;
    }
  }
  return extracted;
};

// Build formatted output from chars using pattern parts
const buildFormattedOutput = (
  chars: string,
  parts: PatternPart[],
  showTrailingLiterals: boolean,
): string => {
  'worklet';
  let formatted = '';
  let charIndex = 0;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]!;

    if (part.type === 'literal') {
      // Only add literal if we have more chars to place after it
      if (charIndex > 0 && charIndex < chars.length) {
        formatted += part.char;
      } else if (charIndex > 0 && charIndex === chars.length) {
        // Check if there are more placeholders after this literal
        const hasMorePlaceholders = parts
          .slice(i + 1)
          .some((p) => p.type === 'placeholder');
        // Add trailing literal if pattern is complete OR showTrailingLiterals is enabled
        if (!hasMorePlaceholders || showTrailingLiterals) {
          formatted += part.char;
        }
      }
    } else {
      // Placeholder - insert next valid char
      if (charIndex >= chars.length) break;

      const char = chars[charIndex];
      if (char !== undefined && part.regex.test(char)) {
        // Add any pending literals before this placeholder
        let pendingLiterals = '';
        for (let j = formatted.length; j < i; j++) {
          const pendingPart = parts[j];
          if (pendingPart?.type === 'literal') {
            pendingLiterals += pendingPart.char;
          }
        }
        formatted += pendingLiterals + char;
        charIndex++;
      } else {
        // Char doesn't match this placeholder's regex, stop
        break;
      }
    }
  }

  return formatted;
};

export class PatternTransformer extends Transformer {
  constructor(options: PatternTransformerOptions) {
    const {
      pattern,
      definitions = {
        '#': /\d/,
        'A': /[a-zA-Z]/,
        '*': /[a-zA-Z0-9]/,
      },
      showTrailingLiterals = false,
      debug = false,
    } = options;

    // Pre-parse pattern (this runs at construction time, not in worklet)
    const parts = parsePattern(pattern, definitions);
    const maxLength = countPlaceholders(parts);

    // Collect only the regexes that are actually used in this pattern
    const usedDefinitions: RegExp[] = [];
    for (const part of parts) {
      if (part.type === 'placeholder') {
        usedDefinitions.push(part.regex);
      }
    }

    const worklet = (input: {
      value: string;
      previousValue: string;
      selection: Selection;
      previousSelection: Selection;
    }) => {
      'worklet';

      const { value, selection, previousValue, previousSelection } = input;

      // Extract valid characters
      const extracted = extractValidChars(value, usedDefinitions);

      // Check for formatting character deletion
      const isCaret = selection.start === selection.end;
      const totalChars = countValidCharsBefore(
        value,
        value.length,
        usedDefinitions,
      );
      const prevTotalChars = countValidCharsBefore(
        previousValue,
        previousValue.length,
        usedDefinitions,
      );
      const charsBefore = countValidCharsBefore(
        value,
        selection.start,
        usedDefinitions,
      );

      const deletedFormattingChar =
        isCaret &&
        value.length < previousValue.length &&
        totalChars === prevTotalChars &&
        totalChars > 0;

      let chars = extracted.slice(0, maxLength);

      // If formatting char was deleted, remove the digit before cursor
      if (deletedFormattingChar && charsBefore > 0) {
        chars = chars.slice(0, charsBefore - 1) + chars.slice(charsBefore);
      }

      // If empty, return empty
      if (chars.length === 0) {
        return { value: '', selection: { start: 0, end: 0 } };
      }

      // Build formatted output
      const formatted = buildFormattedOutput(
        chars,
        parts,
        showTrailingLiterals,
      );

      // Calculate cursor position
      const cursorAtEnd = selection.end >= value.length;
      const prevCursorAtEnd = previousSelection.end >= previousValue.length;

      const isDeleting = totalChars < prevTotalChars;
      const isInserting = totalChars > prevTotalChars;

      // Adjust charsBefore if we deleted a formatting char (and thus removed a digit)
      const adjustedCharsBefore = deletedFormattingChar
        ? charsBefore - 1
        : charsBefore;

      if (debug) {
        console.log('[PatternTransformer]', {
          input: { value, selection },
          extracted: chars,
          formatted,
          cursor: {
            charsBefore: adjustedCharsBefore,
            totalChars,
            isDeleting,
            isInserting,
            deletedFormattingChar,
          },
        });
      }

      // Formatting char deletion - position cursor after the removed digit
      if (deletedFormattingChar) {
        const newPos = positionAfterNChars(
          formatted,
          adjustedCharsBefore,
          parts,
        );
        return {
          value: formatted,
          selection: { start: newPos, end: newPos },
        };
      }

      // Typing at end
      if (isCaret && cursorAtEnd && prevCursorAtEnd) {
        return {
          value: formatted,
          selection: { start: formatted.length, end: formatted.length },
        };
      }

      // Deletion
      if (isDeleting && isCaret) {
        const newPos = positionAfterNChars(
          formatted,
          adjustedCharsBefore,
          parts,
        );
        return {
          value: formatted,
          selection: { start: newPos, end: newPos },
        };
      }

      // Insertion
      if (isInserting && isCaret) {
        const newPos = positionAfterNChars(
          formatted,
          adjustedCharsBefore,
          parts,
        );
        return {
          value: formatted,
          selection: { start: newPos, end: newPos },
        };
      }

      // Default / selection
      const clampedStart = Math.min(adjustedCharsBefore, chars.length);
      const newStart = positionAfterNChars(formatted, clampedStart, parts);
      const endChars = countValidCharsBefore(
        value,
        selection.end,
        usedDefinitions,
      );
      const clampedEnd = Math.min(endChars, chars.length);
      const newEnd = positionAfterNChars(formatted, clampedEnd, parts);

      return {
        value: formatted,
        selection: { start: newStart, end: newEnd },
      };
    };

    super(worklet);
  }
}
