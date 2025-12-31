import { computeUncontrolledSelection, validateSelection } from '../selection';

describe('selection', () => {
  describe('computeUncontrolledSelection', () => {
    it('keeps cursor at end when selection is at the end', () => {
      const result = computeUncontrolledSelection('abc', 'abcd', 3, 3);

      expect(result).toEqual({ start: 4, end: 4 });
    });

    it('shifts cursor by delta when selection is in the middle', () => {
      const result = computeUncontrolledSelection('abcd', 'abXXcd', 2, 2);

      expect(result).toEqual({ start: 4, end: 4 });
    });

    it('shifts selection range by delta', () => {
      const result = computeUncontrolledSelection('hello', 'he__llo', 1, 4);

      expect(result).toEqual({ start: 3, end: 6 });
    });

    it('falls back to end when computed selection is invalid', () => {
      const result = computeUncontrolledSelection('abcd', 'a', 1, 4);

      expect(result).toEqual({ start: 1, end: 1 });
    });
  });

  describe('validateSelection', () => {
    it('throws when selection is negative', () => {
      expect(() => validateSelection({ start: -1, end: 0 }, 3)).toThrow(
        '[rntti] Returned selection must be non-negative. Received start=-1, end=0, valueLength=3',
      );
    });

    it('throws when selection end is before start', () => {
      expect(() => validateSelection({ start: 2, end: 1 }, 4)).toThrow(
        '[rntti] Returned selection end must be >= selection start. Received start=2, end=1, valueLength=4',
      );
    });

    it('throws when selection is out of bounds', () => {
      expect(() => validateSelection({ start: 2, end: 2 }, 1)).toThrow(
        '[rntti] Returned selection is out of bounds for the returned value. Received start=2, end=2, valueLength=1',
      );
    });
  });
});
