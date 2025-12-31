import React from 'react';
import {
  codegenNativeCommands,
  codegenNativeComponent,
  type HostComponent,
  type ViewProps,
  type CodegenTypes,
} from 'react-native';

interface NativeProps extends ViewProps {
  transformerId: CodegenTypes.Int32;
}

interface NativeCommands {
  update: (
    viewRef: React.ElementRef<HostComponent<NativeProps>>,
    transform: boolean,
    value: string | null,
    selectionStart: CodegenTypes.Int32,
    selectionEnd: CodegenTypes.Int32,
  ) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['update'],
});

export default codegenNativeComponent<NativeProps>(
  'TransformerTextInputDecoratorView',
  { interfaceOnly: true },
);
