import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/theme';

type ExploreHeaderProps = {
  title: string;
  subtitle?: string;
  onBack: () => void;
  right?: React.ReactNode;
  backGlyph?: string;
};

export const ExploreHeader = ({
  title,
  subtitle,
  onBack,
  right,
  backGlyph = '←',
}: ExploreHeaderProps) => {
  const { theme } = useTheme();

  return (
    <View className="flex-row items-center gap-3 py-2">
      <Pressable
        onPress={onBack}
        className="w-10 h-10 rounded-[10px] justify-center items-center border"
        style={{
          backgroundColor: theme.cardBg,
          borderColor: theme.border,
        }}>
        <Text className="text-lg font-light" style={{ color: theme.grey }}>
          {backGlyph}
        </Text>
      </Pressable>

      <View className="flex-1 gap-0.5">
        <Text className="text-[17px] font-bold" style={{ color: theme.white }}>
          {title}
        </Text>
        {subtitle && (
          <Text
            className="text-[11px] font-medium tracking-wide"
            style={{ color: theme.grey }}>
            {subtitle}
          </Text>
        )}
      </View>
      {right && <View>{right}</View>}
    </View>
  );
};
