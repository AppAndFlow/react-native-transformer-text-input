import { type HostInstance, type TextInputProps } from 'react-native';
import { type Transformer } from './Transformer';

export type TransformerTextInputInstanceMethods = {
  /**
   * Get the current text value.
   */
  getValue: () => string;
  /**
   * Update the value and/or selection, optionally running the transformer.
   */
  update: (options: {
    /**
     * New value to apply.
     */
    value?: string | null;
    /**
     * Optional selection to apply alongside the value.
     */
    selection?: { start: number; end: number };
    /**
     * Whether to run the transformer on update. Defaults to true.
     */
    transform?: boolean;
  }) => void;
  /**
   * Clear the input value without running the transformer.
   */
  clear: () => void;
};

export type TransformerTextInputInstance = HostInstance &
  TransformerTextInputInstanceMethods;

export type TransformerTextInputProps = Omit<TextInputProps, 'value'> & {
  /**
   * Transformer instance used to sync text changes on the UI thread.
   */
  transformer: Transformer;
};
