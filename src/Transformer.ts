import { Platform } from 'react-native';

export type Selection = { start: number; end: number };

export type TransformerWorklet = (input: {
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

export class Transformer {
  private readonly _worklet: TransformerWorklet;

  constructor(worklet: TransformerWorklet) {
    // On web there is no UI runtime: the web TransformerTextInput runs the
    // worklet synchronously in JS, so it doesn't need to be compiled by the
    // worklets plugin. Native runs it on the UI thread and requires a real
    // worklet, so keep enforcing the directive there.
    if (Platform.OS !== 'web') {
      const workletHash = (worklet as { __workletHash?: number }).__workletHash;
      if (workletHash == null) {
        throw new Error(
          '[rntti] Transformer must be a worklet. Did you forget to add the "worklet" directive?',
        );
      }
    }
    this._worklet = worklet;
  }

  get worklet() {
    return this._worklet;
  }
}
