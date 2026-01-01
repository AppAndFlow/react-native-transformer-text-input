jest.mock('react-native-worklets');
jest.mock('../NativeTransformerTextInputModule');

const createWorklet =
  () =>
  ({
    value,
    selection,
  }: {
    value: string;
    selection: { start: number; end: number };
  }) => {
    'worklet';
    return { value, selection };
  };

describe('registry', () => {
  let Transformer: typeof import('../Transformer').Transformer;
  let registerTransformer: typeof import('../registry').registerTransformer;
  let unregisterTransformer: typeof import('../registry').unregisterTransformer;

  beforeEach(() => {
    jest.resetModules();
    delete globalThis.__rntti_registerTransformerRegistry;
    ({ Transformer } = require('../Transformer'));
    ({ registerTransformer, unregisterTransformer } = require('../registry'));
  });

  it('registers and unregisters transformers', () => {
    const transformer = new Transformer(createWorklet());
    const id = registerTransformer(transformer);
    const registry = globalThis.__rntti_registerTransformerRegistry;

    expect(registry?.get(id)).toBeDefined();
    unregisterTransformer(id);
    expect(registry?.get(id)).toBeUndefined();
  });

  it('allows null selection to pass through', () => {
    const transformer = new Transformer(({ value }: { value: string }) => {
      'worklet';
      return { value, selection: null };
    });

    const id = registerTransformer(transformer);
    const registry = globalThis.__rntti_registerTransformerRegistry;
    const wrapper = registry?.get(id);
    const result = wrapper?.('abc', 0, 0);

    expect(result?.selection).toEqual({ start: 0, end: 0 });
  });

  it('allows null value to pass through', () => {
    const transformer = new Transformer(() => {
      'worklet';
      return { value: null, selection: { start: 0, end: 0 } };
    });

    const id = registerTransformer(transformer);
    const registry = globalThis.__rntti_registerTransformerRegistry;
    const wrapper = registry?.get(id);
    const result = wrapper?.('abc', 0, 0);

    expect(result?.value).toEqual('abc');
  });

  it('allows null transformer result to pass through', () => {
    const transformer = new Transformer(() => {
      'worklet';
      return null;
    });

    const id = registerTransformer(transformer);
    const registry = globalThis.__rntti_registerTransformerRegistry;
    const wrapper = registry?.get(id);
    const result = wrapper?.('abc', 0, 0);

    expect(result?.value).toEqual('abc');
    expect(result?.selection).toEqual({ start: 0, end: 0 });
  });
});
