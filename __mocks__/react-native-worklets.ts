export function runOnUI(worklet: (...args: Array<unknown>) => void) {
  return (...args: Array<unknown>) => worklet(...args);
}

export function executeOnUIRuntimeSync(
  worklet: (...args: Array<unknown>) => unknown,
) {
  return (...args: Array<unknown>) => worklet(...args);
}
