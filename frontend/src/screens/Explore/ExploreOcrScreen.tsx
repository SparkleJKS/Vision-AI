import React from "react";
import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme";

const ExploreOcrScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: theme.screenBg,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <View className="flex-1 px-4 pt-2">
        <View className="flex-row items-center gap-3 py-2">
          <Pressable
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-[10px] justify-center items-center border"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
          >
            <Text className="text-lg font-light" style={{ color: theme.grey }}>
              ←
            </Text>
          </Pressable>
          <View className="flex-1 gap-0.5">
            <Text
              className="text-[17px] font-bold"
              style={{ color: theme.white }}
            >
              Photo to Text
            </Text>
            <Text
              className="text-[11px] font-medium tracking-wide"
              style={{ color: theme.grey }}
            >
              OCR · Coming soon
            </Text>
          </View>
        </View>
        <View
          className="flex-1 rounded-2xl border justify-center items-center p-6"
          style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}
        >
          <Text className="text-4xl mb-3" style={{ color: theme.border }}>
            ◈
          </Text>
          <Text
            className="text-[15px] font-semibold text-center"
            style={{ color: theme.grey }}
          >
            Photo to Text — Coming soon
          </Text>
          <Text
            className="text-[13px] text-center mt-2"
            style={{ color: theme.muted }}
          >
            Extract text from images and documents. This feature is in
            development.
          </Text>
        </View>
      </View>
    </View>
  );
};

export default ExploreOcrScreen;
