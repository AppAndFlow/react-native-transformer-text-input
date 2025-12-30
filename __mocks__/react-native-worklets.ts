export function runOnUI(worklet: (...args: Array<unknown>) => void) {
  return (...args: Array<unknown>) => worklet(...args);
}
