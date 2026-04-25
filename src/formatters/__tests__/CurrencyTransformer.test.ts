import { CurrencyTransformer } from '../currency';

const transform = (
  transformer: CurrencyTransformer,
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

describe('CurrencyTransformer', () => {
  describe('constructor', () => {
    it('creates with USD/en-US', () => {
      expect(
        () => new CurrencyTransformer({ currency: 'USD', locale: 'en-US' }),
      ).not.toThrow();
    });

    it('creates with EUR/de-DE', () => {
      expect(
        () => new CurrencyTransformer({ currency: 'EUR', locale: 'de-DE' }),
      ).not.toThrow();
    });

    it('creates with JPY/ja-JP', () => {
      expect(
        () => new CurrencyTransformer({ currency: 'JPY', locale: 'ja-JP' }),
      ).not.toThrow();
    });
  });

  describe('USD (en-US, prefix symbol, 2 decimals)', () => {
    const usd = new CurrencyTransformer({ currency: 'USD', locale: 'en-US' });

    it('returns empty for empty input', () => {
      expect(transform(usd, '')).toEqual({
        value: '',
        selection: { start: 0, end: 0 },
      });
    });

    describe('typing accumulation from empty', () => {
      it('first non-zero digit shows as cents', () => {
        const r = transform(usd, '1');
        expect(r?.value).toBe('$0.01');
        expect(r?.selection).toEqual({ start: 5, end: 5 });
      });

      it('two digits', () => {
        const r = transform(usd, '$0.012', { start: 6, end: 6 }, '$0.01', {
          start: 5,
          end: 5,
        });
        expect(r?.value).toBe('$0.12');
        expect(r?.selection).toEqual({ start: 5, end: 5 });
      });

      it('three digits crosses dollar boundary', () => {
        const r = transform(usd, '$0.123', { start: 6, end: 6 }, '$0.12', {
          start: 5,
          end: 5,
        });
        expect(r?.value).toBe('$1.23');
        expect(r?.selection).toEqual({ start: 5, end: 5 });
      });

      it('crosses thousands separator', () => {
        const r = transform(usd, '$123.456', { start: 8, end: 8 }, '$123.45', {
          start: 7,
          end: 7,
        });
        expect(r?.value).toBe('$1,234.56');
        expect(r?.selection).toEqual({ start: 9, end: 9 });
      });

      it('drops a leading zero typed into empty input', () => {
        // typing '0' first should not move the input off empty — the cents
        // accumulator is still zero, and the cursor stays at 0.
        const r = transform(usd, '0');
        expect(r?.value).toBe('');
        expect(r?.selection).toEqual({ start: 0, end: 0 });
      });
    });

    describe('mid-typing (cursor not at end)', () => {
      it('typing in front of "." when leading zero gets stripped puts cursor right after the typed digit', () => {
        // state: $0.23 cursor at 2 (between "0" and "."). Type "1":
        // native gives $01.23 cursor at 3. parseInt strips leading "0" → $1.23.
        // The typed "1" lands as the dollar digit; cursor goes right after
        // it (between "1" and ".") — i.e., position 2.
        const r = transform(usd, '$01.23', { start: 3, end: 3 }, '$0.23', {
          start: 2,
          end: 2,
        });
        expect(r?.value).toBe('$1.23');
        expect(r?.selection).toEqual({ start: 2, end: 2 });
      });

      it('typing in cents area where leading zeros get stripped puts cursor right after the typed digit', () => {
        // state: $0.05 cursor at 4 (between cent "0" and cent "5"). Type "1":
        // native gives $0.015 cursor at 5. parseInt: 15 → $0.15. Typed "1"
        // becomes the second digit; cursor goes right after it (between
        // "1" and "5") — i.e., position 4.
        const r = transform(usd, '$0.015', { start: 5, end: 5 }, '$0.05', {
          start: 4,
          end: 4,
        });
        expect(r?.value).toBe('$0.15');
        expect(r?.selection).toEqual({ start: 4, end: 4 });
      });

      it('inserts digit in middle, cursor right after typed digit', () => {
        // state: $12,345.67 cursor between "3" and "4" (pos 5). Type "9":
        // native gives $12,3945.67, cursor at 6.
        const r = transform(
          usd,
          '$12,3945.67',
          { start: 6, end: 6 },
          '$12,345.67',
          { start: 5, end: 5 },
        );
        expect(r?.value).toBe('$123,945.67');
        // After 4th digit (the "9") in "$123,945.67" → cursor at 6.
        expect(r?.selection).toEqual({ start: 6, end: 6 });
      });
    });

    describe('selection-only re-run (no value change)', () => {
      it('preserves cursor in the middle', () => {
        const r = transform(
          usd,
          '$12,345.67',
          { start: 3, end: 3 },
          '$12,345.67',
          { start: 10, end: 10 },
        );
        expect(r?.value).toBe('$12,345.67');
        expect(r?.selection).toEqual({ start: 3, end: 3 });
      });

      it('keeps cursor at the end when at the end', () => {
        const r = transform(
          usd,
          '$12,345.67',
          { start: 10, end: 10 },
          '$12,345.67',
          { start: 10, end: 10 },
        );
        expect(r?.value).toBe('$12,345.67');
        expect(r?.selection).toEqual({ start: 10, end: 10 });
      });

      it('snaps cursor at very start (pos 0) to right after the symbol', () => {
        const r = transform(usd, '$12.34', { start: 0, end: 0 }, '$12.34', {
          start: 5,
          end: 5,
        });
        expect(r?.value).toBe('$12.34');
        expect(r?.selection).toEqual({ start: 1, end: 1 });
      });
    });

    describe('backspace at end', () => {
      it('removes the last digit', () => {
        const r = transform(
          usd,
          '$12,345.6',
          { start: 9, end: 9 },
          '$12,345.67',
          { start: 10, end: 10 },
        );
        expect(r?.value).toBe('$1,234.56');
        expect(r?.selection).toEqual({ start: 9, end: 9 });
      });

      it('clears the input when only one cent remains', () => {
        const r = transform(usd, '$0.0', { start: 4, end: 4 }, '$0.01', {
          start: 5,
          end: 5,
        });
        expect(r?.value).toBe('');
        expect(r?.selection).toEqual({ start: 0, end: 0 });
      });
    });

    describe('backspace next to a separator', () => {
      it('drops the digit before the cursor when "." is deleted', () => {
        // state: $12.34 cursor between "." and "3" (pos 4).
        // backspace deletes ".", value = $1234, cursor at 3.
        const r = transform(usd, '$1234', { start: 3, end: 3 }, '$12.34', {
          start: 4,
          end: 4,
        });
        expect(r?.value).toBe('$1.34');
        // After dropping the digit before cursor ("2"), digits = "134".
        // Cursor lands right after the 1st digit ("1") → position 2.
        expect(r?.selection).toEqual({ start: 2, end: 2 });
      });

      it('drops the digit before the cursor when "," is deleted', () => {
        // state: $1,234.56 cursor between "," and "2" (pos 3).
        // backspace deletes ",", value = $1234.56, cursor at 2.
        const r = transform(
          usd,
          '$1234.56',
          { start: 2, end: 2 },
          '$1,234.56',
          { start: 3, end: 3 },
        );
        expect(r?.value).toBe('$234.56');
        // After dropping the leading "1", digits = "23456". Cursor lands
        // before the first digit ("2") → position 1.
        expect(r?.selection).toEqual({ start: 1, end: 1 });
      });
    });

    describe('backspace at start (deleting the symbol)', () => {
      it('does not drop a digit; the formatter just re-adds the symbol', () => {
        // state: $12.34 cursor between "$" and "1" (pos 1).
        // backspace deletes "$", value = 12.34, cursor at 0.
        const r = transform(usd, '12.34', { start: 0, end: 0 }, '$12.34', {
          start: 1,
          end: 1,
        });
        expect(r?.value).toBe('$12.34');
        expect(r?.selection).toEqual({ start: 1, end: 1 });
      });
    });

    describe('range selection', () => {
      it('replaces selected range with typed digit', () => {
        // state: $12,345.67, select chars at [1, 5) ("12,3"), type "9".
        const r = transform(
          usd,
          '$945.67',
          { start: 2, end: 2 },
          '$12,345.67',
          { start: 1, end: 5 },
        );
        expect(r?.value).toBe('$945.67');
        expect(r?.selection).toEqual({ start: 2, end: 2 });
      });

      it('clears with backspace over the full selection', () => {
        const r = transform(usd, '', { start: 0, end: 0 }, '$12,345.67', {
          start: 0,
          end: 10,
        });
        expect(r?.value).toBe('');
        expect(r?.selection).toEqual({ start: 0, end: 0 });
      });
    });
  });

  describe('EUR (de-DE, suffix symbol, 2 decimals)', () => {
    const eur = new CurrencyTransformer({ currency: 'EUR', locale: 'de-DE' });

    it('formats with locale-specific separators and trailing symbol', () => {
      const r = transform(eur, '1234567');
      expect(r?.value).toBe('12.345,67 €');
    });

    it('places cursor right after the last digit, before the trailing space + €', () => {
      const r = transform(eur, '1234567');
      // formatted: "12.345,67 €" (length 11). Last digit "7" at index 8.
      expect(r?.selection).toEqual({ start: 9, end: 9 });
    });

    it('first digit puts cursor right after the digit', () => {
      const r = transform(eur, '1');
      expect(r?.value).toBe('0,01 €');
      // formatted: "0,01 €" (length 6). Last digit "1" at index 3.
      expect(r?.selection).toEqual({ start: 4, end: 4 });
    });

    it('snaps cursor in trailing " €" back to right after the last digit', () => {
      const eurValue = '12.345,67 €';
      // user taps in the trailing chars (pos 10 — between space and €)
      const r = transform(eur, eurValue, { start: 10, end: 10 }, eurValue, {
        start: 9,
        end: 9,
      });
      expect(r?.value).toBe(eurValue);
      expect(r?.selection).toEqual({ start: 9, end: 9 });
    });
  });

  describe('JPY (ja-JP, no decimals)', () => {
    const jpy = new CurrencyTransformer({ currency: 'JPY', locale: 'ja-JP' });

    it('formats whole units (no decimal places)', () => {
      const r = transform(jpy, '1234567');
      expect(r?.value).toBe('￥1,234,567');
    });

    it('cursor right after the last digit', () => {
      const r = transform(jpy, '1234567');
      // formatted: "￥1,234,567" (length 10). Last digit "7" at index 9.
      expect(r?.selection).toEqual({ start: 10, end: 10 });
    });

    it('first digit shows whole unit', () => {
      const r = transform(jpy, '1');
      expect(r?.value).toBe('￥1');
      expect(r?.selection).toEqual({ start: 2, end: 2 });
    });

    it('backspace at end removes last digit', () => {
      const r = transform(jpy, '￥1,23', { start: 5, end: 5 }, '￥1,234', {
        start: 6,
        end: 6,
      });
      expect(r?.value).toBe('￥123');
      expect(r?.selection).toEqual({ start: 4, end: 4 });
    });

    it('backspace next to "," drops the digit before the cursor', () => {
      // state: ￥1,234 cursor between "," and "2" (pos 3).
      // backspace deletes ",", value = ￥1234, cursor at 2.
      const r = transform(jpy, '￥1234', { start: 2, end: 2 }, '￥1,234', {
        start: 3,
        end: 3,
      });
      expect(r?.value).toBe('￥234');
      // After dropping the leading "1", digits = "234". Cursor lands before
      // the first digit ("2") → position 1.
      expect(r?.selection).toEqual({ start: 1, end: 1 });
    });
  });

  describe('currency-switch reformat', () => {
    const usd = new CurrencyTransformer({ currency: 'USD', locale: 'en-US' });
    const eur = new CurrencyTransformer({ currency: 'EUR', locale: 'de-DE' });

    it('USD value passed to EUR transformer reformats with cursor before suffix', () => {
      const r = transform(eur, '$1,234.56', { start: 9, end: 9 }, '$1,234.56', {
        start: 9,
        end: 9,
      });
      expect(r?.value).toBe('1.234,56 €');
      // Last digit "6" in "1.234,56 €" is at index 7. Cursor at 8.
      expect(r?.selection).toEqual({ start: 8, end: 8 });
    });

    it('JPY-formatted value passed to USD transformer scales for fraction digits', () => {
      const r = transform(
        usd,
        '￥1,234,567',
        { start: 10, end: 10 },
        '￥1,234,567',
        { start: 10, end: 10 },
      );
      expect(r?.value).toBe('$12,345.67');
      expect(r?.selection).toEqual({ start: 10, end: 10 });
    });
  });
});
