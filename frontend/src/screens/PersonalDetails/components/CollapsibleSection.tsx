import type { ReactNode } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import type { ThemeTokens } from '@/theme';

type Props = {
  title: string;
  subtitle?: string;
  expanded: boolean;
  onToggle: () => void;
  theme: ThemeTokens;
  children: ReactNode;
};

export const CollapsibleSection = ({
  title,
  subtitle,
  expanded,
  onToggle,
  theme,
  children,
}: Props) => (
  <View className="mb-4">
    <TouchableOpacity
      className="rounded-2xl border px-4 py-3 flex-row items-center justify-between mb-2"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.border,
      }}
      onPress={onToggle}
      activeOpacity={0.85}>
      <View className="flex-1 pr-2">
        <Text className="text-base font-bold" style={{ color: theme.white }}>
          {title}
        </Text>
        {subtitle && (
          <Text className="text-xs mt-0.5" style={{ color: theme.grey }}>
            {subtitle}
          </Text>
        )}
      </View>
      <Ionicons
        name={expanded ? 'chevron-up' : 'chevron-down'}
        size={22}
        color={theme.grey}
      />
    </TouchableOpacity>
    {expanded && (
      <View
        className="rounded-2xl border px-4 py-4 gap-4"
        style={{
          backgroundColor: theme.cardBg,
          borderColor: theme.border,
        }}>
        {children}
      </View>
    )}
  </View>
);
