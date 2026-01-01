import { useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  type TextInputProps,
} from 'react-native';
import {
  KeyboardAwareScrollView,
  KeyboardProvider,
} from 'react-native-keyboard-controller';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  TransformerTextInput,
  type TransformerTextInputInstance,
  Transformer,
} from 'react-native-transformer-text-input';
import { PhoneNumberTransformer } from 'react-native-transformer-text-input/formatters/phone-number';
import { PatternTransformer } from 'react-native-transformer-text-input/formatters/pattern';

const usernameTransformer = new Transformer(({ value }) => {
  'worklet';

  const cleanedInput = value.replace(/[^0-9a-zA-Z]/g, '');
  const result =
    (cleanedInput ? '@' : '') + cleanedInput.toLowerCase().slice(0, 10);
  return { value: result };
});

const phoneNumberTransformer = new PhoneNumberTransformer();

const creditCardTransformer = new PatternTransformer({
  pattern: '#### #### #### ####',
});

const dateTransformer = new PatternTransformer({
  pattern: '##/##/####',
});

type ExampleCardProps = {
  title: string;
  description: string;
  transformer: Transformer;
  placeholder: string;
  exampleValue: string;
  inputProps?: Partial<TextInputProps>;
};

function ExampleCard({
  title,
  description,
  transformer,
  placeholder,
  exampleValue,
  inputProps,
}: ExampleCardProps) {
  const inputRef = useRef<TransformerTextInputInstance>(null);

  const handleSetValue = () => {
    inputRef.current?.update({ value: exampleValue, transform: true });
  };

  const handleClear = () => {
    inputRef.current?.clear();
  };

  const handleShowValue = () => {
    const value = inputRef.current?.getValue() || '(empty)';
    Alert.alert('Current Value', value);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDescription}>{description}</Text>
      <TransformerTextInput
        ref={inputRef}
        transformer={transformer}
        placeholder={placeholder}
        placeholderTextColor="#999"
        autoCorrect={false}
        style={styles.input}
        {...inputProps}
      />
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={handleSetValue}>
          <Text style={styles.buttonText}>Set Example</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleClear}>
          <Text style={styles.buttonText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleShowValue}>
          <Text style={styles.buttonText}>Show</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      bottomOffset={20}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
      ]}
    >
      <Text style={styles.title}>Transformer Text Input</Text>
      <Text style={styles.subtitle}>Format text as you type with worklets</Text>

      <ExampleCard
        title="Username"
        description="Lowercase alphanumeric with @ prefix"
        transformer={usernameTransformer}
        placeholder="@username"
        exampleValue="JohnDoe123"
        inputProps={{ autoCapitalize: 'none' }}
      />

      <ExampleCard
        title="Phone Number"
        description="US format: +1 (###) ###-####"
        transformer={phoneNumberTransformer}
        placeholder="+1 (555) 123-4567"
        exampleValue="5551234567"
        inputProps={{ keyboardType: 'phone-pad' }}
      />

      <ExampleCard
        title="Credit Card"
        description="Pattern: #### #### #### ####"
        transformer={creditCardTransformer}
        placeholder="4242 4242 4242 4242"
        exampleValue="4242424242424242"
        inputProps={{ keyboardType: 'number-pad' }}
      />

      <ExampleCard
        title="Date"
        description="Pattern: MM/DD/YYYY"
        transformer={dateTransformer}
        placeholder="MM/DD/YYYY"
        exampleValue="12252024"
        inputProps={{ keyboardType: 'number-pad' }}
      />
    </KeyboardAwareScrollView>
  );
}

export default function App() {
  return (
    <KeyboardProvider>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </KeyboardProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginTop: 4,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  input: {
    height: 48,
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  button: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
});
