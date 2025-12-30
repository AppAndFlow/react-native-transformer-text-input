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
