import { Text, View, ScrollView } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';

const ALERTS = [
  {
    id: '1',
    type: 'warning',
    title: 'Obstacle Detected',
    timeAgo: '2m ago',
    icon: 'warning' as const,
    iconBg: 'warning',
  },
  {
    id: '2',
    type: 'info',
    title: 'Route Updated',
    timeAgo: '15m ago',
    icon: 'information-circle' as const,
    iconBg: 'accent',
  },
  {
    id: '3',
    type: 'success',
    title: 'Destination Reached',
    timeAgo: '1h ago',
    icon: 'checkmark-circle' as const,
    iconBg: 'accent',
  },
];

export function AlertsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-screen"
      style={{ paddingTop: insets.top }}
    >
      <Text className="text-white text-[28px] font-bold px-4 pt-6 pb-4">
        Alerts
      </Text>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
      >
        {ALERTS.map((alert) => (
          <View
            key={alert.id}
            className="bg-card rounded-2xl p-4 mb-3 flex-row items-center"
          >
            <View
              className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${
                alert.iconBg === 'warning' ? 'bg-warning' : 'bg-accent'
              }`}
            >
              <Ionicons
                name={alert.icon}
                size={28}
                color={colors.white}
              />
            </View>
            <View className="flex-1">
              <Text className="text-white text-lg font-bold">{alert.title}</Text>
              <Text className="text-grey text-sm mt-0.5">{alert.timeAgo}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
