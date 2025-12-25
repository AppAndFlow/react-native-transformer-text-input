# react-native-transformer-text-input

TextInput component that allows transforming text synchronously with a worklet

## Installation


```sh
npm install react-native-transformer-text-input
```


## Usage


```tsx
import { TransformerTextInput, Transformer } from "react-native-transformer-text-input";

const transformer = new Transformer(({ value }) => {
  'worklet';

  return formatPhoneNumber(value);
});

// ...

const phoneNumberTextInputRef = useRef<TransformerTextInput>(null);

const handleSubmit = () => {
  const newPhoneNumber = phoneNumberTextInputRef.current?.value;

  // ...
};

// ...

return (
  <TransformerTextInput
    ref={phoneNumberTextInputRef}
    transformer={transformer}
    defaultValue={user.phoneNumber}
    // Supports most `TextInput` props
    autoCorrect={false}
    keyboardType="phone-pad"
    onSubmitEditing={handleSubmit}
  />
);
```


## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
