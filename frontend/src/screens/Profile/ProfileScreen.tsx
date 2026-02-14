import { Text, View, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useAuth } from "../../auth/AuthContext";
import { colors } from "../../theme/colors";

const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const { user, signOut, authAvailable } = useAuth();

  return (
    <View className="flex-1 bg-screen" style={{ paddingTop: insets.top }}>
      <Text className="text-white text-[28px] font-bold px-4 pt-6 pb-4">
        Profile
      </Text>
      <View className="px-4">
        {user?.email ? (
          <View className="bg-card rounded-2xl p-4 mb-4">
            <Text className="text-grey text-sm mb-1">Signed in as</Text>
            <Text className="text-white text-base font-medium">
              {user.email}
            </Text>
          </View>
        ) : authAvailable ? null : (
          <View className="bg-card rounded-2xl p-4 mb-4">
            <Text className="text-grey text-sm">Auth not available</Text>
          </View>
        )}
        {authAvailable && (
          <TouchableOpacity
            className="bg-card rounded-2xl p-4 flex-row items-center"
            activeOpacity={0.8}
            onPress={() => signOut()}
          >
            <View className="w-10 h-10 rounded-full bg-warning/20 items-center justify-center mr-4">
              <Ionicons
                name="log-out-outline"
                size={22}
                color={colors.warning}
              />
            </View>
            <Text className="text-warning text-base font-semibold">
              Sign Out
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default ProfileScreen;
