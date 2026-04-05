import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import type { ThemeTokens } from '@/theme';

type Props = {
  theme: ThemeTokens;
  label: string;
  valueLabel: string;
  onPress: () => void;
  disabled: boolean;
  saving: boolean;
};

export const GenderRow = ({
  theme,
  label,
  valueLabel,
  onPress,
  disabled,
  saving,
}: Props) => (
  <TouchableOpacity
    className="rounded-2xl border px-4 py-3 mb-3 flex-row items-center justify-between"
    style={{
      backgroundColor: theme.cardBg,
      borderColor: theme.border,
    }}
    activeOpacity={0.85}
    onPress={onPress}
    disabled={disabled}>
    <View>
      <Text
        className="text-xs font-semibold mb-1"
        style={{ color: theme.grey }}>
        {label}
      </Text>
      <Text className="text-base font-semibold" style={{ color: theme.white }}>
        {valueLabel}
      </Text>
    </View>
    {saving ? (
      <ActivityIndicator size="small" color={theme.primary} />
    ) : (
      <Ionicons name="chevron-forward" size={20} color={theme.grey} />
    )}
  </TouchableOpacity>
);
