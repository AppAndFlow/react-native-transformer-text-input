import { Transformer, type Selection } from '../Transformer';
import { PatternTransformer } from './pattern';

export type PhoneNumberTransformerOptions = {
  /**
   * Country code for phone number formatting.
   * Currently only 'US' is supported.
   * @default 'US'
   */
  country?: 'US';
  /**
   * Enable debug logging for transformer operations.
   * @default false
   */
  debug?: boolean;
};

// Count digits before a position in text
const countDigitsBefore = (text: string, pos: number): number => {
  'worklet';
  let count = 0;
  for (let i = 0; i < Math.min(pos, text.length); i++) {
    const char = text[i];
    if (char !== undefined && char >= '0' && char <= '9') {
      count++;
    }
  }
  return count;
};

// Extract all digits from text
const extractDigits = (text: string): string => {
  'worklet';
  return text.replace(/\D/g, '');
};

// Get national digits (strip leading 1 if present)
const getNationalDigits = (allDigits: string): string => {
  'worklet';
  return allDigits.startsWith('1') ? allDigits.slice(1) : allDigits;
};

export class PhoneNumberTransformer extends Transformer {
  constructor({
    country = 'US',
    debug = false,
  }: PhoneNumberTransformerOptions = {}) {
    if (country !== 'US') {
      throw new Error(
        `[PhoneNumberTransformer] Country "${country}" is not supported. Only "US" is currently supported.`,
      );
    }

    const patternTransformer = new PatternTransformer({
      pattern: '+1 (###) ###-####',
      showTrailingLiterals: true,
      debug,
    });

    const patternTransformerWorklet = patternTransformer.worklet;

    const worklet = (input: {
      value: string;
      previousValue: string;
      selection: Selection;
      previousSelection: Selection;
    }) => {
      'worklet';

      const { value, selection, previousValue, previousSelection } = input;

      // Extract digits
      const allDigits = extractDigits(value);
      const prevAllDigits = extractDigits(previousValue);

      const strippedLeading1 = allDigits.startsWith('1');
      const prevStrippedLeading1 = prevAllDigits.startsWith('1');

      let nationalDigits = getNationalDigits(allDigits);
      const prevNationalDigits = getNationalDigits(prevAllDigits);

      // Special case: only country code "1" remains
      if (nationalDigits.length === 0 && allDigits === '1') {
        // If deleting, clear everything
        if (value.length < previousValue.length) {
          return { value: '', selection: { start: 0, end: 0 } };
        }
        // Otherwise user just typed "1", show "+1 " prefix
        return { value: '+1 ', selection: { start: 3, end: 3 } };
      }

      // Calculate digit positions for selection start and end
      const digitsBeforeStart = countDigitsBefore(value, selection.start);
      const digitsBeforeEnd = countDigitsBefore(value, selection.end);
      const adjustedStart = strippedLeading1
        ? Math.max(0, digitsBeforeStart - 1)
        : digitsBeforeStart;
      const adjustedEnd = strippedLeading1
        ? Math.max(0, digitsBeforeEnd - 1)
        : digitsBeforeEnd;

      // Detect formatting char deletion at this level
      // (PatternTransformer can't detect it because we pass only digits)
      const isCaret = selection.start === selection.end;
      const deletedFormattingChar =
        isCaret &&
        value.length < previousValue.length &&
        nationalDigits.length === prevNationalDigits.length &&
        nationalDigits.length > 0;

      // If formatting char was deleted, remove the digit before cursor
      let finalStart = adjustedStart;
      let finalEnd = adjustedEnd;
      if (deletedFormattingChar && adjustedStart > 0) {
        nationalDigits =
          nationalDigits.slice(0, adjustedStart - 1) +
          nationalDigits.slice(adjustedStart);
        finalStart = adjustedStart - 1;
        finalEnd = adjustedStart - 1;
      }

      // For previous value selection
      const prevDigitsBeforeStart = countDigitsBefore(
        previousValue,
        previousSelection.start,
      );
      const prevDigitsBeforeEnd = countDigitsBefore(
        previousValue,
        previousSelection.end,
      );
      const prevAdjustedStart = prevStrippedLeading1
        ? Math.max(0, prevDigitsBeforeStart - 1)
        : prevDigitsBeforeStart;
      const prevAdjustedEnd = prevStrippedLeading1
        ? Math.max(0, prevDigitsBeforeEnd - 1)
        : prevDigitsBeforeEnd;

      // Call pattern transformer
      // Pass the modified nationalDigits directly as the "extracted" value
      // Use same length for prev to avoid triggering PatternTransformer's deletion logic
      return patternTransformerWorklet({
        value: nationalDigits,
        selection: { start: finalStart, end: finalEnd },
        previousValue: deletedFormattingChar
          ? nationalDigits
          : prevNationalDigits,
        previousSelection: { start: prevAdjustedStart, end: prevAdjustedEnd },
      });
    };

    super(worklet);
  }
}
