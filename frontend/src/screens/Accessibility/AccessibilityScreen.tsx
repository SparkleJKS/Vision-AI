import { Text, View, TouchableOpacity } from "react-native";
import { useDispatch } from "react-redux";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme";
import { useBackHandler } from "@/navigators";
import { navigationActions } from "@/store/actions/navigation";
import type { AppDispatch } from "@/store";

const AccessibilityScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const handleBack = () => dispatch(navigationActions.toBack());

  useBackHandler({ onBack: handleBack });

  return (
    <View
      className="flex-1"
      style={{ paddingTop: insets.top, backgroundColor: theme.screenBg }}
    >
      <TouchableOpacity
        className="flex-row items-center px-4 pt-4 pb-2"
        onPress={handleBack}
        activeOpacity={0.8}
      >
        <Ionicons name="arrow-back" size={24} color={theme.white} />
        <Text className="text-base ml-2" style={{ color: theme.white }}>
          Back
        </Text>
      </TouchableOpacity>
      <View className="flex-1 px-4 items-center justify-center">
        <Text className="text-lg text-center" style={{ color: theme.white }}>
          Accessibility settings — Coming soon
        </Text>
      </View>
    </View>
  );
};

export default AccessibilityScreen;
