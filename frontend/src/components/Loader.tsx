import React from "react";
import { View, ActivityIndicator, Text } from "react-native";

const Loader = () => (
  <View className="flex-1 w-full items-center justify-center bg-[#0f172a]">
    <Text className="text-[28px] font-semibold text-[#f8fafc] mb-4">
      VisionAI
    </Text>
    <ActivityIndicator size="large" color="#2563eb" className="mt-2" />
  </View>
);

export default Loader;
