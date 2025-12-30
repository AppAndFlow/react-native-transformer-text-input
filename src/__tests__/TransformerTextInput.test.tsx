import { render } from '@testing-library/react-native';
import { Transformer, TransformerTextInput } from '../index';

jest.mock('react-native-worklets').mock('../NativeTransformerTextInputModule');

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
});
