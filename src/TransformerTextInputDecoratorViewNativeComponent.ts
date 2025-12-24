import {
  codegenNativeComponent,
  type ViewProps,
  type CodegenTypes,
} from 'react-native';

interface NativeProps extends ViewProps {
  transformerId: CodegenTypes.Int32;
}

export default codegenNativeComponent<NativeProps>(
  'TransformerTextInputDecoratorView',
  { interfaceOnly: true },
);
