import { runOnUI, executeOnUIRuntimeSync } from 'react-native-worklets';
import NativeTransformerTextInputModule from './NativeTransformerTextInputModule';
import { type Selection, type Transformer } from './Transformer';
import { computeUncontrolledSelection, validateSelection } from './selection';

type TransformerWrapper = (
  input: string,
  selectionStart: number,
  selectionEnd: number,
  transform: boolean,
) => { value: string; selection: Selection };

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

let initialized = false;

function initializeIfNeeded() {
  if (initialized) {
    return;
  }

  // Set up registry on UI runtime synchronously so it is guaranteed to exist
  // when native code accesses it after install().
  executeOnUIRuntimeSync(() => {
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

export function registerTransformer(transformer: Transformer): number {
  initializeIfNeeded();

  const id = currentId++;
  const worklet = transformer.worklet;

  runOnUI(() => {
    'worklet';

    let previousValue: string | null = null;
    let previousSelection: Selection | null = null;

    const transformerWrapper: TransformerWrapper = (
      value,
      selectionStart,
      selectionEnd,
      transform,
    ) => {
      const result = transform
        ? worklet({
            value,
            previousValue: previousValue ?? value,
            selection: { start: selectionStart, end: selectionEnd },
            previousSelection: previousSelection ?? {
              start: selectionStart,
              end: selectionEnd,
            },
          })
        : null;
      const newValue = result?.value ?? value;
      let newSelection: Selection;
      if (result?.selection != null) {
        newSelection = result.selection;
        validateSelection(newSelection, newValue.length);
      } else {
        newSelection = computeUncontrolledSelection(
          value,
          newValue,
          selectionStart,
          selectionEnd,
        );
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

export function unregisterTransformer(transformerId: number) {
  runOnUI(() => {
    'worklet';

    global.__rntti_registerTransformerRegistry?.unregister(transformerId);
  })();
}
