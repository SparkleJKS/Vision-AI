import { Text, TextInput, View, type TextInputProps } from 'react-native';
import type { ThemeTokens } from '@/theme';

export type ProfileTextFieldProps = {
  theme: ThemeTokens;
  label: string;
  optional?: boolean;
  value: string;
  onChangeText: (s: string) => void;
  onBlur: () => void;
  maxLength: number;
  multiline?: boolean;
  placeholder: string;
  minHeight?: number;
  editable: boolean;
  keyboardType?: TextInputProps['keyboardType'];
};

export const ProfileTextField = ({
  theme,
  label,
  optional = false,
  value,
  onChangeText,
  onBlur,
  maxLength,
  multiline,
  placeholder,
  minHeight,
  editable,
  keyboardType = 'default',
}: ProfileTextFieldProps) => {
  const inputSurface = {
    backgroundColor: theme.cardBg,
    borderColor: theme.border,
    color: theme.white,
  } as const;

  return (
    <View>
      <Text
        className="text-xs font-semibold mb-2"
        style={{ color: theme.grey }}>
        {label}
        {optional && <Text style={{ color: theme.muted }}> (Optional)</Text>}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onBlur={() => {
          void onBlur();
        }}
        placeholder={placeholder}
        placeholderTextColor={theme.grey}
        maxLength={maxLength}
        multiline={multiline}
        keyboardType={keyboardType}
        textAlignVertical={multiline ? 'top' : 'center'}
        editable={editable}
        className="text-base font-semibold py-2 px-3 rounded-xl border"
        style={[inputSurface, minHeight != null ? { minHeight } : null]}
      />
    </View>
  );
};
