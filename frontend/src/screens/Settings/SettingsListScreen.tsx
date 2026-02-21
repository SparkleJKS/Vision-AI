import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "@/theme";
import { SETTINGS_ITEMS } from "./config";
import type { ISettingsStackParamList } from "@/screens/screens.types";

type NavProp = NativeStackNavigationProp<ISettingsStackParamList>;

const ITEM_ACCENT_KEY: Record<
  string,
  | "settingsProfile"
  | "settingsVoice"
  | "settingsVision"
  | "settingsDevices"
  | "settingsAccessibility"
> = {
  profile: "settingsProfile",
  voice: "settingsVoice",
  vision: "settingsVision",
  devices: "settingsDevices",
  accessibility: "settingsAccessibility",
};

const SettingsListScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const { theme } = useTheme();

  return (
    <View
      className="flex-1"
      style={{ paddingTop: insets.top, backgroundColor: theme.screenBg }}
    >
      <View className="px-4 pt-6 pb-4">
        <Text
          className="text-3xl font-extrabold tracking-tight"
          style={{ color: theme.white }}
        >
          Preferences
        </Text>
        <Text className="text-[13px] mt-1" style={{ color: theme.grey }}>
          Configure your experience
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 80,
        }}
        showsVerticalScrollIndicator={false}
      >
        {SETTINGS_ITEMS.map((item) => {
          const key = ITEM_ACCENT_KEY[item.id];
          const accent = key ? theme[key] : theme.grey;

          return (
            <TouchableOpacity
              key={item.id}
              className="border rounded-2xl p-4 mb-3 overflow-hidden flex-row items-center"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.border,
              }}
              activeOpacity={0.8}
              onPress={() => navigation.navigate(item.screenName)}
            >
              <View
                className="absolute top-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: accent }}
              />
              <View
                className="w-11 h-11 rounded-xl border justify-center items-center mr-3.5"
                style={{
                  borderColor: `${accent}40`,
                  backgroundColor: theme.darkBg,
                }}
              >
                <Ionicons name={item.icon} size={22} color={accent} />
              </View>
              <View className="flex-1">
                <Text
                  className="text-[15px] font-bold mb-0.5"
                  style={{ color: theme.white }}
                >
                  {item.title}
                </Text>
                <Text
                  className="text-xs font-medium"
                  style={{ color: theme.grey }}
                >
                  {item.subtitle}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={theme.tabInactive}
              />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default SettingsListScreen;
