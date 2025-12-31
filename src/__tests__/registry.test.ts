jest.mock('react-native-worklets');
jest.mock('../NativeTransformerTextInputModule');

const makeWorklet =
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
    const transformer = new Transformer(makeWorklet());
    const id = registerTransformer(transformer);
    const registry = globalThis.__rntti_registerTransformerRegistry;

    expect(registry?.get(id)).toBeDefined();
    unregisterTransformer(id);
    expect(registry?.get(id)).toBeUndefined();
  });

  it('throws when selection is negative', () => {
    const transformer = new Transformer(({ value }: { value: string }) => {
      'worklet';
      return { value, selection: { start: -1, end: 0 } };
    });

    const id = registerTransformer(transformer);
    const registry = globalThis.__rntti_registerTransformerRegistry;
    const wrapper = registry?.get(id);

    expect(() => wrapper?.('abc', 0, 0)).toThrow(
      '[rntti] Returned selection must be non-negative. Received start=-1, end=0, valueLength=3',
    );
  });

  it('throws when selection end is before start', () => {
    const transformer = new Transformer(({ value }: { value: string }) => {
      'worklet';
      return { value, selection: { start: 2, end: 1 } };
    });

    const id = registerTransformer(transformer);
    const registry = globalThis.__rntti_registerTransformerRegistry;
    const wrapper = registry?.get(id);

    expect(() => wrapper?.('abcd', 0, 0)).toThrow(
      '[rntti] Returned selection end must be >= selection start. Received start=2, end=1, valueLength=4',
    );
  });

  it('throws when selection is out of bounds', () => {
    const transformer = new Transformer(() => {
      'worklet';
      return { value: 'a', selection: { start: 2, end: 2 } };
    });

    const id = registerTransformer(transformer);
    const registry = globalThis.__rntti_registerTransformerRegistry;
    const wrapper = registry?.get(id);

    expect(() => wrapper?.('abcd', 0, 0)).toThrow(
      '[rntti] Returned selection is out of bounds for the returned value. Received start=2, end=2, valueLength=1',
    );
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

    expect(result?.selection).toBeNull();
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

    expect(result?.value).toBeNull();
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

    expect(result?.value).toBeNull();
    expect(result?.selection).toBeNull();
  });
});
