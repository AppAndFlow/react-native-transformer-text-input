import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ElementRef,
  type Ref,
} from 'react';
import {
  StyleSheet,
  TextInput,
  type HostInstance,
  type TextInputProps,
} from 'react-native';
import { type Transformer } from './Transformer';
import TransformerTextInputDecoratorViewNativeComponent, {
  Commands,
} from './TransformerTextInputDecoratorViewNativeComponent';
import { registerTransformer, unregisterTransformer } from './registry';
import useMergeRefs from './utils/useMergeRefs';

type TransformerTextInputInstanceMethods = {
  /**
   * Current text value.
   */
  readonly value: string;
  /**
   * Update the value and/or selection, optionally running the transformer.
   */
  update: (options: {
    /**
     * New value to apply.
     */
    value?: string | null;
    /**
     * Optional selection to apply alongside the value.
     */
    selection?: { start: number; end: number };
    /**
     * Whether to run the transformer on update. Defaults to true.
     */
    transform?: boolean;
  }) => void;
  /**
   * Clear the input value without running the transformer.
   */
  clear: () => void;
};

export type TransformerTextInputInstance = HostInstance &
  TransformerTextInputInstanceMethods;

export type TransformerTextInputProps = Omit<TextInputProps, 'value'> & {
  /**
   * Transformer instance used to sync text changes on the UI thread.
   */
  transformer: Transformer;
};

export const TransformerTextInput = forwardRef(
  (
    { transformer, onChangeText, ...others }: TransformerTextInputProps,
    forwardedRef: Ref<TransformerTextInputInstance>,
  ) => {
    const transformerId = useMemo(() => {
      return registerTransformer(transformer);
    }, [transformer]);

    useEffect(() => {
      return () => {
        unregisterTransformer(transformerId);
      };
    }, [transformerId]);

    const decoratorRef =
      useRef<
        ElementRef<typeof TransformerTextInputDecoratorViewNativeComponent>
      >(null);
    const textRef = useRef('');

    const setInputRef = useCallback((instance: HostInstance | null) => {
      if (instance != null) {
        Object.assign(instance, {
          get value() {
            return textRef.current;
          },
          set value(_newValue: string) {
            throw new Error('[rntti] Setting value directly is not supported.');
          },
          update({ value, selection, transform }) {
            const nativeRef = decoratorRef.current;
            if (!nativeRef) {
              return;
            }
            Commands.update(
              nativeRef,
              transform ?? true,
              value ?? null,
              selection != null,
              selection?.start ?? 0,
              selection?.end ?? 0,
            );
          },
          clear() {
            this.update({ value: '', transform: false });
          },
        } satisfies TransformerTextInputInstanceMethods);
      }
    }, []);

    const inputRef = useMergeRefs(setInputRef, forwardedRef);

    const handleChangeText = useCallback(
      (text: string) => {
        textRef.current = text;
        onChangeText?.(text);
      },
      [onChangeText],
    );

    return (
      <TransformerTextInputDecoratorViewNativeComponent
        ref={decoratorRef}
        style={styles.decorator}
        transformerId={transformerId}
      >
        <TextInput
          // @ts-expect-error
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
