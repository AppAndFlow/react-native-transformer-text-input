import { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Button,
  Text,
  KeyboardAvoidingView,
} from 'react-native';
import {
  TransformerTextInput,
  type TransformerTextInputInstance,
  Transformer,
} from 'react-native-transformer-text-input';

const usernameTransformer = new Transformer(({ value }) => {
  'worklet';

  const cleanedInput = value.replace(/[^0-9a-zA-Z]/g, '');
  const result =
    (cleanedInput ? '@' : '') + cleanedInput.toLowerCase().slice(0, 10);
  return { value: result };
});

const phoneNumberTransformer = new Transformer(
  ({ value, selection, previousValue, previousSelection }) => {
    'worklet';

    // Helper: check if char is a digit
    const isDigit = (char: string | undefined) =>
      char !== undefined && char >= '0' && char <= '9';

    // Helper: count national digits before a position
    // Always skips the first "1" digit when we have/will have +1 prefix
    const countNationalDigitsBefore = (text: string, pos: number) => {
      let count = 0;
      let skippedCountryOne = false;
      for (let i = 0; i < Math.min(pos, text.length); i++) {
        if (isDigit(text[i])) {
          // Skip the "1" in "+1" prefix
          if (
            !skippedCountryOne &&
            text[i] === '1' &&
            i > 0 &&
            text[i - 1] === '+'
          ) {
            skippedCountryOne = true;
          } else {
            count++;
          }
        }
      }
      return count;
    };

    // Helper: find position in formatted text after N national digits
    const positionAfterNationalDigit = (text: string, targetCount: number) => {
      if (targetCount <= 0) {
        // Position after "+1 " prefix if present, else 0
        if (text.startsWith('+1 ')) return 3;
        if (text.startsWith('+1')) return 2;
        return 0;
      }
      let count = 0;
      let skippedCountryOne = false;
      for (let i = 0; i < text.length; i++) {
        if (isDigit(text[i])) {
          if (
            !skippedCountryOne &&
            text[i] === '1' &&
            i > 0 &&
            text[i - 1] === '+'
          ) {
            skippedCountryOne = true;
          } else {
            count++;
            if (count === targetCount) return i + 1;
          }
        }
      }
      return text.length;
    };

    // Helper: format national digits into phone format
    const formatPhoneNumber = (digits: string) => {
      const area = digits.slice(0, 3);
      const exchange = digits.slice(3, 6);
      const subscriber = digits.slice(6, 10);

      let formatted = '+1 ';

      if (area.length > 0) {
        formatted += '(' + area;
        if (area.length === 3) {
          formatted += ') ';
        }
      }

      if (exchange.length > 0) {
        formatted += exchange;
        if (exchange.length === 3 && subscriber.length > 0) {
          formatted += '-';
        }
      }

      if (subscriber.length > 0) {
        formatted += subscriber;
      }

      return formatted;
    };

    // Extract all digits from input
    const allDigits = value.replace(/\D/g, '');

    // Empty input - clear everything
    if (allDigits.length === 0) {
      return { value: '', selection: { start: 0, end: 0 } };
    }

    // Get national digits - strip leading "1" since we always add +1 prefix
    const nationalDigits = (
      allDigits.startsWith('1') ? allDigits.slice(1) : allDigits
    ).slice(0, 10);

    // If no national digits left, check if user is deleting
    if (nationalDigits.length === 0) {
      // If value got shorter (user is deleting), clear everything
      if (value.length < previousValue.length) {
        console.log('[phone] -> case: deleted to empty');
        return { value: '', selection: { start: 0, end: 0 } };
      }
      // Otherwise user just typed "1", show the prefix
      return { value: '+1 ', selection: { start: 3, end: 3 } };
    }

    const formatted = formatPhoneNumber(nationalDigits);

    // Calculate cursor position
    const isCaret = selection.start === selection.end;
    const cursorAtEnd = selection.end >= value.length;
    const prevCursorAtEnd = previousSelection.end >= previousValue.length;

    // Count national digits
    const digitsBeforeCursor = countNationalDigitsBefore(
      value,
      selection.start,
    );
    const prevDigitsBeforeCursor = countNationalDigitsBefore(
      previousValue,
      previousSelection.start,
    );
    const totalDigits = countNationalDigitsBefore(value, value.length);
    const prevTotalDigits = countNationalDigitsBefore(
      previousValue,
      previousValue.length,
    );

    const isDeleting = totalDigits < prevTotalDigits;
    const isInserting = totalDigits > prevTotalDigits;

    // Detect deletion of formatting character (e.g., deleting space, dash, or paren)
    // User expects this to delete the digit before cursor
    const deletedFormattingChar =
      isCaret &&
      value.length < previousValue.length &&
      totalDigits === prevTotalDigits &&
      totalDigits > 0;

    // Log for debugging
    console.log('[phone]', {
      input: { value, selection },
      prev: { previousValue, previousSelection },
      digits: { nationalDigits, totalDigits, prevTotalDigits },
      cursor: { digitsBeforeCursor, prevDigitsBeforeCursor },
      flags: {
        isCaret,
        cursorAtEnd,
        prevCursorAtEnd,
        isDeleting,
        isInserting,
        deletedFormattingChar,
      },
      output: formatted,
    });

    // Case 0: Deleted a formatting char - remove the digit before cursor
    if (deletedFormattingChar) {
      // Figure out which digit to remove: the one before the cursor
      const digitToRemove = digitsBeforeCursor;

      if (digitToRemove <= 0) {
        // Cursor was before all digits, nothing to delete
        console.log(
          '[phone] -> case: deleted formatting char but cursor before all digits',
        );
        return { value: formatted, selection: { start: 3, end: 3 } };
      }

      // Remove the digit at position (digitToRemove - 1) from nationalDigits
      const trimmedDigits =
        nationalDigits.slice(0, digitToRemove - 1) +
        nationalDigits.slice(digitToRemove);

      console.log('[phone] -> case: deleted formatting char', {
        digitToRemove,
        trimmedDigits,
      });

      if (trimmedDigits.length === 0) {
        return { value: '', selection: { start: 0, end: 0 } };
      }

      const trimmedFormatted = formatPhoneNumber(trimmedDigits);

      // Position cursor where the deleted digit was
      const newCursorDigits = digitToRemove - 1;
      const newPos = positionAfterNationalDigit(
        trimmedFormatted,
        newCursorDigits,
      );

      return {
        value: trimmedFormatted,
        selection: { start: newPos, end: newPos },
      };
    }

    // Case 1: Typing at end (most common)
    if (isCaret && cursorAtEnd && prevCursorAtEnd) {
      console.log('[phone] -> case: typing at end');
      return {
        value: formatted,
        selection: { start: formatted.length, end: formatted.length },
      };
    }

    // Case 2: Deletion - use current cursor position (previous is stale if user moved cursor)
    if (isDeleting && isCaret) {
      const newPos = positionAfterNationalDigit(formatted, digitsBeforeCursor);
      console.log('[phone] -> case: deletion', {
        digitsBeforeCursor,
        newPos,
      });
      return {
        value: formatted,
        selection: { start: newPos, end: newPos },
      };
    }

    // Case 3: Insertion in middle - use current cursor position
    if (isInserting && isCaret) {
      const newPos = positionAfterNationalDigit(formatted, digitsBeforeCursor);
      console.log('[phone] -> case: insertion', {
        digitsBeforeCursor,
        newPos,
      });
      return {
        value: formatted,
        selection: { start: newPos, end: newPos },
      };
    }

    // Case 4: Default / selection handling
    const clampedDigits = Math.min(digitsBeforeCursor, nationalDigits.length);
    const newStart = positionAfterNationalDigit(formatted, clampedDigits);
    const endDigits = countNationalDigitsBefore(value, selection.end);
    const clampedEndDigits = Math.min(endDigits, nationalDigits.length);
    const newEnd = positionAfterNationalDigit(formatted, clampedEndDigits);

    console.log('[phone] -> case: default', {
      clampedDigits,
      newStart,
      clampedEndDigits,
      newEnd,
    });
    return {
      value: formatted,
      selection: { start: newStart, end: newEnd },
    };
  },
);

export default function App() {
  const usernameInputRef = useRef<TransformerTextInputInstance>(null);
  const phoneNumberInputRef = useRef<TransformerTextInputInstance>(null);

  const [isUsernameValid, setIsUsernameValid] = useState(false);
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const isValid = isUsernameValid && isPhoneValid;

  const handleUsernameChange = (value: string) => {
    const valid = value.length >= 2; // At least @X (1 char after @)
    setIsUsernameValid((prev) => (prev !== valid ? valid : prev));
  };

  const handlePhoneChange = (value: string) => {
    const phoneDigits = value.replace(/\D/g, '').replace(/^1/, '');
    const valid = phoneDigits.length === 10;
    setIsPhoneValid((prev) => (prev !== valid ? valid : prev));
  };

  const handleSubmit = () => {
    console.log('Username:', usernameInputRef.current?.value);
    console.log('Phone number:', phoneNumberInputRef.current?.value);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <Text style={styles.title}>React Native Transformer Text Input</Text>
      <View>
        <Text style={styles.label}>Username</Text>
        <TransformerTextInput
          ref={usernameInputRef}
          transformer={usernameTransformer}
          onChangeText={handleUsernameChange}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="@mycoolname"
          style={styles.input}
        />
        <Text style={styles.label}>Phone number</Text>
        <TransformerTextInput
          ref={phoneNumberInputRef}
          transformer={phoneNumberTransformer}
          onChangeText={handlePhoneChange}
          keyboardType="phone-pad"
          autoCorrect={false}
          placeholder="+1 (555) 123-4567"
          style={styles.input}
        />
        <Button title="Submit" onPress={handleSubmit} disabled={!isValid} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-evenly',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 32,
    textAlign: 'center',
  },
  label: {
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    height: 50,
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
});
