import { Transformer } from '../Transformer';

export type CurrencyTransformerOptions = {
  /**
   * ISO 4217 currency code, e.g. 'USD', 'EUR', 'JPY'. Drives the symbol and
   * the number of fraction digits.
   */
  currency: string;
  /**
   * BCP 47 locale tag, e.g. 'en-US', 'de-DE'. Drives separators and symbol
   * position. Defaults to the runtime's default locale.
   */
  locale?: string;
};

export class CurrencyTransformer extends Transformer {
  constructor(options: CurrencyTransformerOptions) {
    const { currency, locale } = options;

    const fractionDigits =
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
      }).resolvedOptions().maximumFractionDigits ?? 0;
    const cacheKey = `${locale ?? ''}|${currency}`;

    super(({ value, previousValue, selection }) => {
      'worklet';

      const isDigitAt = (s: string, i: number) => {
        const c = s.charCodeAt(i);
        return c >= 48 && c <= 57;
      };

      const prevValue = previousValue ?? value;
      let digits = value.replace(/\D/g, '');
      const prevDigits = prevValue.replace(/\D/g, '');

      let cursorDigitIndex = 0;
      for (let i = 0; i < selection.start && i < value.length; i++) {
        if (isDigitAt(value, i)) cursorDigitIndex++;
      }

      // Backspace next to a separator doesn't change the digit count, so the
      // formatter would re-add it. Drop the digit before the cursor so the
      // keystroke has a visible effect (drops the last digit when the cursor
      // sits past the end of the digits).
      if (
        digits.length === prevDigits.length &&
        value.length < prevValue.length &&
        cursorDigitIndex > 0
      ) {
        digits =
          digits.slice(0, cursorDigitIndex - 1) +
          digits.slice(cursorDigitIndex);
        cursorDigitIndex -= 1;
      }

      // Treat all-zero digits as empty so leading zeros and the last-cent
      // backspace both clear the input cleanly.
      const amount = parseInt(digits, 10) / 10 ** fractionDigits;
      if (!digits || amount === 0) {
        return { value: '', selection: { start: 0, end: 0 } };
      }

      const cache: Record<string, Intl.NumberFormat> =
        (
          globalThis as unknown as {
            __currencyFormatters?: Record<string, Intl.NumberFormat>;
          }
        ).__currencyFormatters ?? {};
      let formatter = cache[cacheKey];
      if (!formatter) {
        formatter = new Intl.NumberFormat(locale, {
          style: 'currency',
          currency,
        });
        cache[cacheKey] = formatter;
        (
          globalThis as unknown as {
            __currencyFormatters?: Record<string, Intl.NumberFormat>;
          }
        ).__currencyFormatters = cache;
      }

      const formatted = formatter.format(amount);

      // Map cursor to "right after the Nth digit in formatted" where N is
      // the user's digit-cursor in the raw value, adjusted for the digit
      // count diff between raw and formatted. parseInt may strip leading
      // zeros (raw `0123` → formatted `123`) and the formatter may pad
      // with cents zeros (raw `1` → formatted `001`); the diff captures
      // both so the cursor stays right after whatever digit the user just
      // typed (or to the right of the dropped digit, on backspace).
      let formattedDigitsCount = 0;
      for (let i = 0; i < formatted.length; i++) {
        if (isDigitAt(formatted, i)) formattedDigitsCount++;
      }
      const targetDigit =
        cursorDigitIndex + (formattedDigitsCount - digits.length);

      let newCursor = formatted.length;
      if (targetDigit >= formattedDigitsCount) {
        // Past the last digit — snap to right after the last digit so the
        // cursor sits at the end of the amount (excludes any trailing
        // symbol like " €").
        for (let i = formatted.length - 1; i >= 0; i--) {
          if (isDigitAt(formatted, i)) {
            newCursor = i + 1;
            break;
          }
        }
      } else if (targetDigit <= 0) {
        // Before the first digit — snap to the first digit so the next
        // keystroke lands inside the number rather than before any
        // prefix symbol.
        for (let i = 0; i < formatted.length; i++) {
          if (isDigitAt(formatted, i)) {
            newCursor = i;
            break;
          }
        }
      } else {
        let seen = 0;
        for (let i = 0; i < formatted.length; i++) {
          if (isDigitAt(formatted, i)) {
            seen++;
            if (seen === targetDigit) {
              newCursor = i + 1;
              break;
            }
          }
        }
      }

      return {
        value: formatted,
        selection: { start: newCursor, end: newCursor },
      };
    });
  }
}
