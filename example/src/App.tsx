import { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Button,
  Text,
  KeyboardAvoidingView,
} from 'react-native';
import {
  TransformerTextInput,
  type TransformerTextInputInstance,
  Transformer,
} from 'react-native-transformer-text-input';
import { PhoneNumberTransformer } from 'react-native-transformer-text-input/formatters/phone-number';

const usernameTransformer = new Transformer(({ value }) => {
  'worklet';

  const cleanedInput = value.replace(/[^0-9a-zA-Z]/g, '');
  const result =
    (cleanedInput ? '@' : '') + cleanedInput.toLowerCase().slice(0, 10);
  return { value: result };
});

const phoneNumberTransformer = new PhoneNumberTransformer({
  debug: true,
});

export default function App() {
  const usernameInputRef = useRef<TransformerTextInputInstance>(null);
  const phoneNumberInputRef = useRef<TransformerTextInputInstance>(null);

  const [isUsernameValid, setIsUsernameValid] = useState(false);
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const isValid = isUsernameValid && isPhoneValid;

  const handleUsernameChange = (value: string) => {
    const valid = value.length >= 2; // At least @X (1 char after @)
    setIsUsernameValid((prev) => (prev !== valid ? valid : prev));
  };

  const handlePhoneChange = (value: string) => {
    const phoneDigits = value.replace(/\D/g, '').replace(/^1/, '');
    const valid = phoneDigits.length === 10;
    setIsPhoneValid((prev) => (prev !== valid ? valid : prev));
  };

  const handleSubmit = () => {
    console.log('Username:', usernameInputRef.current?.getValue());
    console.log('Phone number:', phoneNumberInputRef.current?.getValue());
  };

  const handleSetExampleValues = () => {
    usernameInputRef.current?.update({
      value: 'sample',
      transform: false,
    });
    phoneNumberInputRef.current?.update({
      value: '15551234567',
      selection: { start: 5, end: 7 },
      transform: true,
    });
  };

  const handleClearValues = () => {
    usernameInputRef.current?.clear();
    phoneNumberInputRef.current?.clear();
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <Text style={styles.title}>React Native Transformer Text Input</Text>
      <View>
        <Text style={styles.label}>Username</Text>
        <TransformerTextInput
          ref={usernameInputRef}
          transformer={usernameTransformer}
          onChangeText={handleUsernameChange}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="@mycoolname"
          style={styles.input}
        />
        <Text style={styles.label}>Phone number</Text>
        <TransformerTextInput
          ref={phoneNumberInputRef}
          transformer={phoneNumberTransformer}
          onChangeText={handlePhoneChange}
          keyboardType="phone-pad"
          autoCorrect={false}
          placeholder="+1 (555) 123-4567"
          style={styles.input}
        />
        <View style={styles.buttonRow}>
          <Button title="Set Example" onPress={handleSetExampleValues} />
          <View style={styles.buttonSpacer} />
          <Button title="Clear" onPress={handleClearValues} />
        </View>
        <Button title="Submit" onPress={handleSubmit} disabled={!isValid} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-evenly',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 32,
    textAlign: 'center',
  },
  label: {
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    height: 50,
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  buttonSpacer: {
    width: 12,
  },
});
