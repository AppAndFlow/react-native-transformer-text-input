import { Platform } from 'react-native';

import { Transformer } from '../Transformer';

describe('Transformer', () => {
  it('throws if transformer is not a worklet', () => {
    expect(
      () =>
        new Transformer(({ value }) => {
          return { value };
        }),
    ).toThrow(/Transformer must be a worklet/i);
  });

  it('does not require a compiled worklet on web', () => {
    // On web the transformer runs synchronously in JS, so a plain function
    // (no worklets plugin) is accepted.
    jest.replaceProperty(Platform, 'OS', 'web');
    expect(
      () =>
        new Transformer(({ value }) => {
          return { value };
        }),
    ).not.toThrow();
  });

  it('accepts a worklet transformer', () => {
    expect(
      () =>
        new Transformer(({ value }) => {
          'worklet';
          return { value };
        }),
    ).not.toThrow();
  });
});
