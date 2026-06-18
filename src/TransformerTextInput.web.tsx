import {
  forwardRef,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Ref,
} from 'react';
import { TextInput } from 'react-native';
import { type Selection } from './Transformer';
import { computeUncontrolledSelection, validateSelection } from './selection';
import useMergeRefs from './utils/useMergeRefs';
import {
  type TransformerTextInputInstance,
  type TransformerTextInputInstanceMethods,
  type TransformerTextInputProps,
} from './TransformerTextInput.types';

export type {
  TransformerTextInputInstance,
  TransformerTextInputProps,
} from './TransformerTextInput.types';

// The web host node is a DOM input; type only the caret bits we use so the
// library's tsconfig doesn't need the `dom` lib.
type WebInputNode = {
  selectionStart: number | null;
  selectionEnd: number | null;
  setSelectionRange: (start: number, end: number) => void;
};

// Web implementation. There is no UI thread, so instead of the native decorator
// running the transformer worklet on the UI runtime, we render a controlled
// TextInput and run the same transformer synchronously in JS on every change.
// Web is single-threaded, so the value and caret update in one commit — no
// flicker. The caret is restored after the controlled value renders, since
// setting `value` alone collapses it to the end.
export const TransformerTextInput = forwardRef(
  (
    {
      transformer,
      onChangeText,
      defaultValue,
      ...others
    }: TransformerTextInputProps,
    forwardedRef: Ref<TransformerTextInputInstance>,
  ) => {
    const transformedDefaultValue = useMemo(() => {
      if (defaultValue == null) {
        return '';
      }
      const result = transformer.worklet({
        value: defaultValue,
        previousValue: defaultValue,
        selection: { start: defaultValue.length, end: defaultValue.length },
        previousSelection: { start: 0, end: 0 },
      });
      return result?.value ?? defaultValue;
    }, [defaultValue, transformer]);

    const [value, setValue] = useState(transformedDefaultValue);

    const valueRef = useRef(transformedDefaultValue);
    const previousRef = useRef<{ value: string; selection: Selection }>({
      value: transformedDefaultValue,
      selection: {
        start: transformedDefaultValue.length,
        end: transformedDefaultValue.length,
      },
    });
    const pendingSelectionRef = useRef<Selection | null>(null);
    const nodeRef = useRef<WebInputNode | null>(null);

    const applyTransform = useCallback(
      (
        rawValue: string,
        rawSelection: Selection,
        transform: boolean,
      ): string => {
        const prev = previousRef.current;
        const result = transform
          ? transformer.worklet({
              value: rawValue,
              previousValue: prev.value,
              selection: rawSelection,
              previousSelection: prev.selection,
            })
          : null;
        const newValue = result?.value ?? rawValue;
        let newSelection: Selection;
        if (result?.selection != null) {
          newSelection = result.selection;
          validateSelection(newSelection, newValue.length);
        } else {
          newSelection = computeUncontrolledSelection(
            rawValue,
            newValue,
            rawSelection.start,
            rawSelection.end,
          );
        }
        previousRef.current = { value: newValue, selection: newSelection };
        valueRef.current = newValue;
        pendingSelectionRef.current = newSelection;
        setValue(newValue);
        return newValue;
      },
      [transformer],
    );

    const handleChangeText = useCallback(
      (text: string) => {
        // On web the DOM caret sits right after the edit when onChangeText
        // fires; read it so the transformer can map it like the native side.
        const node = nodeRef.current;
        const rawSelection: Selection =
          node != null && typeof node.selectionStart === 'number'
            ? {
                start: node.selectionStart,
                end: node.selectionEnd ?? node.selectionStart,
              }
            : { start: text.length, end: text.length };
        const newValue = applyTransform(text, rawSelection, true);
        onChangeText?.(newValue);
      },
      [applyTransform, onChangeText],
    );

    const setInputRef = useCallback(
      (instance: TransformerTextInputInstance | null) => {
        nodeRef.current = instance as unknown as WebInputNode | null;
        if (instance != null) {
          Object.assign(instance, {
            getValue() {
              return valueRef.current;
            },
            update({ value: nextValue, selection, transform }) {
              const base = nextValue ?? valueRef.current;
              const sel = selection ?? { start: base.length, end: base.length };
              applyTransform(base, sel, transform ?? true);
            },
            clear() {
              this.update({ value: '', transform: false });
            },
          } satisfies TransformerTextInputInstanceMethods);
        }
      },
      [applyTransform],
    );

    const inputRef = useMergeRefs(setInputRef, forwardedRef);

    // Restore the post-transform caret after the controlled value commits.
    useLayoutEffect(() => {
      const pending = pendingSelectionRef.current;
      if (pending == null) {
        return;
      }
      pendingSelectionRef.current = null;
      const node = nodeRef.current;
      if (node != null && typeof node.setSelectionRange === 'function') {
        node.setSelectionRange(pending.start, pending.end);
      }
    });

    return (
      <TextInput
        // @ts-expect-error web host node carries the instance methods
        ref={inputRef}
        value={value}
        onChangeText={handleChangeText}
        {...others}
      />
    );
  },
);
