import { Text, View, TouchableOpacity } from "react-native";
import { useDispatch } from "react-redux";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/theme";
import { useBackHandler } from "@/navigators";
import { navigationActions } from "@/store/actions/navigation";
import type { AppDispatch } from "@/store";

export function ConnectedDevicesScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();

  const handleBack = () => dispatch(navigationActions.toBack());

  useBackHandler({
    onBack: handleBack,
  });

  return (
    <View className="flex-1 bg-screen" style={{ paddingTop: insets.top }}>
      <TouchableOpacity
        className="flex-row items-center px-4 pt-4 pb-2"
        onPress={handleBack}
        activeOpacity={0.8}
      >
        <Ionicons name="arrow-back" size={24} color={colors.white} />
        <Text className="text-white text-base ml-2">Back</Text>
      </TouchableOpacity>

      <View className="flex-1 px-4 items-center justify-center">
        <Text className="text-white text-lg text-center">
          Connected Devices — coming soon
        </Text>
      </View>
    </View>
  );
}
