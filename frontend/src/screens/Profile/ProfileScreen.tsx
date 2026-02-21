import { useState } from "react";
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useDispatch } from "react-redux";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, THEMES, type ThemeId } from "@/theme";
import { useBackHandler } from "@/navigators";
import { useAuth } from "@/auth/AuthContext";
import { logEvent } from "@/utils/logger";
import { navigationActions } from "@/store/actions/navigation";
import type { AppDispatch } from "@/store";

const PROFILE_OPTIONS = [
  {
    id: "personal",
    title: "Personal Details",
    icon: "person-outline" as const,
  },
  {
    id: "privacy",
    title: "Privacy & Security",
    icon: "shield-checkmark-outline" as const,
  },
  {
    id: "subscription",
    title: "Subscription",
    icon: "card-outline" as const,
  },
];

const ProfileScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();
  const { user, signOut, authAvailable } = useAuth();
  const { theme, themeId, setTheme } = useTheme();

  const handleBack = () => dispatch(navigationActions.toBack());
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await signOut();
      logEvent("Profile:SignOutComplete");
    } catch (err) {
      logEvent("Profile:SignOutError", { error: String(err) });
    } finally {
      setIsSigningOut(false);
    }
  };

  useBackHandler({
    onBack: handleBack,
  });

  const displayName =
    user?.displayName ?? user?.email?.split("@")[0] ?? "Guest";
  const displayInitial = displayName[0]?.toUpperCase() ?? "?";

  const handleThemeSelect = (id: ThemeId) => {
    setTheme(id);
    logEvent("Profile:ThemeChanged", { theme: id });
  };

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

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{
          alignItems: "center",
          paddingBottom: insets.bottom + 80,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          className="w-24 h-24 rounded-full items-center justify-center my-6"
          style={{ backgroundColor: theme.primary }}
        >
          <Text className="text-4xl font-bold text-black">
            {displayInitial}
          </Text>
        </View>
        <Text className="text-2xl font-bold" style={{ color: theme.white }}>
          {displayName}
        </Text>
        {user?.email ? (
          <Text className="text-sm mt-1" style={{ color: theme.grey }}>
            {user.email}
          </Text>
        ) : authAvailable ? null : (
          <Text className="text-sm mt-1" style={{ color: theme.grey }}>
            Auth not available
          </Text>
        )}

        <View className="w-full mt-8 mb-2">
          <Text
            className="text-xs font-bold uppercase tracking-wider mb-2"
            style={{ color: theme.grey }}
          >
            App Theme
          </Text>
          <View className="flex-row gap-3">
            {(Object.keys(THEMES) as ThemeId[]).map((id) => (
              <TouchableOpacity
                key={id}
                className="flex-1 py-3 rounded-xl items-center border"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: themeId === id ? theme.primary : theme.border,
                  borderWidth: themeId === id ? 2 : 1,
                }}
                onPress={() => handleThemeSelect(id)}
                activeOpacity={0.8}
              >
                <Text
                  className="text-[15px] font-semibold"
                  style={{ color: theme.white }}
                >
                  {THEMES[id].name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="w-full mt-4">
          {PROFILE_OPTIONS.map((item) => (
            <TouchableOpacity
              key={item.id}
              className="flex-row items-center p-4 rounded-2xl mb-3"
              style={{ backgroundColor: theme.cardBg }}
              activeOpacity={0.8}
            >
              <View
                className="w-12 h-12 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: theme.cardBgLight }}
              >
                <Ionicons name={item.icon} size={24} color={theme.white} />
              </View>
              <Text
                className="text-lg font-bold flex-1"
                style={{ color: theme.white }}
              >
                {item.title}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={theme.grey} />
            </TouchableOpacity>
          ))}

          {authAvailable && (
            <TouchableOpacity
              className="flex-row items-center p-4 rounded-2xl mb-3 border"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.warning,
              }}
              activeOpacity={0.8}
              onPress={handleSignOut}
              disabled={isSigningOut}
            >
              <View
                className="w-12 h-12 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: theme.cardBgLight }}
              >
                {isSigningOut ? (
                  <ActivityIndicator size="small" color={theme.warning} />
                ) : (
                  <Ionicons
                    name="log-out-outline"
                    size={24}
                    color={theme.warning}
                  />
                )}
              </View>
              <Text
                className="text-lg font-bold flex-1"
                style={{ color: theme.warning }}
              >
                {isSigningOut ? "Signing out..." : "Sign Out"}
              </Text>
              {!isSigningOut && (
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={theme.warning}
                />
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;
