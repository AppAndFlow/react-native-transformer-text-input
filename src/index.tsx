import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type Ref,
} from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';
import { runOnUI } from 'react-native-worklets';
import TransformerTextInputDecoratorViewNativeComponent from './TransformerTextInputDecoratorViewNativeComponent';
import NativeTransformerTextInputModule from './NativeTransformerTextInputModule';

export type Selection = { start: number; end: number };

export type TransformerTextInputInstance = { value: string };

export type Transformer = (input: {
  value: string;
  previousValue: string;
  selection: Selection;
  previousSelection: Selection;
}) =>
  | {
      value?: string | null;
      selection?: Selection | null;
    }
  | null
  | undefined;

type TransformerWrapper = (
  input: string,
  selectionStart: number,
  selectionEnd: number,
) => { value: string | null; selection: Selection | null };

type ReactNativeTextInputTransformerRegistry = {
  register(id: number, transformer: TransformerWrapper): void;
  unregister(transformerId: number): void;
  get(transformerId: number): TransformerWrapper | undefined;
};

declare global {
  var __rntti_registerTransformerRegistry:
    | ReactNativeTextInputTransformerRegistry
    | undefined;
}

export type TransformerTextInputProps = Omit<TextInputProps, 'value'> & {
  transformer: Transformer;
};

let initialized = false;

function initializeIfNeeded() {
  if (initialized) {
    return;
  }

  // Important that `runOnUI` is called first to make sure the UI runtime is initialized.
  runOnUI(() => {
    'worklet';

    const transformersMap = new Map<number, TransformerWrapper>();

    globalThis.__rntti_registerTransformerRegistry = {
      register(id, transformer) {
        transformersMap.set(id, transformer);
      },
      unregister(transformerId) {
        transformersMap.delete(transformerId);
      },
      get(transformerId) {
        return transformersMap.get(transformerId);
      },
    };
  })();

  NativeTransformerTextInputModule.install();

  initialized = true;
}

// Start counting ids at 1 to avoid using 0 as it is the default int value.
let currentId = 1;

function registerTransformer(transformer: Transformer): number {
  initializeIfNeeded();

  const id = currentId++;

  runOnUI(() => {
    'worklet';

    let previousValue: string | null = null;
    let previousSelection: Selection | null = null;

    const transformerWrapper: TransformerWrapper = (
      value,
      selectionStart,
      selectionEnd,
    ) => {
      const result = transformer({
        value,
        previousValue: previousValue ?? value,
        selection: { start: selectionStart, end: selectionEnd },
        previousSelection: previousSelection ?? {
          start: selectionStart,
          end: selectionEnd,
        },
      });
      const newValue = result?.value ?? null;
      const newSelection = result?.selection ?? null;
      if (newSelection) {
        const currentValue = newValue ?? value;
        if (newSelection.start < 0 || newSelection.end < 0) {
          throw new Error(
            `[rntti] Returned selection must be non-negative. Received start=${newSelection.start}, end=${newSelection.end}, valueLength=${currentValue.length}`,
          );
        }
        if (newSelection.end < newSelection.start) {
          throw new Error(
            `[rntti] Returned selection end must be >= selection start. Received start=${newSelection.start}, end=${newSelection.end}, valueLength=${currentValue.length}`,
          );
        }
        if (
          newSelection.start > currentValue.length ||
          newSelection.end > currentValue.length
        ) {
          throw new Error(
            `[rntti] Returned selection is out of bounds for the returned value. Received start=${newSelection.start}, end=${newSelection.end}, valueLength=${currentValue.length}`,
          );
        }
      }
      previousValue = newValue;
      previousSelection = newSelection;
      return {
        value: newValue,
        selection: newSelection,
      };
    };

    globalThis.__rntti_registerTransformerRegistry?.register(
      id,
      transformerWrapper,
    );
  })();

  return id;
}

function unregisterTransformer(transformerId: number) {
  runOnUI(() => {
    'worklet';

    global.__rntti_registerTransformerRegistry?.unregister(transformerId);
  })();
}

export const TransformerTextInput = forwardRef(
  (
    { transformer, onChangeText, ...others }: TransformerTextInputProps,
    ref: Ref<TransformerTextInputInstance>,
  ) => {
    const workletHash = (transformer as { __workletHash?: number })
      .__workletHash;
    if (workletHash == null) {
      throw new Error(
        '[rntti] Prop `transformer` must be a worklet. Did you forget to add the "worklet" directive?',
      );
    }

    const transformerId = useMemo(() => {
      return registerTransformer(transformer);
    }, [transformer]);

    useEffect(() => {
      return () => unregisterTransformer(transformerId);
    }, [transformerId]);

    const inputRef = useRef<typeof TextInput>(null);
    const textRef = useRef('');

    // TODO: Merge refs
    useImperativeHandle(ref, () => ({
      get value() {
        return textRef.current;
      },
      set value(_newValue: string) {
        throw new Error('[rntti] Setting value directly is not supported.');
      },
    }));

    const handleChangeText = useCallback(
      (text: string) => {
        textRef.current = text;
        onChangeText?.(text);
      },
      [onChangeText],
    );

    return (
      <TransformerTextInputDecoratorViewNativeComponent
        style={styles.decorator}
        transformerId={transformerId}
      >
        <TextInput
          // @ts-expect-error ??
          ref={inputRef}
          onChangeText={handleChangeText}
          {...others}
        />
      </TransformerTextInputDecoratorViewNativeComponent>
    );
  },
);

const styles = StyleSheet.create({
  decorator: { display: 'contents' },
});
