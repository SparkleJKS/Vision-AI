import { ScrollView, Text, View } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme";

type AlertType = "warning" | "info" | "success";

const ALERTS = [
  {
    id: "1",
    type: "warning" as AlertType,
    title: "Obstacle Detected",
    subtitle: "Object in path ahead",
    timeAgo: "2m ago",
    icon: "warning" as const,
  },
  {
    id: "2",
    type: "info" as AlertType,
    title: "Route Updated",
    subtitle: "New path calculated",
    timeAgo: "15m ago",
    icon: "information-circle" as const,
  },
  {
    id: "3",
    type: "success" as AlertType,
    title: "Destination Reached",
    subtitle: "Navigation complete",
    timeAgo: "1h ago",
    icon: "checkmark-circle" as const,
  },
];

function getAlertAccent(
  theme: import("@/theme/tokens").ThemeTokens,
  type: AlertType,
  themeId: "accessibility" | "neon",
): string {
  switch (type) {
    case "warning":
      return theme.warning;
    case "info":
      return theme.primary;
    case "success":
      return themeId === "accessibility" ? theme.primary : theme.success;
    default:
      return theme.primary;
  }
}

const AlertsScreen = () => {
  const insets = useSafeAreaInsets();
  const { theme, themeId } = useTheme();

  return (
    <View
      className="flex-1"
      style={{ paddingTop: insets.top, backgroundColor: theme.screenBg }}
    >
      <View className="px-4 pt-6 pb-2">
        <Text
          className="text-3xl font-extrabold tracking-tight"
          style={{ color: theme.white }}
        >
          Notifications
        </Text>
        <View className="mt-1">
          <Text className="text-[13px]" style={{ color: theme.grey }}>
            3 recent alerts
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 80,
        }}
        showsVerticalScrollIndicator={false}
      >
        {ALERTS.map((alert) => {
          const accent = getAlertAccent(theme, alert.type, themeId);
          return (
            <View
              key={alert.id}
              className="border rounded-2xl p-4 mb-3 overflow-hidden flex-row items-center"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.border,
              }}
            >
              <View
                className="absolute top-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: accent }}
              />
              <View
                className="w-11 h-11 rounded-xl border justify-center items-center mr-3.5"
                style={{ borderColor: accent, backgroundColor: accent }}
              >
                <Ionicons name={alert.icon} size={22} color={theme.white} />
              </View>
              <View className="flex-1">
                <Text
                  className="text-[15px] font-bold mb-0.5"
                  style={{ color: theme.white }}
                >
                  {alert.title}
                </Text>
                <Text
                  className="text-xs font-medium"
                  style={{ color: theme.grey }}
                >
                  {alert.subtitle}
                </Text>
              </View>
              <View
                className="rounded-full px-2 py-1"
                style={{ backgroundColor: theme.border }}
              >
                <Text
                  className="text-[10px] font-semibold"
                  style={{ color: theme.muted }}
                >
                  {alert.timeAgo}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default AlertsScreen;
