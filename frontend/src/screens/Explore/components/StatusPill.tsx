import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '@/theme';

type StatusPillProps = {
  isOn: boolean;
  onLabel: string;
  offLabel: string;
  onColor?: string;
};

export const StatusPill = ({
  isOn,
  onLabel,
  offLabel,
  onColor,
}: StatusPillProps) => {
  const { theme } = useTheme();
  const activeColor = onColor ?? theme.primary;

  const style = useMemo(
    () => ({
      backgroundColor: isOn ? activeColor + '15' : theme.cardBg,
      borderColor: isOn ? activeColor + '35' : theme.border,
    }),
    [activeColor, isOn, theme.border, theme.cardBg],
  );

  return (
    <View
      className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-lg border"
      style={style}>
      <View
        className="w-1.5 h-1.5 rounded-full"
        style={{
          backgroundColor: isOn ? activeColor : theme.tabInactive,
        }}
      />
      <Text
        className="text-[10px] font-bold tracking-wider"
        style={{ color: isOn ? activeColor : theme.grey }}>
        {isOn ? onLabel : offLabel}
      </Text>
    </View>
  );
};
