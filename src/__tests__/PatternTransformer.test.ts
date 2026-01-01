import { PatternTransformer } from '../formatters/pattern';

// Helper to call the transformer worklet with simpler API
const transform = (
  transformer: PatternTransformer,
  value: string,
  selection: { start: number; end: number } = {
    start: value.length,
    end: value.length,
  },
  previousValue: string = '',
  previousSelection: { start: number; end: number } = { start: 0, end: 0 },
) => {
  return transformer.worklet({
    value,
    selection,
    previousValue,
    previousSelection,
  });
};

describe('PatternTransformer', () => {
  describe('phone number pattern', () => {
    const transformer = new PatternTransformer({
      pattern: '(###) ###-####',
    });

    it('formats partial input', () => {
      const result = transform(transformer, '555');
      expect(result?.value).toBe('(555');
    });

    it('formats complete area code', () => {
      const result = transform(transformer, '5551');
      expect(result?.value).toBe('(555) 1');
    });

    it('formats complete phone number', () => {
      const result = transform(transformer, '5551234567');
      expect(result?.value).toBe('(555) 123-4567');
    });

    it('strips non-digit characters', () => {
      const result = transform(transformer, 'abc555def1234567');
      expect(result?.value).toBe('(555) 123-4567');
    });

    it('limits to pattern length', () => {
      const result = transform(transformer, '55512345678999');
      expect(result?.value).toBe('(555) 123-4567');
    });

    it('returns empty for empty input', () => {
      const result = transform(transformer, '');
      expect(result).toEqual({ value: '', selection: { start: 0, end: 0 } });
    });
  });

  describe('date pattern', () => {
    const transformer = new PatternTransformer({
      pattern: '##/##/####',
    });

    it('formats partial date', () => {
      const result = transform(transformer, '12');
      expect(result?.value).toBe('12');
    });

    it('formats month and day', () => {
      const result = transform(transformer, '1225');
      expect(result?.value).toBe('12/25');
    });

    it('formats complete date', () => {
      const result = transform(transformer, '12252024');
      expect(result?.value).toBe('12/25/2024');
    });
  });

  describe('credit card pattern', () => {
    const transformer = new PatternTransformer({
      pattern: '#### #### #### ####',
    });

    it('formats partial card number', () => {
      const result = transform(transformer, '4242');
      expect(result?.value).toBe('4242');
    });

    it('formats two groups', () => {
      const result = transform(transformer, '42424242');
      expect(result?.value).toBe('4242 4242');
    });

    it('formats complete card number', () => {
      const result = transform(transformer, '4242424242424242');
      expect(result?.value).toBe('4242 4242 4242 4242');
    });
  });

  describe('custom definitions', () => {
    it('supports letter placeholders', () => {
      const transformer = new PatternTransformer({
        pattern: 'AAA-###',
        definitions: {
          '#': /\d/,
          'A': /[a-zA-Z]/,
        },
      });
      const result = transform(transformer, 'ABC123');
      expect(result?.value).toBe('ABC-123');
    });

    it('supports mixed placeholders', () => {
      const transformer = new PatternTransformer({
        pattern: '**-####',
        definitions: {
          '#': /\d/,
          '*': /[a-zA-Z0-9]/,
        },
      });
      const result = transform(transformer, 'A11234');
      expect(result?.value).toBe('A1-1234');
    });

    it('supports custom regex', () => {
      const transformer = new PatternTransformer({
        pattern: 'X-###',
        definitions: {
          '#': /\d/,
          'X': /[1-5]/, // Only 1-5 allowed
        },
      });
      const result = transform(transformer, '3123');
      expect(result?.value).toBe('3-123');
    });
  });

  describe('showTrailingLiterals option', () => {
    it('does not show trailing literals by default', () => {
      const transformer = new PatternTransformer({
        pattern: '(###) ###-####',
      });
      const result = transform(transformer, '555');
      expect(result?.value).toBe('(555');
    });

    it('shows trailing literals when enabled', () => {
      const transformer = new PatternTransformer({
        pattern: '(###) ###-####',
        showTrailingLiterals: true,
      });
      const result = transform(transformer, '555');
      expect(result?.value).toBe('(555) ');
    });

    it('shows all trailing literals until next placeholder', () => {
      const transformer = new PatternTransformer({
        pattern: '(###) ###-####',
        showTrailingLiterals: true,
      });
      const result = transform(transformer, '555123');
      expect(result?.value).toBe('(555) 123-');
    });

    it('deletes digit when deleting trailing literal', () => {
      const transformer = new PatternTransformer({
        pattern: '(###) ###-####',
        showTrailingLiterals: true,
      });
      // Simulating backspace on "(555) 123-" which deletes the "-"
      // Should remove the "3" and result in "(555) 12"
      const result = transform(
        transformer,
        '(555) 123', // After deleting "-"
        { start: 9, end: 9 },
        '(555) 123-', // Previous value with trailing "-"
        { start: 10, end: 10 },
      );
      expect(result?.value).toBe('(555) 12');
      expect(result?.selection).toEqual({ start: 8, end: 8 });
    });

    it('does not lose last char when setting value directly', () => {
      const transformer = new PatternTransformer({
        pattern: '#### #### #### ####',
      });
      // Simulating setting a raw value over a formatted previous value
      const result = transform(
        transformer,
        '4242424242424242', // Raw 16 digits
        { start: 16, end: 16 },
        '4242 4242 4242 4242', // Previous formatted (19 chars)
        { start: 19, end: 19 },
      );
      expect(result?.value).toBe('4242 4242 4242 4242');
    });
  });

  describe('cursor positioning', () => {
    const transformer = new PatternTransformer({
      pattern: '(###) ###-####',
    });

    it('positions cursor at end when typing at end', () => {
      const result = transform(
        transformer,
        '5551',
        { start: 4, end: 4 },
        '555',
        { start: 3, end: 3 },
      );
      expect(result?.value).toBe('(555) 1');
      expect(result?.selection).toEqual({ start: 7, end: 7 });
    });

    it('positions cursor correctly after insertion', () => {
      const result = transform(
        transformer,
        '5955',
        { start: 2, end: 2 },
        '555',
        { start: 1, end: 1 },
      );
      expect(result?.value).toBe('(595) 5');
      // Cursor after 2nd char
      expect(result?.selection).toEqual({ start: 3, end: 3 });
    });

    it('positions cursor correctly after deletion', () => {
      const result = transform(
        transformer,
        '555',
        { start: 3, end: 3 },
        '5551',
        { start: 4, end: 4 },
      );
      expect(result?.value).toBe('(555');
      expect(result?.selection).toEqual({ start: 4, end: 4 });
    });
  });
});
