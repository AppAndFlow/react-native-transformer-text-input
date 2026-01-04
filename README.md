# React Native Transformer Text Input

TextInput component that allows transforming text synchronously with a worklet.

## Motivation

Transforming input as users type is common—phone numbers, credit cards, usernames. Existing approaches have trade-offs:

**Pattern-based masking** (e.g., [react-native-advanced-input-mask](https://github.com/IvanIhnatsiuk/react-native-advanced-input-mask)) uses declarative patterns like `+1 ([000]) [000]-[0000]`. This works well for fixed formats, but patterns can't express conditional logic, variable-length formats, or transformations that depend on context.

**Controlled inputs** (`value` + `onChangeText` + state) give you full JS flexibility, but create a native → JS → re-render → native round-trip. This causes visible lag and cursor flicker—the input feels sluggish because keystrokes are corrected asynchronously.

**This library** combines JS flexibility with synchronous execution. Your transform runs as a worklet on the UI thread—no bridge delay, no flicker. Write any logic you need with the responsiveness of a native input.

## Installation
```sh
npm install react-native-transformer-text-input
```

## Usage
```tsx
import { useRef } from 'react';
import {
  Transformer,
  TransformerTextInput,
  type TransformerTextInputInstance,
} from 'react-native-transformer-text-input';

// Transformer that formats input as a lowercase username with @ prefix
const usernameTransformer = new Transformer(({ value }) => {
  'worklet';

  const cleaned = value.replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
  return { value: cleaned ? '@' + cleaned : '' };
});

function UsernameTextInput() {
  const inputRef = useRef<TransformerTextInputInstance>(null);

  const handleSubmit = () => {
    const username = inputRef.current?.getValue();
    console.log('Submitted:', username);
  };

  return (
    <TransformerTextInput
      ref={inputRef}
      transformer={usernameTransformer}
      placeholder="@username"
      autoCapitalize="none"
      autoCorrect={false}
      onSubmitEditing={handleSubmit}
    />
  );
}
```

## API

### Transformer

Create a transformer by passing a worklet function:

- **Constructor**: `new Transformer(worklet)`
- **worklet input**: an object with
  - `value`: current text value.
  - `previousValue`: previous text value (falls back to `value` on first call).
  - `selection`: current selection `{ start, end }`.
  - `previousSelection`: previous selection `{ start, end }` (falls back to `selection` on first call).
- **worklet return**:
  - Return `null` or `undefined` to apply no transform.
  - Return an object where each field can also be `null` or `undefined` to leave that part unchanged:
    - `value?: string | null` to update the text.
    - `selection?: { start: number; end: number } | null` to update the selection.

### TransformerTextInput

`TransformerTextInput` wraps React Native `TextInput` and applies a `Transformer` on the UI thread.

- **Props**: all `TextInput` props (except `value`) plus:
  - `transformer`: a `Transformer` instance.
- **Ref**: `TransformerTextInputInstance` with:
  - `getValue(): string` - Returns the current text value.
  - `update(options): void` - Programmatically update the input.
    - `options.value: string` - The new text value.
    - `options.selection?: { start: number; end: number }` - Optional cursor/selection position.
    - `options.transform?: boolean` - Whether to run the transformer on the new value (default: `true`).
  - `clear(): void` - Clear the input value.

## Notes

- The transformer must be a worklet; the `Transformer` constructor will throw if it isn't.
- Prefer creating `Transformer` instances at module scope to avoid recreating worklets on every render.
- This library supports the New Architecture only.

## Selection Control

Selection control is needed because transforms can insert or remove characters, which would otherwise move the cursor unpredictably. The transformer can return a `selection` to fully control the caret/selection after a change.

Default behavior when no `selection` is returned:
- If the cursor was at the end, it stays at the end.
- If the cursor was in the middle, it moves forward by the number of inserted/removed characters.
- If the position is ambiguous, it falls back to the end.

## Built-in Transformers (Experimental)

> **Warning**: Built-in transformers are experimental. Breaking changes may occur in minor versions.

The library includes ready-to-use transformers for common use cases.

### PatternTransformer

Formats input using a pattern string with placeholder characters.

```tsx
import { PatternTransformer } from 'react-native-transformer-text-input/formatters/pattern';

const dateTransformer = new PatternTransformer({
  pattern: '##/##/####',  // # = digit, A = letter, * = alphanumeric
});

// Formats as: 12/31/2024
<TransformerTextInput
  transformer={dateTransformer}
  keyboardType="number-pad"
/>
```

Options:
- `pattern`: Pattern string where `#` matches digits, `A` matches letters, `*` matches alphanumeric.
- `definitions`: Custom placeholder definitions (e.g., `{ 'X': /[0-9A-F]/i }` for hex).
- `showTrailingLiterals`: Show literal characters after the last input (default: `false`).

### PhoneNumberTransformer

Formats phone numbers as the user types.

```tsx
import { PhoneNumberTransformer } from 'react-native-transformer-text-input/formatters/phone-number';

const phoneTransformer = new PhoneNumberTransformer({
  country: 'US',           // Only 'US' supported currently
  debug: false,            // Enable debug logging (default: false)
});

// Formats as: +1 (555) 123-4567
<TransformerTextInput
  transformer={phoneTransformer}
  keyboardType="phone-pad"
/>
```

## AI Disclosure

Code in this repository is thought through and mostly written by humans, with AI used to improve clarity, consistency, and implementation details.

## Acknowledgments

- [react-native-live-markdown](https://github.com/Expensify/react-native-live-markdown) and [react-native-advanced-input-mask](https://github.com/IvanIhnatsiuk/react-native-advanced-input-mask) for examples of how to extend TextInput.
- [react-native-worklets](https://github.com/software-mansion/react-native-reanimated/tree/main/packages/react-native-worklets) for the worklet runtime powering UI-thread execution.

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
