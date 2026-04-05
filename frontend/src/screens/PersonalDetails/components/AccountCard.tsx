import { Text, View } from 'react-native';
import type { ThemeTokens } from '@/theme';

type Props = {
  theme: ThemeTokens;
  displayName: string;
  email: string;
};

export const AccountCard = ({ theme, displayName, email }: Props) => (
  <View
    className="rounded-2xl border overflow-hidden mb-6"
    style={{
      backgroundColor: theme.cardBg,
      borderColor: theme.border,
    }}>
    <View className="px-4 py-3 border-b" style={{ borderColor: theme.border }}>
      <Text
        className="text-xs font-semibold mb-1"
        style={{ color: theme.grey }}>
        Name
      </Text>
      <Text className="text-base font-semibold" style={{ color: theme.white }}>
        {displayName}
      </Text>
    </View>
    <View className="px-4 py-3">
      <Text
        className="text-xs font-semibold mb-1"
        style={{ color: theme.grey }}>
        Email
      </Text>
      <Text className="text-base font-semibold" style={{ color: theme.white }}>
        {email}
      </Text>
    </View>
  </View>
);
