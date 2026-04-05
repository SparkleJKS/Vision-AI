import { ActivityIndicator, Text, TextInput, View } from 'react-native';
import type { ThemeTokens } from '@/theme';

type Props = {
  theme: ThemeTokens;
  ageInput: number | null;
  setAgeInput: (v: number | null) => void;
  setAgeHint: (v: string | null) => void;
  ageHint: string | null;
  onBlurCommit: () => void;
  saving: boolean;
  editable: boolean;
};

export const AgeFieldCard = ({
  theme,
  ageInput,
  setAgeInput,
  setAgeHint,
  ageHint,
  onBlurCommit,
  saving,
  editable,
}: Props) => {
  const inputSurface = {
    backgroundColor: theme.cardBg,
    borderColor: theme.border,
    color: theme.white,
  } as const;

  return (
    <View
      className="rounded-2xl border px-4 py-3 mb-3"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.border,
      }}>
      <Text
        className="text-xs font-semibold mb-2"
        style={{ color: theme.grey }}>
        Age
      </Text>
      <TextInput
        value={ageInput === null ? '' : String(ageInput)}
        onChangeText={text => {
          setAgeHint(null);
          const digits = text.replace(/[^0-9]/g, '');
          if (digits === '') {
            setAgeInput(null);
            return;
          }
          const n = parseInt(digits, 10);
          if (!Number.isNaN(n)) setAgeInput(n);
        }}
        onBlur={() => {
          void onBlurCommit();
        }}
        placeholder="Optional"
        placeholderTextColor={theme.grey}
        keyboardType="number-pad"
        maxLength={3}
        editable={editable && !saving}
        className="text-base font-semibold py-2 px-3 rounded-xl border"
        style={inputSurface}
      />
      {ageHint && (
        <Text className="text-xs mt-2" style={{ color: theme.warning }}>
          {ageHint}
        </Text>
      )}
      {saving && (
        <ActivityIndicator
          className="mt-2"
          size="small"
          color={theme.primary}
        />
      )}
    </View>
  );
};
