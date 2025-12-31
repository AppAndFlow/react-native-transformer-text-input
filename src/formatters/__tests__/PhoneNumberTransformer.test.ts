import { PhoneNumberTransformer } from '../phone-number';

// Helper to call the transformer worklet with simpler API
const transform = (
  transformer: PhoneNumberTransformer,
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

describe('PhoneNumberTransformer', () => {
  describe('constructor', () => {
    it('creates transformer with default options', () => {
      expect(() => new PhoneNumberTransformer()).not.toThrow();
    });

    it('creates transformer with US country', () => {
      expect(() => new PhoneNumberTransformer({ country: 'US' })).not.toThrow();
    });

    it('throws for unsupported country', () => {
      expect(
        // @ts-expect-error - testing invalid country
        () => new PhoneNumberTransformer({ country: 'CA' }),
      ).toThrow(/Country "CA" is not supported/);
    });
  });

  describe('formatting', () => {
    const transformer = new PhoneNumberTransformer();

    it('returns empty for empty input', () => {
      const result = transform(transformer, '');
      expect(result).toEqual({ value: '', selection: { start: 0, end: 0 } });
    });

    it('formats partial area code', () => {
      const result = transform(transformer, '55');
      expect(result?.value).toBe('+1 (55');
    });

    it('formats complete area code', () => {
      const result = transform(transformer, '555');
      expect(result?.value).toBe('+1 (555) ');
    });

    it('formats area code complete', () => {
      const result = transform(transformer, '5551');
      expect(result?.value).toBe('+1 (555) 1');
    });

    it('formats area code and exchange', () => {
      const result = transform(transformer, '555123');
      expect(result?.value).toBe('+1 (555) 123');
    });

    it('formats complete phone number', () => {
      const result = transform(transformer, '5551234567');
      expect(result?.value).toBe('+1 (555) 123-4567');
    });

    it('strips non-digit characters', () => {
      const result = transform(transformer, 'abc555def123ghi4567');
      expect(result?.value).toBe('+1 (555) 123-4567');
    });

    it('limits to 10 national digits', () => {
      const result = transform(transformer, '55512345678999');
      expect(result?.value).toBe('+1 (555) 123-4567');
    });
  });

  describe('cursor positioning', () => {
    const transformer = new PhoneNumberTransformer();

    it('positions cursor at end when typing at end', () => {
      const result = transform(
        transformer,
        '5551',
        { start: 4, end: 4 },
        '555',
        { start: 3, end: 3 },
      );
      expect(result?.value).toBe('+1 (555) 1');
      expect(result?.selection).toEqual({ start: 10, end: 10 });
    });

    it('positions cursor correctly after insertion in middle', () => {
      // Simulating inserting "9" after first digit in "555" -> "5955"
      const result = transform(
        transformer,
        '5955',
        { start: 2, end: 2 },
        '555',
        { start: 1, end: 1 },
      );
      expect(result?.value).toBe('+1 (595) 5');
      // Cursor should be after the 2nd national digit
      expect(result?.selection).toEqual({ start: 6, end: 6 });
    });

    it('positions cursor correctly after deletion', () => {
      // Simulating deleting "2" from "55512" -> "5551"
      const result = transform(
        transformer,
        '5551',
        { start: 4, end: 4 },
        '55512',
        { start: 5, end: 5 },
      );
      expect(result?.value).toBe('+1 (555) 1');
      expect(result?.selection).toEqual({ start: 10, end: 10 });
    });

    it('handles deletion in middle of number', () => {
      // Simulating deleting "5" from "5551" -> "551" with cursor at position 1
      const result = transform(
        transformer,
        '551',
        { start: 0, end: 0 },
        '5551',
        { start: 1, end: 1 },
      );
      expect(result?.value).toBe('+1 (551) ');
      expect(result?.selection).toEqual({ start: 3, end: 3 });
    });
  });

  describe('selection handling', () => {
    const transformer = new PhoneNumberTransformer();

    it('maintains selection range', () => {
      const result = transform(
        transformer,
        '5551234567',
        { start: 3, end: 7 },
        '5551234567',
        { start: 3, end: 7 },
      );
      expect(result?.value).toBe('+1 (555) 123-4567');
      // Selection should map to the same digits in formatted output
      expect(result?.selection?.start).toBeLessThan(
        result?.selection?.end ?? 0,
      );
    });

    it('handles selection at start', () => {
      const result = transform(
        transformer,
        '5551234567',
        { start: 0, end: 3 },
        '5551234567',
        { start: 0, end: 3 },
      );
      expect(result?.value).toBe('+1 (555) 123-4567');
      expect(result?.selection).toEqual({ start: 3, end: 7 });
    });

    it('handles selection at end', () => {
      const result = transform(
        transformer,
        '5551234567',
        { start: 7, end: 10 },
        '5551234567',
        { start: 7, end: 10 },
      );
      expect(result?.value).toBe('+1 (555) 123-4567');
      // Selection maps digits 7-10 to formatted positions
      expect(result?.selection).toEqual({ start: 14, end: 17 });
    });
  });
});
