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
import TransformerTextInputDecoratorViewNativeComponent from './TransformerTextInputDecoratorViewNativeComponent';
import { type Transformer } from './Transformer';
import { registerTransformer, unregisterTransformer } from './registry';

export type TransformerTextInputInstance = { value: string };

export type TransformerTextInputProps = Omit<TextInputProps, 'value'> & {
  transformer: Transformer;
};

export const TransformerTextInput = forwardRef(
  (
    { transformer, onChangeText, ...others }: TransformerTextInputProps,
    ref: Ref<TransformerTextInputInstance>,
  ) => {
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
