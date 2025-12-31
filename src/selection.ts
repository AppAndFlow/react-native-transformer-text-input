import { type Selection } from './Transformer';

export const computeUncontrolledSelection = (
  oldValue: string,
  newValue: string,
  selectionStart: number,
  selectionEnd: number,
): Selection => {
  'worklet';
  const oldLength = oldValue.length;
  const newLength = newValue.length;
  const delta = newLength - oldLength;
  let rawStart: number;
  let rawEnd: number;
  if (selectionStart === selectionEnd) {
    if (selectionEnd >= oldLength) {
      rawStart = newLength;
      rawEnd = newLength;
    } else {
      const next = selectionEnd + delta;
      rawStart = next;
      rawEnd = next;
    }
  } else {
    rawStart = selectionStart + delta;
    rawEnd = selectionEnd + delta;
  }

  if (
    rawStart < 0 ||
    rawEnd < 0 ||
    rawStart > newLength ||
    rawEnd > newLength ||
    rawStart > rawEnd
  ) {
    return { start: newLength, end: newLength };
  }

  return { start: rawStart, end: rawEnd };
};

export const validateSelection = (
  selection: Selection,
  valueLength: number,
) => {
  'worklet';
  if (selection.start < 0 || selection.end < 0) {
    throw new Error(
      `[rntti] Returned selection must be non-negative. Received start=${selection.start}, end=${selection.end}, valueLength=${valueLength}`,
    );
  }
  if (selection.end < selection.start) {
    throw new Error(
      `[rntti] Returned selection end must be >= selection start. Received start=${selection.start}, end=${selection.end}, valueLength=${valueLength}`,
    );
  }
  if (selection.start > valueLength || selection.end > valueLength) {
    throw new Error(
      `[rntti] Returned selection is out of bounds for the returned value. Received start=${selection.start}, end=${selection.end}, valueLength=${valueLength}`,
    );
  }
};
