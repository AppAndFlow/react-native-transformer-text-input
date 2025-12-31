import { render } from '@testing-library/react-native';
import React from 'react';
import { TextInput } from 'react-native';
import { Transformer, TransformerTextInput } from '../index';
import * as registry from '../registry';

jest.mock('react-native-worklets');
jest.mock('../NativeTransformerTextInputModule');
jest.mock('../registry', () => ({
  registerTransformer: jest.fn(() => 42),
  unregisterTransformer: jest.fn(),
}));

describe('TransformerTextInput', () => {
  it('renders with a transformer', () => {
    const transformer = new Transformer(({ value }) => {
      'worklet';
      return { value };
    });

    const { toJSON } = render(
      <TransformerTextInput transformer={transformer} />,
    );
    const tree = toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('passes props to TextInput', () => {
    const transformer = new Transformer(({ value }) => {
      'worklet';
      return { value };
    });

    const { toJSON } = render(
      <TransformerTextInput
        transformer={transformer}
        placeholder="Enter text"
      />,
    );
    const tree = toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('updates ref value and calls onChangeText', () => {
    const transformer = new Transformer(({ value }) => {
      'worklet';
      return { value };
    });
    const ref = React.createRef<{ value: string }>();
    const onChangeText = jest.fn();

    const { UNSAFE_getByType } = render(
      <TransformerTextInput
        ref={ref}
        transformer={transformer}
        onChangeText={onChangeText}
      />,
    );

    const textInput = UNSAFE_getByType(TextInput);
    textInput.props.onChangeText('hello');

    expect(ref.current?.value).toBe('hello');
    expect(onChangeText).toHaveBeenCalledWith('hello');
  });

  it('registers and unregisters transformers via registry', () => {
    const transformer = new Transformer(({ value }) => {
      'worklet';
      return { value };
    });

    const { unmount } = render(
      <TransformerTextInput transformer={transformer} />,
    );

    expect(registry.registerTransformer).toHaveBeenCalled();
    expect(registry.registerTransformer).toHaveBeenCalledWith(transformer);

    unmount();

    expect(registry.unregisterTransformer).toHaveBeenCalled();
    expect(registry.unregisterTransformer).toHaveBeenCalledWith(42);
  });
});
